import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

const { createUserMock, uploadProfileImageMock } = vi.hoisted(() => ({
  createUserMock: vi.fn(),
  uploadProfileImageMock: vi.fn(),
}));
vi.mock('../features/user/userService.js', () => ({ createUser: createUserMock }));
vi.mock('../features/images/imageService.js', async (importOriginal) => ({
  ...await importOriginal(),
  uploadProfileImage: uploadProfileImageMock,
}));

import { SignupPage } from './SignupPage.jsx';

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/signup']}>
      <Routes>
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/login" element={<p>로그인 화면 도착</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

async function fillValidForm(user) {
  await user.type(screen.getByLabelText('이메일*'), 'new@example.com');
  await user.type(screen.getByLabelText('비밀번호*'), 'Valid1!x');
  await user.type(screen.getByLabelText('비밀번호 확인*'), 'Valid1!x');
  await user.type(screen.getByLabelText('닉네임*'), '새하비');
}

const NativeURL = URL;

beforeEach(() => {
  createUserMock.mockReset();
  uploadProfileImageMock.mockReset();
  vi.stubGlobal('URL', class URLWithObjectUrls extends NativeURL {
    static createObjectURL(file) { return `blob:${file.name}`; }
    static revokeObjectURL() {}
  });
});

afterEach(() => vi.unstubAllGlobals());

describe('SignupPage', () => {
  it('유효한 필드만 서버에 보내고 비밀번호 확인과 이미지 파일을 제외한다', async () => {
    const user = userEvent.setup();
    createUserMock.mockResolvedValue({ data: { userId: 1 } });
    renderPage();
    const submit = screen.getByRole('button', { name: '회원가입' });
    expect(submit).toBeDisabled();

    await fillValidForm(user);
    await user.click(submit);

    expect(await screen.findByText('로그인 화면 도착')).toBeInTheDocument();
    expect(createUserMock).toHaveBeenCalledWith({
      email: 'new@example.com',
      password: 'Valid1!x',
      nickname: '새하비',
      profileImageUrl: null,
    });
  });

  it('필드별 형식 오류와 비밀번호 불일치를 표시한다', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.type(screen.getByLabelText('이메일*'), 'invalid');
    await user.type(screen.getByLabelText('비밀번호*'), 'invalid');
    await user.type(screen.getByLabelText('비밀번호 확인*'), 'different');
    await user.type(screen.getByLabelText('닉네임*'), 'a');

    expect(screen.getByText('올바른 이메일 주소 형식을 입력해주세요.')).toBeInTheDocument();
    expect(screen.getByText(/비밀번호는 8~20자/)).toBeInTheDocument();
    expect(screen.getByText('비밀번호가 일치하지 않습니다.')).toBeInTheDocument();
    expect(screen.getByText(/2~10자/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '회원가입' })).toBeDisabled();
  });

  it('가입 실패 시 모든 입력을 유지하고 재시도한다', async () => {
    const user = userEvent.setup();
    createUserMock
      .mockRejectedValueOnce(new Error('duplicate'))
      .mockResolvedValueOnce({ data: { userId: 1 } });
    renderPage();
    await fillValidForm(user);
    await user.click(screen.getByRole('button', { name: '회원가입' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('회원가입에 실패했습니다');
    expect(screen.getByLabelText('이메일*')).toHaveValue('new@example.com');
    expect(screen.getByLabelText('닉네임*')).toHaveValue('새하비');

    await user.click(screen.getByRole('button', { name: '회원가입' }));
    expect(await screen.findByText('로그인 화면 도착')).toBeInTheDocument();
    expect(createUserMock).toHaveBeenCalledTimes(2);
  });

  it('프로필 이미지를 미리보기한 뒤 미인증으로 업로드하고 URL을 회원가입에 포함한다', async () => {
    const user = userEvent.setup();
    const file = new File(['profile'], 'profile.png', { type: 'image/png' });
    uploadProfileImageMock.mockResolvedValue('/uploads/profile.png');
    createUserMock.mockResolvedValue({ data: { userId: 1 } });
    renderPage();

    await user.upload(screen.getByLabelText('프로필 사진 업로드'), file);
    expect(await screen.findByAltText('선택한 프로필 사진 미리보기')).toHaveAttribute('src', 'blob:profile.png');
    await fillValidForm(user);
    await user.click(screen.getByRole('button', { name: '회원가입' }));

    expect(uploadProfileImageMock).toHaveBeenCalledWith(file, { auth: false });
    expect(createUserMock).toHaveBeenCalledWith(expect.objectContaining({ profileImageUrl: '/uploads/profile.png' }));
  });

  it('회원가입 저장 실패 후 같은 이미지 URL을 재사용한다', async () => {
    const user = userEvent.setup();
    const file = new File(['profile'], 'profile.png', { type: 'image/png' });
    uploadProfileImageMock.mockResolvedValue('/uploads/profile.png');
    createUserMock.mockRejectedValueOnce(new Error('save failed')).mockResolvedValueOnce({ data: { userId: 1 } });
    renderPage();

    await user.upload(screen.getByLabelText('프로필 사진 업로드'), file);
    await fillValidForm(user);
    await user.click(screen.getByRole('button', { name: '회원가입' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('회원가입에 실패했습니다');
    await user.click(screen.getByRole('button', { name: '회원가입' }));

    expect(await screen.findByText('로그인 화면 도착')).toBeInTheDocument();
    expect(uploadProfileImageMock).toHaveBeenCalledTimes(1);
    expect(createUserMock).toHaveBeenCalledTimes(2);
  });

  it('10MB를 초과하는 프로필 이미지는 선택하지 않는다', async () => {
    const user = userEvent.setup();
    const file = new File([new Uint8Array(10 * 1024 * 1024 + 1)], 'large.png', { type: 'image/png' });
    renderPage();
    await user.upload(screen.getByLabelText('프로필 사진 업로드'), file);
    expect(await screen.findByRole('alert')).toHaveTextContent('10MB 이하');
    expect(uploadProfileImageMock).not.toHaveBeenCalled();
  });
});
