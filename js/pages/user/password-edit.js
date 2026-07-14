import { TIME } from '../../constants/time.js';
import { REGEX } from '../../constants/regex.js';
import {refreshAccessToken} from '../../common/auth.js';
import {updatePasswordRequest} from '../../common/fetch.js';

const passwordUpdateForm = document.querySelector('.password-edit-form');

const passwordField = document.querySelector('.form-field--password');
const passwordConfirmField = document.querySelector('.form-field--password-confirm');

const passwordInput = document.querySelector('#password');
const passwordConfirmInput = document.querySelector('#password-confirm');

const updateButton = document.querySelector('.password-save-button');

const toast = document.querySelector('.password-toast');

const PASSWORD_REGEX = REGEX.PASSWORD_REGEX;
const touched = {password : false, passwordConfirm : false}

const TOAST_LASTING_TIME = TIME.TOAST_LASTING_TIME;
const TOAST_POPUP_TIME = TIME.TOAST_POPUP_TIME;


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

    const result = await updatePasswordRequest(password);

    if (!result.ok) throw new Error('비밀번호 수정 실패');
    

    window.setTimeout(() => {
        updateButtonState();
        toast.hidden = false;
        toast.classList.add('is-active');
        window.setTimeout(() => {
            toast.classList.remove('is-active');
            toast.hidden = true;
        }, TOAST_LASTING_TIME);
    }, TOAST_POPUP_TIME);
});

async function initializePage() {
    try {
        await refreshAccessToken();
        updateButtonState();
    } catch (error) {
        console.error(error);
        // window.location.replace("../auth/login.html");
    }
}

initializePage();