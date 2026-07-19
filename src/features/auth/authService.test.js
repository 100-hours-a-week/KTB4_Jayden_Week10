import { beforeEach, describe, expect, it, vi } from 'vitest';

const { requestMock } = vi.hoisted(() => ({ requestMock: vi.fn() }));
vi.mock('../../shared/api/httpClient.js', () => ({ request: requestMock }));

import { clearAccessToken, getAccessToken, setAccessToken } from '../../shared/session/tokenStore.js';
import { logout, refreshAccessToken } from './authService.js';

beforeEach(() => {
  requestMock.mockReset();
  clearAccessToken();
});

describe('refreshAccessToken', () => {
  it('동시에 호출되면 하나의 요청 Promise를 공유한다', async () => {
    let resolveRequest;
    requestMock.mockReturnValue(new Promise((resolve) => { resolveRequest = resolve; }));

    const first = refreshAccessToken();
    const second = refreshAccessToken();
    resolveRequest({ data: { accessToken: 'renewed-token' } });

    await expect(Promise.all([first, second])).resolves.toEqual(['renewed-token', 'renewed-token']);
    expect(requestMock).toHaveBeenCalledTimes(1);
    expect(getAccessToken()).toBe('renewed-token');
  });
});

describe('logout', () => {
  it('access token 없이 요청하고 성공한 경우에만 메모리 token을 제거한다', async () => {
    setAccessToken('current-token');
    requestMock.mockResolvedValue({ message: 'logout_success', data: null });
    await logout();
    expect(requestMock).toHaveBeenCalledWith('/auth/logout', {
      method: 'POST', auth: false, retryOn401: false,
    });
    expect(getAccessToken()).toBeNull();
  });

  it('로그아웃 요청 실패 시 메모리 token을 유지한다', async () => {
    setAccessToken('current-token');
    requestMock.mockRejectedValue(new Error('network error'));
    await expect(logout()).rejects.toThrow('network error');
    expect(getAccessToken()).toBe('current-token');
  });
});
