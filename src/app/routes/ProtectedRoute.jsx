import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { AUTH_STATUS } from '../../features/auth/authConstants.js';
import { useAuth } from '../../features/auth/AuthContext.jsx';
import { AuthStatusFallback } from '../../shared/components/AuthStatusFallback.jsx';

export function ProtectedRoute() {
  const { status } = useAuth();
  const location = useLocation();

  if (status === AUTH_STATUS.CHECKING) return <AuthStatusFallback />;

  if (status === AUTH_STATUS.ANONYMOUS) {
    const returnTo = `${location.pathname}${location.search}${location.hash}`;
    return <Navigate to={`/login?returnTo=${encodeURIComponent(returnTo)}`} replace />;
  }

  return <Outlet />;
}
