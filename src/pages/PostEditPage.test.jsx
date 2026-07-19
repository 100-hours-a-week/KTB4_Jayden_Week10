import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { ApiError } from '../shared/api/ApiError.js';

const { getArticleMock, updateArticleMock, uploadContentImagesMock } = vi.hoisted(() => ({
  getArticleMock: vi.fn(),
  updateArticleMock: vi.fn(),
  uploadContentImagesMock: vi.fn(),
}));
vi.mock('../features/articles/articleService.js', () => ({
  getArticle: getArticleMock,
  updateArticle: updateArticleMock,
}));
vi.mock('../features/images/imageService.js', async (importOriginal) => ({
  ...await importOriginal(),
  uploadContentImages: uploadContentImagesMock,
}));

import { PostEditPage } from './PostEditPage.jsx';

const NativeURL = URL;

function article(overrides = {}) {
  return {
    articleId: 12,
    title: '기존 제목',
    content: '기존 본문',
    imageUrls: ['/images/one.jpg', '/images/two.jpg'],
    nickname: '하비',
    profileImageUrl: '',
    createdAt: '2026-07-19T12:00:00',
    likeCount: 0,
    viewCount: 0,
    commentCount: 0,
    ...overrides,
  };
}

function renderPage(articleId = '12') {
  return render(
    <MemoryRouter initialEntries={[`/posts/${articleId}/edit`]}>
      <Routes>
        <Route path="/posts/:articleId/edit" element={<PostEditPage />} />
        <Route path="/posts/:articleId" element={<p>게시글 상세 도착</p>} />
        <Route path="/posts" element={<p>게시글 목록</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  getArticleMock.mockReset();
  updateArticleMock.mockReset();
  uploadContentImagesMock.mockReset();
  vi.stubGlobal('URL', class URLWithObjectUrls extends NativeURL {
    static createObjectURL(file) { return `blob:${file.name}`; }
    static revokeObjectURL() {}
  });
});

afterEach(() => vi.unstubAllGlobals());

describe('PostEditPage', () => {
  it('기존 값을 불러오고 이미지 재업로드 없이 그대로 수정한다', async () => {
    const user = userEvent.setup();
    getArticleMock.mockResolvedValue(article());
    updateArticleMock.mockResolvedValue(12);
    renderPage();

    expect(await screen.findByDisplayValue('기존 제목')).toBeInTheDocument();
    expect(screen.getByAltText('기존 게시글 이미지 1')).toBeInTheDocument();
    await user.clear(screen.getByLabelText('내용'));
    await user.type(screen.getByLabelText('내용'), '수정 본문');
    await user.click(screen.getByRole('button', { name: '수정 완료' }));

    expect(await screen.findByText('게시글 상세 도착')).toBeInTheDocument();
    expect(uploadContentImagesMock).not.toHaveBeenCalled();
    expect(updateArticleMock).toHaveBeenCalledWith(12, {
      title: '기존 제목',
      content: '수정 본문',
      contentImageUrls: ['/images/one.jpg', '/images/two.jpg'],
    });
  });

  it('기존 이미지를 제거한 순서대로 저장한다', async () => {
    const user = userEvent.setup();
    getArticleMock.mockResolvedValue(article());
    updateArticleMock.mockResolvedValue(12);
    renderPage();

    await screen.findByDisplayValue('기존 제목');
    await user.click(screen.getByRole('button', { name: '기존 이미지 1 삭제' }));
    await user.click(screen.getByRole('button', { name: '수정 완료' }));

    expect(updateArticleMock.mock.calls[0][1].contentImageUrls).toEqual(['/images/two.jpg']);
  });

  it('새 이미지를 선택하면 기존 이미지 대신 새 업로드 URL만 저장한다', async () => {
    const user = userEvent.setup();
    const file = new File(['new'], 'new.png', { type: 'image/png' });
    getArticleMock.mockResolvedValue(article());
    uploadContentImagesMock.mockResolvedValue(['/uploads/new.png']);
    updateArticleMock.mockResolvedValue(12);
    renderPage();

    await screen.findByDisplayValue('기존 제목');
    await user.upload(screen.getByLabelText('파일 선택'), file);
    expect(await screen.findByAltText('new.png 미리보기')).toBeInTheDocument();
    expect(screen.queryByAltText('기존 게시글 이미지 1')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '수정 완료' }));

    expect(uploadContentImagesMock).toHaveBeenCalledWith([file]);
    expect(updateArticleMock.mock.calls[0][1].contentImageUrls).toEqual(['/uploads/new.png']);
  });

  it('403 수정 실패 시 입력을 유지하고 권한 오류를 표시한다', async () => {
    const user = userEvent.setup();
    getArticleMock.mockResolvedValue(article());
    updateArticleMock.mockRejectedValue(new ApiError('forbidden', { status: 403 }));
    renderPage();

    const titleInput = await screen.findByDisplayValue('기존 제목');
    await user.clear(titleInput);
    await user.type(titleInput, '보존할 수정 제목');
    await user.click(screen.getByRole('button', { name: '수정 완료' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('수정할 권한이 없습니다');
    expect(titleInput).toHaveValue('보존할 수정 제목');
  });

  it('잘못된 ID와 404를 수정 대상 없음으로 표시한다', async () => {
    const firstRender = renderPage('invalid');
    expect(await screen.findByText('수정할 게시글을 찾을 수 없어요.')).toBeInTheDocument();
    expect(getArticleMock).not.toHaveBeenCalled();
    firstRender.unmount();

    getArticleMock.mockRejectedValue(new ApiError('not found', { status: 404 }));
    renderPage('99');
    expect(await screen.findByText('수정할 게시글을 찾을 수 없어요.')).toBeInTheDocument();
  });
});
