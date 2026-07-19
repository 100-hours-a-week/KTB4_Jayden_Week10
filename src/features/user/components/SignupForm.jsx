import { useRef, useState } from 'react';
import { validateSignup } from '../signupValidation.js';
import { ProfileImagePicker } from './ProfileImagePicker.jsx';
import { getErrorMessage } from '../../../shared/errors/errorMessages.js';

const INITIAL_VALUES = { email: '', password: '', passwordConfirm: '', nickname: '' };

function SignupField({ id, label, type = 'text', value, error, touched, onChange, disabled, autoComplete, placeholder }) {
  const isValid = !error;
  return (
    <div className={`form-field form-field--${id}${value ? ' is-filled' : ' is-empty'}${isValid ? ' is-valid' : touched ? ' is-invalid' : ''}`}>
      <label htmlFor={`signup-${id}`}>{label}*</label>
      <input
        id={`signup-${id}`}
        className="text-input signup-input"
        name={id}
        type={type}
        value={value}
        placeholder={placeholder}
        autoComplete={autoComplete}
        aria-invalid={touched && Boolean(error)}
        aria-describedby={`signup-${id}-helper`}
        onChange={onChange}
        disabled={disabled}
        required
      />
      <div id={`signup-${id}-helper`} className="field-helper" aria-live="polite">
        {touched && error && <p className="field-helper__message is-visible">{error}</p>}
        {touched && isValid && <p className="field-helper__message field-helper__message--success is-visible">사용 가능한 값입니다.</p>}
      </div>
    </div>
  );
}

export function SignupForm({ onSubmit }) {
  const [values, setValues] = useState(INITIAL_VALUES);
  const [profileImageFile, setProfileImageFile] = useState(null);
  const [touched, setTouched] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const submittingRef = useRef(false);
  const errors = validateSignup(values);
  const isValid = Object.values(errors).every((error) => !error);

  function changeField(field) {
    return (event) => {
      setValues((current) => ({ ...current, [field]: event.target.value }));
      setTouched((current) => ({ ...current, [field]: true }));
      setSubmitError(null);
    };
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setTouched({ email: true, password: true, passwordConfirm: true, nickname: true });
    if (!isValid || submittingRef.current) return;
    submittingRef.current = true;
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      await onSubmit({
        email: values.email.trim(),
        password: values.password,
        nickname: values.nickname.trim(),
      }, profileImageFile);
    } catch (error) {
      setSubmitError(error);
    } finally {
      submittingRef.current = false;
      setIsSubmitting(false);
    }
  }

  return (
    <form className={`signup-form${isValid ? ' is-valid' : ''}${isSubmitting ? ' is-loading' : ''}${submitError ? ' is-error' : ''}`} onSubmit={handleSubmit} noValidate>
      <ProfileImagePicker id="signup-profile-image" file={profileImageFile} onChange={setProfileImageFile} disabled={isSubmitting} />

      <div className="signup-form__fields">
        <SignupField id="email" label="이메일" type="email" value={values.email} error={errors.email} touched={touched.email} onChange={changeField('email')} disabled={isSubmitting} autoComplete="email" placeholder="이메일을 입력하세요" />
        <SignupField id="password" label="비밀번호" type="password" value={values.password} error={errors.password} touched={touched.password} onChange={changeField('password')} disabled={isSubmitting} autoComplete="new-password" placeholder="비밀번호를 입력하세요" />
        <SignupField id="passwordConfirm" label="비밀번호 확인" type="password" value={values.passwordConfirm} error={errors.passwordConfirm} touched={touched.passwordConfirm} onChange={changeField('passwordConfirm')} disabled={isSubmitting} autoComplete="new-password" placeholder="비밀번호를 한 번 더 입력하세요" />
        <SignupField id="nickname" label="닉네임" value={values.nickname} error={errors.nickname} touched={touched.nickname} onChange={changeField('nickname')} disabled={isSubmitting} autoComplete="nickname" placeholder="닉네임을 입력하세요" />
      </div>

      <button className="button button--primary signup-button" type="submit" disabled={!isValid || isSubmitting}>
        <span className="signup-button__label">회원가입</span>
        <span className="signup-button__spinner" aria-hidden="true" />
      </button>
      {submitError && <p className="signup-form__error" role="alert">{getErrorMessage(submitError, 'user.signup')}</p>}
    </form>
  );
}
