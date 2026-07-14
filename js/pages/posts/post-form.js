import {refreshAccessToken } from "../../common/auth.js";
import { createArticleRequest, uploadContentImagesRequest } from "../../common/fetch.js";

const postCreateForm = document.querySelector('.post-create-form');

const titleInput = document.querySelector('#post-title');
const contentInput = document.querySelector('#post-content');
const imageInput = document.querySelector('#content-images');

const imageGuide = document.querySelector('[data-image-guide]');
const imagePreviewList = document.querySelector('[data-image-preview-list]');

const submitButton = document.querySelector('.post-create-button');

const formError = document.querySelector('.post-create-form__error');

let previewUrls = [];



function updateFormState() {
    const title = titleInput.value.trim();

    const isActive = title !== '';

    postCreateForm.classList.toggle('is-valid', isActive);
    submitButton.disabled = !isActive;
    submitButton.classList.toggle('is-disabled', !isActive);
    submitButton.setAttribute('aria-disabled', String(!isActive));
}

async function createArticle(articleData) {

    const response = await createArticleRequest(articleData);

    if (!response.ok) throw new Error("게시글 작성 실패");
    return response.json();
}

titleInput.addEventListener('input', updateFormState);
contentInput.addEventListener('input', updateFormState);

async function uploadContentImages(contentImages) {
    if (contentImages.length === 0) return {data: {fileUrls: []}};
    const formData = new FormData();
    
    for (const file of contentImages) {
        formData.append('contentImages', file);
    }
    const response = await uploadContentImagesRequest(formData);

    if (!response.ok) return new Error('이미지 업로드 실패');
    return response.json();
}

function clearPreviewUrls() {
    previewUrls.forEach((url) => {
        URL.revokeObjectURL(url);
    });

    previewUrls = [];
    imagePreviewList.replaceChildren();
}

imageInput.addEventListener('change', (e) => {
    clearPreviewUrls();

    const files = Array.from(imageInput.files || []);
    const hasImages = files.length > 0;

    postCreateForm.classList.toggle('has-image', hasImages);
    postCreateForm.classList.toggle('has-no-image', !hasImages);

    imagePreviewList.hidden = !hasImages;
    imageGuide.textContent = hasImages ? `${files.length}개의 이미지가 선택되었습니다.` : '파일을 선택해주세요.';

    files.forEach((file) => {
        const url = URL.createObjectURL(file);
        previewUrls.push(url);
        const item = document.createElement('li');
        const image = document.createElement('img');
        image.src = url;
        image.alt = `${file.name} 미리보기`;
        item.append(image);
        imagePreviewList.append(item);
    });
});

postCreateForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const title = titleInput.value.trim();
    const content = contentInput.value.trim();
    const contentImages = (imageInput.files || [])

    if (!title) {
        formError.textContent = '제목을 입력해주세요.';
        return;
    }
    
    submitButton.disabled = true;
    submitButton.setAttribute('aria-disabled', 'true');
    
    const ImageUrls = await uploadContentImages(contentImages)
    console.log(ImageUrls)
    const articleData = {title, content, contentImageUrls: ImageUrls.data.fileUrls};
    const result = await createArticle(articleData);

    updateFormState();

    const articleId = result.data.articleId;
    console.log(`게시글 작성 완료: ${articleId}`);
    window.setTimeout(() => {
        window.location.assign(`./detail.html?id=${encodeURIComponent(articleId)}`);
    }, 500);
});

window.addEventListener('beforeunload', () => {
    previewUrls.forEach((url) => {
        URL.revokeObjectURL(url);
    });
});

updateFormState();
async function initializePage() {
    try {
        await refreshAccessToken();
        updateFormState();
    } catch (error) {
        console.error(error);
        // window.location.replace("../auth/login.html");
    }
}

initializePage();