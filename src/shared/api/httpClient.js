import { clearAccessToken, getAccessToken } from '../../features/auth/tokenStore.js';
import { ApiError } from './ApiError.js';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');

let refreshHandler = null;
let unauthorizedHandler = null;

export function setRefreshHandler(handler) {
  refreshHandler = handler;
  return () => {
    if (refreshHandler === handler) refreshHandler = null;
  };
}

export function setUnauthorizedHandler(handler) {
  unauthorizedHandler = handler;
  return () => {
    if (unauthorizedHandler === handler) unauthorizedHandler = null;
  };
}

function buildUrl(path) {
  if (/^https?:\/\//i.test(path)) return path;
  return `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
}

async function parseResponse(response) {
  if (response.status === 204) return null;

  const text = await response.text();
  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function createApiError(response, payload) {
  const payloadObject = payload && typeof payload === 'object' ? payload : null;
  const message =
    payloadObject?.message ||
    (typeof payload === 'string' && payload) ||
    response.statusText ||
    '요청을 처리하지 못했습니다.';

  return new ApiError(message, {
    status: response.status,
    code: payloadObject?.code,
    data: payloadObject?.data,
  });
}

export async function request(
  path,
  {
    method = 'GET',
    body,
    headers,
    signal,
    auth = true,
    retryOn401 = true,
    credentials = 'include',
    notifyUnauthorized = true,
  } = {},
) {
  const requestHeaders = new Headers(headers);
  const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;
  const hasBody = body !== undefined && body !== null;

  if (hasBody && !isFormData && !requestHeaders.has('Content-Type')) {
    requestHeaders.set('Content-Type', 'application/json');
  }

  const token = auth ? getAccessToken() : null;
  if (token) requestHeaders.set('Authorization', `Bearer ${token}`);

  const response = await fetch(buildUrl(path), {
    method,
    headers: requestHeaders,
    body: hasBody && !isFormData ? JSON.stringify(body) : body,
    credentials,
    signal,
  });
  const payload = await parseResponse(response);

  if (response.ok) return payload;

  if (response.status === 401 && auth && retryOn401 && refreshHandler) {
    try {
      await refreshHandler();
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        clearAccessToken();
        unauthorizedHandler?.();
      }
      throw error;
    }

    try {
      return await request(path, {
        method,
        body,
        headers,
        signal,
        auth,
        retryOn401: false,
        credentials,
        notifyUnauthorized: false,
      });
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        clearAccessToken();
        unauthorizedHandler?.();
      }
      throw error;
    }
  }

  if (response.status === 401 && auth && notifyUnauthorized) {
    clearAccessToken();
    unauthorizedHandler?.();
  }

  throw createApiError(response, payload);
}
