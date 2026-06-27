

const feed = document.querySelector('.article-feed');
const list = document.querySelector('[data-list-content]');
const retryButton = document.querySelector('[data-retry]');
const emptyMessage = document.querySelector('[data-empty]');
const errorMessage = document.querySelector('[data-error]');
const loadingMore = document.querySelector('[data-loading-more]');
const sentinel = document.querySelector('[data-scroll-sentinel]');

let isFetching = false;
let isFirstLoad = true;
let hasNext = true;
let lastArticleId = null;

const pageSize = 10;

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
    const card = document.createElement('article');
    const link = document.createElement('a');
    const body = document.createElement('div');
    const heading = document.createElement('h3');
    const meta = document.createElement('div');
    const date = document.createElement('time');
    const footer = document.createElement('footer');
    const avatar = document.createElement('span');
    const author = document.createElement('strong');

    card.className = 'article-card';
    link.className = 'article-card__link';
    link.href = `./detail.html?id=${encodeURIComponent(article.articleId)}`;
    link.setAttribute('aria-label', `${title} 게시글 상세 보기`);
    body.className = 'article-card__body';
    heading.className = 'article-card__title';
    heading.title = title;
    heading.textContent = title;
    meta.className = 'article-card__meta';
    meta.append(`좋아요 ${formatCount(article.articleLikeCount)} | `, `댓글 ${formatCount(article.commentCount)} | `, `조회수 ${formatCount(article.articleViewCount)}`);
    date.dateTime = article.createdAt || '';
    date.textContent = article.createdAt;
    meta.append(date);
    footer.className = 'article-card__author';
    avatar.className = 'avatar avatar--placeholder';
    avatar.setAttribute('aria-hidden', 'true');
    if (article.profile_image) {
        const image = document.createElement('img');
        image.src = article.profile_image;
        image.alt = '';
        image.addEventListener('error', () => image.remove());
        avatar.append(image);
    }
    author.textContent = article.nickname || `사용자 ${article.userId ?? ''}`.trim();
    body.append(heading, meta);
    footer.append(avatar, author);
    link.append(body, footer);
    card.append(link);
    return card;
}


async function fetchArticles() {
    if (!hasNext) return;

    isFetching = true;
    loadingMore.hidden = false;

    const appendLastArticleId = isFirstLoad ? '' : `&lastArticleId=${lastArticleId}`;
    const response = await fetch(`http://localhost:8080/articles?pageSize=${pageSize}${appendLastArticleId}`);
    const articles = await response.json();
    const articleArray = Array.isArray(articles.data) ? articles.data : [];

    if (articleArray.length === 0 && isFirstLoad) {
        setState('is-empty');
        return;
    }
    if (articleArray.length === 0 && !isFirstLoad) {
        setState('is-empty');
        return;
    }

    list.append(...articleArray.map(article => createArticleCard(article)));

    lastArticleId = articleArray[articleArray.length - 1].articleId;
    setState(null);

    isFetching = false;
    isFirstLoad = false;
    hasNext = articleArray.length === pageSize;
    sentinel.hidden = !hasNext;
    loadingMore.hidden = true;
};

window.addEventListener('scroll', () => {
    if (isFetching) return;
    if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 10) {
        fetchArticles();
    }
});

fetchArticles();