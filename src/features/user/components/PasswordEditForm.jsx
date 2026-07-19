import { useRef, useState } from 'react';
import { validatePassword, validatePasswordConfirm } from '../passwordValidation.js';
import { getErrorMessage } from '../../../shared/errors/errorMessages.js';

function PasswordField({
  id,
  label,
  value,
  placeholder,
  result,
  touched,
  onChange,
  disabled,
}) {
  const isValid = result.type === 'valid';
  const fieldClass = `form-field form-field--${id}${value ? ' is-filled' : ' is-empty'}${isValid ? ' is-valid' : touched ? ` is-invalid is-${result.type}` : ''}`;
  return (
    <div className={fieldClass}>
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        className="text-input password-edit-input"
        name={id === 'password' ? 'password' : 'passwordConfirm'}
        type="password"
        value={value}
        placeholder={placeholder}
        autoComplete="new-password"
        aria-invalid={touched && !isValid}
        aria-describedby={`${id}-helper`}
        onChange={onChange}
        disabled={disabled}
        required
      />
      <div id={`${id}-helper`} className="password-field-helper" aria-live="polite">
        {touched && !isValid && <p className="password-field-helper__message is-visible">{result.message}</p>}
        {touched && isValid && <p className="password-field-helper__message password-field-helper__message--success is-visible">{id === 'password' ? '사용 가능한 비밀번호입니다.' : '비밀번호가 일치합니다.'}</p>}
      </div>
    </div>
  );
}

export function PasswordEditForm({ onSubmit }) {
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [touched, setTouched] = useState({ password: false, passwordConfirm: false });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const submittingRef = useRef(false);
  const passwordResult = validatePassword(password);
  const confirmResult = validatePasswordConfirm(password, passwordConfirm);
  const isValid = passwordResult.type === 'valid' && confirmResult.type === 'valid';

  async function handleSubmit(event) {
    event.preventDefault();
    setTouched({ password: true, passwordConfirm: true });
    if (!isValid || submittingRef.current) return;
    submittingRef.current = true;
    setIsSubmitting(true);
    setSubmitError(null);
    setIsSuccess(false);
    try {
      await onSubmit(password);
      setPassword('');
      setPasswordConfirm('');
      setTouched({ password: false, passwordConfirm: false });
      setIsSuccess(true);
    } catch (error) {
      setSubmitError(error);
    } finally {
      submittingRef.current = false;
      setIsSubmitting(false);
    }
  }

  return (
    <form className={`password-edit-form${isValid ? ' is-valid' : ''}${isSubmitting ? ' is-loading' : ''}`} onSubmit={handleSubmit} noValidate>
      <div className="password-edit-form__fields">
        <PasswordField
          id="password"
          label="비밀번호"
          value={password}
          placeholder="비밀번호를 입력하세요"
          result={passwordResult}
          touched={touched.password}
          onChange={(event) => {
            setPassword(event.target.value);
            setTouched((current) => ({ ...current, password: true }));
            setSubmitError(null);
            setIsSuccess(false);
          }}
          disabled={isSubmitting}
        />
        <PasswordField
          id="password-confirm"
          label="비밀번호 확인"
          value={passwordConfirm}
          placeholder="비밀번호를 한 번 더 입력하세요"
          result={confirmResult}
          touched={touched.passwordConfirm}
          onChange={(event) => {
            setPasswordConfirm(event.target.value);
            setTouched((current) => ({ ...current, passwordConfirm: true }));
            setSubmitError(null);
            setIsSuccess(false);
          }}
          disabled={isSubmitting}
        />
      </div>

      <button className="button button--primary password-save-button" type="submit" disabled={!isValid || isSubmitting}>
        <span className="password-save-button__label">수정하기</span>
        <span className="password-save-button__spinner" aria-hidden="true" />
      </button>
      {submitError && <p className="password-edit-form__error" role="alert">{getErrorMessage(submitError, 'user.password')}</p>}
      {isSuccess && <p className="password-edit-success" role="status">비밀번호가 수정되었습니다.</p>}
    </form>
  );
}
