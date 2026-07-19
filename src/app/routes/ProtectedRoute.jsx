import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { AUTH_STATUS } from '../../features/auth/authConstants.js';
import { useAuth } from '../../features/auth/AuthContext.jsx';
import { AuthStatusFallback } from '../../features/auth/components/AuthStatusFallback.jsx';

export function ProtectedRoute() {
  const { status, suppressReturnTo, bootstrapError, retryBootstrap } = useAuth();
  const location = useLocation();

  if (status === AUTH_STATUS.CHECKING) return <AuthStatusFallback error={bootstrapError} onRetry={retryBootstrap} />;

  if (status === AUTH_STATUS.ANONYMOUS) {
    if (suppressReturnTo) return <Navigate to="/login" replace />;
    const returnTo = `${location.pathname}${location.search}${location.hash}`;
    return <Navigate to={`/login?returnTo=${encodeURIComponent(returnTo)}`} replace />;
  }

  return <Outlet />;
}
