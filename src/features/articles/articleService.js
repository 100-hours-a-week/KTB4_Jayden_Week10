import { request } from '../../shared/api/httpClient.js';
import { requireArray, requireId, requireRecord } from '../../shared/api/contracts.js';

export const ARTICLE_PAGE_SIZE = 10;

/**
 * @typedef {Object} ArticleDetail
 * @property {number|string} articleId
 * @property {number|string} userId
 * @property {string} title
 * @property {string} content
 * @property {string[]} imageUrls
 * @property {boolean} likedByMe
 */

function toCount(value) {
  const count = Number(value);
  return Number.isFinite(count) && count >= 0 ? count : 0;
}

export function mapArticleSummary(article) {
  const imageUrls = Array.isArray(article?.contentImageUrls) ? article.contentImageUrls : [];

  return {
    articleId: article?.articleId,
    userId: article?.userId,
    title: article?.title ?? '',
    thumbnailUrl: imageUrls.find(Boolean) ?? '',
    likeCount: toCount(article?.articleLikeCount),
    commentCount: toCount(article?.commentCount),
    viewCount: toCount(article?.articleViewCount),
    createdAt: article?.createdAt ?? '',
    isUpdated: Boolean(article?.updatedAt),
    nickname: article?.nickname ?? '',
    profileImageUrl: article?.profileImageUrl ?? '',
  };
}

export function mapArticleDetail(article) {
  const imageUrls = Array.isArray(article?.contentImageUrls)
    ? article.contentImageUrls.filter(Boolean)
    : [];

  return {
    articleId: article?.articleId,
    userId: article?.userId,
    title: article?.title ?? '',
    content: article?.content ?? '',
    imageUrls,
    nickname: article?.nickname ?? '',
    profileImageUrl: article?.profileImageUrl ?? '',
    createdAt: article?.createdAt ?? '',
    isUpdated: Boolean(article?.updatedAt),
    likeCount: toCount(article?.articleLikeCount),
    viewCount: toCount(article?.articleViewCount),
    commentCount: toCount(article?.commentCount),
    likedByMe: Boolean(article?.likedByMe),
  };
}

export async function getArticles({
  pageSize = ARTICLE_PAGE_SIZE,
  lastArticleId,
  signal,
} = {}) {
  const searchParams = new URLSearchParams({ pageSize: String(pageSize) });
  if (lastArticleId !== undefined && lastArticleId !== null && lastArticleId !== '') {
    searchParams.set('lastArticleId', String(lastArticleId));
  }

  const response = await request(`/articles?${searchParams.toString()}`, { signal });
  const articles = requireArray(response?.data, '게시글 목록');
  return articles.map(mapArticleSummary);
}

export async function getArticle(articleId, { signal } = {}) {
  const response = await request(`/articles/${encodeURIComponent(articleId)}`, { signal });
  const article = requireRecord(response?.data, '게시글 상세');
  requireId(article, 'articleId', '게시글 상세');
  requireId(article, 'userId', '게시글 상세');
  return mapArticleDetail(article);
}

export async function incrementArticleView(articleId) {
  const response = await request(`/views/articles/${encodeURIComponent(articleId)}`, {
    method: 'POST',
    includeResponseMeta: true,
  });
  return response.status;
}

export async function addArticleLike(articleId) {
  return request(`/likes/articles/${encodeURIComponent(articleId)}`, { method: 'POST' });
}

export async function removeArticleLike(articleId) {
  return request(`/likes/articles/${encodeURIComponent(articleId)}`, { method: 'DELETE' });
}

export async function createArticle(articleData) {
  const response = await request('/articles', { method: 'POST', body: articleData });
  return requireId(requireRecord(response?.data, '게시글 작성'), 'articleId', '게시글 작성');
}

export async function updateArticle(articleId, articleData) {
  const response = await request(`/articles/${encodeURIComponent(articleId)}`, {
    method: 'PUT',
    body: articleData,
  });
  return requireId(requireRecord(response?.data, '게시글 수정'), 'articleId', '게시글 수정');
}

export async function deleteArticle(articleId) {
  return request(`/articles/${encodeURIComponent(articleId)}`, { method: 'DELETE' });
}
