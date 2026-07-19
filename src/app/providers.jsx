import { RouterProvider } from 'react-router-dom';
import { AuthProvider } from '../features/auth/AuthContext.jsx';
import { router } from './router.jsx';
import { ToastProvider } from '../shared/components/ToastContext.jsx';

export function AppProviders() {
  return (
    <ToastProvider>
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    </ToastProvider>
  );
}
