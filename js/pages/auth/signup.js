const signupForm = document.querySelector('.signup-form');
const submitButton = document.querySelector('.signup-button');
const submitLabel = document.querySelector('.signup-button__label');

const imageInput = document.querySelector('#profile-image');
const profileField = document.querySelector('.profile-field');
const profileUpload = document.querySelector('.profile-upload');
const profilePreview = document.querySelector('.profile-upload__preview');

const emailInput = document.querySelector('#signup-email');
const passwordInput = document.querySelector('#signup-password');
const passwordConfirmInput = document.querySelector('#signup-password-confirm');
const nicknameInput = document.querySelector('#nickname');

const emailField = document.querySelector('.form-field--email');
const passwordField = document.querySelector('.form-field--password');
const passwordConfirmField = document.querySelector('.form-field--password-confirm');
const nicknameField = document.querySelector('.form-field--nickname');


const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_REGEX = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[^A-Za-z0-9])\S{8,20}$/;
const touched = { email: false, password: false, passwordConfirm: false, nickname: false };


function saveButtonState() {
    const email = emailInput.value.trim()
    const password = passwordInput.value.trim();
    const passwordConfirm = passwordConfirmInput.value.trim();
    const nickname = nicknameInput.value.trim();

    const isActive = email !== '' && password !== '' && passwordConfirm !== '' && nickname !== '';

    // signupForm.classList.toggle('is-valid', isActive);
    submitButton.disabled = !isActive;
    submitButton.classList.toggle('is-disabled', !isActive);
    // submitLabel.classList.toggle('aria-disabled', String(!isActive));
}

imageInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    profilePreview.src = URL.createObjectURL(file);
    profileUpload.classList.add('has-image');
});

emailInput.addEventListener('input', saveButtonState);
passwordInput.addEventListener('input', saveButtonState);
passwordConfirmInput.addEventListener('input', saveButtonState);
nicknameInput.addEventListener('input', saveButtonState);

signupForm.addEventListener('submit', (event) => {
    // event.preventDefault();

    const email = emailInput.value.trim()
    const password = passwordInput.value.trim();
    const passwordConfirm = passwordConfirmInput.value.trim();
    const nickname = nicknameInput.value.trim();

    if (!email || !password || !passwordConfirm || !nickname) {
        alert('이메일과 비밀번호, 닉네임을 모두 입력해주세요.');
        return;
    }
    event.preventDefault();
    window.location.assign('./login.html');
});

saveButtonState();