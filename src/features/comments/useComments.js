import { useCallback, useMemo } from 'react';
import { useCursorPagination } from '../../shared/hooks/useCursorPagination.js';
import {
  COMMENT_PAGE_SIZE,
  createComment,
  deleteComment,
  getComments,
  orderComments,
  updateComment,
} from './commentService.js';

const getCommentId = (comment) => comment.commentId;
const getCommentCursor = (comment) => ({
  lastCommentId: comment.commentId,
  lastParentCommentId: comment.parentCommentId,
});

export function useComments(articleId) {
  const fetchPage = useCallback(({ cursor, signal }) => getComments(articleId, {
    pageSize: COMMENT_PAGE_SIZE,
    lastCommentId: cursor?.lastCommentId ?? null,
    lastParentCommentId: cursor?.lastParentCommentId ?? null,
    signal,
  }), [articleId]);
  const pagination = useCursorPagination({
    fetchPage,
    getCursor: getCommentCursor,
    getItemId: getCommentId,
    pageSize: COMMENT_PAGE_SIZE,
  });

  const addComment = useCallback(async (commentText, parentCommentId = null) => {
    const createdComment = await createComment(articleId, { commentText, parentCommentId });
    await pagination.reset({ throwOnError: true });
    return createdComment;
  }, [articleId, pagination]);
  const editComment = useCallback(async (commentId, commentText) => {
    await updateComment(articleId, commentId, commentText);
    pagination.setItems((currentItems) => currentItems.map((comment) => (
      String(comment.commentId) === String(commentId) ? { ...comment, commentText } : comment
    )));
  }, [articleId, pagination]);
  const removeComment = useCallback(async (commentId) => {
    await deleteComment(articleId, commentId);
    pagination.setItems((currentItems) => currentItems.map((comment) => (
      String(comment.commentId) === String(commentId) ? { ...comment, isDeleted: true } : comment
    )));
  }, [articleId, pagination]);
  const orderedItems = useMemo(() => orderComments(pagination.items), [pagination.items]);

  return {
    ...pagination,
    items: orderedItems,
    retry: pagination.reset,
    addComment,
    editComment,
    removeComment,
  };
}
