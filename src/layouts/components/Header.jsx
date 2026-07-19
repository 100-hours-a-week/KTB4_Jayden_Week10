import { Link, useLocation } from 'react-router-dom';
import { AccountMenu } from '../../features/auth/components/AccountMenu.jsx';

export function Header() {
  const location = useLocation();
  const showBackLink = location.pathname !== '/posts';
  const editMatch = location.pathname.match(/^\/posts\/(\d+)\/edit\/?$/);
  const backTo = editMatch ? `/posts/${editMatch[1]}` : '/posts';

  return (
    <header className="site-header">
      <nav className="site-header__inner" aria-label="주요 메뉴">
        {showBackLink && <Link className="detail-back" to={backTo} aria-label={editMatch ? '게시글 상세로 돌아가기' : '게시글 목록으로 돌아가기'}><span aria-hidden="true">‹</span></Link>}
        <Link className="site-logo" to="/posts" aria-label="하비루프 홈">하비루프</Link>
        <AccountMenu />
      </nav>
    </header>
  );
}
