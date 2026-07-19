import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { HttpResponse, http } from 'msw';
import { setupServer } from 'msw/node';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthProvider, useAuth } from './AuthContext.jsx';
import { clearAccessToken, getAccessToken } from '../../shared/session/tokenStore.js';

const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  server.resetHandlers();
  clearAccessToken();
});
afterAll(() => server.close());

function AuthProbe() {
  const { status, user, bootstrapError, retryBootstrap, login, logout } = useAuth();
  return (
    <div>
      <span data-testid="status">{status}</span>
      <span data-testid="nickname">{user?.nickname}</span>
      {bootstrapError && <button type="button" onClick={retryBootstrap}>retry</button>}
      <button type="button" onClick={() => login({ email: 'user@example.com', password: 'Password1!' }).catch(() => {})}>login</button>
      <button type="button" onClick={() => logout().catch(() => {})}>logout</button>
    </div>
  );
}

describe('AuthProvider bootstrap', () => {
  it('refresh와 사용자 조회 성공 후 authenticated로 전환한다', async () => {
    server.use(
      http.post('http://localhost:8080/auth/token/refresh', () => HttpResponse.json({ data: { accessToken: 'token' } })),
      http.get('http://localhost:8080/users/me', () => HttpResponse.json({ data: { userId: 1, nickname: '하비' } })),
    );

    render(<AuthProvider><AuthProbe /></AuthProvider>);

    expect(screen.getByTestId('status')).toHaveTextContent('checking');
    expect(await screen.findByText('authenticated')).toBeInTheDocument();
    expect(screen.getByTestId('nickname')).toHaveTextContent('하비');
  });

  it('refresh 401이면 anonymous로 전환한다', async () => {
    server.use(
      http.post('http://localhost:8080/auth/token/refresh', () => HttpResponse.json({ message: 'unauthorized' }, { status: 401 })),
    );

    render(<AuthProvider><AuthProbe /></AuthProvider>);
    expect(await screen.findByText('anonymous')).toBeInTheDocument();
  });

  it('사용자 조회 401이면 추가 refresh 없이 anonymous로 전환한다', async () => {
    let refreshCount = 0;
    let userRequestCount = 0;
    server.use(
      http.post('http://localhost:8080/auth/token/refresh', () => {
        refreshCount += 1;
        return HttpResponse.json({ data: { accessToken: 'token' } });
      }),
      http.get('http://localhost:8080/users/me', () => {
        userRequestCount += 1;
        return HttpResponse.json({ message: 'unauthorized' }, { status: 401 });
      }),
    );

    render(<AuthProvider><AuthProbe /></AuthProvider>);

    expect(await screen.findByText('anonymous')).toBeInTheDocument();
    expect(refreshCount).toBe(1);
    expect(userRequestCount).toBe(1);
    expect(getAccessToken()).toBeNull();
  });

  it('사용자 조회 5xx이면 token을 유지하고 retry fallback을 표시한다', async () => {
    let refreshCount = 0;
    let userRequestCount = 0;
    server.use(
      http.post('http://localhost:8080/auth/token/refresh', () => {
        refreshCount += 1;
        return HttpResponse.json({ data: { accessToken: `token-${refreshCount}` } });
      }),
      http.get('http://localhost:8080/users/me', () => {
        userRequestCount += 1;
        return HttpResponse.json({ message: 'unavailable' }, { status: 503 });
      }),
    );

    render(<AuthProvider><AuthProbe /></AuthProvider>);

    expect(await screen.findByRole('button', { name: 'retry' })).toBeInTheDocument();
    expect(screen.getByTestId('status')).toHaveTextContent('checking');
    expect(refreshCount).toBe(2);
    expect(userRequestCount).toBe(2);
    expect(getAccessToken()).toBe('token-2');
  });

  it('사용자 조회 network 오류이면 token을 유지하고 한 번 재시도한다', async () => {
    let refreshCount = 0;
    let userRequestCount = 0;
    server.use(
      http.post('http://localhost:8080/auth/token/refresh', () => {
        refreshCount += 1;
        return HttpResponse.json({ data: { accessToken: `token-${refreshCount}` } });
      }),
      http.get('http://localhost:8080/users/me', () => {
        userRequestCount += 1;
        return HttpResponse.error();
      }),
    );

    render(<AuthProvider><AuthProbe /></AuthProvider>);

    expect(await screen.findByRole('button', { name: 'retry' })).toBeInTheDocument();
    expect(refreshCount).toBe(2);
    expect(userRequestCount).toBe(2);
    expect(getAccessToken()).toBe('token-2');
  });

  it('로그인 직후 사용자 조회 401이면 추가 refresh 없이 anonymous를 유지한다', async () => {
    const user = userEvent.setup();
    let refreshCount = 0;
    let userRequestCount = 0;
    server.use(
      http.post('http://localhost:8080/auth/token/refresh', () => {
        refreshCount += 1;
        return HttpResponse.json({ message: 'unauthorized' }, { status: 401 });
      }),
      http.post('http://localhost:8080/auth/login', () => HttpResponse.json({ data: { token: { accessToken: 'login-token' } } })),
      http.get('http://localhost:8080/users/me', () => {
        userRequestCount += 1;
        return HttpResponse.json({ message: 'unauthorized' }, { status: 401 });
      }),
    );

    render(<AuthProvider><AuthProbe /></AuthProvider>);
    expect(await screen.findByText('anonymous')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'login' }));
    await waitFor(() => expect(userRequestCount).toBe(1));

    expect(refreshCount).toBe(1);
    expect(screen.getByTestId('status')).toHaveTextContent('anonymous');
    expect(getAccessToken()).toBeNull();
  });

  it('네트워크 오류를 한 번 재시도한 뒤 checking 오류 상태를 유지한다', async () => {
    let requestCount = 0;
    server.use(
      http.post('http://localhost:8080/auth/token/refresh', () => {
        requestCount += 1;
        return HttpResponse.error();
      }),
    );

    render(<AuthProvider><AuthProbe /></AuthProvider>);
    expect(await screen.findByRole('button', { name: 'retry' })).toBeInTheDocument();
    expect(screen.getByTestId('status')).toHaveTextContent('checking');
    expect(requestCount).toBe(2);
  });

  it('logout 실패 시 추가 refresh 없이 authenticated 상태와 token을 유지한다', async () => {
    const user = userEvent.setup();
    let refreshCount = 0;
    server.use(
      http.post('http://localhost:8080/auth/token/refresh', () => {
        refreshCount += 1;
        return HttpResponse.json({ data: { accessToken: 'bootstrap-token' } });
      }),
      http.get('http://localhost:8080/users/me', () => HttpResponse.json({ data: { userId: 1, nickname: '하비' } })),
      http.post('http://localhost:8080/auth/logout', () => HttpResponse.json({ message: 'unavailable' }, { status: 503 })),
    );

    render(<AuthProvider><AuthProbe /></AuthProvider>);
    expect(await screen.findByText('authenticated')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'logout' }));
    await waitFor(() => expect(refreshCount).toBe(1));

    expect(screen.getByTestId('status')).toHaveTextContent('authenticated');
    expect(getAccessToken()).toBe('bootstrap-token');
  });
});
