import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { getArticleMock, incrementArticleViewMock, addArticleLikeMock } = vi.hoisted(() => ({
  getArticleMock: vi.fn(),
  incrementArticleViewMock: vi.fn(),
  addArticleLikeMock: vi.fn(),
}));

vi.mock('./articleService.js', () => ({
  getArticle: getArticleMock,
  incrementArticleView: incrementArticleViewMock,
  addArticleLike: addArticleLikeMock,
  removeArticleLike: vi.fn(),
}));

import { useArticleDetail } from './useArticleDetail.js';

function article(articleId, overrides = {}) {
  return {
    articleId,
    likedByMe: false,
    likeCount: 3,
    viewCount: 5,
    commentCount: 0,
    ...overrides,
  };
}

beforeEach(() => {
  getArticleMock.mockReset();
  incrementArticleViewMock.mockReset().mockResolvedValue(null);
  addArticleLikeMock.mockReset();
});

describe('useArticleDetail', () => {
  it('이전 게시글의 늦은 좋아요 응답을 새 게시글 상태에 반영하지 않는다', async () => {
    let resolveLike;
    getArticleMock.mockImplementation(async (articleId) => article(articleId));
    addArticleLikeMock.mockReturnValue(new Promise((resolve) => { resolveLike = resolve; }));
    const { result, rerender } = renderHook(
      ({ articleId }) => useArticleDetail(articleId),
      { initialProps: { articleId: 12 } },
    );

    await waitFor(() => expect(result.current.article?.articleId).toBe(12));
    act(() => { void result.current.toggleLike(); });
    rerender({ articleId: 13 });
    await waitFor(() => expect(result.current.article?.articleId).toBe(13));

    await act(async () => { resolveLike(null); });
    expect(result.current.article).toMatchObject({ articleId: 13, likedByMe: false, likeCount: 3 });
  });
});
