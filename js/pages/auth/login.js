const loginForm = document.querySelector('.login-form');
const emailInput = document.querySelector('#email');
const passwordInput = document.querySelector('#password');
const loginButton = document.querySelector('.login-button');

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_REGEX = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[^A-Za-z0-9])\S{8,20}$/;
const touched = { email: false, password: false };

function saveButtonState() {
    const email = emailInput.value.trim()
    const password = passwordInput.value.trim();

    const isActive = email !== '' && password !== '';

    // loginForm.classList.toggle('is-valid', isActive);
    loginButton.disabled = !isActive;
    loginButton.classList.toggle('is-disabled', !isActive);
    // loginButton.classList.toggle('aria-disabled', String(!isActive));
}

emailInput.addEventListener('input', saveButtonState);
passwordInput.addEventListener('input', saveButtonState);

loginForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();

    if (!email || !password) {
        alert('이메일과 비밀번호를 모두 입력해주세요.');
        return;
    }
    // event.preventDefault();
    window.location.assign('../posts/list.html');
});

saveButtonState();