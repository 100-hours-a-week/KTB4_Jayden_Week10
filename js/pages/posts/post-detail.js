const articleView = document.querySelector('[data-article-view]');

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
const commentsSentinel = document.querySelector('[data-comments-sentinel]');

const formError = document.querySelector('.comment-form__error');
const loadingMore = document.querySelector('[data-comments-loading-more]');

let activeSlide = 0;
let editingComment = null;
let pendingDeleteComment = null;

let isFetching = false;
let hasNext = false;

let lastParentCommentId = null;
let lastCommentId = null;

let commentPageSize = 10;

const fallbackImageSrc = document.querySelector('[data-gallery-image]')?.dataset.fallbackSrc || '../../assets/images/empty-posts.svg';



function formatCount(value) {
    const count = Number(value);
    return count >= 1000 ? `${Math.floor(count / 1000)}k` : String(count);
}

function showGallerySlide(index) {}

async function loadArticle(params) {}

document.querySelector('[data-gallery-previous]').addEventListener('click', () => showGallerySlide(activeSlide - 1));
document.querySelector('[data-gallery-next]').addEventListener('click', () => showGallerySlide(activeSlide + 1));


likeButton.addEventListener('click', () => {});

commentForm.addEventListener('submit', (event) => {});



document.querySelector('[data-post-delete-open]').addEventListener('click', () => { 
    postDeleteModal.showModal(); 
    postDeleteModal.classList.add('is-active'); 
});
document.querySelector('[data-post-delete-confirm]').addEventListener('click', () => {
    window.location.assign('./list.html');
});
postDeleteModal.addEventListener('close', () => modal.classList.remove('is-active'));
































const updateCommentForm = () => {};





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

async function fetchComments({ reset = false } = {}) {}


commentInput.addEventListener('input', () => { 
    formError.hidden = true; 
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
loadArticle();