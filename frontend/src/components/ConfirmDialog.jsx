import { useEffect, useRef } from 'react';

/**
 * A modal confirmation step before a destructive action (FR-M2-07).
 * Focus starts on "Vazgeç", Escape cancels, and focus stays inside the dialog.
 */
export function ConfirmDialog({ title, children, confirmLabel, busy, onConfirm, onCancel, testIds = {} }) {
  const dialogRef = useRef(null);
  const cancelRef = useRef(null);

  useEffect(() => {
    const previous = document.activeElement;
    cancelRef.current?.focus();
    return () => previous?.focus?.();
  }, []);

  function handleKeyDown(event) {
    if (event.key === 'Escape' && !busy) {
      event.stopPropagation();
      onCancel();
      return;
    }
    if (event.key !== 'Tab') return;

    // Keep Tab and Shift+Tab inside the dialog.
    const buttons = [...dialogRef.current.querySelectorAll('button:not(:disabled)')];
    if (buttons.length === 0) return;
    const first = buttons[0];
    const last = buttons[buttons.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  return (
    <div className="dialog-backdrop">
      <div
        ref={dialogRef}
        className="dialog"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        aria-describedby="confirm-text"
        onKeyDown={handleKeyDown}
      >
        <h2 id="confirm-title">{title}</h2>
        <p id="confirm-text">{children}</p>
        <div className="dialog-actions">
          <button ref={cancelRef} type="button" className="button" onClick={onCancel} disabled={busy}>
            Vazgeç
          </button>
          <button
            type="button"
            className="button button-danger"
            onClick={onConfirm}
            disabled={busy}
            data-testid={testIds.confirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
