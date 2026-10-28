import { useState } from 'react';
import { TcMonogram, IconMail, IconArrow, IconCheck, IconCopy } from '@/components/icons';
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
  const [token, setToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
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
      if (res.token) {
        setToken(res.token);
        push('success', 'Password reset token generated successfully.');
      } else {
        setTurnstileToken(null);
        setTurnstileResetKey((k) => k + 1);
        push('info', 'If that email is registered, a reset link has been dispatched.');
      }
    } catch {
      setTurnstileToken(null);
      setTurnstileResetKey((k) => k + 1);
      push('error', 'Failed to generate reset link.');
    } finally {
      setBusy(false);
    }
  };

  const resetUrl = token ? `${window.location.origin}/reset-password?token=${token}` : '';

  const copyResetLink = async () => {
    if (!token) return;
    try {
      await navigator.clipboard.writeText(resetUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      push('info', 'Reset link copied to clipboard.');
    } catch {}
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

        {token ? (
          <div className="mt-6 space-y-4">
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-xs text-emerald-300">
              <p className="font-semibold text-emerald-400">Single-Use Reset Token Generated</p>
              <p className="mt-1 text-[var(--color-muted)]">
                In production, this link is delivered via SMTP. For this demo environment, click below to test the reset flow immediately:
              </p>
            </div>

            <button
              type="button"
              onClick={() => navigate(`/reset-password?token=${token}`)}
              className="btn-grad w-full py-3 rounded-xl font-bold text-white text-sm flex items-center justify-center gap-2 cursor-pointer shadow-md"
            >
              <span>Open Reset Password Form</span>
              <IconArrow className="h-4 w-4" />
            </button>

            <button
              type="button"
              onClick={copyResetLink}
              className="w-full py-2.5 rounded-xl border border-[var(--color-line)] bg-[var(--color-raise)] text-xs text-[var(--color-ink)] flex items-center justify-center gap-2 hover:border-violet-500/40 transition cursor-pointer"
            >
              {copied ? <IconCheck className="h-3.5 w-3.5 text-emerald-400" /> : <IconCopy className="h-3.5 w-3.5" />}
              <span>{copied ? 'Link Copied!' : 'Copy Direct Token Link'}</span>
            </button>
          </div>
        ) : (
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
