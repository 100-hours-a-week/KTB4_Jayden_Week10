import { Link, useNavigate, useParams } from 'react-router-dom';
import { PostForm } from '../features/articles/components/PostForm.jsx';
import { parseArticleId } from '../features/articles/articleValidation.js';
import { usePostEditor } from '../features/articles/usePostEditor.js';

export function PostEditPage() {
  const articleId = parseArticleId(useParams().articleId);
  const navigate = useNavigate();
  const { article, status, error, retry, saveArticle } = usePostEditor(articleId);

  async function handleUpdate(articleData) {
    const updatedArticleId = await saveArticle(articleData);
    navigate(`/posts/${encodeURIComponent(updatedArticleId)}`, { replace: true });
  }

  return (
    <main id="main-content" className="post-create-main">
      <section className="post-create-section" aria-labelledby="post-edit-title">
        {status === 'loading' && <p className="post-edit-state" role="status">게시글을 불러오는 중…</p>}
        {status === 'error' && (
          <div className="post-edit-state post-edit-state--error" role="alert">
            <h1>게시글을 불러오지 못했어요.</h1>
            <p>{error?.message}</p>
            <button className="button button--secondary" type="button" onClick={retry}>다시 시도</button>
          </div>
        )}
        {status === 'not-found' && (
          <div className="post-edit-state">
            <h1>수정할 게시글을 찾을 수 없어요.</h1>
            <Link className="button button--primary" to="/posts">목록으로 돌아가기</Link>
          </div>
        )}
        {status === 'success' && article && (
          <>
            <h1 id="post-edit-title" className="post-create-title">취미 이야기 수정</h1>
            <PostForm mode="edit" initialValue={article} onSubmit={handleUpdate} />
          </>
        )}
      </section>
    </main>
  );
}
