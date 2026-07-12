import { setAccessToken } from '../../common/auth.js';

const loginForm = document.querySelector('.login-form');

const emailField = document.querySelector('.form-field--email');
const passwordField = document.querySelector('.form-field--password');

const emailInput = document.querySelector('#email');
const passwordInput = document.querySelector('#password');

const loginButton = document.querySelector('.login-button');
const loginLabel = document.querySelector('.login-button__label')

/**
 * input 검증
 */

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const PASSWORD_REGEX = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[^A-Za-z0-9])\S{8,20}$/;
const touched = { email: false, password: false };

function emailInputState() {
    if (!emailInput.value) return {valid: false, type: 'required'};
    return {valid: EMAIL_REGEX.test(emailInput.value), type: 'format'};
}

function passwordInputState() {
    if (!passwordInput.value) return {valid: false, type: 'required'};
    return {valid : PASSWORD_REGEX.test(passwordInput.value), type : 'format'};
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

function loginState() {
    const results = {
        email: emailInputState(),
        password: passwordInputState()
    };

    renderField(emailField, emailInput, results.email, touched.email);
    renderField(passwordField, passwordInput, results.password, touched.password);
    
    const isValid = Object.values(results).every(result => result.valid);

    loginForm.classList.toggle('is-valid', isValid);
    loginButton.disabled = !isValid;
    loginButton.classList.toggle('is-disabled', !isValid);
    loginLabel.classList.toggle('aria-disabled', String(!isValid));
}

emailInput.addEventListener('input', () => {
    touched.email = true;
    loginState();
});
passwordInput.addEventListener('input', () => {
    touched.password = true;
    loginState();
});

/**
 * login
 */

loginForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    
    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();
    
    if (loginButton.disabled) return;
    
    const response = await fetch('http://localhost:8080/auth/login', 
        {
            method : 'POST',
            credentials: "include",
            headers: { 'Content-Type': 'application/json' },
            body : JSON.stringify({email, password})
        }
    );
    const result = await response.json();
    const token = result.data.token.accessToken;
    if (!token) loginForm.classList.add('is-error', true);

    setAccessToken(token);

    loginState();

    window.location.assign('../posts/list.html');
});

loginState();