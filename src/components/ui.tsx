import {
  type ReactNode,
  type InputHTMLAttributes,
  type TextareaHTMLAttributes,
  type SelectHTMLAttributes,
  type ButtonHTMLAttributes,
  useEffect,
} from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';
import { IconX } from './icons';

/* ------------------------------- Buttons ------------------------------- */
type BtnProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'ghost' | 'outline' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
};

export function Button({
  variant = 'primary',
  size = 'md',
  loading,
  className,
  children,
  disabled,
  ...rest
}: BtnProps) {
  return (
    <button
      disabled={disabled || loading}
      className={cn(
        'relative inline-flex items-center justify-center gap-2 rounded-xl font-display font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-violet)]',
        size === 'sm' && 'px-3.5 py-1.5 text-xs',
        size === 'md' && 'px-5 py-2.5 text-sm',
        size === 'lg' && 'px-7 py-3.5 text-base',
        variant === 'primary' && 'btn-grad text-white',
        variant === 'ghost' && 'text-[var(--color-muted)] hover:bg-[var(--color-raise)] hover:text-[var(--color-ink)]',
        variant === 'outline' &&
          'border border-[var(--color-line)] text-[var(--color-ink)] hover:border-[var(--color-violet)] hover:bg-[var(--color-raise)]',
        variant === 'danger' &&
          'border border-rose-500/30 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20',
        className,
      )}
      {...rest}
    >
      {loading && <Spinner className="h-4 w-4" />}
      {children}
    </button>
  );
}

export function Spinner({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg className={cn('animate-spin', className)} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.25" strokeWidth="2.5" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

/* -------------------------------- Fields -------------------------------- */
export function Field({
  label,
  hint,
  children,
  className,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={cn('block', className)}>
      <span className="mb-2 flex items-baseline justify-between text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-muted)]">
        <span>{label}</span>
        {hint && <span className="normal-case tracking-normal text-[var(--color-faint)] font-normal">{hint}</span>}
      </span>
      {children}
    </label>
  );
}

const fieldCls =
  'w-full rounded-xl border border-[var(--color-line)] bg-[var(--color-raise)] px-4 py-3 text-sm text-[var(--color-ink)] placeholder:text-[var(--color-faint)] outline-none transition focus:border-[var(--color-violet)] focus:bg-[var(--color-panel)] focus:ring-2 focus:ring-[var(--color-violet)]/20';

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cn(fieldCls, props.className)} />;
}

export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={cn(fieldCls, 'min-h-[110px] resize-y', props.className)} />;
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={cn(fieldCls, 'appearance-none pr-8 cursor-pointer', props.className)} />;
}

/* -------------------------------- Badges -------------------------------- */
export const STATUS_META: Record<string, { label: string; cls: string; dot: string }> = {
  submitted: { label: 'Submitted', cls: 'border-[var(--color-line)] bg-[var(--color-raise)] text-[var(--color-muted)]', dot: 'bg-[var(--color-faint)]' },
  approved: { label: 'Approved', cls: 'border-blue-500/30 bg-blue-500/10 text-blue-400', dot: 'bg-blue-400' },
  in_progress: { label: 'In Progress', cls: 'border-violet-500/30 bg-violet-500/10 text-violet-400', dot: 'bg-violet-400' },
  delivered: { label: 'Delivered', cls: 'border-amber-500/30 bg-amber-500/10 text-amber-400', dot: 'bg-amber-400' },
  completed: { label: 'Completed', cls: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400', dot: 'bg-emerald-400' },
  rejected: { label: 'Rejected', cls: 'border-rose-500/30 bg-rose-500/10 text-rose-400', dot: 'bg-rose-400' },
};

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  const m = STATUS_META[status] ?? STATUS_META.submitted;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 font-mono text-[11px] font-medium tracking-wide',
        m.cls,
        className,
      )}
    >
      <span className={cn('h-1.5 w-1.5 rounded-full', m.dot, (status === 'in_progress' || status === 'submitted') && 'animate-pulse')} />
      {m.label}
    </span>
  );
}

export function ProgressBar({ value, className }: { value: number; className?: string }) {
  return (
    <div className={cn('h-1.5 w-full overflow-hidden rounded-full bg-[var(--color-line)]', className)}>
      <div
        className="h-full rounded-full bg-gradient-to-r from-violet-500 via-indigo-500 to-blue-500 transition-all duration-500"
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}

/* --------------------------------- Modal --------------------------------- */
export function Modal({
  open,
  onClose,
  title,
  children,
  wide,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  wide?: boolean;
}) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[90] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className={cn(
              'glass-strong max-h-[92vh] w-full overflow-y-auto rounded-2xl p-6 sm:p-7 shadow-2xl',
              wide ? 'sm:max-w-3xl' : 'sm:max-w-lg',
            )}
            initial={{ y: 30, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 20, opacity: 0, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 320, damping: 28 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-5 flex items-center justify-between border-b border-[var(--color-line)] pb-4">
              <h3 className="font-display text-lg font-bold text-[var(--color-ink)]">{title}</h3>
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg p-2 text-[var(--color-faint)] transition hover:bg-[var(--color-raise)] hover:text-[var(--color-ink)] cursor-pointer"
                aria-label="Close dialog"
              >
                <IconX className="h-4 w-4" />
              </button>
            </div>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* --------------------------------- Misc ---------------------------------- */
export function EmptyState({ icon, title, body }: { icon: ReactNode; title: string; body: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[var(--color-line)] px-6 py-12 text-center bg-[var(--color-raise)]/30">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-violet-500/10 text-violet-400">
        {icon}
      </div>
      <h4 className="font-display text-base font-semibold text-[var(--color-ink)]">{title}</h4>
      <p className="mt-1.5 max-w-sm text-sm text-[var(--color-muted)]">{body}</p>
    </div>
  );
}

export function SectionLabel({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-2 font-mono text-[11px] font-semibold uppercase tracking-[0.25em] text-[var(--color-orchid)]', className)}>
      <span className="h-px w-6 bg-gradient-to-r from-violet-500 to-transparent" />
      {children}
    </span>
  );
}
