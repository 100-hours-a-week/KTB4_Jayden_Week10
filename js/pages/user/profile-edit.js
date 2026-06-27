const passwordForm = document.querySelector('.profile-edit-form');

const nicknameField = document.querySelector('.form-field--nickname');
const nicknameInput = document.querySelector('#nickname');

const saveButton = document.querySelector('.profile-save-button');

const imageInput = document.querySelector('#profile-image');
const profileUpload = document.querySelector('.profile-image-upload');
const profilePreview = document.querySelector('.profile-image-upload__preview');

const withdrawOpenButton = document.querySelector('[data-withdraw-open]');
const withdrawModal = document.querySelector('#withdraw-modal');
const withdrawConfirmButton = document.querySelector('[data-withdraw-confirm]');

const toast = document.querySelector('.profile-toast');



function saveButtonState() {
    const nickname = nicknameInput.value.trim();

    const isActive = nickname !== '' && nickname.length <= 11;

    passwordForm.classList.toggle('is-valid', isActive);
    saveButton.disabled = !isActive;
    saveButton.classList.toggle('is-disabled', !isActive);
    saveButton.setAttribute('aria-disabled', String(!isActive));
}

imageInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    profilePreview.src = URL.createObjectURL(file);
    profileUpload.classList.add('has-image');
});

nicknameInput.addEventListener('input', saveButtonState);

passwordForm.addEventListener('submit', (event) => {
    event.preventDefault();
    
    const nickname = nicknameInput.value.trim();
    if (!nickname) {
        alert('닉네임을 입력해주세요.');
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



withdrawOpenButton.addEventListener('click', () => {
    withdrawModal.showModal();
    withdrawModal.classList.add('is-active');
});

withdrawModal.addEventListener('close', () => {
    withdrawModal.classList.remove('is-active');
});
withdrawConfirmButton.addEventListener('click', () => {
    window.location.assign('../auth/login.html');
});


saveButtonState();