import { request } from '../../shared/api/httpClient.js';

export const MAX_IMAGE_FILE_SIZE = 10 * 1024 * 1024;
export const MAX_IMAGE_TOTAL_SIZE = 100 * 1024 * 1024;

export function validateContentImageFiles(files) {
  if (files.some((file) => file.size > MAX_IMAGE_FILE_SIZE)) {
    return '이미지는 파일당 10MB 이하만 선택할 수 있습니다.';
  }
  const totalSize = files.reduce((sum, file) => sum + file.size, 0);
  if (totalSize > MAX_IMAGE_TOTAL_SIZE) {
    return '이미지는 전체 100MB 이하만 선택할 수 있습니다.';
  }
  return '';
}

export async function uploadProfileImage(file, { auth = true } = {}) {
  const formData = new FormData();
  formData.append('profileImage', file);
  const response = await request('/users/me/profile-image', {
    method: 'POST',
    body: formData,
    auth,
    retryOn401: auth,
  });
  const fileUrl = response?.data?.fileUrl;
  if (!fileUrl) throw new Error('프로필 이미지 업로드 응답에 fileUrl이 없습니다.');
  return fileUrl;
}

export async function uploadContentImages(files) {
  if (!files.length) return [];
  const formData = new FormData();
  files.forEach((file) => formData.append('contentImages', file));
  const response = await request('/articles/content-image', {
    method: 'POST',
    body: formData,
  });
  const fileUrls = response?.data?.fileUrls;
  if (!Array.isArray(fileUrls)) throw new Error('이미지 업로드 응답에 fileUrls가 없습니다.');
  return fileUrls;
}
