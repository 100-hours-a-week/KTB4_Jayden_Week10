import { beforeEach, describe, expect, it, vi } from 'vitest';

const { requestMock } = vi.hoisted(() => ({ requestMock: vi.fn() }));
vi.mock('../../shared/api/httpClient.js', () => ({ request: requestMock }));

import {
  deleteCurrentUser,
  createUser,
  getCurrentUser,
  updateCurrentUser,
  updatePassword,
} from './userService.js';

beforeEach(() => requestMock.mockReset());

describe('userService', () => {
  it('현재 사용자 정보를 반환한다', async () => {
    requestMock.mockResolvedValue({ data: { userId: 1, email: 'hobby@example.com', nickname: '하비' } });
    await expect(getCurrentUser()).resolves.toMatchObject({ nickname: '하비' });
    expect(requestMock).toHaveBeenCalledWith('/users/me', { signal: undefined, retryOn401: true });
  });

  it('닉네임과 확정된 프로필 이미지 URL만 PATCH한다', async () => {
    requestMock.mockResolvedValue({ data: { nickname: '새하비' } });
    const profile = { nickname: '새하비', profileImageUrl: '/profile.jpg' };
    await updateCurrentUser(profile);
    expect(requestMock).toHaveBeenCalledWith('/users/me', { method: 'PATCH', body: profile });
  });

  it('회원 탈퇴를 body 없는 DELETE로 요청한다', async () => {
    requestMock.mockResolvedValue(null);
    await deleteCurrentUser();
    expect(requestMock).toHaveBeenCalledWith('/users/me', { method: 'DELETE' });
  });

  it('비밀번호 확인 없이 새 비밀번호만 PATCH한다', async () => {
    requestMock.mockResolvedValue(null);
    await updatePassword('Valid1!x');
    expect(requestMock).toHaveBeenCalledWith('/users/me/password', {
      method: 'PATCH', body: { password: 'Valid1!x' },
    });
  });

  it('회원가입 정보를 인증 없이 POST한다', async () => {
    const userData = {
      email: 'new@example.com', password: 'Valid1!x', nickname: '새하비', profileImageUrl: null,
    };
    requestMock.mockResolvedValue({ data: { userId: 1 } });
    await createUser(userData);
    expect(requestMock).toHaveBeenCalledWith('/users', {
      method: 'POST', body: userData, auth: false, retryOn401: false,
    });
  });
});
