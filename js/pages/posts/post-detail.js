import { refreshAccessToken } from '../../common/auth.js';
import { fetchArticleRequest, deleteArticleRequest, likeRequest, unlikeRequest, incrementViewCountRequest, createCommentRequest, fetchCommentsRequest, editCommentRequest, deleteCommentRequest} from '../../common/fetch.js';

const articleView = document.querySelector('[data-article-view]');

const articleId = new URLSearchParams(window.location.search).get('id');

const title = document.querySelector('[data-article-title]');
const body = document.querySelector('[data-article-body]');

const articleAvatar = document.querySelector('[data-article-avatar]');
const articleAuthor = document.querySelector('[data-article-author]');
const articleCreatedAt = document.querySelector('[data-article-created-at]');
const articleEdited = document.querySelector('[data-article-edited]');

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
const commentsSentinel = document.querySelector('[data-comments-sentinel]');
const commentEditTemplate = document.querySelector('[data-comment-edit-template]');

const formError = document.querySelector('.comment-form__error');
const loadingMore = document.querySelector('[data-comments-loading-more]');

let activeSlide = 0;
let editingComment = null;
let editingCommentId = null;
let editingCommentText = '';
let pendingDeleteComment = null;

let isFetching = false;
let hasNext = true;
let isFirstLoad = true;

let lastParentCommentId = null;
let lastCommentId = null;

let commentPageSize = 10;

const fallbackImageSrc = document.querySelector('[data-gallery-image]')?.dataset.fallbackSrc || '../../assets/images/empty-posts.svg';



/**
 * 게시글 상세 조회
 */

function setUiState(element, state, stateNames = ['is-loading', 'is-empty', 'is-error']) {
    element.classList.remove(...stateNames);
    if (state) element.classList.add(state);
    element.setAttribute('aria-busy', String(state === 'is-loading'));
}

function setState(state) {
    setUiState(commentMode, state);
    commentsEmpty.hidden = state !== 'is-empty';
    commentsError.hidden = state !== 'is-error';
}

function formatCount(value) {
    const count = Number(value);
    return count >= 1000 ? `${Math.floor(count / 1000)}k` : String(count);
}

function showGallerySlide(index) {
    if (!gallerySlides.length) return;
    activeSlide = (index + gallerySlides.length) % gallerySlides.length;
    gallerySlides.forEach((slide, slideIndex) => slide.classList.toggle('is-active', slideIndex === activeSlide));
}


function createGallerySlide(src, index) {
    const figure = document.createElement('figure');
    const image = document.createElement('img');
    image.className = 'gallery-image';
    image.src = src;
    image.alt = `게시글 이미지 ${index + 1}`;
    image.dataset.galleryImage = '';
    image.dataset.fallbackSrc = fallbackImageSrc;

    figure.className = `gallery-slide${index === 0 ? ' is-active' : ''}`;
    figure.dataset.gallerySlide = '';
    figure.append(image);
    return figure;
}


function renderGallery(images = []) {
    gallery.querySelectorAll('[data-gallery-slide]').forEach( slide => slide.remove());

    gallery.hidden = images.length === 0;
    gallery.classList.toggle('has-no-arrow', images.length <= 1);

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
}


async function fetchArticle() {
    const response = await fetchArticleRequest(articleId);
    const payload = await response.json();
    const article = payload.data;

    title.textContent = article.title;
    body.textContent = article.content;

    articleAvatar.className = 'avatar';
    if (article.profileImageUrl) {
        const image = document.createElement('img');
        image.src = article.profileImageUrl;
        image.alt = '';
        image.addEventListener('error', () => image.remove());
        articleAvatar.append(image);
    }

    articleAuthor.textContent = article.nickname || '더미 작성자';
    articleCreatedAt.textContent = String(article.createdAt).replace('T', ' ').slice(0, 19);
    articleEdited.hidden = !(article.updatedAt !== null);

    likeCount.dataset.count = String(article.articleLikeCount);
    likeCount.textContent = formatCount(likeCount.dataset.count);
    viewCount.dataset.count = String(article.articleViewCount);
    viewCount.textContent = formatCount(viewCount.dataset.count);
    commentCount.dataset.count = String(article.commentCount);
    commentCount.textContent = formatCount(commentCount.dataset.count);
    renderGallery(Array.isArray(article.contentImageUrls) ? article.contentImageUrls : []);
}

