import { useState } from 'react';
import { Button, Field, Input, Textarea } from './ui';
import { useToast } from './toast';
import { useI18n } from '@/lib/i18n';
import { OFFICIAL_CHANNELS } from '@/lib/store';
import { api } from '@/lib/api';
import { IconCheck, IconMail, IconArrow, IconClock } from './icons';

export function ContactForm() {
  const { push } = useToast();
  const { t } = useI18n();
  const [form, setForm] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
    honeypot: '',
  });
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.honeypot) return; // Silent discard for bots

    if (!form.name.trim() || form.name.length < 2) {
      return push('error', 'Please enter your name.');
    }
    if (!form.email.trim() || !form.email.includes('@')) {
      return push('error', 'Please enter a valid email address.');
    }
    if (!form.subject.trim() || form.subject.length < 3) {
      return push('error', 'Please enter a subject (minimum 3 characters).');
    }
    if (!form.message.trim() || form.message.length < 15) {
      return push('error', 'Please enter a message of at least 15 characters.');
    }

    setBusy(true);
    try {
      const result = await api<{ ok: boolean; message?: string }>('/api/contact', {
        method: 'POST',
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim(),
          subject: form.subject.trim(),
          message: form.message.trim(),
          companyWebsite: form.honeypot || undefined,
        }),
      });
      if (!result?.ok) {
        throw new Error(result?.message || 'The inquiry could not be saved.');
      }
      setSent(true);
      push('success', t('messageSent'));
    } catch (err) {
      push('error', err instanceof Error ? err.message : 'Could not save your inquiry. Please email directly.');
    } finally {
      setBusy(false);
    }
  };

  if (sent) {
    return (
      <div className="grad-border glass rounded-2xl p-8 sm:p-10 text-center">
        <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-400">
          <IconCheck className="h-7 w-7" />
        </span>
        <h3 className="font-display text-2xl font-bold text-[var(--color-ink)]">
          {t('messageSent')}
        </h3>
        <p className="mt-2 text-sm text-[var(--color-muted)] max-w-sm mx-auto">
          Your inquiry has been recorded. Our team will review it and respond using the email you provided.
        </p>
        <Button
          type="button"
          variant="outline"
          className="mt-6"
          onClick={() => {
            setSent(false);
            setForm({ name: '', email: '', subject: '', message: '', honeypot: '' });
          }}
        >
          Send another inquiry
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="glass space-y-4 sm:space-y-5 rounded-2xl p-4 sm:p-8">
      {/* Honeypot for bots */}
      <div aria-hidden="true" className="hidden">
        <input
          type="text"
          name="company_site"
          tabIndex={-1}
          value={form.honeypot}
          onChange={(e) => setForm((p) => ({ ...p, honeypot: e.target.value }))}
          autoComplete="off"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t('fullName')}>
          <Input
            type="text"
            placeholder="Ada Lovelace"
            value={form.name}
            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
            required
          />
        </Field>

        <Field label={t('emailAddress')}>
          <Input
            type="email"
            placeholder="you@company.com"
            value={form.email}
            onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
            required
          />
        </Field>

        <Field label={t('subject')} className="sm:col-span-2">
          <Input
            type="text"
            placeholder="Project inquiry / General question"
            value={form.subject}
            onChange={(e) => setForm((p) => ({ ...p, subject: e.target.value }))}
            required
          />
        </Field>

        <Field label={t('message')} className="sm:col-span-2">
          <Textarea
            placeholder="Share details regarding your inquiry or technical question..."
            value={form.message}
            onChange={(e) => setForm((p) => ({ ...p, message: e.target.value }))}
            required
          />
        </Field>
      </div>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 border-t border-[var(--color-line)] pt-5">
        <a
          href={`mailto:${OFFICIAL_CHANNELS.email}`}
          className="inline-flex items-center justify-center sm:justify-start gap-2 text-xs text-[var(--color-muted)] hover:text-[var(--color-orchid)] transition break-all"
        >
          <IconMail className="h-4 w-4 shrink-0" />
          <span>{OFFICIAL_CHANNELS.email}</span>
        </a>

        <Button type="submit" size="lg" loading={busy} className="w-full sm:w-auto">
          <span>{t('sendMessage')}</span> <IconArrow className="h-4 w-4" />
        </Button>
      </div>
    </form>
  );
}
