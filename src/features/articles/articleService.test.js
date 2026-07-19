import { beforeEach, describe, expect, it, vi } from 'vitest';

const { requestMock } = vi.hoisted(() => ({ requestMock: vi.fn() }));
vi.mock('../../shared/api/httpClient.js', () => ({ request: requestMock }));

import {
  createArticle,
  addArticleLike,
  deleteArticle,
  getArticle,
  getArticles,
  incrementArticleView,
  mapArticleDetail,
  mapArticleSummary,
  removeArticleLike,
  updateArticle,
} from './articleService.js';

beforeEach(() => requestMock.mockReset());

describe('articleService', () => {
  it('확정된 목록 필드와 첫 번째 이미지만 화면 모델로 변환한다', () => {
    expect(mapArticleSummary({
      articleId: 7,
      userId: 31,
      title: '도예 클래스 후기',
      contentImageUrls: ['', '/images/first.jpg', '/images/second.jpg'],
      articleLikeCount: 1200,
      commentCount: 3,
      articleViewCount: 42,
      createdAt: '2026-07-19T12:34:56',
      updatedAt: '2026-07-19T13:00:00',
      nickname: '하비',
      profileImageUrl: '/profiles/hobby.jpg',
    })).toEqual({
      articleId: 7,
      userId: 31,
      title: '도예 클래스 후기',
      thumbnailUrl: '/images/first.jpg',
      likeCount: 1200,
      commentCount: 3,
      viewCount: 42,
      createdAt: '2026-07-19T12:34:56',
      isUpdated: true,
      nickname: '하비',
      profileImageUrl: '/profiles/hobby.jpg',
    });
  });

  it('첫 페이지에는 cursor를 제외하고 추가 페이지에는 cursor를 포함한다', async () => {
    requestMock.mockResolvedValue({ data: [] });

    await getArticles({ pageSize: 10 });
    await getArticles({ pageSize: 10, lastArticleId: 31 });

    expect(requestMock.mock.calls[0][0]).toBe('/articles?pageSize=10');
    expect(requestMock.mock.calls[1][0]).toBe('/articles?pageSize=10&lastArticleId=31');
  });

  it('게시글 상세의 확정된 필드만 화면 모델로 변환한다', () => {
    expect(mapArticleDetail({
      articleId: 12,
      userId: 31,
      title: '클라이밍 입문기',
      content: '첫 클라이밍 기록',
      contentImageUrls: ['', '/images/one.jpg', '/images/two.jpg'],
      nickname: '하비',
      profileImageUrl: '/profile.jpg',
      createdAt: '2026-07-19T12:34:56',
      updatedAt: null,
      articleLikeCount: 5,
      articleViewCount: 30,
      commentCount: 2,
      likedByMe: true,
    })).toEqual({
      articleId: 12,
      userId: 31,
      title: '클라이밍 입문기',
      content: '첫 클라이밍 기록',
      imageUrls: ['/images/one.jpg', '/images/two.jpg'],
      nickname: '하비',
      profileImageUrl: '/profile.jpg',
      createdAt: '2026-07-19T12:34:56',
      isUpdated: false,
      likeCount: 5,
      viewCount: 30,
      commentCount: 2,
      likedByMe: true,
    });
  });

  it('상세 조회와 조회수 증가 endpoint를 호출한다', async () => {
    requestMock
      .mockResolvedValueOnce({ data: { articleId: 12, userId: 31 } })
      .mockResolvedValueOnce({ payload: null, status: 201 });

    await getArticle(12);
    await expect(incrementArticleView(12)).resolves.toBe(201);

    expect(requestMock.mock.calls[0][0]).toBe('/articles/12');
    expect(requestMock.mock.calls[1]).toEqual(['/views/articles/12', {
      method: 'POST', includeResponseMeta: true,
    }]);
  });

  it('게시글 작성 payload를 전송하고 생성된 ID를 반환한다', async () => {
    const articleData = { title: '새 글', content: '', contentImageUrls: [] };
    requestMock.mockResolvedValue({ data: { articleId: 21 } });

    await expect(createArticle(articleData)).resolves.toBe(21);
    expect(requestMock).toHaveBeenCalledWith('/articles', { method: 'POST', body: articleData });
  });

  it('좋아요 추가와 취소 endpoint를 body 없이 호출한다', async () => {
    requestMock.mockResolvedValue(null);
    await addArticleLike(12);
    await removeArticleLike(12);
    expect(requestMock.mock.calls).toEqual([
      ['/likes/articles/12', { method: 'POST' }],
      ['/likes/articles/12', { method: 'DELETE' }],
    ]);
  });

  it('게시글 작성 응답에 ID가 없으면 상세 이동 전에 실패한다', async () => {
    requestMock.mockResolvedValue({ data: {} });
    await expect(createArticle({ title: '새 글' })).rejects.toThrow('articleId');
  });

  it('게시글 수정 payload를 PUT으로 전송하고 수정된 ID를 반환한다', async () => {
    const articleData = { title: '수정 글', content: '본문', contentImageUrls: ['/one.jpg'] };
    requestMock.mockResolvedValue({ data: { articleId: 12 } });

    await expect(updateArticle(12, articleData)).resolves.toBe(12);
    expect(requestMock).toHaveBeenCalledWith('/articles/12', {
      method: 'PUT', body: articleData,
    });
  });

  it('게시글 삭제 endpoint를 body 없이 호출한다', async () => {
    requestMock.mockResolvedValue({ data: { articleId: 12 } });
    await deleteArticle(12);
    expect(requestMock).toHaveBeenCalledWith('/articles/12', { method: 'DELETE' });
  });
});
