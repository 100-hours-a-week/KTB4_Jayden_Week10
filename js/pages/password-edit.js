const passwordForm = document.querySelector('.password-edit-form');
const passwordField = document.querySelector('.form-field--password');
const passwordConfirmField = document.querySelector('.form-field--password-confirm');
const passwordInput = document.querySelector('#password');
const passwordConfirmInput = document.querySelector('#password-confirm');
const saveButton = document.querySelector('.password-save-button');
const formError = document.querySelector('.password-edit-form__error');
const toast = document.querySelector('.password-toast');

const PASSWORD_PATTERN = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[^A-Za-z0-9])\S{8,20}$/;
const touched = { password: false, passwordConfirm: false };

function getPasswordResult() {
  const value = passwordInput.value;
  if (!value) return { valid: false, type: 'required' };
  if (!PASSWORD_PATTERN.test(value)) return { valid: false, type: 'format' };
  if (passwordConfirmInput.value && value !== passwordConfirmInput.value) return { valid: false, type: 'mismatch' };
  return { valid: true };
}

function getPasswordConfirmResult() {
  const value = passwordConfirmInput.value;
  if (!value) return { valid: false, type: 'required' };
  if (value !== passwordInput.value) return { valid: false, type: 'mismatch' };
  return { valid: true };
}

function renderField(field, input, result, hasBeenTouched) {
  field.classList.remove('is-empty', 'is-filled', 'is-invalid', 'is-valid', 'is-required', 'is-format', 'is-mismatch');
  input.setAttribute('aria-invalid', 'false');
  if (input.value) field.classList.add('is-filled');
  else field.classList.add('is-empty');

  if (result.valid) {
    field.classList.add('is-valid');
  } else if (hasBeenTouched) {
    field.classList.add('is-invalid', `is-${result.type}`);
    input.setAttribute('aria-invalid', 'true');
  }
}

function updateFormState() {
  const passwordResult = getPasswordResult();
  const passwordConfirmResult = getPasswordConfirmResult();
  const isValid = passwordResult.valid && passwordConfirmResult.valid;

  renderField(passwordField, passwordInput, passwordResult, touched.password);
  renderField(passwordConfirmField, passwordConfirmInput, passwordConfirmResult, touched.passwordConfirm);
  passwordForm.classList.toggle('is-valid', isValid);
  saveButton.disabled = !isValid;
  saveButton.classList.toggle('is-disabled', !isValid);
  saveButton.setAttribute('aria-disabled', String(!isValid));
}

function showToast() {
  toast.hidden = false;
  window.setTimeout(() => { toast.hidden = true; }, 2200);
}

function showRequestError() {
  passwordForm.classList.remove('is-loading', 'is-valid');
  passwordForm.classList.add('is-error');
  formError.hidden = false;
  passwordInput.value = '';
  passwordConfirmInput.value = '';
  touched.password = false;
  touched.passwordConfirm = false;
  updateFormState();
}

async function savePassword() {
  const userId = document.body.dataset.userId;
  if (!userId) {
    await new Promise((resolve) => window.setTimeout(resolve, 450));
    return;
  }

  const apiBase = document.body.dataset.apiBase || window.location.origin;
  const response = await fetch(new URL(`/users/${encodeURIComponent(userId)}/password`, apiBase), {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ password: passwordInput.value }),
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
}

[
  [passwordInput, passwordField, 'password'],
  [passwordConfirmInput, passwordConfirmField, 'passwordConfirm'],
].forEach(([input, field, name]) => {
  input.addEventListener('focus', () => field.classList.add('is-focused'));
  input.addEventListener('blur', () => {
    field.classList.remove('is-focused');
    touched[name] = true;
    updateFormState();
  });
  input.addEventListener('input', () => {
    passwordForm.classList.remove('is-error');
    formError.hidden = true;
    updateFormState();
  });
});

passwordForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  touched.password = true;
  touched.passwordConfirm = true;
  updateFormState();
  if (saveButton.disabled) return;

  passwordForm.classList.remove('is-error', 'is-valid');
  passwordForm.classList.add('is-loading');
  saveButton.disabled = true;
  saveButton.setAttribute('aria-disabled', 'true');

  try {
    await savePassword();
    passwordForm.classList.remove('is-loading');
    passwordForm.classList.add('is-success');
    passwordInput.value = '';
    passwordConfirmInput.value = '';
    touched.password = false;
    touched.passwordConfirm = false;
    updateFormState();
    showToast();
  } catch (error) {
    console.error('비밀번호 수정에 실패했습니다.', error);
    showRequestError();
  }
});

updateFormState();
