import { beforeEach, describe, expect, it, vi } from 'vitest';

const { requestMock } = vi.hoisted(() => ({ requestMock: vi.fn() }));
vi.mock('../../shared/api/httpClient.js', () => ({ request: requestMock }));

import { clearAccessToken, getAccessToken } from './tokenStore.js';
import { refreshAccessToken } from './authService.js';

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
