import { useRef, useState } from 'react';
import { uploadContentImages } from '../../images/imageService.js';
import { getErrorMessage } from '../../../shared/errors/errorMessages.js';
import { MultiImagePicker } from './MultiImagePicker.jsx';

export function PostForm({ mode = 'create', initialValue, onSubmit }) {
  const [title, setTitle] = useState(initialValue?.title ?? '');
  const [content, setContent] = useState(initialValue?.content ?? '');
  const [files, setFiles] = useState([]);
  const [existingImageUrls, setExistingImageUrls] = useState(initialValue?.imageUrls ?? []);
  const [uploadedImageUrls, setUploadedImageUrls] = useState(null);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submittingRef = useRef(false);
  const trimmedTitle = title.trim();

  function handleFilesChange(nextFiles) {
    setFiles(nextFiles);
    setUploadedImageUrls(null);
    setError(null);
  }

  function handleRemoveExisting(index) {
    setExistingImageUrls((currentUrls) => currentUrls.filter((_, imageIndex) => imageIndex !== index));
    setError(null);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!trimmedTitle || submittingRef.current) return;
    submittingRef.current = true;
    setIsSubmitting(true);
    setError(null);
    try {
      let imageUrls = files.length ? uploadedImageUrls : existingImageUrls;
      if (files.length && imageUrls === null) {
        imageUrls = await uploadContentImages(files);
        setUploadedImageUrls(imageUrls);
      }
      await onSubmit({
        title: trimmedTitle,
        content: content.trim(),
        contentImageUrls: imageUrls,
      });
    } catch (submitError) {
      setError(submitError);
    } finally {
      submittingRef.current = false;
      setIsSubmitting(false);
    }
  }

  const isValid = Boolean(trimmedTitle);
  return (
    <form className={`post-create-form ${isValid ? 'is-valid' : 'is-empty'} ${files.length || existingImageUrls.length ? 'has-image' : 'has-no-image'}${isSubmitting ? ' is-loading' : ''}`} onSubmit={handleSubmit} noValidate>
      <div className="post-create-form__fields">
        <div className={`form-field form-field--title${isValid ? ' is-valid' : ''}`}>
          <label htmlFor="post-title">제목*</label>
          <input
            id="post-title"
            className="post-create-input"
            name="title"
            type="text"
            maxLength={26}
            value={title}
            placeholder="제목을 입력해주세요. (최대 26글자)"
            onChange={(event) => setTitle(event.target.value)}
            disabled={isSubmitting}
            required
          />
          <p className="post-field-helper">*제목을 입력해주세요.</p>
        </div>
        <div className="form-field form-field--content">
          <label htmlFor="post-content">내용</label>
          <textarea
            id="post-content"
            className="post-create-textarea"
            name="content"
            value={content}
            placeholder="오늘의 취미 이야기를 들려주세요."
            onChange={(event) => setContent(event.target.value)}
            disabled={isSubmitting}
          />
        </div>
      </div>

      <MultiImagePicker
        files={files}
        existingImageUrls={existingImageUrls}
        onChange={handleFilesChange}
        onRemoveExisting={mode === 'edit' ? handleRemoveExisting : undefined}
        disabled={isSubmitting}
      />

      <button className={`button button--primary post-create-button${!isValid ? ' is-disabled' : ''}`} type="submit" disabled={!isValid || isSubmitting}>
        <span className="post-create-button__label">{mode === 'create' ? '작성 완료' : '수정 완료'}</span>
        <span className="post-create-button__spinner" aria-hidden="true" />
      </button>
      {error && <p className="post-create-form__error" role="alert">{getErrorMessage(error, mode === 'edit' ? 'article.update' : 'article.create')}</p>}
    </form>
  );
}
