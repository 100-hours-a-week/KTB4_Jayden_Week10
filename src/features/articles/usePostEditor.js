import { useCallback, useEffect, useRef, useState } from 'react';
import { ApiError } from '../../shared/api/ApiError.js';
import { getArticle, updateArticle } from './articleService.js';

export function usePostEditor(articleId) {
  const [article, setArticle] = useState(null);
  const [status, setStatus] = useState(articleId ? 'loading' : 'not-found');
  const [error, setError] = useState(null);
  const controllerRef = useRef(null);

  const loadArticle = useCallback(async () => {
    if (!articleId) {
      setStatus('not-found');
      return;
    }
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    setStatus('loading');
    setError(null);
    try {
      setArticle(await getArticle(articleId, { signal: controller.signal }));
      setStatus('success');
    } catch (requestError) {
      if (requestError?.name === 'AbortError') return;
      if (requestError instanceof ApiError && requestError.status === 404) {
        setStatus('not-found');
      } else {
        setError(requestError);
        setStatus('error');
      }
    }
  }, [articleId]);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadArticle(), 0);
    return () => {
      window.clearTimeout(timer);
      controllerRef.current?.abort();
    };
  }, [loadArticle]);

  const saveArticle = useCallback(
    (articleData) => updateArticle(articleId, articleData),
    [articleId],
  );

  return { article, status, error, retry: loadArticle, saveArticle };
}
