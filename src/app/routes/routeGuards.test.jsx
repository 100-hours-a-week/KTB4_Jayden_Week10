import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { AuthContext } from '../../features/auth/AuthContext.jsx';
import { AUTH_STATUS } from '../../features/auth/authConstants.js';
import { ProtectedRoute } from './ProtectedRoute.jsx';
import { PublicOnlyRoute } from './PublicOnlyRoute.jsx';

function LocationProbe() {
  const location = useLocation();
  return <span>{`${location.pathname}${location.search}${location.hash}`}</span>;
}

function renderWithStatus(status, initialEntry, routeElement) {
  const authValue = {
    status,
    user: null,
    bootstrapError: null,
    retryBootstrap: vi.fn(),
  };

  return render(
    <AuthContext.Provider value={authValue}>
      <MemoryRouter initialEntries={[initialEntry]}>
        <Routes>
          {routeElement}
          <Route path="/login" element={<LocationProbe />} />
          <Route path="/posts" element={<LocationProbe />} />
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>,
  );
}

describe('route guards', () => {
  it('anonymous 사용자의 보호 경로와 query/hash를 returnTo로 보존한다', () => {
    renderWithStatus(
      AUTH_STATUS.ANONYMOUS,
      '/posts/10?tab=comments#reply',
      <Route element={<ProtectedRoute />}><Route path="/posts/:id" element={<p>protected</p>} /></Route>,
    );

    expect(screen.getByText('/login?returnTo=%2Fposts%2F10%3Ftab%3Dcomments%23reply')).toBeInTheDocument();
  });

  it('authenticated 사용자가 공개 전용 경로에 접근하면 posts로 이동한다', () => {
    renderWithStatus(
      AUTH_STATUS.AUTHENTICATED,
      '/login',
      <Route element={<PublicOnlyRoute />}><Route path="/login" element={<p>login</p>} /></Route>,
    );

    expect(screen.getByText('/posts')).toBeInTheDocument();
  });
});
