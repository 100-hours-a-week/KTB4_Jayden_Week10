import { Outlet } from 'react-router-dom';
import { Header } from './components/Header.jsx';

export function AppLayout() {
  return (
    <>
      <a className="skip-link" href="#main-content">본문으로 건너뛰기</a>
      <Header />
      <Outlet />
    </>
  );
}
