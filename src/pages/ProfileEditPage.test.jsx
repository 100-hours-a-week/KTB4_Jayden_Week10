import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../test/renderWithProviders.jsx';
import { createUserFixture } from '../test/fixtures.js';

const { authState, updateCurrentUserMock, deleteCurrentUserMock, uploadProfileImageMock } = vi.hoisted(() => ({
  authState: {
    user: { userId: 1, email: 'hobby@example.com', nickname: '하비', profileImageUrl: '/profile.jpg' },
    refreshUser: vi.fn(),
    applyCurrentUser: vi.fn(),
    markAnonymous: vi.fn(),
  },
  updateCurrentUserMock: vi.fn(),
  deleteCurrentUserMock: vi.fn(),
  uploadProfileImageMock: vi.fn(),
}));
vi.mock('../features/auth/AuthContext.jsx', () => ({ useAuth: () => authState }));
vi.mock('../features/user/userService.js', () => ({
  updateCurrentUser: updateCurrentUserMock,
  deleteCurrentUser: deleteCurrentUserMock,
}));
vi.mock('../features/images/imageService.js', async (importOriginal) => ({
  ...await importOriginal(),
  uploadProfileImage: uploadProfileImageMock,
}));

import { ProfileEditPage } from './ProfileEditPage.jsx';

function renderPage() {
  return renderWithProviders(<ProfileEditPage />, {
    route: '/settings/profile',
    path: '/settings/profile',
  });
}

const NativeURL = URL;

beforeEach(() => {
  authState.user = createUserFixture();
  authState.refreshUser.mockReset().mockResolvedValue({ ...authState.user });
  authState.applyCurrentUser.mockReset();
  authState.markAnonymous.mockReset();
  updateCurrentUserMock.mockReset().mockResolvedValue(null);
  deleteCurrentUserMock.mockReset();
  uploadProfileImageMock.mockReset();
  vi.stubGlobal('URL', class URLWithObjectUrls extends NativeURL {
    static createObjectURL(file) { return `blob:${file.name}`; }
    static revokeObjectURL() {}
  });
});

afterEach(() => vi.unstubAllGlobals());

