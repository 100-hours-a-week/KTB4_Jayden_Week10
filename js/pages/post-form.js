const postCreateForm = document.querySelector('.post-create-form');

if (postCreateForm) {
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

  function getResult(input) {
    return { valid: Boolean(input.value.trim()) };
  }

  function renderField(field, input, hasBeenTouched) {
    const result = getResult(input);
    field.classList.remove('is-empty', 'is-filled', 'is-invalid', 'is-valid');
    input.setAttribute('aria-invalid', 'false');
    if (input.value.trim()) field.classList.add('is-filled');
    else field.classList.add('is-empty');

    if (result.valid) {
      field.classList.add('is-valid');
    } else if (hasBeenTouched) {
      field.classList.add('is-invalid');
      input.setAttribute('aria-invalid', 'true');
    }
    return result.valid;
  }

  function updateFormState() {
    const titleValid = renderField(titleField, titleInput, touched.title);
    const contentValid = renderField(contentField, contentInput, touched.content);
    const isValid = titleValid && contentValid;
    postCreateForm.classList.toggle('is-empty', !titleInput.value.trim() && !contentInput.value.trim());
    postCreateForm.classList.toggle('is-valid', isValid && !isLimited);
    submitButton.classList.toggle('is-disabled', !isValid || isLimited);
    submitButton.disabled = !isValid || isLimited;
    submitButton.setAttribute('aria-disabled', String(!isValid || isLimited));
  }

  function clearImagePreviews() {
    previewUrls.forEach((url) => URL.revokeObjectURL(url));
    previewUrls = [];
    imagePreviewList.replaceChildren();
  }

  function renderImagePreviews() {
    clearImagePreviews();
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
  }

  async function createArticle() {
    const userId = document.body.dataset.userId;
    if (!userId) {
      await new Promise((resolve) => window.setTimeout(resolve, 450));
      return { articleId: 1 };
    }

    const apiBase = document.body.dataset.apiBase || window.location.origin;
    // 이미지 업로드 API가 제공되면 선택한 파일을 먼저 업로드해 URL 배열을 content_image에 넣습니다.
    const response = await fetch(new URL('/articles', apiBase), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        title: titleInput.value.trim(),
        content: contentInput.value.trim(),
        user_id: userId,
        content_image: [],
      }),
    });
    const payload = await response.json();
    if (payload.message?.includes('1분 내 글 3개')) return { limited: true };
    if (!response.ok || payload.message !== 'article_create_success') throw new Error(payload.message || `HTTP ${response.status}`);
    return { articleId: payload.data?.article_id };
  }

  function showLimitedState() {
    isLimited = true;
    postCreateForm.classList.remove('is-loading', 'is-valid');
    postCreateForm.classList.add('is-limited');
    limitedMessage.hidden = false;
    submitButton.disabled = true;
    submitButton.setAttribute('aria-disabled', 'true');
  }

  [
    [titleInput, titleField, 'title'],
    [contentInput, contentField, 'content'],
  ].forEach(([input, field, name]) => {
    input.addEventListener('focus', () => field.classList.add('is-focused'));
    input.addEventListener('blur', () => {
      field.classList.remove('is-focused');
      touched[name] = true;
      updateFormState();
    });
    input.addEventListener('input', () => {
      postCreateForm.classList.remove('is-error');
      formError.hidden = true;
      formError.textContent = '*제목,내용을 모두 작성해주세요.';
      updateFormState();
    });
  });

  imageInput.addEventListener('change', renderImagePreviews);

  postCreateForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (isLimited) return;
    touched.title = true;
    touched.content = true;
    updateFormState();
    const isValid = Boolean(titleInput.value.trim() && contentInput.value.trim());

    if (!isValid) {
      postCreateForm.classList.add('is-error');
      formError.hidden = false;
      return;
    }

    postCreateForm.classList.remove('is-error', 'is-valid');
    postCreateForm.classList.add('is-loading');
    submitButton.disabled = true;
    submitButton.setAttribute('aria-disabled', 'true');

    try {
      const result = await createArticle();
      if (result.limited) {
        showLimitedState();
        return;
      }
      postCreateForm.classList.remove('is-loading');
      postCreateForm.classList.add('is-success');
      submitLabel.textContent = '성공';
      successMessage.hidden = false;
      const articleId = result.articleId || 1;
      window.setTimeout(() => window.location.assign(`./detail.html?id=${encodeURIComponent(articleId)}`), 500);
    } catch (error) {
      console.error('게시글 작성에 실패했습니다.', error);
      postCreateForm.classList.remove('is-loading');
      postCreateForm.classList.add('is-error');
      formError.textContent = '게시글을 작성하지 못했습니다. 잠시 후 다시 시도해주세요.';
      formError.hidden = false;
      updateFormState();
    }
  });

  updateFormState();
}
