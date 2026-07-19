import { useEffect, useRef, useState } from 'react';
import { MAX_IMAGE_FILE_SIZE } from '../../images/imageService.js';

const MAX_IMAGE_FILE_SIZE_LABEL = '10MB';

export function ProfileImagePicker({
  id,
  file,
  initialImageUrl = '',
  name = '',
  onChange,
  disabled = false,
  variant = 'signup',
}) {
  const [previewUrl, setPreviewUrl] = useState('');
  const [error, setError] = useState('');
  const previewUrlRef = useRef('');

  useEffect(() => {
    return () => {
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    };
  }, []);

  function handleChange(event) {
    const nextFile = event.target.files?.[0] ?? null;
    if (!nextFile) return;
    if (nextFile.size > MAX_IMAGE_FILE_SIZE) {
      setError(`프로필 이미지는 ${MAX_IMAGE_FILE_SIZE_LABEL} 이하만 선택할 수 있습니다.`);
      event.target.value = '';
      return;
    }
    setError('');
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    previewUrlRef.current = URL.createObjectURL(nextFile);
    setPreviewUrl(previewUrlRef.current);
    onChange(nextFile);
  }

  const imageUrl = previewUrl || initialImageUrl;
  const isProfileEdit = variant === 'profile-edit';
  const uploadClass = isProfileEdit ? 'profile-image-upload' : 'profile-upload';
  const previewClass = isProfileEdit ? 'profile-image-upload__preview' : 'profile-upload__preview';
  const inputClass = isProfileEdit ? 'profile-image-upload__input' : 'profile-upload__input';

  return (
    <div className={isProfileEdit ? 'profile-image-field is-valid' : 'profile-field'}>
      <span className={isProfileEdit ? 'profile-image-field__label' : 'profile-field__label'}>프로필 사진</span>
      <label className={`${uploadClass}${imageUrl ? ' has-image' : ''}`} htmlFor={id} aria-label={isProfileEdit ? '프로필 사진 변경' : '프로필 사진 업로드'}>
        {imageUrl && <img className={previewClass} src={imageUrl} alt={file ? '선택한 프로필 사진 미리보기' : name ? `${name}님의 프로필 이미지` : '현재 프로필 사진'} />}
        {isProfileEdit && imageUrl && <span className="profile-image-upload__change">변경</span>}
        <span className={isProfileEdit ? 'profile-image-upload__plus' : 'profile-upload__plus'} aria-hidden="true">+</span>
      </label>
      <input
        id={id}
        className={inputClass}
        type="file"
        accept="image/*"
        aria-describedby={`${id}-helper`}
        onChange={handleChange}
        disabled={disabled}
      />
      <p id={`${id}-helper`} className="profile-image-helper" role={error ? 'alert' : undefined}>
        {error || `파일당 최대 ${MAX_IMAGE_FILE_SIZE_LABEL}`}
      </p>
    </div>
  );
}
