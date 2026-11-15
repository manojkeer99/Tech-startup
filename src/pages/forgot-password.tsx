import { useState } from 'react';
import { TcMonogram, IconMail, IconArrow } from '@/components/icons';
import { Button, Field, Input } from '@/components/ui';
import { TurnstileWidget, type TurnstileConfigState } from '@/components/turnstile-widget';
import { useToast } from '@/components/toast';
import { useI18n } from '@/lib/i18n';
import { store } from '@/lib/store';

interface ForgotPasswordPageProps {
  navigate: (path: string) => void;
}

export function ForgotPasswordPage({ navigate }: ForgotPasswordPageProps) {
  const { push } = useToast();
  const { t } = useI18n();
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [turnstileResetKey, setTurnstileResetKey] = useState(0);
  const [turnstileConfig, setTurnstileConfig] = useState<TurnstileConfigState>({
    enabled: false,
    required: false,
    misconfigured: false,
    mode: 'development-bypass',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      return push('error', 'Please enter a valid email address.');
    }
    if (turnstileConfig.misconfigured) {
      return push('error', 'Security verification is misconfigured on the server.');
    }
    if (turnstileConfig.required && !turnstileToken) {
      return push('error', 'Please complete the Cloudflare Turnstile security check.');
    }

    setBusy(true);
    try {
      const res = await store.requestPasswordReset(email, turnstileToken);
      if (!res.success) {
        setTurnstileToken(null);
        setTurnstileResetKey((k) => k + 1);
        push('error', res.error || 'Failed to generate reset link.');
        return;
      }
      setTurnstileToken(null);
      setTurnstileResetKey((k) => k + 1);
      push('info', 'If that email is registered, reset instructions will arrive shortly. Check your inbox and spam folder.');
    } catch {
      setTurnstileToken(null);
      setTurnstileResetKey((k) => k + 1);
      push('error', 'Failed to generate reset link.');
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
              Password Recovery
            </span>
          </div>
        </button>

        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-500/15 text-[var(--color-orchid)] mb-4">
          <IconMail className="h-6 w-6" />
        </span>

        <h1 className="font-display text-2xl sm:text-3xl font-bold text-[var(--color-ink)]">
          {t('resetPasswordTitle')}
        </h1>
        <p className="mt-1.5 text-sm text-[var(--color-muted)]">
          {t('resetPasswordSubtitle')}
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <Field label={t('emailAddress')}>
            <Input
              type="email"
              placeholder="you@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </Field>

          <TurnstileWidget
            action="forgot_password"
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
            <span>{t('sendResetLink')}</span>
            {!busy && <IconArrow className="h-4 w-4" />}
          </Button>
        </form>

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
