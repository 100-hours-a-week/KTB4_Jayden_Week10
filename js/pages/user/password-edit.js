const passwordForm = document.querySelector('.password-edit-form');

const passwordField = document.querySelector('.form-field--password');
const passwordConfirmField = document.querySelector('.form-field--password-confirm');

const passwordInput = document.querySelector('#password');
const passwordConfirmInput = document.querySelector('#password-confirm');

const saveButton = document.querySelector('.password-save-button');
const formError = document.querySelector('.password-edit-form__error');

const toast = document.querySelector('.password-toast');

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_REGEX = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[^A-Za-z0-9])\S{8,20}$/;

const userId = document.body.dataset.userId || 6352;


function saveButtonState() {
    const password = passwordInput.value;
    const passwordConfirm = passwordConfirmInput.value;

    const isActive = password !== '' && password === passwordConfirm;

    passwordForm.classList.toggle('is-valid', isActive);
    saveButton.disabled = !isActive;
    saveButton.classList.toggle('is-disabled', !isActive);
    saveButton.setAttribute('aria-disabled', String(!isActive));
}


passwordInput.addEventListener('input', saveButtonState);
passwordConfirmInput.addEventListener('input', saveButtonState);

passwordForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    
    const password = passwordInput.value;
    const passwordConfirm = passwordConfirmInput.value;

    if (password !== passwordConfirm) {
        alert('비밀번호와 비밀번호 확인이 다릅니다.')
        return;
    }
    if (!password || !passwordConfirm) {
        alert('비밀번호를 입력해주세요.');
        return;
    }
    saveButton.disabled = true;
    saveButton.setAttribute('aria-disabled', 'true');

    const result = await fetch(`http://localhost:8080/users/${userId}/password`,
        {
            method : 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify( { password } )
        }
    )

    window.setTimeout(() => {
        saveButtonState();
        toast.hidden = false;
        toast.classList.add('is-active');
        window.setTimeout(() => {
            toast.classList.remove('is-active');
            toast.hidden = true;
        }, 3000);
    }, 500);
});

saveButtonState();