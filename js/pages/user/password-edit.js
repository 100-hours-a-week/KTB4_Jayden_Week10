const passwordUpdateForm = document.querySelector('.password-edit-form');

const passwordField = document.querySelector('.form-field--password');
const passwordConfirmField = document.querySelector('.form-field--password-confirm');

const passwordInput = document.querySelector('#password');
const passwordConfirmInput = document.querySelector('#password-confirm');

const updateButton = document.querySelector('.password-save-button');
const formError = document.querySelector('.password-edit-form__error');

const toast = document.querySelector('.password-toast');

const userId = document.body.dataset.userId || 6352;

const PASSWORD_REGEX = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[^A-Za-z0-9])\S{8,20}$/;
const touched = {password : false, passwordConfirm : false}

/**
 * input 검증
 */
function passwordInputState() {
    if (!passwordInput.value) return {valid: false, type: 'required'};
    return {valid : PASSWORD_REGEX.test(passwordInput.value), type : 'format'};
}

function passwordConfirmInputState() {
    if (!passwordConfirmInput.value) return {valid: false, type: 'required'};
    return {valid : passwordInput.value === passwordConfirmInput.value, type : 'mismatch'};
}

function renderField(element, input, result, hasBeenTouched) {
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

function updateButtonState() {
    const results = {
        password : passwordInputState(),
        passwordConfirm : passwordConfirmInputState()
    };

    renderField(passwordField, passwordInput, results.password, touched.password);
    renderField(passwordConfirmField, passwordConfirmInput, results.passwordConfirm, touched.passwordConfirm);

    const isActive = results.password.valid && results.passwordConfirm.valid;

    passwordUpdateForm.classList.toggle('is-valid', isActive);
    updateButton.disabled = !isActive;
    updateButton.classList.toggle('is-disabled', !isActive);
    updateButton.setAttribute('aria-disabled', String(!isActive));
}

passwordInput.addEventListener('input', () => {
    touched.password = true;
    updateButtonState();
});
passwordConfirmInput.addEventListener('input', () => {
    touched.passwordConfirm = true;
    updateButtonState();
});

passwordUpdateForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    
    const password = passwordInput.value;
    const passwordConfirm = passwordConfirmInput.value;

    if (updateButton.disabled) return;

    const result = await fetch(`http://localhost:8080/users/${userId}/password`,
        {
            method : 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify( { password } )
        }
    );

    window.setTimeout(() => {
        updateButtonState();
        toast.hidden = false;
        toast.classList.add('is-active');
        window.setTimeout(() => {
            toast.classList.remove('is-active');
            toast.hidden = true;
        }, 3000);
    }, 500);
});

updateButtonState();