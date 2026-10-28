import { useEffect } from 'react';
import { Reveal, Scramble, CountUp, Marquee, TiltCard } from '@/components/motion';
import { TcMonogram, IconArrow, IconCheck, IconShield, IconClock, IconActivity, IconSpark, IconDiscord, IconInstagram } from '@/components/icons';
import { SERVICE_DEFINITIONS } from '@/lib/service-meta';
import { OFFICIAL_CHANNELS } from '@/lib/store';
import { useI18n } from '@/lib/i18n';

interface HomePageProps {
  navigate: (path: string) => void;
  initialSection?: string;
}

export function HomePage({ navigate, initialSection }: HomePageProps) {
  const { t } = useI18n();

  useEffect(() => {
    const target = initialSection || (typeof window !== 'undefined' && window.location.hash ? window.location.hash.slice(1) : null);
    if (target === 'process' || target === 'community' || target === 'services') {
      const timer = setTimeout(() => {
        const el = document.getElementById(target);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [initialSection]);

  const PILLARS = [
    {
      icon: IconClock,
      title: t('pillar1Title'),
      body: t('pillar1Desc'),
    },
    {
      icon: IconShield,
      title: t('pillar2Title'),
      body: t('pillar2Desc'),
    },
    {
      icon: IconActivity,
      title: t('pillar3Title'),
      body: t('pillar3Desc'),
    },
    {
      icon: IconSpark,
      title: t('pillar4Title'),
      body: t('pillar4Desc'),
    },
  ];

  const STEPS = [
    {
      n: '01',
      title: t('step1Title'),
      body: t('step1Desc'),
    },
    {
      n: '02',
      title: t('step2Title'),
      body: t('step2Desc'),
    },
    {
      n: '03',
      title: t('step3Title'),
      body: t('step3Desc'),
    },
    {
      n: '04',
      title: t('step4Title'),
      body: t('step4Desc'),
    },
  ];

  return (
    <div className="relative overflow-hidden">
      {/* Ambient Lighting & Grid */}
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute -top-40 left-1/2 h-[520px] w-[860px] -translate-x-1/2 rounded-full bg-violet-600/15 blur-[140px]" />
        <div className="absolute top-[35%] -right-40 h-[440px] w-[540px] rounded-full bg-blue-600/10 blur-[140px]" />
        <div className="grid-bg absolute inset-0" />
      </div>

      {/* ------------------------------- HERO ------------------------------- */}
      <section className="relative mx-auto max-w-7xl px-4 sm:px-6 pt-12 pb-16 lg:px-8 lg:pt-24 lg:pb-32">
        <div className="grid items-center gap-10 sm:gap-14 lg:grid-cols-[1.15fr_0.85fr]">
          <div>
            <Reveal>
              <div className="inline-flex items-center gap-2.5 rounded-full border border-violet-500/30 bg-violet-500/10 px-3.5 py-1 sm:px-4 sm:py-1.5 font-mono text-[10px] sm:text-[11px] uppercase tracking-[0.2em] sm:tracking-[0.25em] text-[var(--color-orchid)]">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>{t('heroPill')}</span>
              </div>
            </Reveal>

            {/* Exact Tagline & Headline */}
            <h1 className="mt-6 sm:mt-7 font-display text-[clamp(2.25rem,7.5vw,5.5rem)] font-extrabold leading-[0.98] tracking-tight">
              <Reveal delay={0.06}>
                <span className="block text-[var(--color-ink)]">
                  {t('heroLine1')}
                </span>
              </Reveal>
              <Reveal delay={0.12}>
                <span className="block text-gradient">
                  {t('heroLine2')}
                </span>
              </Reveal>
              <Reveal delay={0.18}>
                <span className="block text-[var(--color-ink)]">
                  <Scramble text="ON DEMAND." speed={24} />
                </span>
              </Reveal>
            </h1>

            {/* Exact Tagline Banner */}
            <Reveal delay={0.24}>
              <div className="mt-4 flex items-center gap-2 text-sm sm:text-base font-semibold text-[var(--color-orchid)] tracking-wide font-mono">
                <span>&ldquo;{t('tagline')}&rdquo;</span>
              </div>
            </Reveal>

            <Reveal delay={0.28}>
              <p className="mt-5 sm:mt-6 max-w-xl text-sm sm:text-lg leading-relaxed text-[var(--color-muted)]">
                {t('subTagline')}
              </p>
            </Reveal>

            <Reveal delay={0.34}>
              <div className="mt-8 sm:mt-9 flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 sm:gap-4">
                <button
                  type="button"
                  onClick={() => navigate('/project')}
                  className="btn-grad group inline-flex items-center justify-center gap-2.5 rounded-xl px-5 sm:px-7 py-3.5 sm:py-4 font-display text-sm sm:text-base font-bold text-white cursor-pointer shadow-lg w-full sm:w-auto"
                >
                  <span>{t('heroCtaPrimary')}</span>
                  <IconArrow className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </button>

                <button
                  type="button"
                  onClick={() => navigate('/services')}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-[var(--color-line)] bg-[var(--color-raise)]/60 px-5 sm:px-7 py-3.5 sm:py-4 font-display text-sm sm:text-base font-semibold text-[var(--color-ink)] hover:border-[var(--color-violet)] hover:bg-[var(--color-raise)] transition cursor-pointer w-full sm:w-auto"
                >
                  <span>{t('heroCtaSecondary')}</span>
                </button>
              </div>
            </Reveal>

            {/* Verifiable Capabilities Metrics (Strictly non-fabricated) */}
            <Reveal delay={0.4}>
              <div className="mt-10 sm:mt-14 grid max-w-lg grid-cols-3 gap-2.5 sm:gap-6 border-t border-[var(--color-line)] pt-6 sm:pt-7">
                <div>
                  <p className="font-display text-xl sm:text-3xl font-extrabold text-[var(--color-ink)]">
                    <CountUp to={SERVICE_DEFINITIONS.length} suffix="" />
                  </p>
                  <p className="mt-1 font-mono text-[10px] sm:text-[11px] uppercase tracking-wider text-[var(--color-faint)] truncate">
                    {t('heroStat1Label')}
                  </p>
                </div>
                <div>
                  <p className="font-display text-xl sm:text-3xl font-extrabold text-[var(--color-ink)]">
                    100%
                  </p>
                  <p className="mt-1 font-mono text-[10px] sm:text-[11px] uppercase tracking-wider text-[var(--color-faint)] truncate">
                    {t('heroStat2Label')}
                  </p>
                </div>
                <div>
                  <p className="font-display text-xl sm:text-3xl font-extrabold text-[var(--color-orchid)]">
                    &lt; 24h
                  </p>
                  <p className="mt-1 font-mono text-[10px] sm:text-[11px] uppercase tracking-wider text-[var(--color-faint)] truncate">
                    {t('heroStat3Label')}
                  </p>
                </div>
              </div>
            </Reveal>
          </div>

          {/* Interactive 3D Monogram & Holographic Card Showcase */}
          <div className="relative hidden lg:flex items-center justify-center" aria-hidden="true">
            <div className="relative w-full max-w-md">
              {/* Subtle Ambient Radial Glow */}
              <div className="absolute inset-0 -m-8 rounded-full bg-gradient-to-tr from-violet-600/20 via-blue-600/10 to-transparent blur-3xl" />

              <TiltCard className="glass relative rounded-3xl p-8 border border-[var(--color-line-highlight)] shadow-2xl">
                <div className="flex items-center justify-between border-b border-[var(--color-line)] pb-5">
                  <div className="flex items-center gap-3">
                    <TcMonogram className="h-10 w-10" />
                    <div>
                      <span className="font-display text-sm font-bold tracking-widest text-[var(--color-ink)] block">
                        THE CREATORS
                      </span>
                      <span className="font-mono text-[10px] uppercase text-[var(--color-orchid)] tracking-wider block">
                        Studio Production Core
                      </span>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-md">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Live Queue
                  </span>
                </div>

                <div className="mt-6 space-y-4">
                  <div className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-raise)]/80 p-4">
                    <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--color-faint)]">
                      Current Focus
                    </p>
                    <p className="mt-1 font-display text-sm font-bold text-[var(--color-ink)]">
                      Full-Stack Digital Production &amp; Custom Software
                    </p>
                    <div className="mt-3 flex items-center justify-between text-[11px] font-mono text-[var(--color-muted)]">
                      <span>Client Milestone Tracking</span>
                      <span className="text-emerald-400 font-bold">Active</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 font-mono text-xs">
                    <div className="rounded-xl border border-[var(--color-line)] bg-[var(--color-raise)]/60 p-3">
                      <span className="text-[10px] text-[var(--color-faint)] block uppercase">Pricing</span>
                      <span className="text-[var(--color-ink)] font-semibold">Custom Scoped</span>
                    </div>
                    <div className="rounded-xl border border-[var(--color-line)] bg-[var(--color-raise)]/60 p-3">
                      <span className="text-[10px] text-[var(--color-faint)] block uppercase">First Review</span>
                      <span className="text-[var(--color-orchid)] font-semibold">&lt; 24h SLA</span>
                    </div>
                  </div>

                  <div className="pt-2">
                    <p className="text-xs text-[var(--color-muted)] italic leading-relaxed">
                      &ldquo;Every build is custom scoped to exact specifications with zero templates and live milestone verification.&rdquo;
                    </p>
                  </div>
                </div>
              </TiltCard>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------ MARQUEE ------------------------------ */}
      <Marquee items={SERVICE_DEFINITIONS.map((s) => s.name)} />

      {/* ------------------------------ SERVICES ----------------------------- */}
      <section id="services" className="relative mx-auto max-w-7xl px-4 sm:px-6 py-16 sm:py-24 lg:px-8">
        <Reveal className="max-w-2xl">
          <span className="font-mono text-xs font-semibold uppercase tracking-[0.25em] text-[var(--color-orchid)]">
            {t('servicesHeadingKicker')}
          </span>
          <h2 className="mt-4 font-display text-2xl sm:text-5xl font-bold leading-tight text-[var(--color-ink)]">
            {t('servicesTitle')}
          </h2>
          <p className="mt-4 text-sm sm:text-base leading-relaxed text-[var(--color-muted)]">
            {t('servicesSubtitle')}
          </p>
        </Reveal>

        <div className="mt-10 sm:mt-14 grid gap-5 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {SERVICE_DEFINITIONS.map((service, i) => (
            <Reveal key={service.slug} delay={i * 0.05} className={i === 6 ? 'sm:col-span-2 lg:col-span-1' : ''}>
              <TiltCard
                onClick={() => navigate(`/services/${service.slug}`)}
                className="glass group relative flex h-full flex-col justify-between rounded-2xl p-5 sm:p-7 cursor-pointer hover:border-violet-500/40"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-[var(--color-orchid)]">
                      0{i + 1}
                    </span>
                    <span className="font-mono text-[11px] text-[var(--color-faint)]">
                      {t('customScopeBadge')}
                    </span>
                  </div>

                  <h3 className="mt-4 sm:mt-5 font-display text-lg sm:text-xl font-bold text-[var(--color-ink)] group-hover:text-[var(--color-orchid)] transition-colors">
                    {service.name}
                  </h3>
                  <p className="mt-2 text-xs sm:text-sm leading-relaxed text-[var(--color-muted)]">
                    {service.tagline}
                  </p>

                  <div className="mt-5 sm:mt-6 flex flex-wrap gap-2">
                    {service.features.slice(0, 3).map((f) => (
                      <span
                        key={f}
                        className="rounded-md border border-[var(--color-line)] bg-[var(--color-raise)] px-2.5 py-1 text-[11px] text-[var(--color-muted)]"
                      >
                        {f}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mt-6 sm:mt-8 flex items-center justify-between border-t border-[var(--color-line)] pt-4 text-xs font-semibold text-[var(--color-orchid)]">
                  <span>{t('viewService')}</span>
                  <IconArrow className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </div>
              </TiltCard>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ------------------------------ PROCESS ------------------------------ */}
      <section id="process" className="relative border-y border-[var(--color-line)] bg-[var(--color-abyss)] py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Reveal className="max-w-2xl">
            <span className="font-mono text-xs font-semibold uppercase tracking-[0.25em] text-[var(--color-orchid)]">
              {t('processKicker')}
            </span>
            <h2 className="mt-4 font-display text-2xl sm:text-5xl font-bold leading-tight text-[var(--color-ink)]">
              {t('processTitle')}
            </h2>
          </Reveal>

          <div className="mt-10 sm:mt-14 grid gap-5 sm:gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((s, i) => (
              <Reveal key={s.n} delay={i * 0.08}>
                <div className="relative h-full rounded-2xl border border-[var(--color-line)] bg-[var(--color-raise)]/60 p-5 sm:p-6 hover:border-violet-500/40 transition">
                  <span className="font-display text-3xl sm:text-4xl font-extrabold text-[var(--color-orchid)]/30 block mb-3">
                    {s.n}
                  </span>
                  <h3 className="font-display text-base sm:text-lg font-bold text-[var(--color-ink)]">
                    {s.title}
                  </h3>
                  <p className="mt-2 text-xs sm:text-sm leading-relaxed text-[var(--color-muted)]">
                    {s.body}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------- PILLARS ------------------------------ */}
      <section className="relative mx-auto max-w-7xl px-4 sm:px-6 py-16 sm:py-24 lg:px-8">
        <div className="grid gap-10 sm:gap-12 lg:grid-cols-[0.9fr_1.1fr]">
          <Reveal>
            <span className="font-mono text-xs font-semibold uppercase tracking-[0.25em] text-[var(--color-orchid)]">
              {t('pillarsKicker')}
            </span>
            <h2 className="mt-4 font-display text-2xl sm:text-5xl font-bold leading-tight text-[var(--color-ink)]">
              {t('pillarsTitle')}
            </h2>
            <p className="mt-4 sm:mt-5 text-sm sm:text-base leading-relaxed text-[var(--color-muted)]">
              We operate as a compact, senior engineering team. No bureaucratic layers or outsourced handoffs — the experts you consult with are the engineers executing your build.
            </p>

            <div className="mt-6 sm:mt-8 rounded-2xl border border-[var(--color-line)] bg-[var(--color-raise)] p-5 sm:p-6 space-y-3">
              <div className="flex items-center gap-2 font-display text-base font-bold text-[var(--color-ink)]">
                <IconCheck className="h-5 w-5 text-emerald-400 shrink-0" />
                <span>Verified Direct Dialogue</span>
              </div>
              <p className="text-xs sm:text-sm text-[var(--color-muted)] leading-relaxed">
                We evaluate timeline, technical feasibility, and production milestones before any contract is finalized.
              </p>
            </div>
          </Reveal>

          <div className="grid gap-4 sm:grid-cols-2">
            {PILLARS.map((p, i) => (
              <Reveal key={p.title} delay={i * 0.08}>
                <div className="glass h-full rounded-2xl p-5 sm:p-6">
                  <span className="flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-xl bg-violet-500/10 text-[var(--color-orchid)] mb-4">
                    <p.icon className="h-5 w-5" />
                  </span>
                  <h3 className="font-display text-base font-bold text-[var(--color-ink)]">
                    {p.title}
                  </h3>
                  <p className="mt-2 text-xs sm:text-sm leading-relaxed text-[var(--color-muted)]">
                    {p.body}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------ COMMUNITY ----------------------------- */}
      <section id="community" className="relative border-y border-[var(--color-line)] bg-[var(--color-abyss)] py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col lg:flex-row items-center justify-between gap-8 sm:gap-10">
          <Reveal className="max-w-2xl">
            <span className="font-mono text-xs font-semibold uppercase tracking-[0.25em] text-[var(--color-royal)]">
              {t('communityKicker')}
            </span>
            <h2 className="mt-4 font-display text-2xl sm:text-4xl font-bold leading-tight text-[var(--color-ink)]">
              {t('communityTitle')}
            </h2>
            <p className="mt-3 sm:mt-4 text-sm sm:text-base text-[var(--color-muted)] leading-relaxed">
              {t('communityDesc')}
            </p>
          </Reveal>

          <Reveal delay={0.15} className="w-full lg:w-auto">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 sm:gap-4 w-full">
              <a
                href={OFFICIAL_CHANNELS.discord}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-3 rounded-2xl border border-[#5865F2]/40 bg-[#5865F2]/10 px-4 sm:px-6 py-3.5 sm:py-4 transition hover:-translate-y-1 hover:bg-[#5865F2]/20 hover:shadow-xl w-full sm:w-auto"
              >
                <span className="flex h-10 w-10 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-xl bg-[#5865F2] text-white">
                  <IconDiscord className="h-5 w-5 sm:h-6 sm:w-6" />
                </span>
                <span className="text-left min-w-0">
                  <span className="block font-display text-sm sm:text-base font-bold text-[var(--color-ink)] truncate">
                    {t('joinDiscord')}
                  </span>
                </span>
              </a>

              <a
                href={OFFICIAL_CHANNELS.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-3 rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 sm:px-6 py-3.5 sm:py-4 transition hover:-translate-y-1 hover:bg-rose-500/20 hover:shadow-xl w-full sm:w-auto"
              >
                <span className="flex h-10 w-10 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 text-white">
                  <IconInstagram className="h-5 w-5 sm:h-6 sm:w-6" />
                </span>
                <span className="text-left min-w-0">
                  <span className="block font-display text-sm sm:text-base font-bold text-[var(--color-ink)] truncate">
                    {t('followInstagram')}
                  </span>
                </span>
              </a>
            </div>
          </Reveal>
        </div>
      </section>

      {/* -------------------------------- CTA -------------------------------- */}
      <section className="relative mx-auto max-w-7xl px-4 sm:px-6 py-16 sm:py-24 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl border border-violet-500/30 bg-gradient-to-br from-violet-600/15 via-[var(--color-panel)] to-blue-600/15 px-4 sm:px-16 py-12 sm:py-16 text-center shadow-2xl">
          <Reveal>
            <h2 className="mx-auto max-w-2xl font-display text-2xl sm:text-5xl font-extrabold leading-tight text-[var(--color-ink)]">
              {t('ctaTitle')}
            </h2>
            <p className="mx-auto mt-3 sm:mt-4 max-w-xl text-sm sm:text-base text-[var(--color-muted)]">
              {t('ctaSubtitle')}
            </p>

            <div className="mt-8 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3.5 sm:gap-4 max-w-md sm:max-w-none mx-auto">
              <button
                type="button"
                onClick={() => navigate('/project')}
                className="btn-grad group inline-flex items-center justify-center gap-2 rounded-xl px-6 sm:px-8 py-3.5 sm:py-4 font-display text-sm sm:text-base font-bold text-white shadow-xl cursor-pointer w-full sm:w-auto"
              >
                <span>{t('ctaButton')}</span>
                <IconArrow className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </button>

              <button
                type="button"
                onClick={() => navigate('/contact')}
                className="inline-flex items-center justify-center rounded-xl border border-[var(--color-line)] bg-[var(--color-raise)] px-6 sm:px-7 py-3.5 sm:py-4 font-display text-sm sm:text-base font-semibold text-[var(--color-ink)] hover:border-violet-500/50 transition cursor-pointer w-full sm:w-auto"
              >
                <span>{t('navContact')}</span>
              </button>
            </div>

            <div className="mt-8 flex flex-col sm:flex-row flex-wrap items-center justify-center gap-3 sm:gap-6 font-mono text-[11px] sm:text-xs text-[var(--color-faint)]">
              <span className="inline-flex items-center gap-1.5">
                <IconCheck className="h-4 w-4 text-emerald-400 shrink-0" />
                <span>Zero Public Markup</span>
              </span>
              <span className="inline-flex items-center gap-1.5">
                <IconCheck className="h-4 w-4 text-emerald-400 shrink-0" />
                <span>Custom Negotiated Scope</span>
              </span>
              <span className="inline-flex items-center gap-1.5">
                <IconCheck className="h-4 w-4 text-emerald-400 shrink-0" />
                <span>Real-Time Milestone Tracking</span>
              </span>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
