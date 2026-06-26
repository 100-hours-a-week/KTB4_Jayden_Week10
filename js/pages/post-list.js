

const feed = document.querySelector('.article-feed');
const list = document.querySelector('[data-list-content]');
const retryButton = document.querySelector('[data-retry]');
const emptyMessage = document.querySelector('[data-empty]');
const errorMessage = document.querySelector('[data-error]');
const loadingMore = document.querySelector('[data-loading-more]');
const sentinel = document.querySelector('[data-scroll-sentinel]');

let isLoading = false;
let isFirstLoad = true;
let hasNext = true;
let lastArticleId = null;

const pageSize = 10;

function formatCount(value) {
    const count = Number(value);
    return count >= 1000 ? `${Math.floor(count / 1000)}k` : String(count);
}


async function fetchArticles() {
    const response = await fetch(`http://localhost:8080/articles?pageSize=${pageSize}&lastArticleId=${lastArticleId}`);
    const articles = await response.json();
    articles.forEach(article => {
        list.get
    })
}

fetchArticles();