import { beforeEach, describe, expect, it, vi } from 'vitest';

const { requestMock } = vi.hoisted(() => ({ requestMock: vi.fn() }));
vi.mock('../../shared/api/httpClient.js', () => ({ request: requestMock }));

import {
  uploadContentImages,
  uploadProfileImage,
  validateContentImageFiles,
} from './imageService.js';

beforeEach(() => requestMock.mockReset());

describe('imageService', () => {
  it('게시글 이미지의 파일당 10MB와 전체 100MB 제한을 검증한다', () => {
    expect(validateContentImageFiles([{ size: 10 * 1024 * 1024 + 1 }])).toContain('파일당 10MB');
    expect(validateContentImageFiles(Array.from({ length: 11 }, () => ({ size: 10 * 1024 * 1024 })))).toContain('전체 100MB');
    expect(validateContentImageFiles([{ size: 10 * 1024 * 1024 }])).toBe('');
  });

  it('회원가입 프로필 이미지를 access token 없이 업로드한다', async () => {
    const file = new File(['profile'], 'profile.png', { type: 'image/png' });
    requestMock.mockResolvedValue({ data: { fileUrl: '/profile.png' } });

    await expect(uploadProfileImage(file, { auth: false })).resolves.toBe('/profile.png');
    expect(requestMock).toHaveBeenCalledWith('/users/me/profile-image', expect.objectContaining({
      method: 'POST', auth: false, retryOn401: false,
    }));
    expect(requestMock.mock.calls[0][1].body.get('profileImage')).toBe(file);
  });

  it('로그인 사용자 프로필 이미지는 인증 요청으로 업로드한다', async () => {
    requestMock.mockResolvedValue({ data: { fileUrl: '/profile.png' } });
    await uploadProfileImage(new File(['profile'], 'profile.png'));
    expect(requestMock.mock.calls[0][1]).toEqual(expect.objectContaining({ auth: true, retryOn401: true }));
  });

  it('프로필 fileUrl이 없는 응답을 성공으로 처리하지 않는다', async () => {
    requestMock.mockResolvedValue({ data: {} });
    await expect(uploadProfileImage(new File(['profile'], 'profile.png'))).rejects.toThrow('fileUrl');
  });

  it('파일이 없으면 API를 호출하지 않는다', async () => {
    await expect(uploadContentImages([])).resolves.toEqual([]);
    expect(requestMock).not.toHaveBeenCalled();
  });

  it('모든 게시글 이미지를 contentImages 필드로 업로드한다', async () => {
    const files = [new File(['one'], 'one.png'), new File(['two'], 'two.jpg')];
    requestMock.mockResolvedValue({ data: { fileUrls: ['/one.png', '/two.jpg'] } });

    await expect(uploadContentImages(files)).resolves.toEqual(['/one.png', '/two.jpg']);
    const [, options] = requestMock.mock.calls[0];
    expect(requestMock.mock.calls[0][0]).toBe('/articles/content-image');
    expect(options.method).toBe('POST');
    expect(options.body.getAll('contentImages')).toEqual(files);
  });

  it('fileUrls가 없는 응답을 성공으로 처리하지 않는다', async () => {
    requestMock.mockResolvedValue({ data: {} });
    await expect(uploadContentImages([new File(['one'], 'one.png')])).rejects.toThrow('fileUrls');
  });
});
