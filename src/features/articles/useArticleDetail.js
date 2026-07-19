import { useCallback, useEffect, useRef, useState } from 'react';
import { ApiError } from '../../shared/api/ApiError.js';
import {
  addArticleLike,
  getArticle,
  incrementArticleView,
  removeArticleLike,
} from './articleService.js';

export function useArticleDetail(articleId) {
  const [article, setArticle] = useState(null);
  const [status, setStatus] = useState(articleId ? 'loading' : 'not-found');
  const [error, setError] = useState(null);
  const [isLikePending, setIsLikePending] = useState(false);
  const [likeError, setLikeError] = useState(null);
  const [likeTargetArticleId, setLikeTargetArticleId] = useState(null);
  const requestControllerRef = useRef(null);
  const likePendingRef = useRef(false);
  const likeRequestIdRef = useRef(0);
  const likeTargetArticleIdRef = useRef(null);
  const viewedArticleIdRef = useRef(null);

  const loadArticle = useCallback(async () => {
    if (!articleId) {
      setStatus('not-found');
      return;
    }

    requestControllerRef.current?.abort();
    requestControllerRef.current = new AbortController();
    setStatus('loading');
    setError(null);

    try {
      const nextArticle = await getArticle(articleId, {
        signal: requestControllerRef.current.signal,
      });
      setArticle(nextArticle);
      setLikeError(null);
      setStatus('success');
    } catch (requestError) {
      if (requestError?.name === 'AbortError') return;
      setArticle(null);
      if (requestError instanceof ApiError && requestError.status === 404) {
        setStatus('not-found');
      } else {
        setError(requestError);
        setStatus('error');
      }
    }
  }, [articleId]);

  useEffect(() => {
    const initialLoadTimer = window.setTimeout(() => void loadArticle(), 0);
    return () => {
      window.clearTimeout(initialLoadTimer);
      requestControllerRef.current?.abort();
    };
  }, [loadArticle]);

  useEffect(() => {
    if (status !== 'success' || !article || String(article.articleId) !== String(articleId)) return;
    if (String(viewedArticleIdRef.current) === String(articleId)) return;

    viewedArticleIdRef.current = articleId;
    void incrementArticleView(articleId)
      .then((statusCode) => {
        if (statusCode !== 201) return;
        setArticle((currentArticle) => currentArticle && String(currentArticle.articleId) === String(articleId) ? {
          ...currentArticle,
          viewCount: currentArticle.viewCount + 1,
        } : currentArticle);
      })
      .catch(() => {
        viewedArticleIdRef.current = null;
      });
  }, [article, articleId, status]);

  const adjustCommentCount = useCallback((delta) => {
    setArticle((currentArticle) => currentArticle ? {
      ...currentArticle,
      commentCount: Math.max(0, currentArticle.commentCount + delta),
    } : currentArticle);
  }, []);

  const toggleLike = useCallback(async () => {
    if ((likePendingRef.current && String(likeTargetArticleIdRef.current) === String(articleId)) || !article) return;
    const targetArticleId = articleId;
    const likeRequestId = likeRequestIdRef.current + 1;
    likeRequestIdRef.current = likeRequestId;
    likeTargetArticleIdRef.current = targetArticleId;
    setLikeTargetArticleId(targetArticleId);
    likePendingRef.current = true;
    setIsLikePending(true);
    setLikeError(null);
    const wasLiked = article.likedByMe;
    try {
      if (wasLiked) await removeArticleLike(targetArticleId);
      else await addArticleLike(targetArticleId);
      setArticle((currentArticle) => currentArticle && String(currentArticle.articleId) === String(targetArticleId) ? {
        ...currentArticle,
        likedByMe: !wasLiked,
        likeCount: Math.max(0, currentArticle.likeCount + (wasLiked ? -1 : 1)),
      } : currentArticle);
    } catch (requestError) {
      if (likeRequestIdRef.current === likeRequestId) setLikeError(requestError);
    } finally {
      if (likeRequestIdRef.current === likeRequestId) {
        likePendingRef.current = false;
        setIsLikePending(false);
      }
    }
  }, [article, articleId]);

  return {
    article,
    status,
    error,
    retry: loadArticle,
    adjustCommentCount,
    toggleLike,
    isLikePending: isLikePending && String(likeTargetArticleId) === String(articleId),
    likeError: String(likeTargetArticleId) === String(articleId) ? likeError : null,
  };
}
