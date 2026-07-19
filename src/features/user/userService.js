import { request } from '../../shared/api/httpClient.js';

export async function getCurrentUser({ signal, retryOn401 = true } = {}) {
  const response = await request('/users/me', { signal, retryOn401 });
  return response?.data ?? null;
}
