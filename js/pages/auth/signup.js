const signupForm = document.querySelector('.signup-form');
const submitButton = document.querySelector('.signup-button');
const submitLabel = document.querySelector('.signup-button__label');

const imageInput = document.querySelector('#profile-image');
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

/**
 * input 검증
 */
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const PASSWORD_REGEX = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[^A-Za-z0-9])\S{8,20}$/;
const NICKNAME_REGEX = /^[ㄱ-ㅎ가-힣a-zA-Z0-9_-]{2,10}$/;
const touched = { email: false, password: false, passwordConfirm: false, nickname: false };

function emailInputState() {
    if (!emailInput.value) return {valid: false, type: 'required'};
    // if () return { valid: false, type: 'duplicate'}; 이메일 중복 확인 API 생성 필요
    return {valid: EMAIL_REGEX.test(emailInput.value), type: 'format'};
}

function passwordInputState() {
    if (!passwordInput.value) return {valid: false, type: 'required'};
    return {valid : PASSWORD_REGEX.test(passwordInput.value), type : 'format'};
}

function passwordConfirmInputState() {
    if (!passwordConfirmInput.value) return {valid: false, type: 'required'};
    return {valid : passwordInput.value === passwordConfirmInput.value, type : 'mismatch'};
}

function nicknameInputState() {
    if (!nicknameInput.value) return {valid: false, type: 'required'};
    if (/\s/.test(nicknameInput.value)) return { valid: false, type: 'whitespace'};
    if (nicknameInput.value.length > 10) return { valid: false, type: 'max'};
    // if () return { valid: false, type: 'duplicate'}; 닉네임 중복 확인 API 생성 필요
    return {valid : NICKNAME_REGEX.test(nicknameInput.value), type : 'format'};
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

function signupFormState() {
    const results = {
        email: emailInputState(),
        password: passwordInputState(),
        passwordConfirm: passwordConfirmInputState(),
        nickname: nicknameInputState()
    };

    renderField(emailField, emailInput, results.email, touched.email);
    renderField(passwordField, passwordInput, results.password, touched.password);
    renderField(passwordConfirmField, passwordConfirmInput, results.passwordConfirm, touched.passwordConfirm);
    renderField(nicknameField, nicknameInput, results.nickname, touched.nickname);
    
    const isValid = Object.values(results).every(result => result.valid);

    signupForm.classList.toggle('is-valid', isValid);
    submitButton.disabled = !isValid;
    submitButton.classList.toggle('is-disabled', !isValid);
    submitLabel.classList.toggle('aria-disabled', String(!isValid));
}



imageInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    profilePreview.src = URL.createObjectURL(file);
    profileUpload.classList.add('has-image');
});


emailInput.addEventListener('input', () => {
    touched.email = true;
    signupFormState();
});
passwordInput.addEventListener('input', () => {
    touched.password = true;
    signupFormState();
});
passwordConfirmInput.addEventListener('input', () => {
    touched.passwordConfirm = true;
    signupFormState();
});
nicknameInput.addEventListener('input', () => {
    touched.nickname = true;
    signupFormState();
});

async function signup(signupData) {
    const response = await fetch('http://localhost:8080/users',
        {
            method : 'POST', 
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({...signupData})
        }
    );

    if (!response.ok) return new Error('회원 가입 실패');
    return response.json();
}

async function uploadProfileImage(profileImage) {
    if (!profileImage) return {data: {fileUrl: null}};
    const formData = new FormData();
    formData.append('profileImage', profileImage);
    const response = await fetch('http://localhost:8080/users/me/profile-image',
        {
            method : 'POST', 
            body: formData
        }
    );

    if (!response.ok) return new Error('이미지 업로드 실패');
    return response.json();
}


signupForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    if (submitButton.disabled) return;

    const email = emailInput.value.trim()
    const password = passwordInput.value.trim();
    const passwordConfirm = passwordConfirmInput.value.trim();
    const nickname = nicknameInput.value.trim();
    const profileImage = imageInput.files[0] || null;

    const profileResult = await uploadProfileImage(profileImage);

    const signupData = {email, password, nickname, profileImageUrl : profileResult.data.fileUrl}
    const result = await signup(signupData);

    signupFormState();

    window.location.assign('./login.html');
});

signupFormState();
