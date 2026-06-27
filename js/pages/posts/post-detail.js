const articleView = document.querySelector('[data-article-view]');

const articleId = new URLSearchParams(window.location.search).get('id');
const apiBase = document.body.dataset.apiBase;

const title = document.querySelector('[data-article-title]');
const body = document.querySelector('[data-article-body]');

const likeButton = document.querySelector('[data-like-button]');
const likeCount = document.querySelector('[data-like-count]');
const viewCount = document.querySelector('[data-view-count]');
const commentCount = document.querySelector('[data-comment-count]');

const gallery = document.querySelector('[data-gallery]');
const galleryArrows = document.querySelectorAll('.gallery-arrow');
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

const formError = document.querySelector('.comment-form__error');
const loadingMore = document.querySelector('[data-comments-loading-more]');

let activeSlide = 0;
let editingComment = null;
let pendingDeleteComment = null;

let isFetching = false;
let hasNext = true;
let isFirstLoad = true;

let lastParentCommentId = null;
let lastCommentId = null;

let commentPageSize = 10;

const fallbackImageSrc = document.querySelector('[data-gallery-image]')?.dataset.fallbackSrc || '../../assets/images/empty-posts.svg';

const userId = document.body.dataset.userId || 6352;


/**
 * 게시글 상세 조회
 */

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
    image.dataset.galleyImage = '';
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
    const response = await fetch(`http://localhost:8080/articles/${articleId}`);
    const payload = await response.json();
    const article = payload.data;

    title.textContent = article.title;
    body.textContent = article.content;
    likeCount.dataset.count = String(article.articleLikeCount);
    likeCount.textContent = formatCount(likeCount.dataset.count);
    viewCount.dataset.count = String(article.articleViewCount);
    viewCount.textContent = formatCount(viewCount.dataset.count);
    commentCount.dataset.count = String(article.commentCount);
    commentCount.textContent = formatCount(commentCount.dataset.count);
    renderGallery(Array.isArray(article.contentImages) ? article.contentImages : []);
}

document.querySelector('[data-gallery-previous]').addEventListener('click', () => showGallerySlide(activeSlide - 1));
document.querySelector('[data-gallery-next]').addEventListener('click', () => showGallerySlide(activeSlide + 1));


likeButton.addEventListener('click', async () => {
    const likeOn = likeButton.getAttribute('aria-pressed') === 'true';
    const currentCount = Number(likeCount.dataset.count);
    const next = Math.max(0, currentCount + (likeOn ? -1 : 1));

    const response = likeOn ? await fetch(`http://localhost:8080/likes/articles/${articleId}/users/${userId}`, {
        method: 'DELETE'
    }) : 
        await fetch(`http://localhost:8080/likes/articles/${articleId}/users/${userId}`, {
            method: 'POST'
        });

    likeButton.setAttribute('aria-pressed', String(!likeOn));
    likeCount.dataset.count = String(next);
    likeCount.textContent = formatCount(next);
});


document.querySelector('[data-post-delete-open]').addEventListener('click', () => { 
    postDeleteModal.showModal(); 
    postDeleteModal.classList.add('is-active'); 
});
document.querySelector('[data-post-delete-confirm]').addEventListener('click', async () => {

    const response = await fetch(`http://localhost:8080/articles/${articleId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({userId})
    });
    window.location.assign('./list.html');
});

postDeleteModal.addEventListener('close', () => postDeleteModal.classList.remove('is-active'));


/**
 * 댓글
 */

commentForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const commentText = commentInput.value.trim();
    const parentCommentId = null;
    
    if (!commentText) return; 

    const response = await fetch(`http://localhost:8080/articles/${articleId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({userId, commentText, parentCommentId})
    });

    updateCommentForm();
});

function updateCommentForm() {
    const hasText = commentInput.value.trim() !== '';

    commentForm.classList.toggle('comment-form-valid', hasText);
    commentSubmit.disabled = !hasText;
    commentSubmit.classList.toggle('is-disabled', !hasText);
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
    item.dataset.commentId = comment.comment_id;
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

async function fetchComments({ reset = false } = {}) {
    if (!hasNext) return;

    isFetching = true;
    loadingMore.hidden = false;


    const lastCommentQuery = lastCommentId == null ? '' : `&lastCommentId=${lastCommentId}`;
    const lastParentCommentQuery = lastParentCommentId == null ? '' : `&lastParentCommentId=${lastParentCommentId}`;
    const response = await fetch(`http://localhost:8080/articles/${articleId}/comments?pageSize=${commentPageSize}${lastCommentQuery}${lastParentCommentQuery}`);
    const comments = await response.json();
    const commentArray = Array.isArray(comments.data) ? comments.data : [];

    if (commentArray.length === 0 && isFirstLoad) {
        setState('is-empty');
        return;
    }
    if (commentArray.length === 0 && isFirstLoad) {
        setState('is-empty');
        return;
    }

    commentList.append(...commentArray.map(comment => createComment(comment, {reply: Boolean(comment.parentCommentId)})));

    lastCommentId = commentArray[commentArray.length - 1].commentId;
    lastParentCommentId = commentArray[commentArray.length - 1].parentCommentId;
    setState(null);

    isFetching = false;
    isFirstLoad = false;
    hasNext = commentArray.length === commentPageSize;
    commentsSentinel.hidden = !hasNext;
    loadingMore.hidden = true;
}


commentInput.addEventListener('input', () => { 
    updateCommentForm(); 
});

commentForm.addEventListener('submit', (event) => {});


commentList.addEventListener('click', (event) => {});


document.querySelector('[data-comment-delete-confirm]').addEventListener('click', () => {});


commentDeleteModal.addEventListener('close', () => modal.classList.remove('is-active'));


window.addEventListener('scroll', () => {
    if (isFetching) return;
    if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 10) {
        fetchComments();
    }
});


updateCommentForm();
fetchArticle();
fetchComments();