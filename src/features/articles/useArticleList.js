import { useCallback } from 'react';
import { useCursorPagination } from '../../shared/hooks/useCursorPagination.js';
import { ARTICLE_PAGE_SIZE, getArticles } from './articleService.js';

const getArticleId = (article) => article.articleId;
const getArticleCursor = getArticleId;

export function useArticleList() {
  const fetchPage = useCallback(({ cursor, signal }) => getArticles({
    pageSize: ARTICLE_PAGE_SIZE,
    lastArticleId: cursor,
    signal,
  }), []);
  const pagination = useCursorPagination({
    fetchPage,
    getCursor: getArticleCursor,
    getItemId: getArticleId,
    pageSize: ARTICLE_PAGE_SIZE,
  });

  return {
    ...pagination,
    retry: pagination.reset,
  };
}
