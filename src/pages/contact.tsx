import { ContactForm } from '@/components/contact-form';
import { Reveal } from '@/components/motion';
import { useI18n } from '@/lib/i18n';
import { OFFICIAL_CHANNELS } from '@/lib/store';
import { IconMail, IconClock, IconShield, IconDiscord, IconInstagram, IconArrow } from '@/components/icons';

interface ContactPageProps {
  navigate: (path: string) => void;
}

export function ContactPage({ navigate }: ContactPageProps) {
  const { t } = useI18n();

  return (
    <div className="relative mx-auto max-w-7xl px-4 sm:px-6 py-10 sm:py-14 lg:px-8 lg:py-20">
      {/* Ambient background glow */}
      <div className="pointer-events-none absolute -top-20 right-0 h-[400px] w-[560px] rounded-full bg-violet-600/10 blur-[140px]" aria-hidden="true" />

      <div className="grid gap-10 sm:gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16">
        <div>
          <Reveal>
            <span className="font-mono text-xs font-semibold uppercase tracking-[0.25em] text-[var(--color-orchid)]">
              {t('navContact')}
            </span>
            <h1 className="mt-4 font-display text-3xl sm:text-5xl font-extrabold leading-tight text-[var(--color-ink)]">
              Let&apos;s start a <span className="text-gradient">conversation</span>
            </h1>
            <p className="mt-4 sm:mt-5 text-sm sm:text-base leading-relaxed text-[var(--color-muted)]">
              Have a technical question or need preliminary scoping advice before submitting a full project brief? Send us a direct message and our engineering team will respond within 24 hours.
            </p>
          </Reveal>

          <Reveal delay={0.08}>
            <div className="mt-6 sm:mt-8 space-y-3.5">
              <a
                href={`mailto:${OFFICIAL_CHANNELS.email}`}
                className="glass flex items-center gap-3.5 sm:gap-4 rounded-2xl p-3.5 sm:p-4 hover:border-violet-500/40 transition"
              >
                <span className="flex h-10 w-10 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-xl bg-violet-500/15 text-[var(--color-orchid)]">
                  <IconMail className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <span className="block font-mono text-[10px] uppercase tracking-wider text-[var(--color-faint)]">
                    Official Inquiries
                  </span>
                  <span className="block text-xs sm:text-sm font-semibold text-[var(--color-ink)] break-all">
                    {OFFICIAL_CHANNELS.email}
                  </span>
                </div>
              </a>

              <div className="glass flex items-center gap-3.5 sm:gap-4 rounded-2xl p-3.5 sm:p-4">
                <span className="flex h-10 w-10 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-xl bg-blue-500/15 text-blue-400">
                  <IconClock className="h-5 w-5" />
                </span>
                <div>
                  <span className="block font-mono text-[10px] uppercase tracking-wider text-[var(--color-faint)]">
                    Guaranteed SLA
                  </span>
                  <span className="block text-xs sm:text-sm font-semibold text-[var(--color-ink)]">
                    First response within 24 hours (Monday – Saturday)
                  </span>
                </div>
              </div>

              {/* Verified Community Links */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3 pt-2">
                <a
                  href={OFFICIAL_CHANNELS.discord}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-xl border border-[#5865F2]/30 bg-[#5865F2]/10 p-3 sm:p-3.5 flex items-center gap-2.5 text-xs font-semibold text-[var(--color-ink)] hover:bg-[#5865F2]/20 transition"
                >
                  <IconDiscord className="h-4 w-4 text-[#5865F2] shrink-0" />
                  <span className="truncate">Discord Community</span>
                </a>

                <a
                  href={OFFICIAL_CHANNELS.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 sm:p-3.5 flex items-center gap-2.5 text-xs font-semibold text-[var(--color-ink)] hover:bg-rose-500/20 transition"
                >
                  <IconInstagram className="h-4 w-4 text-rose-400 shrink-0" />
                  <span className="truncate">Instagram</span>
                </a>
              </div>

              <div className="rounded-xl border border-[var(--color-line)] bg-[var(--color-raise)]/60 p-3.5 sm:p-4 text-xs text-[var(--color-faint)] leading-relaxed flex items-start gap-2.5">
                <IconShield className="h-4 w-4 text-[var(--color-orchid)] shrink-0 mt-0.5" />
                <span>
                  All communications and project attachments are handled with strict NDA confidentiality.
                </span>
              </div>
            </div>
          </Reveal>

          <Reveal delay={0.14}>
            <div className="mt-6 sm:mt-8">
              <button
                type="button"
                onClick={() => navigate('/project')}
                className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-[var(--color-orchid)] hover:underline cursor-pointer"
              >
                <span>Ready to submit a detailed project brief instead?</span>
                <IconArrow className="h-4 w-4 shrink-0" />
              </button>
            </div>
          </Reveal>
        </div>

        <Reveal delay={0.1}>
          <ContactForm />
        </Reveal>
      </div>
    </div>
  );
}
