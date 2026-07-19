import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { AuthContext } from '../AuthContext.jsx';
import { AUTH_STATUS } from '../authConstants.js';
import { AccountMenu } from './AccountMenu.jsx';

function renderMenu(logout = vi.fn()) {
  const value = {
    status: AUTH_STATUS.AUTHENTICATED,
    user: { nickname: '하비', profileImageUrl: '' },
    logout,
  };
  return render(
    <AuthContext.Provider value={value}>
      <MemoryRouter><AccountMenu /></MemoryRouter>
    </AuthContext.Provider>,
  );
}

describe('AccountMenu', () => {
  it('메뉴를 열고 Escape로 닫은 뒤 trigger에 focus를 돌려준다', async () => {
    const user = userEvent.setup();
    renderMenu();
    const trigger = screen.getByRole('button', { name: '프로필 메뉴 열기' });

    await user.click(trigger);
    expect(screen.getByRole('link', { name: '회원정보수정' })).toBeVisible();
    await user.keyboard('{Escape}');

    expect(screen.queryByRole('link', { name: '회원정보수정' })).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it('로그아웃 실패 시 메뉴와 현재 화면에 오류를 유지한다', async () => {
    const user = userEvent.setup();
    const logout = vi.fn().mockRejectedValue(new Error('logout failed'));
    renderMenu(logout);

    await user.click(screen.getByRole('button', { name: '프로필 메뉴 열기' }));
    await user.click(screen.getByRole('button', { name: '로그아웃' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('로그아웃하지 못했습니다');
    expect(logout).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('link', { name: '회원정보수정' })).toBeVisible();
  });
});
