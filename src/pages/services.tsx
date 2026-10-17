import { Reveal, TiltCard } from '@/components/motion';
import { SERVICE_DEFINITIONS } from '@/lib/service-meta';
import { useI18n } from '@/lib/i18n';
import {
  IconWeb,
  IconApp,
  IconCpu,
  IconFilm,
  IconMod,
  IconPen,
  IconSpark,
  IconArrow,
  IconShield,
  IconCheck,
} from '@/components/icons';

const SERVICE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  'website-development': IconWeb,
  'application-development': IconApp,
  'software-development': IconCpu,
  'video-editing': IconFilm,
  'game-mods': IconMod,
  'graphic-design': IconPen,
  'custom-demand': IconSpark,
};

interface ServicesPageProps {
  navigate: (path: string) => void;
}

export function ServicesPage({ navigate }: ServicesPageProps) {
  const { t } = useI18n();

  return (
    <div className="relative mx-auto max-w-7xl px-4 sm:px-6 py-12 sm:py-16 lg:px-8 lg:py-24">
      {/* Ambient background glow */}
      <div className="pointer-events-none absolute -top-20 left-1/2 h-[420px] w-[720px] -translate-x-1/2 rounded-full bg-violet-600/10 blur-[130px]" aria-hidden="true" />

      {/* Header */}
      <Reveal className="max-w-3xl">
        <span className="font-mono text-xs font-semibold uppercase tracking-[0.25em] text-[var(--color-orchid)]">
          {t('servicesHeadingKicker')}
        </span>
        <h1 className="mt-4 font-display text-3xl sm:text-6xl font-extrabold leading-tight text-[var(--color-ink)]">
          Seven disciplines, <span className="text-gradient">one standard</span>
        </h1>
        <p className="mt-4 sm:mt-5 text-sm sm:text-lg leading-relaxed text-[var(--color-muted)]">
          Every project receives direct senior engineering attention, milestone-based transparent production, and live progress tracking. We discuss scope, requirements, and pricing directly with you.
        </p>

        {/* Pricing notice */}
        <div className="mt-6 inline-flex items-start gap-2.5 rounded-xl border border-[var(--color-line)] bg-[var(--color-raise)] px-3.5 py-2.5 text-xs text-[var(--color-muted)]">
          <IconShield className="h-4 w-4 text-[var(--color-orchid)] shrink-0 mt-0.5" />
          <span>Tailored Pricing Policy: All engagements are scoped individually through direct dialogue.</span>
        </div>
      </Reveal>

      {/* Service Grid */}
      <div className="mt-12 sm:mt-16 grid gap-5 sm:gap-6 md:grid-cols-2">
        {SERVICE_DEFINITIONS.map((s, i) => {
          const Icon = SERVICE_ICONS[s.slug] || IconSpark;

          return (
            <Reveal key={s.slug} delay={i * 0.05}>
              <TiltCard
                onClick={() => navigate(`/services/${s.slug}`)}
                className="glass group flex h-full flex-col justify-between rounded-2xl p-5 sm:p-8 cursor-pointer hover:border-violet-500/40"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <span className="flex h-12 w-12 sm:h-13 sm:w-13 items-center justify-center rounded-2xl border border-violet-500/25 bg-violet-500/10 text-[var(--color-orchid)] group-hover:bg-gradient-to-br group-hover:from-violet-600 group-hover:to-blue-600 group-hover:text-white transition-colors duration-200 shrink-0">
                      <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
                    </span>
                    <span className="font-mono text-xs font-semibold text-[var(--color-faint)]">
                      DISCIPLINE 0{i + 1}
                    </span>
                  </div>

                  <h2 className="mt-5 sm:mt-6 font-display text-xl sm:text-2xl font-bold text-[var(--color-ink)] group-hover:text-[var(--color-orchid)] transition-colors">
                    {s.name}
                  </h2>
                  <p className="mt-2 text-xs sm:text-sm leading-relaxed text-[var(--color-muted)]">
                    {s.tagline}
                  </p>

                  {/* Features List */}
                  <div className="mt-5 sm:mt-6 space-y-2 border-t border-[var(--color-line)] pt-4 sm:pt-5">
                    {s.features.slice(0, 3).map((f) => (
                      <div key={f} className="flex items-start gap-2.5 text-xs text-[var(--color-muted)]">
                        <IconCheck className="h-3.5 w-3.5 text-emerald-400 shrink-0 mt-0.5" />
                        <span>{f}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-6 sm:mt-8 flex items-center justify-between border-t border-[var(--color-line)] pt-4 text-xs font-semibold">
                  <span className="font-mono text-[11px] uppercase tracking-wider text-[var(--color-faint)]">
                    Custom Scope
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-[var(--color-orchid)] group-hover:gap-2.5 transition-all">
                    <span>{t('viewService')}</span>
                    <IconArrow className="h-3.5 w-3.5" />
                  </span>
                </div>
              </TiltCard>
            </Reveal>
          );
        })}
      </div>

      {/* Bespoke / Custom Demand Card */}
      <Reveal delay={0.15}>
        <div className="mt-10 sm:mt-12 rounded-3xl border border-violet-500/30 bg-gradient-to-br from-violet-600/10 via-[var(--color-panel)] to-blue-600/10 p-5 sm:p-10 text-center">
          <h3 className="font-display text-xl sm:text-2xl font-bold text-[var(--color-ink)]">
            Have a unique cross-discipline demand?
          </h3>
          <p className="mt-3 text-xs sm:text-sm text-[var(--color-muted)] max-w-xl mx-auto leading-relaxed">
            Not all software and creative builds fit into standard categories. We evaluate custom architectures, technical prototypes, research tools, and high-complexity challenges.
          </p>
          <div className="mt-6">
            <button
              type="button"
              onClick={() => navigate('/project?service=custom-demand')}
              className="btn-grad inline-flex items-center justify-center gap-2 rounded-xl px-5 sm:px-7 py-3.5 font-display text-sm font-bold text-white shadow-lg cursor-pointer w-full sm:w-auto"
            >
              <span>Submit Custom Demand Brief</span>
              <IconArrow className="h-4 w-4" />
            </button>
          </div>
        </div>
      </Reveal>
    </div>
  );
}
