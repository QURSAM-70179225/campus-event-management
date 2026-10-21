import { createContext, useCallback, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export const ToastContext = createContext(null);

const STYLES = {
  success: { icon: CheckCircle2, ring: 'border-emerald-200', iconColor: 'text-emerald-600' },
  error: { icon: AlertCircle, ring: 'border-rose-200', iconColor: 'text-rose-600' },
  info: { icon: Info, ring: 'border-violet/30', iconColor: 'text-violet' },
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const idRef = useRef(0);

  const dismiss = useCallback((id) => setToasts((list) => list.filter((t) => t.id !== id)), []);

  const push = useCallback(
    (type, message, title) => {
      const id = ++idRef.current;
      setToasts((list) => [...list.slice(-3), { id, type, message, title }]);
      setTimeout(() => dismiss(id), type === 'error' ? 6000 : 4000);
    },
    [dismiss]
  );

  const toast = useMemo(
    () => ({
      success: (message, title) => push('success', message, title),
      error: (message, title) => push('error', message, title),
      info: (message, title) => push('info', message, title),
    }),
    [push]
  );

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-0 z-[60] flex flex-col items-center gap-2 p-4 sm:items-end"
      >
        <AnimatePresence initial={false}>
          {toasts.map((t) => {
            const { icon: Icon, ring, iconColor } = STYLES[t.type];
            return (
              <motion.div
                key={t.id}
                layout
                initial={{ opacity: 0, y: 16, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, x: 40 }}
                transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                role={t.type === 'error' ? 'alert' : 'status'}
                className={`pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-2xl border bg-white p-4 shadow-lift ${ring}`}
              >
                <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${iconColor}`} aria-hidden />
                <div className="min-w-0 flex-1 text-sm">
                  {t.title && <p className="font-semibold text-ink">{t.title}</p>}
                  <p className="text-muted">{t.message}</p>
                </div>
                <button
                  type="button"
                  onClick={() => dismiss(t.id)}
                  className="rounded-md p-1 text-muted hover:bg-mist hover:text-ink"
                  aria-label="Dismiss notification"
                >
                  <X className="h-4 w-4" />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}
