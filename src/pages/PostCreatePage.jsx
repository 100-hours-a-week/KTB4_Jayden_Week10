import { useNavigate } from 'react-router-dom';
import { PostForm } from '../features/articles/components/PostForm.jsx';
import { createArticle } from '../features/articles/articleService.js';

export function PostCreatePage() {
  const navigate = useNavigate();

  async function handleCreate(articleData) {
    const articleId = await createArticle(articleData);
    navigate(`/posts/${encodeURIComponent(articleId)}`, { replace: true });
  }

  return (
    <main id="main-content" className="post-create-main">
      <section className="post-create-section" aria-labelledby="post-create-title">
        <h1 id="post-create-title" className="post-create-title">취미 이야기 작성</h1>
        <PostForm onSubmit={handleCreate} />
      </section>
    </main>
  );
}
