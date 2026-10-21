import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';

/** Accessible dialog: Escape closes, focus moves inside, background scroll locked. */
export default function Modal({ open, onClose, title, description, children, size = 'md', footer }) {
  const panelRef = useRef(null);
  // Keep the latest onClose without re-running the focus effect on every render.
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open) return undefined;
    const previouslyFocused = document.activeElement;
    const onKey = (e) => e.key === 'Escape' && onCloseRef.current();
    document.addEventListener('keydown', onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const t = setTimeout(() => {
      const first = panelRef.current?.querySelector('input, select, textarea, button:not([data-close])');
      (first || panelRef.current)?.focus();
    }, 50);
    return () => {
      clearTimeout(t);
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = overflow;
      previouslyFocused?.focus?.();
    };
  }, [open]);

  const widths = { sm: 'max-w-md', md: 'max-w-xl', lg: 'max-w-3xl' };

  return createPortal(
    <AnimatePresence>
      {open && (
        <div key="modal" className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4">
          <motion.div
            className="absolute inset-0 bg-ink/50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
            tabIndex={-1}
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 400, damping: 34 }}
            className={`relative flex max-h-[92vh] w-full ${widths[size]} flex-col rounded-t-2xl bg-white shadow-lift sm:rounded-2xl`}
          >
            <div className="flex items-start justify-between gap-4 border-b border-line px-6 py-4">
              <div>
                <h2 id="modal-title" className="text-xl font-bold">
                  {title}
                </h2>
                {description && <p className="mt-0.5 text-sm text-muted">{description}</p>}
              </div>
              <button
                type="button"
                data-close
                onClick={onClose}
                className="rounded-lg p-1.5 text-muted hover:bg-mist hover:text-ink"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="overflow-y-auto px-6 py-5">{children}</div>
            {footer && <div className="flex flex-wrap justify-end gap-2 border-t border-line px-6 py-4">{footer}</div>}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}

/** Yes/no confirmation built on Modal. */
export function ConfirmDialog({ open, onClose, onConfirm, title, message, confirmLabel, busy, danger = true }) {
  return (
    <Modal
      open={open}
      onClose={busy ? () => {} : onClose}
      title={title}
      size="sm"
      footer={
        <>
          <button type="button" className="btn-secondary" onClick={onClose} disabled={busy}>
            Keep it
          </button>
          <button type="button" className={danger ? 'btn-danger' : 'btn-primary'} onClick={onConfirm} disabled={busy}>
            {busy ? 'Working…' : confirmLabel}
          </button>
        </>
      }
    >
      <p className="text-sm text-muted">{message}</p>
    </Modal>
  );
}
