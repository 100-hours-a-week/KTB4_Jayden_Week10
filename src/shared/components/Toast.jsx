import { useEffect } from 'react';

export function Toast({ message, variant = 'success', duration = 3000, onDismiss }) {
  useEffect(() => {
    if (!onDismiss) return undefined;
    const timer = window.setTimeout(onDismiss, duration);
    return () => window.clearTimeout(timer);
  }, [duration, onDismiss]);

  return (
    <div className={`toast is-active${variant === 'error' ? ' toast--error' : ''}`} role="status" aria-live="polite">
      {message}
    </div>
  );
}
