const postEditForm = document.querySelector('.post-edit-form');

const backButton = document.querySelector('.post-edit-back');

const articleId = new URLSearchParams(window.location.search).get('id');

const titleField = document.querySelector('.post-edit-field--title');
const contentField = document.querySelector('.post-edit-field--content');

const titleInput = document.querySelector('#post-title');
const contentInput = document.querySelector('#post-content');
const imageInput = document.querySelector('#content-images');

const imageGuide = document.querySelector('[data-image-guide]');
const imagePreviewList = document.querySelector('[data-image-list]');

const submitButton = document.querySelector('.post-edit-button');
const submitLabel = document.querySelector('[data-submit-label]');

const formError = document.querySelector('.post-edit-error');

const successMessage = document.querySelector('.post-edit-success');

const touched = { title: false, content: false };
let previewUrls = [];
let isLimited = false;


backButton.addEventListener('click', () => {
    window.location.assign(`./detail.html?id=${articleId}`);
});

async function fetchArticle() {
    try {
        const response = await fetch(`http://localhost:8080/articles/${articleId}`);

        if (!response.ok) {
        throw new Error('게시글 조회 실패');
        }

        const result = await response.json();
        const article = result.data;
        const existingImages = article.contentImages || [];

        titleInput.value = article.title;
        contentInput.value = article.content;

        existingImages.forEach((file) => {
        const url = URL.createObjectURL(file);
        previewUrls.push(url);
        const item = document.createElement('li');
        const image = document.createElement('img');
        image.src = url;
        image.alt = `${file.name} 미리보기`;
        item.append(image);
        imagePreviewList.append(item);
        });
    } catch (error) {
        console.error(error);
        alert('게시글 정보를 불러오지 못했습니다.');
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
    const userId = document.body.dataset.userId || 6352;

    if (!userId) {
        await new Promise((resolve) => window.setTimeout(resolve, 500));
        return { articleId : 6352 }
    }

    const formData = new FormData();
    const response = await fetch(`http://localhost:8080/articles/${articleId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify( {userId, ...articleData} )
    });

    if (!response.ok) throw new Error("게시글 작성 실패");
    return response.json();
}

titleInput.addEventListener('input', updateFormState);
contentInput.addEventListener('input', updateFormState);

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
            .map(file => file.name);

    if (!title) {
        formError.textContent = '제목을 입력해주세요.';
        return;
    }
    
    submitButton.disabled = true;
    submitButton.setAttribute('aria-disabled', 'true');
    
    const articleData = {title, content, contentImages}
    const result = await updateArticle(articleData);

    updateFormState();

    const articleId = result.data.articleId;
    window.setTimeout(() => {
        window.location.assign(`./detail.html?id=${encodeURIComponent(articleId)}`);
    }, 500);
});

updateFormState();
fetchArticle();