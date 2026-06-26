const loginForm = document.querySelector('.login-form');
const emailField = document.querySelector('.form-field--email');
const passwordField = document.querySelector('.form-field--password');
const emailInput = document.querySelector('#email');
const passwordInput = document.querySelector('#password');
const loginButton = document.querySelector('.login-button');

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_PATTERN = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[^A-Za-z0-9])\S{8,20}$/;
const touched = { email: false, password: false };

function getEmailResult() {
  const value = emailInput.value.trim();
  if (!value) return { valid: false, type: 'required' };
  return { valid: EMAIL_PATTERN.test(value), type: 'format' };
}

function getPasswordResult() {
  const value = passwordInput.value;
  if (!value) return { valid: false, type: 'required' };
  return { valid: PASSWORD_PATTERN.test(value), type: 'format' };
}

function renderField(field, input, result, hasBeenTouched) {
  field.classList.remove('is-filled', 'is-invalid', 'is-valid', 'is-required', 'is-format');
  input.setAttribute('aria-invalid', 'false');

  if (input.value) field.classList.add('is-filled');
  if (result.valid) {
    field.classList.add('is-valid');
    return;
  }

  if (hasBeenTouched) {
    field.classList.add('is-invalid', `is-${result.type}`);
    input.setAttribute('aria-invalid', 'true');
  }
}

function updateLoginState() {
  const emailResult = getEmailResult();
  const passwordResult = getPasswordResult();
  const isFormValid = emailResult.valid && passwordResult.valid;

  renderField(emailField, emailInput, emailResult, touched.email);
  renderField(passwordField, passwordInput, passwordResult, touched.password);
  loginForm.classList.toggle('is-valid', isFormValid);
  loginButton.disabled = !isFormValid;
  loginButton.classList.toggle('is-disabled', !isFormValid);
  loginButton.setAttribute('aria-disabled', String(!isFormValid));
}

[
  [emailInput, emailField, 'email'],
  [passwordInput, passwordField, 'password'],
].forEach(([input, field, name]) => {
  input.addEventListener('focus', () => field.classList.add('is-focused'));
  input.addEventListener('blur', () => {
    field.classList.remove('is-focused');
    touched[name] = true;
    updateLoginState();
  });
  input.addEventListener('input', () => updateLoginState());
});

loginForm.addEventListener('submit', (event) => {
  const emailResult = getEmailResult();
  const passwordResult = getPasswordResult();

  if (!emailResult.valid || !passwordResult.valid) {
    event.preventDefault();
    touched.email = true;
    touched.password = true;
    updateLoginState();
    return;
  }

  // API 연동 전에는 비밀번호를 URL에 남기지 않고 목록 페이지로 이동합니다.
  event.preventDefault();
  window.location.assign('../posts/list.html');
});

updateLoginState();
