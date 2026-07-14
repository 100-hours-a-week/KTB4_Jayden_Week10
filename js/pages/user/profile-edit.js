import { TIME } from '../../constants/time.js';
import { REGEX } from '../../constants/regex.js';
import {refreshAccessToken} from '../../common/auth.js';
import { fetchUserRequest, updateUserInfoRequest, deleteUserRequest } from '../../common/fetch.js';

const profileEditForm = document.querySelector('.profile-edit-form');

const email = document.querySelector('[data-profile-email]')

const nicknameField = document.querySelector('.form-field--nickname');
const nicknameInput = document.querySelector('#nickname');

const updateButton = document.querySelector('.profile-save-button');

const imageInput = document.querySelector('#profile-image');
const profileUpload = document.querySelector('.profile-image-upload');
const profilePreview = document.querySelector('.profile-image-upload__preview');

const withdrawOpenButton = document.querySelector('[data-withdraw-open]');
const withdrawModal = document.querySelector('#withdraw-modal');
const withdrawConfirmButton = document.querySelector('[data-withdraw-confirm]');

const toast = document.querySelector('.profile-toast');

const NICKNAME_REGEX = REGEX.NICKNAME_REGEX
const touched = {nickname : false}

const TOAST_LASTING_TIME = TIME.TOAST_LASTING_TIME;
const TOAST_POPUP_TIME = TIME.TOAST_POPUP_TIME;



async function fetchUserInfo() {
    const result = await fetchUserRequest;
    const payload = await result.json();
    const userInfo = payload.data;

    email.textContent = userInfo.email;
    nicknameInput.value = userInfo.nickname;
    profilePreview.src = userInfo.profileImageUrl ? userInfo.profileImageUrl : "../../assets/images/default-profile.svg";
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

function updateButtonState() {
    const nickname = nicknameInput.value.trim();

    const result = nicknameInputState();
    
    renderField(nicknameField, nicknameInput, result, touched.nickname);

    const isValid = result.valid

    profileEditForm.classList.toggle('is-valid', isValid);
    updateButton.disabled = !isValid;
    updateButton.classList.toggle('is-disabled', !isValid);
    updateButton.setAttribute('aria-disabled', String(!isValid));
}

imageInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    profilePreview.src = URL.createObjectURL(file);
    profileUpload.classList.add('has-image');

    profilePreview.addEventListener('load', () => {
        URL.revokeObjectURL(profilePreview.src);
    },
    { once: true }
    );
});

async function uploadProfileImage(profileImage) {
    if (!profileImage) return {data: {fileUrl: profilePreview.src}};
    const formData = new FormData();
    formData.append('profileImage', profileImage);
    const response = await uploadProfileImageRequest(formData);

    if (!response.ok) return new Error('이미지 업로드 실패');
    return response.json();
}

nicknameInput.addEventListener('input', updateButtonState);

profileEditForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    
    const profileImage = imageInput.files[0] || null;
    const nickname = nicknameInput.value.trim();
    
    updateButtonState();

    if (updateButton.disabled) return;

    const profileResult = await uploadProfileImage(profileImage);

    const result = await updateUserInfoRequest(nickname, profileResult.data.fileUrl);


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



withdrawOpenButton.addEventListener('click', () => {
    withdrawModal.showModal();
    withdrawModal.classList.add('is-active');
});

withdrawModal.addEventListener('close', () => {
    withdrawModal.classList.remove('is-active');
});
withdrawConfirmButton.addEventListener('click', async () => {

        const result = await deleteUserRequest;

    window.location.assign('../auth/login.html');
});

async function initializePage() {
    try {
        await refreshAccessToken();
        await fetchUserInfo();
        updateButtonState();
    } catch (error) {
        console.error(error);
        // window.location.replace("../auth/login.html");
    }
}

initializePage();