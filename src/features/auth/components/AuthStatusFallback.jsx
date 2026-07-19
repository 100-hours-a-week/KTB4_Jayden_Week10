export function AuthStatusFallback({ error, onRetry }) {
  return (
    <main className="auth-status" aria-live="polite">
      {error ? (
        <section role="alert">
          <h1>로그인 상태를 확인하지 못했습니다</h1>
          <p>네트워크 연결을 확인한 뒤 다시 시도해주세요.</p>
          <button className="button button--primary" type="button" onClick={onRetry}>
            다시 시도
          </button>
        </section>
      ) : (
        <p role="status">로그인 상태를 확인하고 있습니다…</p>
      )}
    </main>
  );
}
