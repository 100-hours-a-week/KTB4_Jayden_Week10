import { Link } from 'react-router-dom';
import { PostCard } from '../features/articles/components/PostCard.jsx';
import { useArticleList } from '../features/articles/useArticleList.js';
import { InfiniteScrollTrigger } from '../shared/components/InfiniteScrollTrigger.jsx';

function ArticleSkeletons() {
  return (
    <div className="skeleton-list" aria-label="게시글을 불러오는 중">
      {[0, 1, 2].map((item) => (
        <div className="article-card article-card--skeleton" key={item}><span /><span /><span /></div>
      ))}
    </div>
  );
}

export function PostListPage() {
  const {
    items,
    status,
    error,
    hasNext,
    isLoadingMore,
    loadMoreError,
    retry,
    loadMore,
    retryLoadMore,
  } = useArticleList();

  return (
    <main id="main-content" className="page-main">
      <section className="article-intro" aria-labelledby="page-title">
        <h1 id="page-title">오늘의 취미 피드</h1>
        <Link className="button button--primary" to="/posts/new">글쓰기</Link>
      </section>

      <section
        id="article-list"
        className={`article-feed is-${status}`}
        aria-labelledby="article-list-title"
        aria-live="polite"
        aria-busy={status === 'loading' || isLoadingMore}
      >
        <h2 id="article-list-title" className="sr-only">게시글 목록</h2>

        {status === 'loading' && <ArticleSkeletons />}

        {status === 'empty' && (
          <div className="feed-message feed-message--empty">
            <p>빈 게시글</p>
            <span>아직 작성된 게시글이 없어요.</span>
          </div>
        )}

        {status === 'error' && (
          <div className="feed-message feed-message--error" role="alert">
            <p>게시글을 불러오지 못했어요.</p>
            <span>{error?.message}</span>
            <button className="button button--secondary" type="button" onClick={retry}>다시 시도</button>
          </div>
        )}

        {status === 'success' && (
          <>
            <div className="article-feed__content">
              {items.map((article) => <PostCard article={article} key={article.articleId} />)}
            </div>

            {loadMoreError && (
              <div className="feed-load-more-error" role="alert">
                <span>게시글을 더 불러오지 못했어요.</span>
                <button className="button button--secondary" type="button" onClick={retryLoadMore}>다시 시도</button>
              </div>
            )}
            {isLoadingMore && <div className="feed-loading-more" role="status">게시글을 더 불러오는 중…</div>}
            <InfiniteScrollTrigger enabled={hasNext && !isLoadingMore && !loadMoreError} onIntersect={loadMore} />
          </>
        )}
      </section>
    </main>
  );
}
