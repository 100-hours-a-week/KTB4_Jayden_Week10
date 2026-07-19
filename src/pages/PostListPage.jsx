import { Link } from 'react-router-dom';

export function PostListPage() {
  return (
    <main className="placeholder-page">
      <h1>게시글</h1>
      <p>인증 기반 마이그레이션이 완료되었습니다. 게시글 화면은 후속 단계에서 연결됩니다.</p>
      <Link to="/posts/new">게시글 작성 경로 확인</Link>
    </main>
  );
}
