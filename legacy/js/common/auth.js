import {API_BASE_URL} from '../constants/api.js';


let accessToken = null;
let refreshPromise = null;

export function setAccessToken(token) {
    accessToken = token;
}

export function getAccessToken() {
    return accessToken;
}

export function clearAccessToken() {
    accessToken = null;
}

export async function refreshAccessToken() {
    if (refreshPromise) {
        return refreshPromise;
    }

    refreshPromise = requestRefreshToken();

    try {
        return await refreshPromise;
    } finally {
        refreshPromise = null;
    }
}

async function requestRefreshToken() {
    const response = await fetch(
        `${API_BASE_URL}/auth/token/refresh`,
        {
            method: 'POST',
            credentials: 'include'
        }
    );

    const responseBody = await response.json();

    if (!response.ok) {
        clearAccessToken();
        throw new Error(
            responseBody.message ?? '액세스 토큰 재발급 실패'
        );
    }

    const newAccessToken =
        responseBody.data.accessToken;

    setAccessToken(newAccessToken);

    return newAccessToken;
}

export async function authFetch(url, options = {}) {
    if (!accessToken) {
        await refreshAccessToken();
    }

    const headers = new Headers(options.headers);
    headers.set("Authorization", `Bearer ${accessToken}`);
    let response = await fetch(url, 
        {
            ...options,
            headers,
            credentials: "include"
        }
    );

    if (response.status !== 401) {
        return response;
    }

    await refreshAccessToken();
    headers.set("Authorization", `Bearer ${accessToken}`);
    response = await fetch(url, 
        {
            ...options,
            headers,
            credentials: "include"
        }
    );

    return response;
}
