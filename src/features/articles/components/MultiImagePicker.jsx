import { useEffect, useRef, useState } from 'react';
import { validateContentImageFiles } from '../../images/imageService.js';

export function MultiImagePicker({
  files,
  existingImageUrls = [],
  onChange,
  onRemoveExisting,
  disabled = false,
}) {
  const [previews, setPreviews] = useState([]);
  const [error, setError] = useState('');
  const previewsRef = useRef([]);

  useEffect(() => {
    return () => previewsRef.current.forEach((preview) => URL.revokeObjectURL(preview.url));
  }, []);

  function handleChange(event) {
    const nextFiles = Array.from(event.target.files ?? []);
    const validationError = validateContentImageFiles(nextFiles);
    if (validationError) {
      setError(validationError);
      event.target.value = '';
      return;
    }
    setError('');
    previewsRef.current.forEach((preview) => URL.revokeObjectURL(preview.url));
    const nextPreviews = nextFiles.map((file) => ({
      name: file.name,
      url: URL.createObjectURL(file),
    }));
    previewsRef.current = nextPreviews;
    setPreviews(nextPreviews);
    onChange(nextFiles);
  }

  const showingNewFiles = previews.length > 0;
  const imageCount = showingNewFiles ? previews.length : existingImageUrls.length;

  return (
    <section className="image-upload-section" aria-labelledby="image-upload-title">
      <h2 id="image-upload-title">이미지</h2>
      <div className="image-upload-control">
        <label className="image-upload-button" htmlFor="content-images">파일 선택</label>
        <input
          id="content-images"
          type="file"
          accept="image/*"
          multiple
          disabled={disabled}
          onChange={handleChange}
          aria-describedby="content-images-guide content-images-error"
        />
        <span id="content-images-guide" className="image-upload-guide">
          {showingNewFiles
            ? `${files.length}개의 새 이미지가 선택되었습니다. 기존 이미지를 대체합니다.`
            : imageCount
              ? `${imageCount}개의 기존 이미지가 있습니다.`
              : '파일을 선택해주세요.'}
        </span>
      </div>
      {error && <p id="content-images-error" className="image-upload-error" role="alert">{error}</p>}
      {imageCount > 0 && (
        <ul className="image-preview-list" aria-label={showingNewFiles ? '선택한 이미지 미리보기' : '기존 게시글 이미지'}>
          {(showingNewFiles ? previews : existingImageUrls).map((image, index) => (
            <li key={showingNewFiles ? `${image.name}-${index}` : image}>
              <img
                src={showingNewFiles ? image.url : image}
                alt={showingNewFiles ? `${image.name} 미리보기` : `기존 게시글 이미지 ${index + 1}`}
              />
              {!showingNewFiles && onRemoveExisting && (
                <button type="button" onClick={() => onRemoveExisting(index)} disabled={disabled} aria-label={`기존 이미지 ${index + 1} 삭제`}>삭제</button>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
