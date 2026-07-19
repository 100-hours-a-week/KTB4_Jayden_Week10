import { request } from '../../shared/api/httpClient.js';
import { requireId, requireRecord } from '../../shared/api/contracts.js';

/**
 * @typedef {Object} CurrentUser
 * @property {number|string} userId
 * @property {string} email
 * @property {string} nickname
 * @property {string|null} profileImageUrl
 */

export async function getCurrentUser({ signal, retryOn401 = true } = {}) {
  const response = await request('/users/me', { signal, retryOn401 });
  if (response?.data === null || response?.data === undefined) return null;
  const user = requireRecord(response.data, '현재 사용자');
  requireId(user, 'userId', '현재 사용자');
  return user;
}

export async function updateCurrentUser({ nickname, profileImageUrl }) {
  const response = await request('/users/me', {
    method: 'PATCH',
    body: { nickname, profileImageUrl: profileImageUrl || null },
  });
  if (response?.data === null || response?.data === undefined) return null;
  return requireRecord(response.data, '사용자 수정');
}

export async function deleteCurrentUser() {
  return request('/users/me', { method: 'DELETE' });
}

export async function updatePassword(password) {
  return request('/users/me/password', {
    method: 'PATCH',
    body: { password },
  });
}

export async function createUser(userData) {
  return request('/users', {
    method: 'POST',
    body: userData,
    auth: false,
    retryOn401: false,
  });
}