document.querySelector('[article-update-button]').addEventListener('click', () => {
    window.location.assign(`./edit.html?id=${articleId}`)
});

document.querySelector('[data-gallery-previous]').addEventListener('click', () => showGallerySlide(activeSlide - 1));
document.querySelector('[data-gallery-next]').addEventListener('click', () => showGallerySlide(activeSlide + 1));


likeButton.addEventListener('click', async () => {
    const likeOn = likeButton.getAttribute('aria-pressed') === 'true';
    const currentCount = Number(likeCount.dataset.count);
    const next = Math.max(0, currentCount + (likeOn ? -1 : 1));

    const response = likeOn ? await unlikeRequest(articleId) : 
        await likeRequest(articleId);

    likeButton.setAttribute('aria-pressed', String(!likeOn));
    likeCount.dataset.count = String(next);
    likeCount.textContent = formatCount(next);
});


document.querySelector('[data-post-delete-open]').addEventListener('click', () => { 
    postDeleteModal.showModal(); 
    postDeleteModal.classList.add('is-active'); 
});
document.querySelector('[data-post-delete-confirm]').addEventListener('click', async () => {

    const response = await deleteArticleRequest(articleId);
    window.location.assign('./list.html');
});

postDeleteModal.addEventListener('close', () => postDeleteModal.classList.remove('is-active'));

async function incrementViewCount() {
    const result = await incrementViewCountRequest(articleId);
}




/**
 * 댓글
 */

commentInput.addEventListener('input', () => { 
    updateCommentForm(); 
});

commentForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const commentText = commentInput.value.trim();
    const parentCommentId = null;
    
    if (!commentText) return; 

    const response = await createCommentRequest(articleId, commentText, parentCommentId);

    updateCommentForm();
});

function updateCommentForm() {
    const hasText = commentInput.value.trim() !== '';

    commentForm.classList.toggle('comment-form-valid', hasText);
    commentSubmit.disabled = !hasText;
    commentSubmit.classList.toggle('is-disabled', !hasText);
}


function createCommentEditForm(comment) {
    const editForm = commentEditTemplate.content.firstElementChild.cloneNode(true);
    const editLabel = editForm.querySelector('[data-comment-edit-label]');
    const editInput = editForm.querySelector('[data-comment-edit-input]');
    const editInputId = `comment-edit-input-${comment.commentId}`;

    editLabel.setAttribute('for', editInputId);
    editInput.id = editInputId;
    editInput.value = comment.commentText || '';

    return editForm;
}


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
    item.dataset.commentId = comment.commentId;
    
    if (comment.parentCommentId) item.dataset.parentCommentId = comment.parentCommentId;
    
    avatar.className = 'avatar';
    if (comment.profileImageUrl) {
        const image = document.createElement('img');
        image.src = comment.profileImageUrl;
        image.alt = '';
        image.addEventListener('error', () => image.remove());
        avatar.append(image);
    }
    // avatar.setAttribute('aria-hidden', 'true');
    
    author.textContent = comment.nickname || '더미 작성자';
    
    time.dateTime = comment.createdAt || '';
    time.textContent = String(comment.createdAt).replace('T', ' ').slice(0, 19);
    
    actions.className = 'comment-item__actions';
    
    edit.type = 'button'; 
    edit.textContent = '수정'; 
    edit.dataset.commentEdit = '';

    remove.type = 'button'; 
    remove.textContent = '삭제'; 
    remove.dataset.commentDeleteOpen = '';

    text.dataset.commentText = '';
    text.textContent = comment.deletedAt ? '삭제된 댓글입니다.' : comment.commentText;

    if (comment.deletedAt) { 
        item.classList.add('is-deleted'); actions.remove(); 
    } else actions.append(edit, remove);

    header.append(avatar, author, time, actions);
    article.append(header, text);
    if (!comment.deletedAt) article.append(createCommentEditForm(comment));
    item.append(article);

    return item;
};

