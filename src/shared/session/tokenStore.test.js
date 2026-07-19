import { afterEach, describe, expect, it } from 'vitest';
import { clearAccessToken, getAccessToken, setAccessToken } from './tokenStore.js';

afterEach(clearAccessToken);

describe('tokenStore', () => {
  it('access token을 메모리에 저장하고 제거한다', () => {
    setAccessToken('access-token');
    expect(getAccessToken()).toBe('access-token');
    clearAccessToken();
    expect(getAccessToken()).toBeNull();
  });
});
