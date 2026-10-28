import { useState, useEffect } from 'react';
import { Reveal } from '@/components/motion';
import { Button, SectionLabel } from '@/components/ui';
import {
  IconCopy,
  IconCheck,
  IconSpark,
  IconShield,
  IconArrow,
  IconFolder,
  IconUser,
} from '@/components/icons';
import { store } from '@/lib/store';
import { useToast } from '@/components/toast';
import { fetchMyReferrals, trackReferralCode } from '@/lib/admin-api';
import type { PublicUser } from '@/types';

interface ReferAndEarnPageProps {
  navigate: (path: string) => void;
  incomingRefCode?: string;
}

export function ReferAndEarnPage({ navigate, incomingRefCode }: ReferAndEarnPageProps) {
  const { push } = useToast();
  const [sessionUser, setSessionUser] = useState<PublicUser | null>(store.getSessionUser());
  const [referralCode, setReferralCode] = useState<string>('');
  const [referralLink, setReferralLink] = useState<string>('');
  const [loadingLink, setLoadingLink] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [trackedReferrer, setTrackedReferrer] = useState<{ code: string; name?: string } | null>(null);

  useEffect(() => {
    const syncAuth = () => setSessionUser(store.getSessionUser());
    syncAuth();
    return store.subscribe(syncAuth);
  }, []);

  // Load personal referral code & link if user is logged in
  useEffect(() => {
    if (!sessionUser) {
      setReferralCode('');
      setReferralLink('');
      return;
    }

    let active = true;
    setLoadingLink(true);
    fetchMyReferrals()
      .then((res) => {
        if (!active) return;
        setReferralCode(res.referralCode);
        setReferralLink(`${window.location.origin}/refer-and-earn?ref=${encodeURIComponent(res.referralCode)}`);
      })
      .catch(() => {
        if (!active) return;
        if (sessionUser.referralCode) {
          setReferralCode(sessionUser.referralCode);
          setReferralLink(`${window.location.origin}/refer-and-earn?ref=${encodeURIComponent(sessionUser.referralCode)}`);
        }
      })
      .finally(() => {
        if (active) setLoadingLink(false);
      });

    return () => {
      active = false;
    };
  }, [sessionUser]);

  // If visitor arrived with ?ref=CODE, confirm attribution with server
  useEffect(() => {
    if (!incomingRefCode) return;
    const clean = incomingRefCode.trim().toUpperCase();
    if (!clean) return;

    trackReferralCode(clean)
      .then((res) => {
        if (res.ok && res.attributed && res.referralCode) {
          setTrackedReferrer({ code: res.referralCode, name: res.referrerName });
        }
      })
      .catch(() => {});
  }, [incomingRefCode]);

  const handleCopyLink = () => {
    if (!referralLink) return;
    navigator.clipboard.writeText(referralLink);
    setCopiedLink(true);
    push('success', 'Referral link copied to clipboard.');
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleCopyCode = () => {
    if (!referralCode) return;
    navigator.clipboard.writeText(referralCode);
    setCopiedCode(true);
    push('info', 'Referral code copied to clipboard.');
    setTimeout(() => setCopiedCode(false), 2500);
  };

  return (
    <div className="relative mx-auto max-w-7xl px-4 sm:px-6 py-12 sm:py-16 lg:px-8 lg:py-24">
      {/* Ambient background glow */}
      <div
        className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 h-[420px] w-[680px] rounded-full bg-violet-600/12 blur-[150px]"
        aria-hidden="true"
      />

      {/* Active Visitor Referral Banner */}
      {trackedReferrer && (
        <Reveal className="mb-8">
          <div className="rounded-2xl border border-emerald-500/35 bg-emerald-500/10 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-start sm:items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-300">
                <IconCheck className="h-5 w-5" />
              </div>
              <div>
                <p className="font-display text-sm font-bold text-[var(--color-ink)]">
                  Referral invitation active ({trackedReferrer.code})
                </p>
                <p className="text-xs text-[var(--color-muted)] mt-0.5">
                  {trackedReferrer.name
                    ? `You were invited by ${trackedReferrer.name}. Submit your first project brief and it will be automatically attributed.`
                    : 'Submit your first project brief and it will be automatically attributed to your referrer.'}
                </p>
              </div>
            </div>
            <Button variant="primary" size="sm" onClick={() => navigate('/project')}>
              <span>Submit a Project Brief</span>
              <IconArrow className="h-4 w-4" />
            </Button>
          </div>
        </Reveal>
      )}

      {/* Hero Section */}
      <Reveal className="max-w-3xl">
        <SectionLabel>Partner Referral Program</SectionLabel>
        <h1 className="mt-4 font-display text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-[var(--color-ink)] leading-[1.08]">
          Refer a Client.{' '}
          <span className="text-gradient">Earn a 10% Commission.</span>
        </h1>
        <p className="mt-5 text-base sm:text-lg leading-relaxed text-[var(--color-muted)] max-w-2xl">
          Introduce founders, studios, and businesses to <strong className="text-[var(--color-ink)]">THE CREATORS</strong>.
          When a new client you refer submits a project brief through your unique referral link and completes an eligible project payment, you earn a verified <strong className="text-[var(--color-ink)]">10% commission</strong> on the payment received.
        </p>
      </Reveal>

      {/* Personal Referral Link Card OR Login/Register Call to Action */}
      <Reveal className="mt-10">
        {sessionUser ? (
          <div className="grad-border glass rounded-3xl p-6 sm:p-8 lg:p-10">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="space-y-2 max-w-xl">
                <div className="inline-flex items-center gap-2 rounded-lg border border-violet-500/30 bg-violet-500/10 px-2.5 py-1 font-mono text-[11px] font-semibold uppercase tracking-wider text-violet-300">
                  <IconSpark className="h-3.5 w-3.5" />
                  <span>Your Unique Referral Link</span>
                </div>
                <h2 className="font-display text-xl sm:text-2xl font-bold text-[var(--color-ink)]">
                  Share your link with prospective clients
                </h2>
                <p className="text-xs sm:text-sm text-[var(--color-muted)] leading-relaxed">
                  When a new client visits through this link and submits a project request, our server attributes the project to your account automatically.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <Button variant="outline" size="sm" onClick={() => navigate('/dashboard?tab=referrals')}>
                  <IconFolder className="h-4 w-4" />
                  <span>View My Referrals & Earnings</span>
                </Button>
              </div>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-[1fr_auto_auto] items-center">
              <div className="rounded-xl border border-[var(--color-line)] bg-[var(--color-abyss)] px-4 py-3 font-mono text-xs sm:text-sm text-[var(--color-ink)] truncate select-all">
                {loadingLink ? 'Generating your unique referral link...' : referralLink || 'Unavailable'}
              </div>

              <Button
                variant="primary"
                onClick={handleCopyLink}
                disabled={!referralLink || loadingLink}
              >
                {copiedLink ? <IconCheck className="h-4 w-4" /> : <IconCopy className="h-4 w-4" />}
                <span>{copiedLink ? 'Link Copied' : 'Copy Referral Link'}</span>
              </Button>

              {referralCode && (
                <Button variant="ghost" onClick={handleCopyCode}>
                  <span className="font-mono text-xs">Code: {referralCode}</span>
                  {copiedCode ? <IconCheck className="h-3.5 w-3.5 text-emerald-400" /> : <IconCopy className="h-3.5 w-3.5" />}
                </Button>
              )}
            </div>
          </div>
        ) : (
          <div className="grad-border glass rounded-3xl p-6 sm:p-8 lg:p-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="space-y-2 max-w-xl">
              <div className="inline-flex items-center gap-2 rounded-lg border border-violet-500/30 bg-violet-500/10 px-2.5 py-1 font-mono text-[11px] font-semibold uppercase tracking-wider text-violet-300">
                <IconUser className="h-3.5 w-3.5" />
                <span>Get Your Referral Link</span>
              </div>
              <h2 className="font-display text-xl sm:text-2xl font-bold text-[var(--color-ink)]">
                Sign in or create an account to start referring
              </h2>
              <p className="text-xs sm:text-sm text-[var(--color-muted)] leading-relaxed">
                Every registered user receives a unique referral code and shareable link inside their client dashboard.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <Button variant="primary" size="lg" onClick={() => navigate('/register')}>
                <span>Create Free Account</span>
                <IconArrow className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="lg" onClick={() => navigate('/login')}>
                <span>Sign In</span>
              </Button>
            </div>
          </div>
        )}
      </Reveal>

      {/* How It Works — 3 Simple Steps */}
      <Reveal className="mt-16">
        <div className="mb-8">
          <SectionLabel>How It Works</SectionLabel>
          <h2 className="mt-2 font-display text-2xl sm:text-3xl font-bold text-[var(--color-ink)]">
            Three steps from introduction to payout
          </h2>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <div className="glass rounded-2xl p-6 border border-[var(--color-line)] flex flex-col justify-between">
            <div>
              <span className="font-mono text-xs font-bold uppercase tracking-widest text-[var(--color-orchid)]">
                01 · Share Your Link
              </span>
              <h3 className="mt-3 font-display text-lg font-bold text-[var(--color-ink)]">
                Send your unique referral link
              </h3>
              <p className="mt-2 text-xs sm:text-sm leading-relaxed text-[var(--color-muted)]">
                Copy your personal referral link from this page or your dashboard and share it with a prospective client who needs website, app, software, video, mod, or design production.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-[var(--color-line)]/60 font-mono text-[11px] text-[var(--color-faint)]">
              30-day tamper-resistant server attribution
            </div>
          </div>

          <div className="glass rounded-2xl p-6 border border-[var(--color-line)] flex flex-col justify-between">
            <div>
              <span className="font-mono text-xs font-bold uppercase tracking-widest text-[var(--color-orchid)]">
                02 · Client Submits & Pays
              </span>
              <h3 className="mt-3 font-display text-lg font-bold text-[var(--color-ink)]">
                Referred client completes an eligible project payment
              </h3>
              <p className="mt-2 text-xs sm:text-sm leading-relaxed text-[var(--color-muted)]">
                When the referred client submits their project brief, it appears in your dashboard under <strong className="text-[var(--color-ink)]">My Referrals</strong>. Once the project is scoped and the client completes an eligible project payment, our team verifies the payment received.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-[var(--color-line)]/60 font-mono text-[11px] text-[var(--color-faint)]">
              Tracked live in your Client Dashboard
            </div>
          </div>

          <div className="glass rounded-2xl p-6 border border-[var(--color-line)] flex flex-col justify-between">
            <div>
              <span className="font-mono text-xs font-bold uppercase tracking-widest text-emerald-400">
                03 · Earn 10% Commission
              </span>
              <h3 className="mt-3 font-display text-lg font-bold text-[var(--color-ink)]">
                Receive 10% of the verified payment
              </h3>
              <p className="mt-2 text-xs sm:text-sm leading-relaxed text-[var(--color-muted)]">
                Your commission is calculated strictly at <strong className="text-[var(--color-ink)]">10%</strong> of the actual eligible payment received for the referred project—never on uncollected quotes or unpaid invoices—and paid out to you.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-[var(--color-line)]/60 font-mono text-[11px] text-emerald-400">
              10% commission on verified project payments
            </div>
          </div>
        </div>
      </Reveal>

      {/* Program Rules & Eligibility */}
      <Reveal className="mt-16">
        <div className="rounded-3xl border border-[var(--color-line)] bg-[var(--color-abyss)]/90 p-6 sm:p-8 lg:p-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-violet-500/30 bg-violet-500/10 text-violet-300">
              <IconShield className="h-5 w-5" />
            </div>
            <div>
              <SectionLabel>Transparency & Compliance</SectionLabel>
              <h2 className="font-display text-xl sm:text-2xl font-bold text-[var(--color-ink)]">
                Program Rules & Commission Policy
              </h2>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2 text-xs sm:text-sm leading-relaxed text-[var(--color-muted)]">
            <div className="space-y-3">
              <div className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-raise)]/40 p-4">
                <h4 className="font-display font-bold text-[var(--color-ink)] mb-1">
                  1. Genuine Paid Client Projects Only
                </h4>
                <p>
                  Link clicks, account registrations, or unpaid project inquiries do not qualify for commission. A commission is earned only when a referred client submits a genuine project brief and completes an eligible project payment.
                </p>
              </div>

              <div className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-raise)]/40 p-4">
                <h4 className="font-display font-bold text-[var(--color-ink)] mb-1">
                  2. 10% Commission Calculation
                </h4>
                <p>
                  Commission is fixed at <strong className="text-[var(--color-ink)]">10%</strong> of the eligible amount actually received by THE CREATORS for the referred project, excluding taxes, refunds, or uncollected milestone quotes.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-raise)]/40 p-4">
                <h4 className="font-display font-bold text-[var(--color-ink)] mb-1">
                  3. New Clients Only & No Self-Referrals
                </h4>
                <p>
                  Referrals apply exclusively to new clients without prior project history or pre-existing accounts. Self-referrals (using your own referral link or matching email/account) are automatically blocked on the server.
                </p>
              </div>

              <div className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-raise)]/40 p-4">
                <h4 className="font-display font-bold text-[var(--color-ink)] mb-1">
                  4. Single Attribution & Verification
                </h4>
                <p>
                  Attribution is locked on first valid referral visit and verified server-side when the project brief is submitted. Existing clients cannot be retroactively claimed or reassigned to another referrer.
                </p>
              </div>
            </div>
          </div>
        </div>
      </Reveal>
    </div>
  );
}
