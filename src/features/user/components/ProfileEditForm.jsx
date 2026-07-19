import { useRef, useState } from 'react';
import { validateNickname } from '../profileValidation.js';
import { ProfileImagePicker } from './ProfileImagePicker.jsx';
import { useToast } from '../../../shared/components/ToastContext.jsx';
import { getErrorMessage } from '../../../shared/errors/errorMessages.js';

export function ProfileEditForm({ user, onSubmit }) {
  const [nickname, setNickname] = useState(user.nickname ?? '');
  const [profileImageFile, setProfileImageFile] = useState(null);
  const [touched, setTouched] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const submittingRef = useRef(false);
  const { showToast } = useToast();
  const trimmedNickname = nickname.trim();
  const validationError = validateNickname(nickname);

  async function handleSubmit(event) {
    event.preventDefault();
    setTouched(true);
    if (validationError || submittingRef.current) return;
    submittingRef.current = true;
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      await onSubmit({ nickname: trimmedNickname }, profileImageFile);
      showToast('수정완료');
      setTouched(false);
    } catch (error) {
      setSubmitError(error);
    } finally {
      submittingRef.current = false;
      setIsSubmitting(false);
    }
  }

  const isValid = !validationError;
  return (
    <form className={`profile-edit-form${isValid ? ' is-valid' : ''}${isSubmitting ? ' is-loading' : ''}${submitError ? ' is-error' : ''}`} onSubmit={handleSubmit} noValidate>
      <ProfileImagePicker
        id="profile-image"
        file={profileImageFile}
        initialImageUrl={user.profileImageUrl}
        name={user.nickname}
        onChange={setProfileImageFile}
        disabled={isSubmitting}
        variant="profile-edit"
      />

      <div className="profile-edit-form__fields">
        <div className="profile-email">
          <span className="profile-email__label">이메일</span>
          <p>{user.email}</p>
        </div>
        <div className={`form-field form-field--nickname${nickname ? ' is-filled' : ' is-empty'}${isValid ? ' is-valid' : touched ? ' is-invalid' : ''}`}>
          <label htmlFor="nickname">닉네임</label>
          <input
            id="nickname"
            className="text-input profile-edit-input"
            name="nickname"
            type="text"
            maxLength={10}
            autoComplete="nickname"
            value={nickname}
            aria-invalid={touched && Boolean(validationError)}
            aria-describedby="nickname-helper"
            onChange={(event) => {
              setNickname(event.target.value);
              setTouched(true);
              setSubmitError(null);
            }}
            disabled={isSubmitting}
          />
          <div id="nickname-helper" className="profile-field-helper" aria-live="polite">
            <p className={`profile-field-helper__message${touched && validationError ? ' is-visible' : ''}`}>{validationError}</p>
            <p className={`profile-field-helper__message profile-field-helper__message--success${isValid && touched ? ' is-visible' : ''}`}>사용 가능한 닉네임입니다.</p>
          </div>
        </div>
      </div>

      <button className="button button--primary profile-save-button" type="submit" disabled={!isValid || isSubmitting}>
        <span className="profile-save-button__label">수정하기</span>
        <span className="profile-save-button__spinner" aria-hidden="true" />
      </button>
      {submitError && <p className="profile-edit-form__error" role="alert">{getErrorMessage(submitError, 'user.profile')}</p>}
    </form>
  );
}
