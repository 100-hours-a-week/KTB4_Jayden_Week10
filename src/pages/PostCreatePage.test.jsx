import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

const { createArticleMock, uploadContentImagesMock } = vi.hoisted(() => ({
  createArticleMock: vi.fn(),
  uploadContentImagesMock: vi.fn(),
}));
vi.mock('../features/articles/articleService.js', () => ({ createArticle: createArticleMock }));
vi.mock('../features/images/imageService.js', async (importOriginal) => ({
  ...await importOriginal(),
  uploadContentImages: uploadContentImagesMock,
}));

import { PostCreatePage } from './PostCreatePage.jsx';

const NativeURL = URL;

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/posts/new']}>
      <Routes>
        <Route path="/posts/new" element={<PostCreatePage />} />
        <Route path="/posts/:articleId" element={<p>게시글 상세 도착</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  createArticleMock.mockReset();
  uploadContentImagesMock.mockReset().mockResolvedValue([]);
  vi.stubGlobal('URL', class URLWithObjectUrls extends NativeURL {
    static createObjectURL(file) { return `blob:${file.name}`; }
    static revokeObjectURL() {}
  });
});

afterEach(() => vi.unstubAllGlobals());

describe('PostCreatePage', () => {
  it('제목만 입력해도 빈 본문과 이미지 배열로 작성하고 상세로 이동한다', async () => {
    const user = userEvent.setup();
    createArticleMock.mockResolvedValue(21);
    renderPage();

    const submit = screen.getByRole('button', { name: '작성 완료' });
    expect(submit).toBeDisabled();
    await user.type(screen.getByLabelText('제목*'), ' 새 취미 이야기 ');
    await user.click(submit);

    expect(await screen.findByText('게시글 상세 도착')).toBeInTheDocument();
    expect(createArticleMock).toHaveBeenCalledWith({
      title: '새 취미 이야기', content: '', contentImageUrls: [],
    });
    expect(uploadContentImagesMock).not.toHaveBeenCalled();
  });

  it('저장 실패 후 재시도할 때 성공한 이미지 URL을 다시 업로드하지 않는다', async () => {
    const user = userEvent.setup();
    const file = new File(['image'], 'hobby.png', { type: 'image/png' });
    uploadContentImagesMock.mockResolvedValue(['/uploads/hobby.png']);
    createArticleMock
      .mockRejectedValueOnce(new Error('게시글 저장 실패'))
      .mockResolvedValueOnce(22);
    renderPage();

    await user.type(screen.getByLabelText('제목*'), '이미지 게시글');
    await user.upload(screen.getByLabelText('파일 선택'), file);
    expect(await screen.findByAltText('hobby.png 미리보기')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '작성 완료' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('게시글을 저장하지 못했습니다');

    await user.click(screen.getByRole('button', { name: '작성 완료' }));
    expect(await screen.findByText('게시글 상세 도착')).toBeInTheDocument();
    expect(uploadContentImagesMock).toHaveBeenCalledTimes(1);
    expect(createArticleMock).toHaveBeenCalledTimes(2);
    expect(createArticleMock).toHaveBeenLastCalledWith({
      title: '이미지 게시글', content: '', contentImageUrls: ['/uploads/hobby.png'],
    });
  });

  it('429 오류를 별도 안내하고 입력을 유지한다', async () => {
    const user = userEvent.setup();
    createArticleMock.mockRejectedValue(Object.assign(new Error('limited'), { status: 429 }));
    renderPage();

    const titleInput = screen.getByLabelText('제목*');
    await user.type(titleInput, '제한 테스트');
    await user.click(screen.getByRole('button', { name: '작성 완료' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('1분 내 글 3개');
    expect(titleInput).toHaveValue('제한 테스트');
  });

  it('10MB를 초과하는 게시글 이미지는 선택하지 않는다', async () => {
    const user = userEvent.setup();
    const file = new File(['image'], 'large.png', { type: 'image/png' });
    Object.defineProperty(file, 'size', { value: 10 * 1024 * 1024 + 1 });
    renderPage();

    await user.upload(screen.getByLabelText('파일 선택'), file);
    expect(await screen.findByRole('alert')).toHaveTextContent('파일당 10MB 이하');
    expect(screen.queryByAltText('large.png 미리보기')).not.toBeInTheDocument();
    expect(uploadContentImagesMock).not.toHaveBeenCalled();
  });
});
