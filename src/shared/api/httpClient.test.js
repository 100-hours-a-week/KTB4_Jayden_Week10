import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { clearAccessToken, getAccessToken, setAccessToken } from '../../features/auth/tokenStore.js';
import { ApiError } from './ApiError.js';
import { request, setRefreshHandler, setUnauthorizedHandler } from './httpClient.js';

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn());
  clearAccessToken();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('httpClient', () => {
  it('204 응답을 JSON parsing 없이 처리한다', async () => {
    fetch.mockResolvedValue(new Response(null, { status: 204 }));
    await expect(request('/empty', { auth: false })).resolves.toBeNull();
  });

  it('JSON이 아닌 오류도 ApiError로 변환한다', async () => {
    fetch.mockResolvedValue(new Response('server unavailable', { status: 503 }));
    await expect(request('/broken', { auth: false })).rejects.toMatchObject({
      name: 'ApiError',
      status: 503,
      message: 'server unavailable',
    });
  });

  it('보호 요청 401에서 refresh 후 새 token으로 한 번 재시도한다', async () => {
    setAccessToken('expired');
    fetch
      .mockResolvedValueOnce(new Response(JSON.stringify({ message: 'expired' }), { status: 401 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ data: { ok: true } }), { status: 200 }));
    const refresh = vi.fn(async () => setAccessToken('renewed'));
    const unauthorized = vi.fn();
    const removeRefresh = setRefreshHandler(refresh);
    const removeUnauthorized = setUnauthorizedHandler(unauthorized);

    await expect(request('/protected')).resolves.toEqual({ data: { ok: true } });
    expect(refresh).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledTimes(2);
    expect(fetch.mock.calls[1][1].headers.get('Authorization')).toBe('Bearer renewed');
    expect(unauthorized).not.toHaveBeenCalled();

    removeRefresh();
    removeUnauthorized();
  });

  it('재시도도 401이면 인증 만료 handler를 한 번 호출한다', async () => {
    fetch.mockImplementation(async () => new Response('{}', { status: 401 }));
    const removeRefresh = setRefreshHandler(vi.fn(async () => setAccessToken('renewed')));
    const unauthorized = vi.fn();
    const removeUnauthorized = setUnauthorizedHandler(unauthorized);

    await expect(request('/protected')).rejects.toBeInstanceOf(ApiError);
    expect(fetch).toHaveBeenCalledTimes(2);
    expect(unauthorized).toHaveBeenCalledTimes(1);

    removeRefresh();
    removeUnauthorized();
  });

  it('refresh 401이면 token을 제거하고 인증 만료 handler를 호출한다', async () => {
    setAccessToken('expired');
    fetch.mockResolvedValue(new Response('{}', { status: 401 }));
    const removeRefresh = setRefreshHandler(vi.fn(async () => {
      throw new ApiError('refresh unauthorized', { status: 401 });
    }));
    const unauthorized = vi.fn();
    const removeUnauthorized = setUnauthorizedHandler(unauthorized);

    await expect(request('/protected')).rejects.toMatchObject({ status: 401 });
    expect(getAccessToken()).toBeNull();
    expect(unauthorized).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledTimes(1);

    removeRefresh();
    removeUnauthorized();
  });

  it('refresh network 오류이면 token과 인증 상태를 유지한다', async () => {
    setAccessToken('expired');
    fetch.mockResolvedValue(new Response('{}', { status: 401 }));
    const networkError = new TypeError('Failed to fetch');
    const removeRefresh = setRefreshHandler(vi.fn(async () => {
      throw networkError;
    }));
    const unauthorized = vi.fn();
    const removeUnauthorized = setUnauthorizedHandler(unauthorized);

    await expect(request('/protected')).rejects.toBe(networkError);
    expect(getAccessToken()).toBe('expired');
    expect(unauthorized).not.toHaveBeenCalled();

    removeRefresh();
    removeUnauthorized();
  });

  it('refresh 5xx이면 token과 인증 상태를 유지한다', async () => {
    setAccessToken('expired');
    fetch.mockResolvedValue(new Response('{}', { status: 401 }));
    const refreshError = new ApiError('refresh unavailable', { status: 503 });
    const removeRefresh = setRefreshHandler(vi.fn(async () => {
      throw refreshError;
    }));
    const unauthorized = vi.fn();
    const removeUnauthorized = setUnauthorizedHandler(unauthorized);

    await expect(request('/protected')).rejects.toBe(refreshError);
    expect(getAccessToken()).toBe('expired');
    expect(unauthorized).not.toHaveBeenCalled();

    removeRefresh();
    removeUnauthorized();
  });

  it('refresh 성공 후 원 요청이 5xx면 인증 상태를 제거하지 않는다', async () => {
    setAccessToken('expired');
    fetch
      .mockResolvedValueOnce(new Response('{}', { status: 401 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ message: 'server error' }), { status: 500 }));
    const removeRefresh = setRefreshHandler(vi.fn(async () => setAccessToken('renewed')));
    const unauthorized = vi.fn();
    const removeUnauthorized = setUnauthorizedHandler(unauthorized);

    await expect(request('/protected')).rejects.toMatchObject({ status: 500 });
    expect(unauthorized).not.toHaveBeenCalled();
    expect(getAccessToken()).toBe('renewed');

    removeRefresh();
    removeUnauthorized();
  });
});
