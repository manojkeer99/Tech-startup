import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { IconCheck, IconX, IconShield } from './icons';

type ToastKind = 'success' | 'error' | 'info';
type Toast = { id: number; kind: ToastKind; message: string };

const ToastCtx = createContext<{ push: (kind: ToastKind, message: string) => void }>({
  push: () => {},
});

export function useToast() {
  return useContext(ToastCtx);
}

const KIND_STYLE: Record<ToastKind, { ring: string; icon: ReactNode }> = {
  success: { ring: 'border-emerald-500/40 text-emerald-400', icon: <IconCheck className="h-4 w-4 text-emerald-400" /> },
  error: { ring: 'border-rose-500/50 text-rose-400', icon: <IconX className="h-4 w-4 text-rose-400" /> },
  info: { ring: 'border-violet-500/40 text-violet-400', icon: <IconShield className="h-4 w-4 text-violet-400" /> },
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const idRef = useRef(0);

  const push = useCallback((kind: ToastKind, message: string) => {
    const id = ++idRef.current;
    setToasts((t) => [...t.slice(-4), { id, kind, message }]);
    window.setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4200);
  }, []);

  const value = useMemo(() => ({ push }), [push]);

  return (
    <ToastCtx.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed right-4 top-4 z-[100] flex w-[min(92vw,380px)] flex-col gap-2">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, x: 40, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 30, scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 380, damping: 28 }}
              className={`glass-strong pointer-events-auto flex items-start gap-3 rounded-xl border p-4 shadow-2xl ${KIND_STYLE[t.kind].ring}`}
            >
              <span className="mt-0.5 shrink-0">{KIND_STYLE[t.kind].icon}</span>
              <p className="text-sm leading-snug text-[var(--color-ink)] flex-1">{t.message}</p>
              <button
                type="button"
                onClick={() => setToasts((x) => x.filter((y) => y.id !== t.id))}
                className="rounded p-1 text-[var(--color-faint)] transition hover:text-[var(--color-ink)]"
                aria-label="Dismiss notification"
              >
                <IconX className="h-3.5 w-3.5" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastCtx.Provider>
  );
}
