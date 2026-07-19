import { request } from '../../shared/api/httpClient.js';
import { requireArray } from '../../shared/api/contracts.js';

export const COMMENT_PAGE_SIZE = 10;

/**
 * @typedef {Object} Comment
 * @property {number|string} commentId
 * @property {number|string} userId
 * @property {number|string|null} parentCommentId
 * @property {string} commentText
 */

export function mapComment(comment) {
  return {
    commentId: comment?.commentId,
    userId: comment?.userId,
    parentCommentId: comment?.parentCommentId ?? null,
    commentText: comment?.commentText ?? '',
    nickname: comment?.nickname ?? '',
    profileImageUrl: comment?.profileImageUrl ?? '',
    createdAt: comment?.createdAt ?? '',
    isDeleted: Boolean(comment?.deletedAt),
  };
}

export function orderComments(comments) {
  const rootComments = [];
  const repliesByParent = new Map();

  comments.forEach((comment) => {
    if (comment.parentCommentId === null) {
      rootComments.push(comment);
      return;
    }
    const parentKey = String(comment.parentCommentId);
    const replies = repliesByParent.get(parentKey) ?? [];
    replies.push(comment);
    repliesByParent.set(parentKey, replies);
  });

  const orderedComments = [];
  const orderedIds = new Set();
  rootComments.forEach((comment) => {
    orderedComments.push(comment);
    orderedIds.add(String(comment.commentId));
    (repliesByParent.get(String(comment.commentId)) ?? []).forEach((reply) => {
      orderedComments.push(reply);
      orderedIds.add(String(reply.commentId));
    });
  });

  comments.forEach((comment) => {
    if (!orderedIds.has(String(comment.commentId))) orderedComments.push(comment);
  });
  return orderedComments;
}

export async function getComments(articleId, {
  pageSize = COMMENT_PAGE_SIZE,
  lastCommentId,
  lastParentCommentId,
  signal,
} = {}) {
  const searchParams = new URLSearchParams({ pageSize: String(pageSize) });
  if (lastCommentId !== undefined && lastCommentId !== null && lastCommentId !== '') {
    searchParams.set('lastCommentId', String(lastCommentId));
  }
  if (lastParentCommentId !== undefined && lastParentCommentId !== null && lastParentCommentId !== '') {
    searchParams.set('lastParentCommentId', String(lastParentCommentId));
  }

  const response = await request(
    `/articles/${encodeURIComponent(articleId)}/comments?${searchParams.toString()}`,
    { signal },
  );
  const comments = requireArray(response?.data, '댓글 목록');
  return comments.map(mapComment);
}

export async function createComment(articleId, { commentText, parentCommentId = null }) {
  const response = await request(`/articles/${encodeURIComponent(articleId)}/comments`, {
    method: 'POST',
    body: { commentText, parentCommentId },
  });
  const comment = response?.data;
  return comment?.commentId === undefined || comment?.commentId === null ? null : mapComment(comment);
}

export async function updateComment(articleId, commentId, commentText) {
  return request(
    `/articles/${encodeURIComponent(articleId)}/comments/${encodeURIComponent(commentId)}`,
    { method: 'PUT', body: { commentText } },
  );
}

export async function deleteComment(articleId, commentId) {
  return request(
    `/articles/${encodeURIComponent(articleId)}/comments/${encodeURIComponent(commentId)}`,
    { method: 'DELETE' },
  );
}
