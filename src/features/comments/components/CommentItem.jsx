import { useCallback, useRef, useState } from 'react';
import { Avatar } from '../../../shared/components/Avatar.jsx';
import { ConfirmDialog } from '../../../shared/components/ConfirmDialog.jsx';
import { getErrorMessage } from '../../../shared/errors/errorMessages.js';
import { formatArticleDate } from '../../../shared/lib/formatArticle.js';
import { CommentForm } from './CommentForm.jsx';

export function CommentItem({ comment, canManage, onCreateReply, onEdit, onDelete }) {
  const isReply = comment.parentCommentId !== null;
  const [isEditing, setIsEditing] = useState(false);
  const [isReplying, setIsReplying] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deleteError, setDeleteError] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const deleteTriggerRef = useRef(null);
  const closeDeleteDialog = useCallback(() => setIsDeleteOpen(false), []);

  async function handleEdit(commentText) {
    await onEdit(comment.commentId, commentText);
    setIsEditing(false);
  }

  async function handleReply(commentText) {
    await onCreateReply(commentText, comment.commentId);
    setIsReplying(false);
  }

  async function handleDelete() {
    if (isDeleting) return;
    setIsDeleting(true);
    setDeleteError(null);
    try {
      await onDelete(comment.commentId);
      setIsDeleteOpen(false);
    } catch (error) {
      setDeleteError(error);
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <li className={`comment-item${isReply ? ' is-reply' : ''}${comment.isDeleted ? ' is-deleted' : ''}${isEditing ? ' is-editing' : ''}`}>
      <article>
        <header>
          <Avatar src={comment.profileImageUrl} name={comment.nickname} />
          <strong>{comment.nickname}</strong>
          <time dateTime={comment.createdAt}>{formatArticleDate(comment.createdAt)}</time>
          {!comment.isDeleted && (
            <div className="comment-item__actions">
              {!isReply && <button type="button" onClick={() => setIsReplying((current) => !current)}>답글</button>}
              {canManage && <button type="button" onClick={() => setIsEditing(true)}>수정</button>}
              {canManage && <button ref={deleteTriggerRef} type="button" onClick={() => setIsDeleteOpen(true)}>삭제</button>}
            </div>
          )}
        </header>
        <p data-comment-text>{comment.isDeleted ? '해당 댓글은 삭제되었습니다.' : comment.commentText}</p>
        {isEditing && (
          <CommentForm
            mode="수정 완료"
            initialValue={comment.commentText}
            onSubmit={handleEdit}
            onCancel={() => setIsEditing(false)}
            variant={`edit-${comment.commentId}`}
            autoFocus
          />
        )}
        {isReplying && (
          <CommentForm
            mode="답글 등록"
            placeholder={`${comment.nickname}님에게 답글 남기기`}
            onSubmit={handleReply}
            onCancel={() => setIsReplying(false)}
            variant={`reply-${comment.commentId}`}
            autoFocus
          />
        )}
      </article>
      <ConfirmDialog
        open={isDeleteOpen}
        title="댓글을 삭제하시겠습니까?"
        description="삭제한 내용은 복구할 수 없습니다."
        pending={isDeleting}
        pendingLabel="삭제 중…"
        errorMessage={deleteError ? getErrorMessage(deleteError, 'comment.delete') : ''}
        triggerRef={deleteTriggerRef}
        onConfirm={handleDelete}
        onClose={closeDeleteDialog}
      />
    </li>
  );
}
