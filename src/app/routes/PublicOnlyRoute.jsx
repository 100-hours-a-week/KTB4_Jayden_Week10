import { Navigate, Outlet } from 'react-router-dom';
import { AUTH_STATUS } from '../../features/auth/authConstants.js';
import { useAuth } from '../../features/auth/AuthContext.jsx';
import { AuthStatusFallback } from '../../shared/components/AuthStatusFallback.jsx';

export function PublicOnlyRoute() {
  const { status } = useAuth();

  if (status === AUTH_STATUS.CHECKING) return <AuthStatusFallback />;
  if (status === AUTH_STATUS.AUTHENTICATED) return <Navigate to="/posts" replace />;
  return <Outlet />;
}
