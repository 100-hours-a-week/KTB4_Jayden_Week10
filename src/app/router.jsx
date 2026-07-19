import { createBrowserRouter } from 'react-router-dom';
import { AppLayout } from '../layouts/AppLayout.jsx';
import { AuthLayout } from '../layouts/AuthLayout.jsx';
import { LoginPage } from '../pages/LoginPage.jsx';
import { NotFoundPage } from '../pages/NotFoundPage.jsx';
import { PostListPage } from '../pages/PostListPage.jsx';
import { RoutePlaceholderPage } from '../pages/RoutePlaceholderPage.jsx';
import { SignupPage } from '../pages/SignupPage.jsx';
import { ProtectedRoute } from './routes/ProtectedRoute.jsx';
import { PublicOnlyRoute } from './routes/PublicOnlyRoute.jsx';
import { RootRoute } from './routes/RootRoute.jsx';

export const router = createBrowserRouter([
  { path: '/', element: <RootRoute /> },
  {
    element: <PublicOnlyRoute />,
    children: [
      {
        element: <AuthLayout />,
        children: [
          { path: '/login', element: <LoginPage /> },
          { path: '/signup', element: <SignupPage /> },
        ],
      },
    ],
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { path: '/posts', element: <PostListPage /> },
          { path: '/posts/new', element: <RoutePlaceholderPage /> },
          { path: '/posts/:articleId', element: <RoutePlaceholderPage /> },
          { path: '/posts/:articleId/edit', element: <RoutePlaceholderPage /> },
          { path: '/settings/profile', element: <RoutePlaceholderPage /> },
          { path: '/settings/password', element: <RoutePlaceholderPage /> },
          { path: '*', element: <NotFoundPage /> },
        ],
      },
    ],
  },
]);