async function fetchComments({ reset = false } = {}) {
    if (!hasNext || isFetching) return;

    isFetching = true;
    loadingMore.hidden = false;

    try {
        const lastCommentQuery = lastCommentId == null ? '' : `&lastCommentId=${lastCommentId}`;
        const lastParentCommentQuery = lastParentCommentId == null ? '' : `&lastParentCommentId=${lastParentCommentId}`;
        const response = await fetchCommentsRequest(articleId, commentPageSize, lastCommentQuery, lastParentCommentQuery);
        const comments = await response.json();
        const commentArray = Array.isArray(comments.data) ? comments.data : [];

        if (commentArray.length === 0) {
            hasNext = false;

            if (isFirstLoad) {
                setState('is-empty');
            }
            return;
        }

        commentList.append(...commentArray.map(comment => createComment(comment, {reply: Boolean(comment.parentCommentId)})));

        lastCommentId = commentArray[commentArray.length - 1].commentId;
        lastParentCommentId = commentArray[commentArray.length - 1].parentCommentId;
        setState(null);

        isFirstLoad = false;
        hasNext = commentArray.length === commentPageSize;
        commentsSentinel.hidden = !hasNext;
    } catch (error) {
        console.error(error);
        setState('is-error');
    } finally {
        isFetching = false;
        loadingMore.hidden = true;
    }
}

commentList.addEventListener('click', (event) => {
    const item = event.target.closest('.comment-item');
    if (!item) return;

    if (event.target.matches('[data-comment-edit]')) {
        const editInput = item.querySelector('[data-comment-edit-input]');

        if (editingComment && editingComment !== item) {
            editingComment.classList.remove('is-editing');
        }

        editingComment = item;
        editingCommentId = item.dataset.commentId;
        editingCommentText = item.querySelector('[data-comment-text]')?.textContent.trim() || '';

        editInput.value = editingCommentText;
        item.classList.add('is-editing');
        editInput.focus();
    }

    if (event.target.matches('[data-comment-edit-cancel]')) {
        const editInput = item.querySelector('[data-comment-edit-input]');

        editInput.value = item.querySelector('[data-comment-text]')?.textContent.trim() || '';
        item.classList.remove('is-editing');
        editingComment = null;
        editingCommentId = null;
        editingCommentText = '';
    }

    if (event.target.matches('[data-comment-delete-open]')) {
        pendingDeleteComment = item;

        commentDeleteModal.showModal();
        commentDeleteModal.classList.add('is-active');
    }
});

commentList.addEventListener('submit', async (event) => {
    if (!event.target.matches('[data-comment-edit-form]')) return;
    event.preventDefault();

    const editForm = event.target;
    const item = editForm.closest('.comment-item');
    const editInput = editForm.querySelector('[data-comment-edit-input]');
    const editError = editForm.querySelector('[data-comment-edit-error]');
    const commentId = item.dataset.commentId;
    const nextCommentText = editInput.value.trim();

    editError.hidden = true;
    const response = await editCommentRequest(articleId, commentId, nextCommentText);
});

document.querySelector('[data-comment-delete-confirm]').addEventListener('click', async (event) => {
    const commentId = pendingDeleteComment.dataset.commentId;
    const response = await deleteCommentRequest(articleId, commentId);
});

commentDeleteModal.addEventListener('close', () => commentDeleteModal.classList.remove('is-active'));


window.addEventListener('scroll', () => {
    if (isFetching) return;
    if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 10) {
        fetchComments();
    }
});

async function initializePage() {
    try {
        await refreshAccessToken();
        await fetchArticle();
        await fetchComments();

        updateCommentForm();
        incrementViewCount();
    } catch (error) {
        console.error(error);
        // window.location.replace("../auth/login.html");
    }
}

initializePage();