describe('ProfileEditPage', () => {
  it('이메일과 현재 프로필을 표시하고 닉네임 수정 후 AuthContext를 갱신한다', async () => {
    const user = userEvent.setup();
    renderPage();

    expect(screen.getByText('hobby@example.com')).toBeInTheDocument();
    expect(screen.getByAltText('하비님의 프로필 이미지')).toBeInTheDocument();
    const nicknameInput = screen.getByLabelText('닉네임');
    await user.clear(nicknameInput);
    await user.type(nicknameInput, '새하비');
    await user.click(screen.getByRole('button', { name: '수정하기' }));

    expect(await screen.findByText('수정완료')).toBeInTheDocument();
    expect(updateCurrentUserMock).toHaveBeenCalledWith({
      nickname: '새하비', profileImageUrl: '/profile.jpg',
    });
    expect(authState.refreshUser).toHaveBeenCalledTimes(1);
  });

  it('잘못된 닉네임은 요청하지 않고 안내한다', async () => {
    const user = userEvent.setup();
    renderPage();

    const nicknameInput = screen.getByLabelText('닉네임');
    await user.clear(nicknameInput);
    await user.type(nicknameInput, '하 비');
    expect(screen.getByText(/공백을 사용할 수 없습니다/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '수정하기' })).toBeDisabled();
    expect(updateCurrentUserMock).not.toHaveBeenCalled();
  });

  it('수정 실패 시 닉네임 입력을 유지한다', async () => {
    const user = userEvent.setup();
    updateCurrentUserMock.mockRejectedValue(new Error('server error'));
    renderPage();

    const nicknameInput = screen.getByLabelText('닉네임');
    await user.clear(nicknameInput);
    await user.type(nicknameInput, '보존닉네임');
    await user.click(screen.getByRole('button', { name: '수정하기' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('입력 내용은 유지됩니다');
    expect(nicknameInput).toHaveValue('보존닉네임');
  });

  it('PATCH 응답이 있으면 후속 사용자 조회 실패 시 응답값으로 인증 사용자를 갱신한다', async () => {
    const user = userEvent.setup();
    const updatedUser = { ...authState.user, nickname: '응답닉네임' };
    updateCurrentUserMock.mockResolvedValue(updatedUser);
    authState.refreshUser.mockRejectedValue(new Error('profile reload failed'));
    renderPage();

    const nicknameInput = screen.getByLabelText('닉네임');
    await user.clear(nicknameInput);
    await user.type(nicknameInput, '응답닉네임');
    await user.click(screen.getByRole('button', { name: '수정하기' }));

    expect(await screen.findByRole('status')).toHaveTextContent('수정완료');
    expect(authState.refreshUser).toHaveBeenCalledTimes(1);
    expect(authState.applyCurrentUser).toHaveBeenCalledWith(updatedUser);
  });

  it('탈퇴 실패 시 dialog를 유지하고 성공 후 인증을 지운 뒤 로그인으로 이동한다', async () => {
    const user = userEvent.setup();
    deleteCurrentUserMock
      .mockRejectedValueOnce(new Error('withdraw error'))
      .mockResolvedValueOnce(null);
    renderPage();

    await user.click(screen.getByRole('button', { name: '회원 탈퇴' }));
    expect(screen.getByRole('button', { name: '취소' })).toHaveFocus();
    await user.click(screen.getByRole('button', { name: '확인' }));
    expect(await screen.findByText('회원 탈퇴에 실패했습니다. 다시 시도해주세요.')).toBeInTheDocument();
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '확인' }));
    await vi.waitFor(() => expect(authState.markAnonymous).toHaveBeenCalledWith({ suppressReturnTo: true }));
    expect(deleteCurrentUserMock).toHaveBeenCalledTimes(2);
  });

  it('새 프로필 이미지를 업로드하고 사용자 정보와 헤더를 갱신한다', async () => {
    const user = userEvent.setup();
    const file = new File(['profile'], 'new-profile.png', { type: 'image/png' });
    uploadProfileImageMock.mockResolvedValue('/uploads/new-profile.png');
    renderPage();

    await user.upload(screen.getByLabelText('프로필 사진 변경'), file);
    expect(await screen.findByAltText('선택한 프로필 사진 미리보기')).toHaveAttribute('src', 'blob:new-profile.png');
    await user.click(screen.getByRole('button', { name: '수정하기' }));

    expect(uploadProfileImageMock).toHaveBeenCalledWith(file);
    expect(updateCurrentUserMock).toHaveBeenCalledWith({ nickname: '하비', profileImageUrl: '/uploads/new-profile.png' });
    expect(authState.refreshUser).toHaveBeenCalledTimes(1);
  });

  it('사용자 정보 저장 실패 후 성공한 이미지 URL을 재사용한다', async () => {
    const user = userEvent.setup();
    const file = new File(['profile'], 'new-profile.png', { type: 'image/png' });
    uploadProfileImageMock.mockResolvedValue('/uploads/new-profile.png');
    updateCurrentUserMock.mockRejectedValueOnce(new Error('save failed')).mockResolvedValueOnce(null);
    renderPage();

    await user.upload(screen.getByLabelText('프로필 사진 변경'), file);
    await user.click(screen.getByRole('button', { name: '수정하기' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('입력 내용은 유지됩니다');
    await user.click(screen.getByRole('button', { name: '수정하기' }));

    expect(await screen.findByText('수정완료')).toBeInTheDocument();
    expect(uploadProfileImageMock).toHaveBeenCalledTimes(1);
    expect(updateCurrentUserMock).toHaveBeenCalledTimes(2);
  });
});
