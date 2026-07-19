import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

const { deleteArticleMock } = vi.hoisted(() => ({ deleteArticleMock: vi.fn() }));
vi.mock('../articleService.js', () => ({ deleteArticle: deleteArticleMock }));

import { PostActions } from './PostActions.jsx';

function renderActions() {
  return render(
    <MemoryRouter initialEntries={['/posts/12']}>
      <Routes>
        <Route path="/posts/:articleId" element={<PostActions articleId={12} />} />
        <Route path="/posts" element={<p>게시글 목록 도착</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => deleteArticleMock.mockReset());

describe('PostActions', () => {
  it('수정 route를 연결하고 Escape로 삭제 dialog를 닫는다', async () => {
    const user = userEvent.setup();
    renderActions();

    expect(screen.getByRole('link', { name: '수정' })).toHaveAttribute('href', '/posts/12/edit');
    const deleteButton = screen.getByRole('button', { name: '삭제' });
    await user.click(deleteButton);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '취소' })).toHaveFocus();
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(deleteButton).toHaveFocus();
  });

  it('삭제 성공 후 게시글 목록으로 이동한다', async () => {
    const user = userEvent.setup();
    deleteArticleMock.mockResolvedValue({ data: { articleId: 12 } });
    renderActions();

    await user.click(screen.getByRole('button', { name: '삭제' }));
    await user.click(screen.getByRole('button', { name: '확인' }));

    expect(await screen.findByText('게시글 목록 도착')).toBeInTheDocument();
    expect(deleteArticleMock).toHaveBeenCalledWith(12);
  });

  it('403 실패 시 dialog를 유지하고 재시도할 수 있다', async () => {
    const user = userEvent.setup();
    deleteArticleMock
      .mockRejectedValueOnce(Object.assign(new Error('forbidden'), { status: 403 }))
      .mockResolvedValueOnce(null);
    renderActions();

    await user.click(screen.getByRole('button', { name: '삭제' }));
    await user.click(screen.getByRole('button', { name: '확인' }));
    expect(await screen.findByText('이 게시글을 삭제할 권한이 없습니다.')).toBeInTheDocument();
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '확인' }));
    expect(await screen.findByText('게시글 목록 도착')).toBeInTheDocument();
    expect(deleteArticleMock).toHaveBeenCalledTimes(2);
  });
});
