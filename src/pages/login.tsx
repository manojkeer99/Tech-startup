import { useState, useEffect } from 'react';
import { TcMonogram, IconArrow, IconShield } from '@/components/icons';
import { Button, Field, Input } from '@/components/ui';
import { GoogleSignInButton } from '@/components/google-sign-in';
import { TurnstileWidget, type TurnstileConfigState } from '@/components/turnstile-widget';
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
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [turnstileResetKey, setTurnstileResetKey] = useState(0);
  const [turnstileConfig, setTurnstileConfig] = useState<TurnstileConfigState>({
    enabled: false,
    required: false,
    misconfigured: false,
    mode: 'development-bypass',
  });

  // Redirect already-authenticated users so visiting /login doesn't require re-signing in
  useEffect(() => {
    let mounted = true;
    const redirectIfAuthenticated = async () => {
      const user = await store.checkSession();
      if (!mounted || !user) return;
      if (isAdminLogin) {
        if (user.role === 'admin') {
          navigate('/admin');
        }
      } else {
        navigate(user.role === 'admin' ? '/admin' : '/dashboard');
      }
    };
    redirectIfAuthenticated();
    return () => {
      mounted = false;
    };
  }, [isAdminLogin, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (turnstileConfig.misconfigured) {
      return push('error', 'Security verification is misconfigured on the server.');
    }
    if (turnstileConfig.required && !turnstileToken) {
      return push('error', 'Please complete the Cloudflare Turnstile security check.');
    }

    setBusy(true);
    try {
      const res = await store.login(email, password, turnstileToken);
      if (res.success && res.user) {
        if (isAdminLogin && res.user.role !== 'admin') {
          push('error', 'That account does not have administrator privileges. Redirecting to Client Dashboard.');
          navigate('/dashboard');
          return;
        }
        push('success', `Welcome back, ${res.user.name.split(' ')[0]}.`);
        if (res.user.role === 'admin') {
          navigate('/admin');
        } else {
          navigate('/dashboard');
        }
      } else {
        setTurnstileToken(null);
        setTurnstileResetKey((k) => k + 1);
        push('error', res.error || 'Invalid email or password.');
      }
    } catch {
      setTurnstileToken(null);
      setTurnstileResetKey((k) => k + 1);
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

        {/* Google OAuth */}
        {!isAdminLogin && (
          <div className="mt-6 w-full space-y-4">
            <GoogleSignInButton
              onSuccess={() => {
                const user = store.getSessionUser();
                navigate(user?.role === 'admin' ? '/admin' : '/dashboard');
              }}
            />
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

          <TurnstileWidget
            action="login"
            resetKey={turnstileResetKey}
            onVerify={setTurnstileToken}
            onConfigChange={setTurnstileConfig}
          />

          <Button
            type="submit"
            size="lg"
            loading={busy}
            disabled={busy || turnstileConfig.misconfigured || (turnstileConfig.required && !turnstileToken)}
            className="w-full mt-2"
          >
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
