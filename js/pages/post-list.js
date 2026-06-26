import { requestJson } from '../common/api.js';
import { setUiState } from '../common/ui-state.js';

const PAGE_SIZE = 10;
const feed = document.querySelector('.article-feed');
const list = document.querySelector('[data-list-content]');
const retryButton = document.querySelector('[data-retry]');
const emptyMessage = document.querySelector('[data-empty]');
const errorMessage = document.querySelector('[data-error]');
const loadingMore = document.querySelector('[data-loading-more]');
const sentinel = document.querySelector('[data-scroll-sentinel]');
let lastArticleId = null;
let isFetching = false;
let isLastPage = false;

function setState(state) {
  setUiState(feed, state);
  emptyMessage.hidden = state !== 'is-empty';
  errorMessage.hidden = state !== 'is-error';
}

function formatCount(value) {
  const count = Number(value) || 0;
  return count >= 1000 ? `${Math.floor(count / 1000)}k` : String(count);
}

function formatDate(value) {
  return value ? String(value).replace('T', ' ').slice(0, 19) : '-';
}

function truncateTitle(title) {
  const characters = Array.from(title || '제목 없음');
  return characters.length > 26 ? `${characters.slice(0, 26).join('')}…` : characters.join('');
}

function createArticleCard(article) {
  const title = article.title || '제목 없음';
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
  heading.textContent = truncateTitle(title);
  meta.className = 'article-card__meta';
  meta.append(`좋아요 ${formatCount(article.articleLikeCount)}`, `댓글 ${formatCount(article.commentCount)}`, `조회수 ${formatCount(article.articleViewCount)}`);
  date.dateTime = article.createdAt || '';
  date.textContent = formatDate(article.createdAt);
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
  author.textContent = article.nickname || article.userName || `사용자 ${article.userId ?? ''}`.trim();
  body.append(heading, meta);
  footer.append(avatar, author);
  link.append(body, footer);
  card.append(link);
  return card;
}

async function loadArticles({ reset = false } = {}) {
  if (isFetching || (!reset && isLastPage)) return;
  isFetching = true;
  if (reset) {
    lastArticleId = null;
    isLastPage = false;
    list.replaceChildren();
    setState('is-loading');
  } else {
    loadingMore.hidden = false;
  }
  try {
    const payload = await requestJson('/articles', { query: { lastArticleId, pageSize: PAGE_SIZE } });
    const articles = Array.isArray(payload.data) ? payload.data : [];
    if (reset && articles.length === 0) {
      setState('is-empty');
      return;
    }
    list.append(...articles.map(createArticleCard));
    lastArticleId = articles.at(-1)?.articleId ?? lastArticleId;
    isLastPage = articles.length < PAGE_SIZE;
    setState(null);
  } catch (error) {
    console.error('게시글 목록 요청에 실패했습니다.', error);
    setState('is-error');
  } finally {
    isFetching = false;
    loadingMore.hidden = true;
  }
}

retryButton.addEventListener('click', () => loadArticles({ reset: true }));
new IntersectionObserver(([entry]) => { if (entry.isIntersecting) loadArticles(); }, { rootMargin: '240px 0px' }).observe(sentinel);
loadArticles({ reset: true });
