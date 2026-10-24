import { useState } from 'react';
import { TcMonogram, IconArrow, IconCheck, IconFolder, IconBell } from '@/components/icons';
import { Button, Field, Input } from '@/components/ui';
import { GoogleSignInButton } from '@/components/google-sign-in';
import { useToast } from '@/components/toast';
import { useI18n } from '@/lib/i18n';
import { store } from '@/lib/store';

interface RegisterPageProps {
  navigate: (path: string) => void;
}

export function RegisterPage({ navigate }: RegisterPageProps) {
  const { push } = useToast();
  const { t } = useI18n();

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    age: '',
    password: '',
    confirm: '',
  });
  const [busy, setBusy] = useState(false);

  const setField = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [key]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirm) {
      return push('error', "Passwords do not match.");
    }
    if (form.password.length < 8) {
      return push('error', "Password must be at least 8 characters long.");
    }

    setBusy(true);
    try {
      const res = await store.register({
        name: form.name,
        email: form.email,
        phone: form.phone,
        age: form.age ? Number(form.age) : undefined,
        passwordPlain: form.password,
      });

      if (res.success && res.user) {
        push('success', `Account created successfully! Welcome to The Creators.`);
        navigate('/dashboard');
      } else {
        push('error', res.error || 'Registration failed.');
      }
    } catch {
      push('error', 'Encountered an error during account creation.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="relative mx-auto max-w-6xl px-4 sm:px-6 py-12 lg:py-24">
      {/* Background glow */}
      <div className="pointer-events-none absolute -top-16 right-1/4 h-[380px] w-[540px] rounded-full bg-blue-600/10 blur-[130px]" aria-hidden="true" />

      <div className="grid items-center gap-10 sm:gap-12 lg:grid-cols-2">
        {/* Left Side: Value proposition */}
        <div>
          <button
            type="button"
            onClick={() => navigate('/')}
            className="mb-8 flex items-center gap-3 cursor-pointer text-left"
            aria-label="THE CREATORS Home"
          >
            <TcMonogram className="h-10 w-10 shrink-0" />
            <div>
              <span className="font-display text-base font-bold tracking-[0.2em] text-[var(--color-ink)] block">
                THE CREATORS
              </span>
              <span className="font-mono text-[9px] uppercase tracking-[0.22em] text-[var(--color-orchid)] block">
                Build · Break · On Demand
              </span>
            </div>
          </button>

          <h1 className="font-display text-3xl sm:text-5xl font-extrabold leading-tight text-[var(--color-ink)]">
            Your projects, <span className="text-gradient">one dashboard</span>
          </h1>

          <p className="mt-4 max-w-md text-sm sm:text-base leading-relaxed text-[var(--color-muted)]">
            {t('createAccountSubtitle')}
          </p>

          <ul className="mt-6 sm:mt-8 space-y-4">
            <li className="flex items-start gap-3.5 text-sm text-[var(--color-ink)]">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-500/15 text-[var(--color-orchid)]">
                <IconFolder className="h-4.5 w-4.5" />
              </span>
              <div>
                <strong className="block text-[var(--color-ink)]">Live Milestone Tracking</strong>
                <span className="text-xs text-[var(--color-muted)]">Track status, progress percentages, and updates from the engineers.</span>
              </div>
            </li>

            <li className="flex items-start gap-3.5 text-sm text-[var(--color-ink)]">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-500/15 text-blue-400">
                <IconCheck className="h-4.5 w-4.5" />
              </span>
              <div>
                <strong className="block text-[var(--color-ink)]">Dedicated Client Portal</strong>
                <span className="text-xs text-[var(--color-muted)]">Real-time milestone tracking, deliverable drops, and direct updates.</span>
              </div>
            </li>

            <li className="flex items-start gap-3.5 text-sm text-[var(--color-ink)]">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400">
                <IconBell className="h-4.5 w-4.5" />
              </span>
              <div>
                <strong className="block text-[var(--color-ink)]">Direct Updates &amp; Notes</strong>
                <span className="text-xs text-[var(--color-muted)]">Instant notifications for scoping approvals, deliverable drops, and QA handoffs.</span>
              </div>
            </li>
          </ul>
        </div>

        {/* Right Side: Register Card */}
        <div className="grad-border glass rounded-3xl p-5 sm:p-9">
          <h2 className="font-display text-xl sm:text-2xl font-bold text-[var(--color-ink)]">
            {t('createAccountTitle')}
          </h2>
          <p className="mt-1 text-xs sm:text-sm text-[var(--color-muted)]">
            Takes less than 60 seconds.
          </p>

          {/* Google Sign-up */}
          <div className="mt-5 sm:mt-6 space-y-4">
            <GoogleSignInButton onSuccess={() => navigate('/dashboard')} />
            <div className="flex items-center gap-3 text-xs text-[var(--color-faint)]" aria-hidden="true">
              <span className="h-px flex-1 bg-[var(--color-line)]" />
              <span>or sign up with email</span>
              <span className="h-px flex-1 bg-[var(--color-line)]" />
            </div>
          </div>

          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            <Field label={t('fullName')}>
              <Input
                type="text"
                placeholder="Ada Lovelace"
                value={form.name}
                onChange={setField('name')}
                required
              />
            </Field>

            <Field label={t('emailAddress')}>
              <Input
                type="email"
                placeholder="you@company.com"
                value={form.email}
                onChange={setField('email')}
                required
              />
            </Field>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label={t('contactNumber')} hint="optional">
                <Input
                  type="tel"
                  placeholder="+1 555 000 1234"
                  value={form.phone}
                  onChange={setField('phone')}
                />
              </Field>

              <Field label={t('ageField')} hint="optional">
                <Input
                  type="number"
                  placeholder="25"
                  min={13}
                  max={120}
                  value={form.age}
                  onChange={setField('age')}
                />
              </Field>
            </div>

            <Field label={t('password')} hint="min. 8 characters">
              <Input
                type="password"
                placeholder="••••••••"
                value={form.password}
                onChange={setField('password')}
                required
                minLength={8}
              />
            </Field>

            <Field label={t('confirmPassword')}>
              <Input
                type="password"
                placeholder="••••••••"
                value={form.confirm}
                onChange={setField('confirm')}
                required
                minLength={8}
              />
            </Field>

            <Button type="submit" size="lg" loading={busy} className="w-full mt-3">
              <span>{t('createAccountTitle')}</span>
              {!busy && <IconArrow className="h-4 w-4" />}
            </Button>
          </form>

          <p className="mt-6 text-center text-xs text-[var(--color-muted)]">
            {t('alreadyHaveAccount')}{' '}
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="text-[var(--color-orchid)] font-semibold hover:underline cursor-pointer"
            >
              {t('navLogin')}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
