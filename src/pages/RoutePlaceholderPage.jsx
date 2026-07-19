import { useLocation, useParams } from 'react-router-dom';

export function RoutePlaceholderPage() {
  const location = useLocation();
  const params = useParams();
  const articleSuffix = params.articleId ? ` (${params.articleId})` : '';

  return (
    <main className="placeholder-page">
      <h1>마이그레이션 준비 화면{articleSuffix}</h1>
      <p><code>{location.pathname}</code> 경로가 React Router에 연결되었습니다.</p>
    </main>
  );
}
