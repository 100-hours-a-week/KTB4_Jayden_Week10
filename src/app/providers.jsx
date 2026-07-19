import { RouterProvider } from 'react-router-dom';
import { AuthProvider } from '../features/auth/AuthContext.jsx';
import { router } from './router.jsx';

export function AppProviders() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  );
}
