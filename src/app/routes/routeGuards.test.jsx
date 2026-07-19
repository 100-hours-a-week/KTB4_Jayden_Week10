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

function renderWithStatus(status, initialEntry, routeElement, { suppressReturnTo = false } = {}) {
  const authValue = {
    status,
    user: null,
    bootstrapError: null,
    retryBootstrap: vi.fn(),
    suppressReturnTo,
  };

  return render(
    <AuthContext.Provider value={authValue}>
      <MemoryRouter initialEntries={[initialEntry]}>
        <Routes>
          {routeElement}
          <Route path="/login" element={<LocationProbe />} />
          <Route path="/posts" element={<LocationProbe />} />
          <Route path="/posts/:id" element={<LocationProbe />} />
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

  it('로그인 중 authenticated로 전환되면 안전한 returnTo를 우선한다', () => {
    renderWithStatus(
      AUTH_STATUS.AUTHENTICATED,
      '/login?returnTo=%2Fposts%2F10%3Ftab%3Dcomments%23reply',
      <Route element={<PublicOnlyRoute />}><Route path="/login" element={<p>login</p>} /></Route>,
    );

    expect(screen.getByText('/posts/10?tab=comments#reply')).toBeInTheDocument();
  });

  it('명시적 로그아웃·탈퇴는 보호 경로 returnTo를 남기지 않는다', () => {
    renderWithStatus(
      AUTH_STATUS.ANONYMOUS,
      '/settings/profile',
      <Route element={<ProtectedRoute />}><Route path="/settings/profile" element={<p>protected</p>} /></Route>,
      { suppressReturnTo: true },
    );

    expect(screen.getByText('/login')).toBeInTheDocument();
  });
});
