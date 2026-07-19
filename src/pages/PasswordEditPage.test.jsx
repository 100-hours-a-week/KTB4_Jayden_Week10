import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useLocation } from 'react-router-dom';
import { renderWithProviders } from '../test/renderWithProviders.jsx';

const { updatePasswordMock, markAnonymousMock } = vi.hoisted(() => ({
  updatePasswordMock: vi.fn(),
  markAnonymousMock: vi.fn(),
}));
vi.mock('../features/user/userService.js', () => ({ updatePassword: updatePasswordMock }));
vi.mock('../features/auth/AuthContext.jsx', () => ({ useAuth: () => ({ markAnonymous: markAnonymousMock }) }));

import { PasswordEditPage } from './PasswordEditPage.jsx';

function LoginProbe() {
  const location = useLocation();
  return <p>로그인 화면 도착 {location.state?.toastMessage}</p>;
}

function renderPage() {
  return renderWithProviders(<PasswordEditPage />, {
    route: '/settings/password',
    path: '/settings/password',
    additionalRoutes: [{ path: '/login', element: <LoginProbe /> }],
  });
}

beforeEach(() => {
  updatePasswordMock.mockReset();
  markAnonymousMock.mockReset();
});

describe('PasswordEditPage', () => {
  it('형식 오류와 확인 불일치를 구분하고 유효할 때만 제출한다', async () => {
    const user = userEvent.setup();
    renderPage();
    const password = screen.getByLabelText('비밀번호');
    const confirm = screen.getByLabelText('비밀번호 확인');
    const submit = screen.getByRole('button', { name: '수정하기' });

    await user.type(password, 'invalid');
    expect(screen.getByText(/8~20자/)).toBeInTheDocument();
    await user.type(confirm, 'different');
    expect(screen.getByText('비밀번호가 일치하지 않습니다.')).toBeInTheDocument();
    expect(submit).toBeDisabled();
    expect(updatePasswordMock).not.toHaveBeenCalled();
  });

  it('성공 시 확인 값을 전송하지 않고 인증을 지운 뒤 로그인으로 이동한다', async () => {
    const user = userEvent.setup();
    updatePasswordMock.mockResolvedValue(null);
    renderPage();
    const password = screen.getByLabelText('비밀번호');
    const confirm = screen.getByLabelText('비밀번호 확인');

    await user.type(password, 'Valid1!x');
    await user.type(confirm, 'Valid1!x');
    await user.click(screen.getByRole('button', { name: '수정하기' }));

    expect(await screen.findByText(/로그인 화면 도착/)).toBeInTheDocument();
    expect(updatePasswordMock).toHaveBeenCalledWith('Valid1!x');
    expect(markAnonymousMock).toHaveBeenCalledWith({ suppressReturnTo: true });
    expect(screen.getByRole('status')).toHaveTextContent('비밀번호가 수정되었습니다');
  });

  it('실패 시 두 입력을 보존하고 재시도할 수 있다', async () => {
    const user = userEvent.setup();
    updatePasswordMock
      .mockRejectedValueOnce(new Error('server error'))
      .mockResolvedValueOnce(null);
    renderPage();
    const password = screen.getByLabelText('비밀번호');
    const confirm = screen.getByLabelText('비밀번호 확인');

    await user.type(password, 'Valid1!x');
    await user.type(confirm, 'Valid1!x');
    await user.click(screen.getByRole('button', { name: '수정하기' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('입력 내용은 유지됩니다');
    expect(password).toHaveValue('Valid1!x');
    expect(confirm).toHaveValue('Valid1!x');

    await user.click(screen.getByRole('button', { name: '수정하기' }));
    expect(await screen.findByText(/로그인 화면 도착/)).toBeInTheDocument();
    expect(updatePasswordMock).toHaveBeenCalledTimes(2);
    expect(markAnonymousMock).toHaveBeenCalledTimes(1);
  });
});
