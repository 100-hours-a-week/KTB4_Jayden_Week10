const signupForm = document.querySelector('.signup-form');
const submitButton = document.querySelector('.signup-button');
const submitLabel = document.querySelector('.signup-button__label');
const imageInput = document.querySelector('#profile-image');
const profileField = document.querySelector('.profile-field');
const profileUpload = document.querySelector('.profile-upload');
const profilePreview = document.querySelector('.profile-upload__preview');

const fields = {
  email: { element: document.querySelector('.form-field--email'), input: document.querySelector('#signup-email') },
  password: { element: document.querySelector('.form-field--password'), input: document.querySelector('#signup-password') },
  passwordConfirm: { element: document.querySelector('.form-field--password-confirm'), input: document.querySelector('#signup-password-confirm') },
  nickname: { element: document.querySelector('.form-field--nickname'), input: document.querySelector('#nickname') },
};

const EMAIL_PATTERN = /^[A-Za-z]+@[A-Za-z]+(?:\.[A-Za-z]+)+$/;
const PASSWORD_PATTERN = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[^A-Za-z0-9])\S{8,20}$/;
const touched = { profile: false, email: false, password: false, passwordConfirm: false, nickname: false };
let previewUrl = '';

function getProfileResult() {
  return { valid: Boolean(imageInput.files?.[0]), type: 'required' };
}

function getEmailResult() {
  const value = fields.email.input.value.trim();
  if (!value) return { valid: false, type: 'required' };
  return { valid: EMAIL_PATTERN.test(value), type: 'format' };
}

function getPasswordResult() {
  const value = fields.password.input.value;
  if (!value) return { valid: false, type: 'required' };
  return { valid: PASSWORD_PATTERN.test(value), type: 'format' };
}

function getPasswordConfirmResult() {
  const value = fields.passwordConfirm.input.value;
  if (!value) return { valid: false, type: 'required' };
  return { valid: value === fields.password.input.value, type: 'mismatch' };
}

function getNicknameResult() {
  const value = fields.nickname.input.value;
  if (!value) return { valid: false, type: 'required' };
  if (/\s/.test(value)) return { valid: false, type: 'whitespace' };
  if (Array.from(value).length > 10) return { valid: false, type: 'max' };
  return { valid: true };
}

function renderField(field, result, hasBeenTouched) {
  const { element, input } = field;
  element.classList.remove('is-empty', 'is-filled', 'is-invalid', 'is-valid', 'is-required', 'is-format', 'is-mismatch', 'is-whitespace', 'is-max', 'is-duplicate');
  input.setAttribute('aria-invalid', 'false');

  if (input.value) element.classList.add('is-filled');
  else element.classList.add('is-empty');

  if (result.valid) {
    element.classList.add('is-valid');
  } else if (hasBeenTouched) {
    element.classList.add('is-invalid', `is-${result.type}`);
    input.setAttribute('aria-invalid', 'true');
  }
}

function renderProfile(result) {
  profileField.classList.toggle('is-valid', result.valid);
  profileField.classList.toggle('is-invalid', !result.valid && touched.profile);
  profileField.classList.toggle('is-empty', !result.valid);
}

function updateSignupState() {
  const results = {
    profile: getProfileResult(),
    email: getEmailResult(),
    password: getPasswordResult(),
    passwordConfirm: getPasswordConfirmResult(),
    nickname: getNicknameResult(),
  };
  const isValid = Object.values(results).every((result) => result.valid);

  renderProfile(results.profile);
  renderField(fields.email, results.email, touched.email);
  renderField(fields.password, results.password, touched.password);
  renderField(fields.passwordConfirm, results.passwordConfirm, touched.passwordConfirm);
  renderField(fields.nickname, results.nickname, touched.nickname);
  signupForm.classList.toggle('is-valid', isValid);
  submitButton.disabled = !isValid;
  submitButton.classList.toggle('is-disabled', !isValid);
  submitButton.setAttribute('aria-disabled', String(!isValid));
}

function clearProfilePreview() {
  imageInput.value = '';
  profilePreview.removeAttribute('src');
  profileUpload.classList.remove('has-image');
  if (previewUrl) URL.revokeObjectURL(previewUrl);
  previewUrl = '';
}

profileUpload.addEventListener('click', () => {
  // 선택된 이미지를 다시 누른 뒤 파일 선택을 취소하면 기존 이미지를 삭제한 상태로 남깁니다.
  if (imageInput.files?.[0]) clearProfilePreview();
});

imageInput.addEventListener('change', () => {
  const file = imageInput.files?.[0];
  touched.profile = true;
  if (file) {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    previewUrl = URL.createObjectURL(file);
    profilePreview.src = previewUrl;
    profileUpload.classList.add('has-image');
  } else {
    clearProfilePreview();
  }
  updateSignupState();
});

Object.entries(fields).forEach(([name, field]) => {
  field.input.addEventListener('focus', () => field.element.classList.add('is-focused'));
  field.input.addEventListener('blur', () => {
    field.element.classList.remove('is-focused');
    touched[name] = true;
    updateSignupState();
  });
  field.input.addEventListener('input', () => {
    signupForm.classList.remove('is-error');
    updateSignupState();
  });
});

signupForm.addEventListener('submit', (event) => {
  event.preventDefault();
  touched.profile = true;
  Object.keys(fields).forEach((name) => { touched[name] = true; });
  updateSignupState();
  if (submitButton.disabled) return;

  // 회원가입 API 명세가 제공되면 이 지점에서 fetch()를 호출하고, 실패 시 is-error를 적용합니다.
  signupForm.classList.remove('is-valid');
  signupForm.classList.add('is-loading');
  submitButton.disabled = true;
  submitButton.setAttribute('aria-disabled', 'true');

  window.setTimeout(() => {
    signupForm.classList.remove('is-loading');
    signupForm.classList.add('is-success');
    submitLabel.textContent = '회원 가입 성공';
    window.setTimeout(() => window.location.assign('./login.html'), 500);
  }, 450);
});

updateSignupState();
