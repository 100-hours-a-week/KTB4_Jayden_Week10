const postCreateForm = document.querySelector('.post-create-form');

const titleField = document.querySelector('.form-field--title');
const contentField = document.querySelector('.form-field--content');

const titleInput = document.querySelector('#post-title');
const contentInput = document.querySelector('#post-content');
const imageInput = document.querySelector('#content-images');

const imageGuide = document.querySelector('[data-image-guide]');
const imagePreviewList = document.querySelector('[data-image-preview-list]');

const submitButton = document.querySelector('.post-create-button');
const submitLabel = document.querySelector('.post-create-button__label');

const formError = document.querySelector('.post-create-form__error');

const limitedMessage = document.querySelector('.post-create-form__limited');
const successMessage = document.querySelector('.post-create-form__success');

const touched = { title: false, content: false };

let previewUrls = [];
let isLimited = false;



function updateFormState() {
    const title = titleInput.value.trim();

    const isActive = title !== '';

    postCreateForm.classList.toggle('is-valid', isActive);
    submitButton.disabled = !isActive;
    submitButton.classList.toggle('is-disabled', !isActive);
    submitButton.setAttribute('aria-disabled', String(!isActive));
}

async function createArticle(articleData) {
    const userId = document.body.dataset.userId || 6352;

    if (!userId) {
        await new Promise((resolve) => window.setTimeout(resolve, 500));
        return { articleId : 6352 }
    }

    const response = await fetch('http://localhost:8080/articles', {
        method: 'POST',
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
    const contentImages = (imageInput.files[0] || [])
            .map(file => file.name);

    if (!title) {
        formError.textContent = '제목을 입력해주세요.';
        return;
    }
    
    submitButton.disabled = true;
    submitButton.setAttribute('aria-disabled', 'true');
    
    const articleData = {title, content, contentImages}
    const result = await createArticle(articleData);

    updateFormState();

    const articleId = result.data.articleId;
    window.setTimeout(() => {
        window.location.assign(`./detail.html?id=${encodeURIComponent(articleId)}`);
    }, 500);
});

updateFormState();