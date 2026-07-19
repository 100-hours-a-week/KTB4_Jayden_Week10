import { useState } from 'react';
import { Link, Outlet } from 'react-router-dom';
import { useAuth } from '../features/auth/AuthContext.jsx';

export function AppLayout() {
  const { user, logout } = useAuth();
  const [logoutError, setLogoutError] = useState('');

  async function handleLogout() {
    setLogoutError('');
    try {
      await logout();
    } catch {
      setLogoutError('로그아웃하지 못했습니다. 다시 시도해주세요.');
    }
  }

  return (
    <>
      <header className="migration-header">
        <Link to="/posts" aria-label="하비루프 홈">하비루프</Link>
        <div>
          <span>{user?.nickname}</span>
          <button type="button" onClick={handleLogout}>로그아웃</button>
        </div>
      </header>
      {logoutError && <p className="app-request-error" role="alert">{logoutError}</p>}
      <Outlet />
    </>
  );
}
