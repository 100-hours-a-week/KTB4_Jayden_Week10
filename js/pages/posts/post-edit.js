import { authFetch, refreshAccessToken } from '../../common/auth.js';

const postEditForm = document.querySelector('.post-edit-form');

const backButton = document.querySelector('.post-edit-back');

const articleId = new URLSearchParams(window.location.search).get('id');

const titleInput = document.querySelector('#post-title');
const contentInput = document.querySelector('#post-content');
const imageInput = document.querySelector('#content-images');

const imageGuide = document.querySelector('[data-image-guide]');
const imagePreviewList = document.querySelector('[data-image-list]');

const submitButton = document.querySelector('.post-edit-button');

const formError = document.querySelector('.post-edit-error');

let previewUrls = [];


backButton.addEventListener('click', () => {
    window.location.assign(`./detail.html?id=${articleId}`);
});

async function fetchArticle() {
    try {
        const response = await authFetch(`http://localhost:8080/articles/${articleId}`);

        if (!response.ok) {
        throw new Error('게시글 조회 실패');
        }

        const result = await response.json();
        const article = result.data;
        const existingImages = article.contentImageUrls || [];

        titleInput.value = article.title;
        contentInput.value = article.content;

        existingImages.forEach((url) => {
        previewUrls.push(url);
        const item = document.createElement('li');
        const image = document.createElement('img');
        image.src = url;
        image.alt = `${url.name} 미리보기`;
        item.append(image);
        imagePreviewList.append(item);
        });
    } catch (error) {
        console.error(error);
        // alert('게시글 정보를 불러오지 못했습니다.');
    }
}

function updateFormState() {
    const title = titleInput.value.trim();

    const isActive = title !== '';

    postEditForm.classList.toggle('is-valid', isActive);
    submitButton.disabled = !isActive;
    submitButton.classList.toggle('is-disabled', !isActive);
    submitButton.setAttribute('aria-disabled', String(!isActive));
}

async function updateArticle(articleData) {
    const formData = new FormData();
    const response = await authFetch(`http://localhost:8080/articles/${articleId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify( { ...articleData} )
    });

    if (!response.ok) throw new Error("게시글 작성 실패");
    return response.json();
}

titleInput.addEventListener('input', updateFormState);
contentInput.addEventListener('input', updateFormState);

async function uploadContentImages(contentImages) {
    if (!contentImages) return {data: {fileUrls: null}};
    const formData = new FormData();
    
    for (const file of contentImages) {
        formData.append('contentImages', file);
    }
    const response = await authFetch('http://localhost:8080/articles/content-image',
        {
            method : 'POST', 
            body: formData
        }
    );

    if (!response.ok) return new Error('이미지 업로드 실패');
    return response.json();
}

imageInput.addEventListener('change', (e) => {
    const files = Array.from(imageInput.files || []);
    const hasImages = files.length > 0;

    postEditForm.classList.toggle('has-image', hasImages);
    postEditForm.classList.toggle('has-no-image', !hasImages);

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

postEditForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const title = titleInput.value.trim();
    const content = contentInput.value.trim();
    const contentImages = Array.from(imageInput.files || [])

    if (!title) {
        formError.textContent = '제목을 입력해주세요.';
        return;
    }
    
    submitButton.disabled = true;
    submitButton.setAttribute('aria-disabled', 'true');

    const ImageUrls = await uploadContentImages(contentImages)
    
    const articleData = {title, content, contentImageUrls: ImageUrls.data.fileUrls}
    const result = await updateArticle(articleData);

    updateFormState();

    const articleId = result.data.articleId;
    window.setTimeout(() => {
        window.location.assign(`./detail.html?id=${encodeURIComponent(articleId)}`);
    }, 500);
});

async function initializePage() {
    try {
        await refreshAccessToken();
        await fetchArticle();

        updateFormState();
    } catch (error) {
        console.error(error);
        // window.location.replace("../auth/login.html");
    }
}

initializePage();