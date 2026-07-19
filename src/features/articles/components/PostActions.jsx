import { useCallback, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ConfirmDialog } from '../../../shared/components/ConfirmDialog.jsx';
import { getErrorMessage } from '../../../shared/errors/errorMessages.js';
import { deleteArticle } from '../articleService.js';

export function PostActions({ articleId }) {
  const navigate = useNavigate();
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState(null);
  const triggerRef = useRef(null);
  const deletingRef = useRef(false);

  const closeDialog = useCallback(() => setIsDeleteOpen(false), []);

  async function handleDelete() {
    if (deletingRef.current) return;
    deletingRef.current = true;
    setIsDeleting(true);
    setError(null);
    try {
      await deleteArticle(articleId);
      navigate('/posts', { replace: true });
    } catch (deleteError) {
      setError(deleteError);
    } finally {
      deletingRef.current = false;
      setIsDeleting(false);
    }
  }

  return (
    <>
      <div className="article-detail__actions">
        <Link className="button button--outline" to={`/posts/${encodeURIComponent(articleId)}/edit`}>수정</Link>
        <button ref={triggerRef} className="button button--outline" type="button" onClick={() => setIsDeleteOpen(true)}>삭제</button>
      </div>
      <ConfirmDialog
        open={isDeleteOpen}
        title="게시글을 삭제하시겠습니까?"
        description="삭제한 내용은 복구할 수 없습니다."
        pending={isDeleting}
        pendingLabel="삭제 중…"
        errorMessage={error ? getErrorMessage(error, 'article.delete') : ''}
        triggerRef={triggerRef}
        onConfirm={handleDelete}
        onClose={closeDialog}
      />
    </>
  );
}
