const profileForm = document.querySelector('.profile-edit-form');
const nicknameField = document.querySelector('.form-field--nickname');
const nicknameInput = document.querySelector('#nickname');
const saveButton = document.querySelector('.profile-save-button');
const imageInput = document.querySelector('#profile-image');
const imageUpload = document.querySelector('.profile-image-upload');
const imagePreview = document.querySelector('.profile-image-upload__preview');
const withdrawOpenButton = document.querySelector('[data-withdraw-open]');
const withdrawModal = document.querySelector('#withdraw-modal');
const withdrawConfirmButton = document.querySelector('[data-withdraw-confirm]');
const toast = document.querySelector('.profile-toast');

const originalNickname = nicknameInput.value;
let nicknameTouched = false;
let previewUrl = '';

function getNicknameResult() {
  const value = nicknameInput.value;
  if (!value) return { valid: false, type: 'required' };
  if (Array.from(value).length > 10) return { valid: false, type: 'max' };
  return { valid: true };
}

function updateFormState() {
  const result = getNicknameResult();
  nicknameField.classList.remove('is-empty', 'is-filled', 'is-invalid', 'is-valid', 'is-required', 'is-max', 'is-duplicate');
  nicknameInput.setAttribute('aria-invalid', 'false');

  if (nicknameInput.value) nicknameField.classList.add('is-filled');
  else nicknameField.classList.add('is-empty');

  if (result.valid) {
    nicknameField.classList.add('is-valid');
  } else if (nicknameTouched) {
    nicknameField.classList.add('is-invalid', `is-${result.type}`);
    nicknameInput.setAttribute('aria-invalid', 'true');
  }

  profileForm.classList.toggle('is-valid', result.valid);
  saveButton.disabled = !result.valid;
  saveButton.classList.toggle('is-disabled', !result.valid);
  saveButton.setAttribute('aria-disabled', String(!result.valid));
}

function clearProfileImage() {
  imageInput.value = '';
  imagePreview.removeAttribute('src');
  imagePreview.alt = '';
  imageUpload.classList.remove('has-image');
  if (previewUrl) URL.revokeObjectURL(previewUrl);
  previewUrl = '';
}

function showToast() {
  toast.hidden = false;
  toast.classList.add('is-active');
  window.setTimeout(() => {
    toast.classList.remove('is-active');
    toast.hidden = true;
  }, 2200);
}

imageUpload.addEventListener('click', () => {
  // 기존 이미지를 누른 뒤 파일 선택을 취소하면, 이미지가 삭제된 상태로 유지됩니다.
  if (imageUpload.classList.contains('has-image')) clearProfileImage();
});

imageInput.addEventListener('change', () => {
  const file = imageInput.files?.[0];
  if (!file) {
    clearProfileImage();
    return;
  }
  if (previewUrl) URL.revokeObjectURL(previewUrl);
  previewUrl = URL.createObjectURL(file);
  imagePreview.src = previewUrl;
  imagePreview.alt = '선택한 프로필 사진';
  imageUpload.classList.add('has-image');
});

nicknameInput.addEventListener('focus', () => nicknameField.classList.add('is-focused'));
nicknameInput.addEventListener('blur', () => {
  nicknameField.classList.remove('is-focused');
  nicknameTouched = true;
  updateFormState();
});
nicknameInput.addEventListener('input', () => {
  profileForm.classList.remove('is-error');
  updateFormState();
});

profileForm.addEventListener('submit', (event) => {
  event.preventDefault();
  nicknameTouched = true;
  updateFormState();
  if (saveButton.disabled) return;

  // data-user-id와 API base가 설정되면 이 지점에서 PATCH /users/{user_id} fetch()를 호출합니다.
  profileForm.classList.remove('is-valid');
  profileForm.classList.add('is-loading');
  saveButton.disabled = true;
  saveButton.setAttribute('aria-disabled', 'true');

  window.setTimeout(() => {
    profileForm.classList.remove('is-loading');
    profileForm.classList.add('is-success');
    updateFormState();
    showToast();
  }, 450);
});

withdrawOpenButton.addEventListener('click', () => {
  withdrawModal.showModal();
  withdrawModal.classList.add('is-active');
});

withdrawModal.addEventListener('close', () => withdrawModal.classList.remove('is-active'));
withdrawConfirmButton.addEventListener('click', () => window.location.assign('../auth/login.html'));

updateFormState();
