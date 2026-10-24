import { useState } from 'react';
import { TcMonogram, IconArrow, IconShield } from '@/components/icons';
import { Button, Field, Input } from '@/components/ui';
import { GoogleSignInButton } from '@/components/google-sign-in';
import { useToast } from '@/components/toast';
import { useI18n } from '@/lib/i18n';
import { store } from '@/lib/store';

interface LoginPageProps {
  navigate: (path: string) => void;
  isAdminLogin?: boolean;
}

export function LoginPage({ navigate, isAdminLogin = false }: LoginPageProps) {
  const { push } = useToast();
  const { t } = useI18n();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await store.login(email, password);
      if (res.success && res.user) {
        push('success', `Welcome back, ${res.user.name.split(' ')[0]}.`);
        if (isAdminLogin && res.user.role !== 'admin') {
          push('error', "That account does not have administrator privileges.");
          store.logout();
          return;
        }
        if (res.user.role === 'admin') {
          navigate('/admin');
        } else {
          navigate('/dashboard');
        }
      } else {
        push('error', res.error || 'Invalid email or password.');
      }
    } catch {
      push('error', 'Login encountered an unexpected error.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="relative flex min-h-[82vh] items-center justify-center px-4 sm:px-5 py-12 sm:py-16">
      <div className="pointer-events-none absolute top-10 left-1/2 h-[360px] w-[620px] -translate-x-1/2 rounded-full bg-violet-600/12 blur-[120px]" aria-hidden="true" />

      <div className="grad-border glass relative w-full max-w-md rounded-2xl p-5 sm:p-9">
        {/* Monogram Brand Header */}
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
              {isAdminLogin ? 'Administrative Portal' : 'Client Access'}
            </span>
          </div>
        </button>

        {isAdminLogin ? (
          <div className="mb-6 flex items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3.5 py-2 text-xs font-semibold text-amber-400">
            <IconShield className="h-4 w-4" />
            <span>Restricted Access: Internal Studio Administration</span>
          </div>
        ) : null}

        <h1 className="font-display text-2xl sm:text-3xl font-bold text-[var(--color-ink)]">
          {isAdminLogin ? 'Admin Log in' : t('loginTitle')}
        </h1>
        <p className="mt-1.5 text-sm text-[var(--color-muted)]">
          {isAdminLogin
            ? 'Manage production pipeline, client accounts, and project deliverables.'
            : t('loginSubtitle')}
        </p>

        {/* Google OAuth (Client flow) */}
        {!isAdminLogin && (
          <div className="mt-6 space-y-4">
            <GoogleSignInButton onSuccess={() => navigate('/dashboard')} />
            <div className="flex items-center gap-3 text-xs text-[var(--color-faint)]" aria-hidden="true">
              <span className="h-px flex-1 bg-[var(--color-line)]" />
              <span>or log in with credentials</span>
              <span className="h-px flex-1 bg-[var(--color-line)]" />
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <Field label={t('emailAddress')}>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              required
              autoComplete="username"
            />
          </Field>

          <Field label={t('password')}>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              autoComplete="current-password"
            />
          </Field>

          <Button type="submit" size="lg" loading={busy} className="w-full mt-2">
            <span>{t('navLogin')}</span>
            {!busy && <IconArrow className="h-4 w-4" />}
          </Button>
        </form>

        <div className="mt-6 flex items-center justify-between text-xs text-[var(--color-muted)] border-t border-[var(--color-line)] pt-5">
          <button
            type="button"
            onClick={() => navigate('/forgot-password')}
            className="hover:text-[var(--color-orchid)] transition cursor-pointer"
          >
            {t('forgotPassword')}
          </button>
          {!isAdminLogin ? (
            <button
              type="button"
              onClick={() => navigate('/register')}
              className="font-semibold text-[var(--color-orchid)] hover:underline cursor-pointer"
            >
              {t('createAccountTitle')}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="text-[var(--color-orchid)] hover:underline cursor-pointer"
            >
              Switch to Client Login
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
