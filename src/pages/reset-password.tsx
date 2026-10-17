import { useState } from 'react';
import { TcMonogram, IconArrow, IconCheck } from '@/components/icons';
import { Button, Field, Input } from '@/components/ui';
import { useToast } from '@/components/toast';
import { useI18n } from '@/lib/i18n';
import { store } from '@/lib/store';

interface ResetPasswordPageProps {
  tokenFromQuery?: string;
  navigate: (path: string) => void;
}

export function ResetPasswordPage({ tokenFromQuery = '', navigate }: ResetPasswordPageProps) {
  const { push } = useToast();
  const { t } = useI18n();

  const [token, setToken] = useState(tokenFromQuery);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token.trim()) {
      return push('error', 'Reset token is required.');
    }
    if (password !== confirm) {
      return push('error', 'Passwords do not match.');
    }
    if (password.length < 8) {
      return push('error', 'Password must be at least 8 characters long.');
    }

    setBusy(true);
    try {
      const res = await store.completePasswordReset(token.trim(), password);
      if (res.success) {
        setSuccess(true);
        push('success', 'Your password has been updated. You can now log in.');
      } else {
        push('error', res.error || 'Password reset failed.');
      }
    } catch {
      push('error', 'Failed to update password.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="relative flex min-h-[80vh] items-center justify-center px-5 py-16">
      <div className="pointer-events-none absolute top-10 left-1/2 h-[360px] w-[620px] -translate-x-1/2 rounded-full bg-violet-600/12 blur-[120px]" aria-hidden="true" />

      <div className="grad-border glass relative w-full max-w-md rounded-2xl p-8 sm:p-9">
        <button
          type="button"
          onClick={() => navigate('/')}
          className="mb-7 flex items-center gap-3 cursor-pointer text-left"
          aria-label="THE CREATORS Home"
        >
          <TcMonogram className="h-9 w-9" />
          <div>
            <span className="font-display text-base font-bold tracking-[0.2em] text-[var(--color-ink)] block">
              THE CREATORS
            </span>
            <span className="font-mono text-[9px] uppercase tracking-[0.22em] text-[var(--color-orchid)] block">
              Set New Password
            </span>
          </div>
        </button>

        <h1 className="font-display text-2xl sm:text-3xl font-bold text-[var(--color-ink)]">
          {t('updatePassword')}
        </h1>
        <p className="mt-1.5 text-sm text-[var(--color-muted)]">
          Must be at least 8 characters and unique to your account.
        </p>

        {success ? (
          <div className="mt-6 space-y-4 text-center">
            <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-400">
              <IconCheck className="h-6 w-6" />
            </span>
            <p className="text-sm font-semibold text-emerald-400">Password Updated Successfully</p>
            <Button
              type="button"
              className="w-full mt-4"
              onClick={() => navigate('/login')}
            >
              <span>Continue to Login</span>
              <IconArrow className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            {!tokenFromQuery && (
              <Field label="Reset Token">
                <Input
                  type="text"
                  placeholder="Paste 32-character token"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  required
                />
              </Field>
            )}

            <Field label={t('newPassword')} hint="min. 8 characters">
              <Input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                autoFocus
              />
            </Field>

            <Field label={t('confirmPassword')}>
              <Input
                type="password"
                placeholder="••••••••"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                minLength={8}
              />
            </Field>

            <Button type="submit" size="lg" loading={busy} className="w-full mt-2">
              <span>{t('updatePassword')}</span>
              {!busy && <IconArrow className="h-4 w-4" />}
            </Button>
          </form>
        )}

        <div className="mt-6 border-t border-[var(--color-line)] pt-5 text-center">
          <button
            type="button"
            onClick={() => navigate('/login')}
            className="text-xs text-[var(--color-muted)] hover:text-[var(--color-orchid)] transition cursor-pointer"
          >
            ← {t('backToLogin')}
          </button>
        </div>
      </div>
    </div>
  );
}
