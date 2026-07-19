import { formatCount } from '../../../shared/lib/formatArticle.js';
import { getErrorMessage } from '../../../shared/errors/errorMessages.js';

export function PostStats({ article, onToggleLike, isLikePending = false, likeError = null }) {
  return (
    <>
      <section className="article-stats" aria-label="게시글 통계">
        <button
          className="article-stat article-stat--like"
          type="button"
          aria-pressed={article.likedByMe}
          aria-label={article.likedByMe ? '좋아요 취소' : '좋아요 추가'}
          onClick={onToggleLike}
          disabled={isLikePending}
        >
          <strong>{formatCount(article.likeCount)}</strong>
          <span>{isLikePending ? '처리 중…' : '좋아요수'}</span>
        </button>
        <div className="article-stat"><strong>{formatCount(article.viewCount)}</strong><span>조회수</span></div>
        <div className="article-stat"><strong>{formatCount(article.commentCount)}</strong><span>댓글</span></div>
      </section>
      {likeError && <p className="article-like-error" role="alert">{getErrorMessage(likeError, 'article.like')}</p>}
    </>
  );
}
