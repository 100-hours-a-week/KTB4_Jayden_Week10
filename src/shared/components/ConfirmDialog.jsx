import { useEffect, useId, useRef } from 'react';

function getFocusableElements(container) {
  return [...container.querySelectorAll('button:not(:disabled), [href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])')];
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = '확인',
  pendingLabel = '처리 중…',
  pending = false,
  errorMessage = '',
  triggerRef,
  onConfirm,
  onClose,
}) {
  const generatedId = useId();
  const titleId = `confirm-dialog-${generatedId}`;
  const dialogRef = useRef(null);
  const cancelRef = useRef(null);
  const restoreFocusRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    restoreFocusRef.current = triggerRef?.current ?? document.activeElement;
    cancelRef.current?.focus();

    function handleKeyDown(event) {
      if (event.key === 'Escape' && !pending) {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== 'Tab') return;
      const focusableElements = getFocusableElements(dialogRef.current);
      if (focusableElements.length === 0) return;
      const first = focusableElements[0];
      const last = focusableElements.at(-1);
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      restoreFocusRef.current?.focus?.();
    };
  }, [onClose, open, pending, triggerRef]);

  if (!open) return null;

  return (
    <div
      className="confirm-dialog__overlay"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !pending) onClose();
      }}
    >
      <div ref={dialogRef} className="confirm-dialog" role="dialog" aria-modal="true" aria-labelledby={titleId}>
        <h2 id={titleId}>{title}</h2>
        <p>{description}</p>
        {errorMessage && <p className="confirm-dialog__error" role="alert">{errorMessage}</p>}
        <div className="confirm-dialog__actions">
          <button ref={cancelRef} className="button button--secondary" type="button" onClick={onClose} disabled={pending}>취소</button>
          <button className="button button--primary" type="button" onClick={onConfirm} disabled={pending}>{pending ? pendingLabel : confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}
