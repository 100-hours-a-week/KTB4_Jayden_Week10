import { PAGINATION } from '../../constants/pagination.js';
import { refreshAccessToken, authFetch } from '../../common/auth.js';
import { fetchArticlesRequest } from '../../common/fetch.js';

const feed = document.querySelector('.article-feed');
const list = document.querySelector('[data-list-content]');
const emptyMessage = document.querySelector('[data-empty]');
const errorMessage = document.querySelector('[data-error]');
const loadingMore = document.querySelector('[data-loading-more]');
const sentinel = document.querySelector('[data-scroll-sentinel]');
const articleCardTemplate = document.querySelector('[data-article-card-template]');

let isFetching = false;
let isFirstLoad = true;
let hasNext = true;
let lastArticleId = null;

const pageSize = PAGINATION.POST_PAGE_SIZE;
const scrollThreshold = PAGINATION.SCROLL_THRESHOLD;

const articleImageFieldNames = ['thumbnailImage', 'thumbnailUrl', 'imageUrl', 'contentImage', 'contentImageUrl','contentImageUrls', 'contentImages', 'articleImage', 'articleImageUrl', 'firstImage'];
const articleImageEvents = {
    load: 'load',
    error: 'error'
};

function getArticleImageSrc(article) {
    const imageValue = articleImageFieldNames.map(fieldName => article[fieldName]).find(Boolean);
    if (Array.isArray(imageValue)) return imageValue.find(Boolean) || '';
    return imageValue || '';
}

function setUiState(element, state, stateNames = ['is-loading', 'is-empty', 'is-error']) {
    element.classList.remove(...stateNames);
    if (state) element.classList.add(state);
    element.setAttribute('aria-busy', String(state === 'is-loading'));
}

function setState(state) {
    setUiState(feed, state);
    emptyMessage.hidden = state !== 'is-empty';
    errorMessage.hidden = state !== 'is-error';
}


function formatCount(value) {
    const count = Number(value);
    return count >= 1000 ? `${Math.floor(count / 1000)}k` : String(count);
}

function createArticleCard(article) {
    const title = article.title;
    const imageSrc = getArticleImageSrc(article);
    const card = document.createElement('article');
    const link = document.createElement('a');
    const media = document.createElement('figure');
    const postImage = document.createElement('img');
    const body = document.createElement('div');
    const heading = document.createElement('h3');
    const meta = document.createElement('div');
    const date = document.createElement('time');
    const footer = document.createElement('footer');
    const avatar = document.createElement('span');
    const author = document.createElement('strong');

    card.className = `article-card ${imageSrc ? 'has-image' : 'has-no-image'}`;
    card.dataset.articleCard = '';
    link.className = 'article-card__link';
    link.href = `./detail.html?id=${encodeURIComponent(article.articleId)}`;
    link.setAttribute('aria-label', `${title} 게시글 상세 보기`);

    media.className = 'article-card__media';
    media.dataset.articleMedia = '';

    postImage.className = 'article-card__image';
    postImage.dataset.articleImage = article.contentImageUrls;
    postImage.alt = `${title} 이미지`;
    postImage.addEventListener(articleImageEvents.error, () => {
        media.remove();
        card.classList.remove('has-image');
        card.classList.add('has-no-image');
    });
    if (imageSrc) {
        postImage.src = imageSrc;
        media.append(postImage);
    }

    body.className = 'article-card__body';

    heading.className = 'article-card__title';
    heading.title = title;
    heading.textContent = title;

    meta.className = 'article-card__meta';
    meta.append(`좋아요 ${formatCount(article.articleLikeCount)} | `, `댓글 ${formatCount(article.commentCount)} | `, `조회수 ${formatCount(article.articleViewCount)}`);
    date.textContent = String(article.createdAt).replace('T', ' ').slice(0, 19);
    meta.append(date);
    footer.className = 'article-card__author';
    avatar.className = 'avatar avatar--placeholder';
    avatar.setAttribute('aria-hidden', 'true');
    if (article.profileImageUrl) {
        const image = document.createElement('img');
        image.src = article.profileImageUrl;
        image.alt = '';
        image.addEventListener('error', () => image.remove());
        avatar.append(image);
    }
    author.textContent = article.nickname;
    body.append(heading, meta);
    footer.append(avatar, author);
    if (imageSrc) link.append(media);
    link.append(body, footer);
    card.append(link);
    return card;
}


async function fetchArticles() {
    if (!hasNext) return;

    isFetching = true;
    loadingMore.hidden = false;

    try {
        const appendLastArticleId = isFirstLoad ? '' : `&lastArticleId=${lastArticleId}`;
        const response = await fetchArticlesRequest(pageSize, appendLastArticleId);
        if (!response.ok) throw new Error('게시글 목록 조회 실패');

        const articles = await response.json();
        const articleArray = Array.isArray(articles.data) ? articles.data : [];

        if (articleArray.length === 0) {
            hasNext = false;
            
            if (isFirstLoad) {
                setState('is-empty');
            }
            return;
        }

        list.append(...articleArray.map(article => createArticleCard(article)));

        lastArticleId = articleArray[articleArray.length - 1].articleId;
        setState(null);

        isFirstLoad = false;
        hasNext = articleArray.length === pageSize;
        sentinel.hidden = !hasNext;
    } catch (error) {
        console.error(error);
        setState('is-error');
    } finally {
        isFetching = false;
        loadingMore.hidden = true;
    }
}

window.addEventListener('scroll', () => {
    if (isFetching) return;
    if (window.innerHeight + window.scrollY >= document.body.offsetHeight - scrollThreshold) {
        fetchArticles();
    }
});

async function initializePage() {
    try {
        await refreshAccessToken();
        await fetchArticles();
    } catch (error) {
        console.error(error);
        // window.location.replace("../auth/login.html");
    }
}

initializePage();
