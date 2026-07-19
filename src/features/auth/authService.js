import { request } from '../../shared/api/httpClient.js';
import { clearAccessToken, setAccessToken } from '../../shared/session/tokenStore.js';

let refreshPromise = null;

export async function login(credentials) {
  const response = await request('/auth/login', {
    method: 'POST',
    body: credentials,
    auth: false,
    retryOn401: false,
  });
  const token = response?.data?.token?.accessToken;

  if (!token) throw new Error('로그인 응답에 access token이 없습니다.');
  setAccessToken(token);
  return response;
}

export function refreshAccessToken() {
  if (refreshPromise) return refreshPromise;

  refreshPromise = request('/auth/token/refresh', {
    method: 'POST',
    auth: false,
    retryOn401: false,
  })
    .then((response) => {
      const token = response?.data?.accessToken;
      if (!token) throw new Error('토큰 재발급 응답에 access token이 없습니다.');
      setAccessToken(token);
      return token;
    })
    .finally(() => {
      refreshPromise = null;
    });

  return refreshPromise;
}

export async function logout() {
  const response = await request('/auth/logout', {
    method: 'POST',
    auth: false,
    retryOn401: false,
  });
  clearAccessToken();
  return response;
}
