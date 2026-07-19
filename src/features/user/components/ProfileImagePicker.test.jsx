import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProfileImagePicker } from './ProfileImagePicker.jsx';

const NativeURL = URL;
const revokeObjectURLMock = vi.fn();

beforeEach(() => {
  revokeObjectURLMock.mockReset();
  vi.stubGlobal('URL', class URLWithObjectUrls extends NativeURL {
    static createObjectURL(file) { return `blob:${file.name}`; }
    static revokeObjectURL(url) { revokeObjectURLMock(url); }
  });
});

afterEach(() => vi.unstubAllGlobals());

describe('ProfileImagePicker', () => {
  it('파일 변경과 unmount에서 생성한 object URL을 정리한다', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const { rerender, unmount } = render(
      <ProfileImagePicker id="profile" file={null} onChange={onChange} />,
    );
    const input = screen.getByLabelText('프로필 사진 업로드');
    const firstFile = new File(['first'], 'first.png', { type: 'image/png' });
    await user.upload(input, firstFile);
    rerender(<ProfileImagePicker id="profile" file={firstFile} onChange={onChange} />);

    const secondFile = new File(['second'], 'second.png', { type: 'image/png' });
    await user.upload(input, secondFile);
    expect(revokeObjectURLMock).toHaveBeenCalledWith('blob:first.png');

    rerender(<ProfileImagePicker id="profile" file={secondFile} onChange={onChange} />);
    unmount();
    expect(revokeObjectURLMock).toHaveBeenCalledWith('blob:second.png');
  });
});
