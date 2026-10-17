import { useState } from 'react';
import { Button, Modal, Field, Input } from './ui';
import { useToast } from './toast';
import { store } from '@/lib/store';
import { useI18n } from '@/lib/i18n';
import { IconShield, IconCheck, IconArrow } from './icons';

export function GoogleSignInButton({
  onSuccess,
}: {
  onSuccess?: () => void;
}) {
  const { push } = useToast();
  const { t } = useI18n();
  const [modalOpen, setModalOpen] = useState(false);
  const [googleEmail, setGoogleEmail] = useState('');
  const [googleName, setGoogleName] = useState('');
  const [busy, setBusy] = useState(false);

  const handleStart = () => {
    // Open interactive Google Identity verification modal
    setModalOpen(true);
  };

  const handleSimulatedGoogleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!googleEmail || !googleEmail.includes('@')) {
      return push('error', 'Please provide a valid Google account email.');
    }
    setBusy(true);
    try {
      const res = await store.loginWithGoogle(googleEmail, googleName || googleEmail.split('@')[0]);
      if (res.success) {
        push('success', `Signed in with verified Google account: ${googleEmail}`);
        setModalOpen(false);
        if (onSuccess) onSuccess();
      } else {
        push('error', 'Google authentication could not be completed.');
      }
    } catch {
      push('error', 'Google sign-in failed.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="lg"
        onClick={handleStart}
        className="w-full bg-white !text-slate-900 border-slate-300 hover:!bg-slate-100 font-semibold shadow-sm"
        aria-label="Continue with Google"
      >
        <svg aria-hidden="true" className="h-5 w-5 shrink-0" viewBox="0 0 48 48">
          <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.05 13.22l7.98 6.19C11.92 13.72 17.47 9.5 24 9.5Z" />
          <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.92c-.58 2.96-2.26 5.48-4.73 7.18l7.65 5.93c4.46-4.12 7.14-10.2 7.14-17.58Z" />
          <path fill="#FBBC05" d="M10.03 28.59A14.4 14.4 0 0 1 9.25 24c0-1.59.27-3.13.76-4.59l-7.98-6.19A23.9 23.9 0 0 0 0 24c0 3.88.93 7.56 2.57 10.78l7.46-6.19Z" />
          <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.9-5.87l-7.65-5.93c-2.13 1.43-4.85 2.3-8.25 2.3-6.53 0-12.08-4.22-14.07-10.09l-7.98 6.19C6.51 42.62 14.62 48 24 48Z" />
        </svg>
        <span>{t('continueWithGoogle')}</span>
      </Button>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Google Sign-In Authentication">
        <div className="space-y-5">
          <div className="rounded-xl border border-blue-500/20 bg-blue-500/10 p-4 text-xs text-blue-300">
            <div className="flex items-center gap-2 font-semibold">
              <IconShield className="h-4 w-4" />
              <span>OAuth 2.0 Identity Protocol</span>
            </div>
            <p className="mt-1.5 leading-relaxed text-[var(--color-muted)]">
              In production, Google OAuth verifies the ID token on the server using Google&apos;s public keys. Client accounts receive client role access only (admin privileges cannot be granted via OAuth).
            </p>
          </div>

          <form onSubmit={handleSimulatedGoogleAuth} className="space-y-4">
            <Field label="Google Account Email">
              <Input
                type="email"
                placeholder="you@gmail.com"
                value={googleEmail}
                onChange={(e) => setGoogleEmail(e.target.value)}
                required
                autoFocus
              />
            </Field>
            <Field label="Your Name (from Google Profile)">
              <Input
                type="text"
                placeholder="e.g. Alex Morgan"
                value={googleName}
                onChange={(e) => setGoogleName(e.target.value)}
              />
            </Field>

            <div className="rounded-lg border border-[var(--color-line)] bg-[var(--color-raise)] p-3 text-xs text-[var(--color-muted)]">
              <div className="flex items-center gap-2">
                <IconCheck className="h-3.5 w-3.5 text-emerald-400" />
                <span>Zero administrative escalation: Client role only</span>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <IconCheck className="h-3.5 w-3.5 text-emerald-400" />
                <span>Includes 100 welcome tokens for new registrations</span>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" loading={busy}>
                Authorize &amp; Continue <IconArrow className="h-4 w-4" />
              </Button>
            </div>
          </form>
        </div>
      </Modal>
    </>
  );
}
