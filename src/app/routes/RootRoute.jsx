import { Navigate } from 'react-router-dom';
import { AUTH_STATUS } from '../../features/auth/authConstants.js';
import { useAuth } from '../../features/auth/AuthContext.jsx';
import { AuthStatusFallback } from '../../features/auth/components/AuthStatusFallback.jsx';

export function RootRoute() {
  const { status, bootstrapError, retryBootstrap } = useAuth();
  if (status === AUTH_STATUS.CHECKING) return <AuthStatusFallback error={bootstrapError} onRetry={retryBootstrap} />;
  return <Navigate to={status === AUTH_STATUS.AUTHENTICATED ? '/posts' : '/login'} replace />;
}
