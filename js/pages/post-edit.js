const postEditForm = document.querySelector('.post-edit-form');

if (postEditForm) {
  const titleField = document.querySelector('.post-edit-field--title');
  const contentField = document.querySelector('.post-edit-field--content');
  const titleInput = document.querySelector('#post-title');
  const contentInput = document.querySelector('#post-content');
  const imageInput = document.querySelector('#content-images');
  const imageGuide = document.querySelector('[data-image-guide]');
  const imageList = document.querySelector('[data-image-list]');
  const submitButton = document.querySelector('.post-edit-button');
  const submitLabel = document.querySelector('[data-submit-label]');
  const formError = document.querySelector('.post-edit-error');
  const successMessage = document.querySelector('.post-edit-success');
  const touched = { title: false, content: false };
  let previewUrls = [];

  function renderField(field, input, touchedField) {
    const valid = Boolean(input.value.trim());
    field.classList.remove('is-empty', 'is-filled', 'is-invalid', 'is-valid');
    if (input.value.trim()) field.classList.add('is-filled');
    else field.classList.add('is-empty');
    if (valid) field.classList.add('is-valid');
    else if (touchedField) field.classList.add('is-invalid');
    input.setAttribute('aria-invalid', String(!valid && touchedField));
    return valid;
  }

  function updateFormState() {
    const valid = renderField(titleField, titleInput, touched.title) && renderField(contentField, contentInput, touched.content);
    postEditForm.classList.toggle('is-valid', valid);
    submitButton.classList.toggle('is-disabled', !valid);
    submitButton.disabled = !valid;
    submitButton.setAttribute('aria-disabled', String(!valid));
  }

  function clearPreviews() {
    previewUrls.forEach((url) => URL.revokeObjectURL(url));
    previewUrls = [];
    imageList.querySelectorAll('[data-new-image]').forEach((item) => item.remove());
  }

  function renderSelectedImages() {
    clearPreviews();
    const files = Array.from(imageInput.files || []);
    if (!files.length) return;
    postEditForm.classList.remove('has-no-image');
    postEditForm.classList.add('has-image');
    imageGuide.textContent = `${files.length}개의 새 이미지가 선택되었습니다.`;
    files.forEach((file) => {
      const url = URL.createObjectURL(file);
      previewUrls.push(url);
      const item = document.createElement('li');
      const image = document.createElement('img');
      const name = document.createElement('small');
      item.dataset.newImage = '';
      image.src = url;
      image.alt = `${file.name} 미리보기`;
      name.textContent = file.name;
      item.append(image, name);
      imageList.append(item);
    });
  }

  async function updateArticle() {
    const articleId = document.body.dataset.articleId;
    const userId = document.body.dataset.userId;
    if (!articleId || !userId) {
      await new Promise((resolve) => window.setTimeout(resolve, 450));
      return { articleId: articleId || 1 };
    }
    const apiBase = document.body.dataset.apiBase || window.location.origin;
    const response = await fetch(new URL(`/articles/${encodeURIComponent(articleId)}`, apiBase), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ title: titleInput.value.trim(), content: contentInput.value.trim(), user_id: userId, content_image: [] }),
    });
    const payload = await response.json();
    if (!response.ok || payload.message !== 'article_create_success') throw new Error(payload.message || `HTTP ${response.status}`);
    return { articleId: payload.data?.article_id || articleId };
  }

  [[titleInput, titleField, 'title'], [contentInput, contentField, 'content']].forEach(([input, field, name]) => {
    input.addEventListener('focus', () => field.classList.add('is-focused'));
    input.addEventListener('blur', () => { field.classList.remove('is-focused'); touched[name] = true; updateFormState(); });
    input.addEventListener('input', () => { formError.hidden = true; postEditForm.classList.remove('is-error'); updateFormState(); });
  });
  imageInput.addEventListener('change', renderSelectedImages);

  postEditForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    touched.title = true; touched.content = true; updateFormState();
    const valid = Boolean(titleInput.value.trim() && contentInput.value.trim());
    if (!valid) { postEditForm.classList.add('is-error'); formError.hidden = false; return; }
    postEditForm.classList.remove('is-error', 'is-valid');
    postEditForm.classList.add('is-loading');
    submitButton.disabled = true;
    try {
      const result = await updateArticle();
      postEditForm.classList.remove('is-loading');
      postEditForm.classList.add('is-success');
      submitLabel.textContent = '성공';
      successMessage.hidden = false;
      window.setTimeout(() => window.location.assign(`./detail.html?id=${encodeURIComponent(result.articleId)}`), 500);
    } catch (error) {
      console.error('게시글 수정에 실패했습니다.', error);
      postEditForm.classList.remove('is-loading');
      postEditForm.classList.add('is-error');
      formError.textContent = '게시글을 수정하지 못했습니다. 잠시 후 다시 시도해주세요.';
      formError.hidden = false;
      updateFormState();
    }
  });
  updateFormState();
}
