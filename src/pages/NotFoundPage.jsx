import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return (
    <main className="placeholder-page">
      <h1>페이지를 찾을 수 없습니다</h1>
      <p>주소를 확인하거나 게시글 목록으로 돌아가주세요.</p>
      <Link to="/posts">게시글 목록으로</Link>
    </main>
  );
}
