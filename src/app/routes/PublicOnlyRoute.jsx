import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { AUTH_STATUS } from '../../features/auth/authConstants.js';
import { useAuth } from '../../features/auth/AuthContext.jsx';
import { AuthStatusFallback } from '../../features/auth/components/AuthStatusFallback.jsx';
import { getSafeReturnTo } from '../../shared/lib/getSafeReturnTo.js';

export function PublicOnlyRoute() {
  const { status, bootstrapError, retryBootstrap } = useAuth();
  const location = useLocation();

  if (status === AUTH_STATUS.CHECKING) return <AuthStatusFallback error={bootstrapError} onRetry={retryBootstrap} />;
  if (status === AUTH_STATUS.AUTHENTICATED) {
    const returnTo = location.pathname === '/login'
      ? new URLSearchParams(location.search).get('returnTo')
      : null;
    return <Navigate to={getSafeReturnTo(returnTo)} replace />;
  }
  return <Outlet />;
}
