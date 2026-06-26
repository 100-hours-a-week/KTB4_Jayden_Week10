const articleView = document.querySelector('[data-article-view]');

if (articleView) {
  const articleId = document.body.dataset.articleId || new URLSearchParams(window.location.search).get('id') || '1';
  const apiBase = document.body.dataset.apiBase;
  const title = document.querySelector('[data-article-title]');
  const body = document.querySelector('[data-article-body]');
  const likeButton = document.querySelector('[data-like-button]');
  const likeCount = document.querySelector('[data-like-count]');
  const viewCount = document.querySelector('[data-view-count]');
  const commentCount = document.querySelector('[data-comment-count]');
  const gallery = document.querySelector('[data-gallery]');
  let gallerySlides = [...document.querySelectorAll('[data-gallery-slide]')];
  const postDeleteModal = document.querySelector('#post-delete-modal');
  const commentDeleteModal = document.querySelector('#comment-delete-modal');
  const commentForm = document.querySelector('[data-comment-form]');
  const commentInput = document.querySelector('[data-comment-input]');
  const commentSubmit = document.querySelector('[data-comment-submit]');
  const commentMode = document.querySelector('[data-comment-mode]');
  const commentList = document.querySelector('[data-comment-list]');
  const commentsSection = document.querySelector('[data-comments-section]');
  const commentsEmpty = document.querySelector('[data-comments-empty]');
  const commentsError = document.querySelector('[data-comments-error]');
  const loadingMore = document.querySelector('[data-comments-loading-more]');
  const commentsSentinel = document.querySelector('[data-comments-sentinel]');
  const formError = document.querySelector('.comment-form__error');
  let activeSlide = 0;
  let editingComment = null;
  let pendingDeleteComment = null;
  let isLoadingComments = false;
  let isLastCommentPage = false;
  let lastParentCommentId = null;
  let lastCommentId = null;
  const fallbackImageSrc = document.querySelector('[data-gallery-image]')?.dataset.fallbackSrc || '../../assets/images/empty-posts.svg';

  const formatCount = (value) => {
    const count = Number(value) || 0;
    return count >= 1000 ? `${Math.floor(count / 1000)}k` : String(count);
  };

  const setArticleState = (state) => {
    articleView.classList.remove('is-loading', 'is-error', 'is-not-found');
    articleView.classList.add(state);
    document.querySelector('[data-article-error]').hidden = state !== 'is-error';
    document.querySelector('[data-article-not-found]').hidden = state !== 'is-not-found';
  };

  const updateCommentCount = (delta) => {
    const next = Math.max(0, (Number(commentCount.dataset.count || commentCount.textContent) || 0) + delta);
    commentCount.dataset.count = String(next);
    commentCount.textContent = formatCount(next);
  };

  const updateCommentForm = () => {
    const isValid = Boolean(commentInput.value.trim());
    commentForm.classList.toggle('comment-form-empty', !isValid);
    commentForm.classList.toggle('comment-form-valid', isValid);
    commentSubmit.disabled = !isValid;
    commentSubmit.classList.toggle('is-disabled', !isValid);
    commentSubmit.setAttribute('aria-disabled', String(!isValid));
  };

  const showGallerySlide = (index) => {
    if (!gallerySlides.length) return;
    activeSlide = (index + gallerySlides.length) % gallerySlides.length;
    gallerySlides.forEach((slide, slideIndex) => slide.classList.toggle('is-active', slideIndex === activeSlide));
  };

  const bindImageFallback = (image) => {
    image.addEventListener('error', () => {
      if (image.src.endsWith(fallbackImageSrc)) return;
      image.src = fallbackImageSrc;
    }, { once: true });
  };

  const createGallerySlide = (src, index) => {
    const figure = document.createElement('figure');
    const image = document.createElement('img');
    figure.className = `gallery-slide${index === 0 ? ' is-active' : ''}`;
    figure.dataset.gallerySlide = '';
    image.className = 'gallery-image';
    image.src = src;
    image.alt = `게시글 이미지 ${index + 1}`;
    image.dataset.galleryImage = '';
    image.dataset.fallbackSrc = fallbackImageSrc;
    bindImageFallback(image);
    figure.append(image);
    return figure;
  };

  const renderGallery = (images = []) => {
    gallery.querySelectorAll('[data-gallery-slide]').forEach((slide) => slide.remove());
    const nextImages = images.filter(Boolean);
    if (!nextImages.length) {
      gallerySlides = [];
      document.querySelector('[data-gallery-previous]').hidden = true;
      document.querySelector('[data-gallery-next]').hidden = true;
      return;
    }
    document.querySelector('[data-gallery-next]').before(...nextImages.map(createGallerySlide));
    gallerySlides = [...document.querySelectorAll('[data-gallery-slide]')];
    activeSlide = 0;
    showGallerySlide(0);
    const hasMultipleImages = gallerySlides.length > 1;
    document.querySelector('[data-gallery-previous]').hidden = !hasMultipleImages;
    document.querySelector('[data-gallery-next]').hidden = !hasMultipleImages;
  };

  const createComment = (comment, { reply = false } = {}) => {
    const item = document.createElement('li');
    const article = document.createElement('article');
    const header = document.createElement('header');
    const avatar = document.createElement('span');
    const author = document.createElement('strong');
    const time = document.createElement('time');
    const actions = document.createElement('div');
    const edit = document.createElement('button');
    const remove = document.createElement('button');
    const text = document.createElement('p');
    item.className = `comment-item${reply ? ' is-reply' : ''}`;
    item.dataset.commentId = comment.comment_id || crypto.randomUUID();
    if (comment.parent_comment_id) item.dataset.parentCommentId = comment.parent_comment_id;
    avatar.className = 'avatar';
    avatar.setAttribute('aria-hidden', 'true');
    author.textContent = comment.nickname || `사용자 ${comment.user_id || ''}`.trim() || '더미 작성자';
    time.dateTime = comment.created_at || '';
    time.textContent = String(comment.created_at || new Date().toISOString()).replace('T', ' ').slice(0, 19);
    actions.className = 'comment-item__actions';
    edit.type = 'button'; edit.textContent = '수정'; edit.dataset.commentEdit = '';
    remove.type = 'button'; remove.textContent = '삭제'; remove.dataset.commentDeleteOpen = '';
    text.dataset.commentText = '';
    text.textContent = comment.deleted_at ? '삭제된 댓글입니다.' : comment.comment;
    if (comment.deleted_at) { item.classList.add('is-deleted'); actions.remove(); }
    else actions.append(edit, remove);
    header.append(avatar, author, time, actions);
    article.append(header, text);
    item.append(article);
    return item;
  };

  const refreshEmptyMessage = () => { commentsEmpty.hidden = commentList.children.length !== 0; };

  const loadComments = async ({ reset = false } = {}) => {
    if (!apiBase || isLoadingComments || (!reset && isLastCommentPage)) return;
    isLoadingComments = true;
    commentsSection.classList.remove('comments-error');
    commentsError.hidden = true;
    if (reset) { commentList.replaceChildren(); lastParentCommentId = null; lastCommentId = null; isLastCommentPage = false; }
    else loadingMore.hidden = false;
    try {
      const url = new URL(`/articles/${encodeURIComponent(articleId)}/comments`, apiBase);
      url.searchParams.set('page_size', '10');
      if (lastParentCommentId) url.searchParams.set('last_parent_comment_id', lastParentCommentId);
      if (lastCommentId) url.searchParams.set('last_comment_id', lastCommentId);
      const response = await fetch(url, { headers: { Accept: 'application/json' } });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const payload = await response.json();
      const comments = Array.isArray(payload.data?.comments) ? payload.data.comments : [];
      commentList.append(...comments.map((comment) => createComment(comment, { reply: Boolean(comment.parent_comment_id) })));
      const last = comments.at(-1);
      lastParentCommentId = last?.parent_comment_id ?? lastParentCommentId;
      lastCommentId = last?.comment_id ?? lastCommentId;
      isLastCommentPage = comments.length < 10;
      refreshEmptyMessage();
    } catch (error) {
      console.error('댓글 조회에 실패했습니다.', error);
      commentsSection.classList.add('comments-error');
      commentsError.hidden = false;
    } finally {
      isLoadingComments = false;
      loadingMore.hidden = true;
    }
  };

  const loadArticle = async () => {
    if (!apiBase) return;
    setArticleState('is-loading');
    try {
      const response = await fetch(new URL(`/articles/${encodeURIComponent(articleId)}`, apiBase), { headers: { Accept: 'application/json' } });
      if (response.status === 404) { setArticleState('is-not-found'); return; }
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const payload = await response.json();
      const article = payload.data;
      title.textContent = article.title;
      body.replaceChildren(...String(article.content || '').split('\n').map((line) => { const paragraph = document.createElement('p'); paragraph.textContent = line; return paragraph; }));
      likeCount.dataset.count = String(article.article_like_count || 0);
      likeCount.textContent = formatCount(article.article_like_count);
      viewCount.textContent = formatCount(article.article_view_count);
      commentCount.dataset.count = String(article.comment_count || 0);
      commentCount.textContent = formatCount(article.comment_count);
      articleView.classList.toggle('has-image', Boolean(article.content_image?.length));
      articleView.classList.toggle('has-no-image', !article.content_image?.length);
      renderGallery(Array.isArray(article.content_image) ? article.content_image : []);
      articleView.classList.remove('is-loading');
      loadComments({ reset: true });
    } catch (error) {
      console.error('게시글 조회에 실패했습니다.', error);
      setArticleState('is-error');
    }
  };

  likeButton.addEventListener('click', () => {
    const isLiked = likeButton.getAttribute('aria-pressed') === 'true';
    const current = Number(likeCount.dataset.count || likeCount.textContent) || 0;
    const next = Math.max(0, current + (isLiked ? -1 : 1));
    likeButton.setAttribute('aria-pressed', String(!isLiked));
    likeCount.dataset.count = String(next);
    likeCount.textContent = formatCount(next);
  });
  document.querySelector('[data-gallery-previous]').addEventListener('click', () => showGallerySlide(activeSlide - 1));
  document.querySelector('[data-gallery-next]').addEventListener('click', () => showGallerySlide(activeSlide + 1));
  commentInput.addEventListener('input', () => { formError.hidden = true; updateCommentForm(); });

  commentForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const text = commentInput.value.trim();
    if (!text) return;
    commentForm.classList.add('comment-submitting');
    commentSubmit.disabled = true;
    commentSubmit.textContent = editingComment ? '수정 중...' : '등록 중...';
    window.setTimeout(() => {
      if (editingComment) {
        editingComment.querySelector('[data-comment-text]').textContent = text;
        editingComment = null;
      } else {
        commentList.prepend(createComment({ comment: text, user_id: 1, created_at: new Date().toISOString() }));
        updateCommentCount(1);
      }
      commentInput.value = '';
      commentMode.textContent = '댓글 등록';
      commentSubmit.textContent = '댓글 등록';
      commentForm.classList.remove('comment-submitting');
      refreshEmptyMessage();
      updateCommentForm();
    }, 280);
  });

  commentList.addEventListener('click', (event) => {
    const item = event.target.closest('.comment-item');
    if (!item) return;
    if (event.target.matches('[data-comment-edit]')) {
      editingComment = item;
      commentInput.value = item.querySelector('[data-comment-text]').textContent;
      commentMode.textContent = '댓글 수정';
      commentSubmit.textContent = '댓글 수정';
      commentInput.focus();
      updateCommentForm();
    }
    if (event.target.matches('[data-comment-delete-open]')) {
      pendingDeleteComment = item;
      commentDeleteModal.showModal();
      commentDeleteModal.classList.add('is-active');
    }
  });

  document.querySelector('[data-post-delete-open]').addEventListener('click', () => { postDeleteModal.showModal(); postDeleteModal.classList.add('is-active'); });
  document.querySelector('[data-post-delete-confirm]').addEventListener('click', () => window.location.assign('./list.html'));
  document.querySelector('[data-comment-delete-confirm]').addEventListener('click', () => {
    if (!pendingDeleteComment) return;
    const hasReplies = commentList.querySelector(`[data-parent-comment-id="${pendingDeleteComment.dataset.commentId}"]`);
    if (hasReplies) {
      pendingDeleteComment.classList.add('is-deleted');
      pendingDeleteComment.querySelector('[data-comment-text]').textContent = '댓글이 삭제되었습니다.';
      pendingDeleteComment.querySelector('.comment-item__actions')?.remove();
    } else {
      pendingDeleteComment.remove();
    }
    updateCommentCount(-1);
    refreshEmptyMessage();
    pendingDeleteComment = null;
  });
  [postDeleteModal, commentDeleteModal].forEach((modal) => modal.addEventListener('close', () => modal.classList.remove('is-active')));
  document.querySelectorAll('[data-gallery-image]').forEach(bindImageFallback);
  document.querySelector('[data-article-retry]').addEventListener('click', loadArticle);
  document.querySelector('[data-comments-retry]').addEventListener('click', () => loadComments({ reset: true }));
  new IntersectionObserver(([entry]) => { if (entry.isIntersecting) loadComments(); }, { rootMargin: '240px 0px' }).observe(commentsSentinel);

  updateCommentForm();
  refreshEmptyMessage();
  loadArticle();
}
