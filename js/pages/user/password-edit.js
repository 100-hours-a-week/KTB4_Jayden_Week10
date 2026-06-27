const passwordForm = document.querySelector('.password-edit-form');

const passwordField = document.querySelector('.form-field--password');
const passwordConfirmField = document.querySelector('.form-field--password-confirm');

const passwordInput = document.querySelector('#password');
const passwordConfirmInput = document.querySelector('#password-confirm');

const saveButton = document.querySelector('.password-save-button');
const formError = document.querySelector('.password-edit-form__error');

const toast = document.querySelector('.password-toast');



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

passwordForm.addEventListener('submit', (event) => {
    event.preventDefault();
    
    const password = passwordInput.value;
    const passwordConfirm = passwordConfirmInput.value;
    if (!password || !passwordConfirm) {
        alert('비밀번호를 입력해주세요.');
        return;
    }
    saveButton.disabled = true;
    saveButton.setAttribute('aria-disabled', 'true');

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