import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

const { getArticlesMock } = vi.hoisted(() => ({ getArticlesMock: vi.fn() }));
vi.mock('../features/articles/articleService.js', () => ({
  ARTICLE_PAGE_SIZE: 10,
  getArticles: getArticlesMock,
}));

import { PostListPage } from './PostListPage.jsx';

let intersectionCallback;

function article(articleId, overrides = {}) {
  return {
    articleId,
    title: `게시글 ${articleId}`,
    thumbnailUrl: '',
    likeCount: 0,
    commentCount: 0,
    viewCount: 0,
    createdAt: '2026-07-19T12:34:56',
    isUpdated: false,
    nickname: '하비',
    profileImageUrl: '',
    ...overrides,
  };
}

function renderPage() {
  return render(<MemoryRouter><PostListPage /></MemoryRouter>);
}

beforeEach(() => {
  getArticlesMock.mockReset();
  intersectionCallback = null;
  vi.stubGlobal('IntersectionObserver', class IntersectionObserverMock {
    constructor(callback) {
      intersectionCallback = callback;
    }
    observe() {}
    disconnect() {}
  });
});

afterEach(() => vi.unstubAllGlobals());

describe('PostListPage', () => {
  it('게시글 카드와 상세 React route를 렌더링한다', async () => {
    getArticlesMock.mockResolvedValue([
      article(7, { title: '도예 클래스 후기', thumbnailUrl: '/first.jpg', likeCount: 1200, isUpdated: true }),
    ]);

    renderPage();

    expect(screen.getByLabelText('게시글을 불러오는 중')).toBeInTheDocument();
    const link = await screen.findByRole('link', { name: '도예 클래스 후기 게시글 상세 보기' });
    expect(link).toHaveAttribute('href', '/posts/7');
    expect(screen.getByRole('img', { name: '도예 클래스 후기 이미지' })).toHaveAttribute('src', '/first.jpg');
    expect(screen.getByText(/좋아요 1k/)).toBeInTheDocument();
    expect(screen.getByText(/수정됨/)).toBeInTheDocument();
  });

  it('첫 조회 결과가 없으면 빈 결과를 표시한다', async () => {
    getArticlesMock.mockResolvedValue([]);
    renderPage();
    expect(await screen.findByText('아직 작성된 게시글이 없어요.')).toBeInTheDocument();
  });

  it('첫 조회 오류에서 같은 조회를 다시 시도한다', async () => {
    const user = userEvent.setup();
    getArticlesMock
      .mockRejectedValueOnce(new Error('목록 API 오류'))
      .mockResolvedValueOnce([article(1)]);
    renderPage();

    expect(await screen.findByText('게시글을 불러오지 못했어요.')).toBeInTheDocument();
    expect(screen.getByText('목록 API 오류')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '다시 시도' }));

    expect(await screen.findByText('게시글 1')).toBeInTheDocument();
    expect(getArticlesMock).toHaveBeenCalledTimes(2);
  });

  it('sentinel 교차 시 cursor로 다음 페이지를 조회하고 중복 ID를 제거한다', async () => {
    const firstPage = Array.from({ length: 10 }, (_, index) => article(index + 1));
    getArticlesMock
      .mockResolvedValueOnce(firstPage)
      .mockResolvedValueOnce([article(10, { title: '중복 게시글' }), article(11)]);
    renderPage();

    expect(await screen.findByText('게시글 10')).toBeInTheDocument();
    await waitFor(() => expect(intersectionCallback).toBeTypeOf('function'));
    act(() => intersectionCallback([{ isIntersecting: true }]));

    expect(await screen.findByText('게시글 11')).toBeInTheDocument();
    expect(screen.getAllByRole('article')).toHaveLength(11);
    expect(getArticlesMock.mock.calls[1][0]).toMatchObject({ lastArticleId: 10 });
  });

  it('추가 조회 오류에서 기존 목록을 유지하고 추가 조회만 재시도한다', async () => {
    const user = userEvent.setup();
    const firstPage = Array.from({ length: 10 }, (_, index) => article(index + 1));
    getArticlesMock
      .mockResolvedValueOnce(firstPage)
      .mockRejectedValueOnce(new Error('추가 조회 오류'))
      .mockResolvedValueOnce([article(11)]);
    renderPage();

    expect(await screen.findByText('게시글 10')).toBeInTheDocument();
    await waitFor(() => expect(intersectionCallback).toBeTypeOf('function'));
    act(() => intersectionCallback([{ isIntersecting: true }]));

    expect(await screen.findByText('게시글을 더 불러오지 못했어요.')).toBeInTheDocument();
    expect(screen.getByText('게시글 1')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '다시 시도' }));

    expect(await screen.findByText('게시글 11')).toBeInTheDocument();
    expect(getArticlesMock).toHaveBeenCalledTimes(3);
  });
});
