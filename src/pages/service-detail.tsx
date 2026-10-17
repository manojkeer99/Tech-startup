import { Reveal } from '@/components/motion';
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
  IconCheck,
  IconShield,
  IconClock,
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

interface ServiceDetailPageProps {
  slug: string;
  navigate: (path: string) => void;
}

export function ServiceDetailPage({ slug, navigate }: ServiceDetailPageProps) {
  const { t } = useI18n();
  const service = SERVICE_DEFINITIONS.find((s) => s.slug === slug) || SERVICE_DEFINITIONS[0];
  const Icon = SERVICE_ICONS[service.slug] || IconSpark;
  const index = SERVICE_DEFINITIONS.findIndex((s) => s.slug === service.slug) + 1;
  const related = SERVICE_DEFINITIONS.filter((s) => s.slug !== service.slug).slice(0, 3);

  return (
    <div className="relative mx-auto max-w-7xl px-4 sm:px-6 py-10 sm:py-12 lg:px-8 lg:py-20">
      {/* Ambient glow */}
      <div className="pointer-events-none absolute -top-10 left-1/2 h-[380px] w-[700px] -translate-x-1/2 rounded-full bg-violet-600/10 blur-[130px]" aria-hidden="true" />

      {/* Breadcrumb */}
      <Reveal>
        <nav className="flex flex-wrap items-center gap-1.5 sm:gap-2 font-mono text-[10px] sm:text-[11px] uppercase tracking-[0.16em] sm:tracking-[0.2em] text-[var(--color-faint)]">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="hover:text-[var(--color-ink)] transition cursor-pointer"
          >
            {t('navHome')}
          </button>
          <span>/</span>
          <button
            type="button"
            onClick={() => navigate('/services')}
            className="hover:text-[var(--color-ink)] transition cursor-pointer"
          >
            {t('navServices')}
          </button>
          <span>/</span>
          <span className="text-[var(--color-orchid)]">{service.short}</span>
        </nav>
      </Reveal>

      {/* Main Header & Overview */}
      <div className="mt-8 sm:mt-10 grid gap-10 sm:gap-12 lg:grid-cols-[1.1fr_0.9fr]">
        <div>
          <Reveal>
            <div className="flex items-center gap-3.5 sm:gap-4">
              <span className="flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-blue-600 text-white shadow-lg shrink-0">
                <Icon className="h-7 w-7 sm:h-8 sm:w-8" />
              </span>
              <div>
                <span className="font-mono text-xs uppercase tracking-wider text-[var(--color-faint)] block">
                  DISCIPLINE 0{index}
                </span>
                <span className="font-mono text-xs text-emerald-400 font-semibold block">
                  Active for Intake
                </span>
              </div>
            </div>
          </Reveal>

          <Reveal delay={0.06}>
            <h1 className="mt-5 sm:mt-6 font-display text-3xl sm:text-6xl font-extrabold leading-tight text-[var(--color-ink)]">
              {service.name}
            </h1>
          </Reveal>

          <Reveal delay={0.12}>
            <p className="mt-3 sm:mt-4 font-display text-base sm:text-lg font-medium text-[var(--color-orchid)]">
              {service.tagline}
            </p>
          </Reveal>

          <Reveal delay={0.18}>
            <div className="mt-5 sm:mt-6 space-y-3.5 sm:space-y-4 text-sm sm:text-base leading-relaxed text-[var(--color-muted)]">
              {service.longDescription.map((p, idx) => (
                <p key={idx}>{p}</p>
              ))}
            </div>
          </Reveal>

          {/* Direct Scope notice */}
          <Reveal delay={0.22}>
            <div className="mt-6 rounded-xl border border-[var(--color-line)] bg-[var(--color-raise)] p-3.5 sm:p-4 text-xs text-[var(--color-muted)] flex items-start gap-2.5 sm:gap-3">
              <IconShield className="h-4 w-4 text-[var(--color-orchid)] shrink-0 mt-0.5" />
              <span>
                <strong>Tailored Pricing Notice:</strong> We do not publish flat dollar tiers. All timeline milestones and project pricing are negotiated directly based on your technical brief.
              </span>
            </div>
          </Reveal>

          <Reveal delay={0.26}>
            <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 sm:gap-4">
              <button
                type="button"
                onClick={() => navigate(`/project?service=${service.slug}`)}
                className="btn-grad group inline-flex items-center justify-center gap-2 rounded-xl px-5 sm:px-7 py-3.5 sm:py-4 font-display text-sm sm:text-base font-bold text-white shadow-xl cursor-pointer w-full sm:w-auto"
              >
                <span>Request This Service</span>
                <IconArrow className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </button>

              <button
                type="button"
                onClick={() => navigate('/contact')}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-[var(--color-line)] bg-[var(--color-raise)] px-5 sm:px-6 py-3.5 sm:py-4 font-display text-sm font-semibold text-[var(--color-ink)] hover:border-violet-500/40 transition cursor-pointer w-full sm:w-auto"
              >
                <span>Ask a Question</span>
              </button>
            </div>
          </Reveal>
        </div>

        {/* Deliverables & Features Box */}
        <Reveal delay={0.15}>
          <div className="grad-border glass rounded-3xl p-5 sm:p-8 space-y-6 sm:space-y-7">
            <div>
              <p className="font-mono text-xs font-semibold uppercase tracking-[0.25em] text-[var(--color-orchid)]">
                Key Engineering Capabilities
              </p>
              <ul className="mt-4 space-y-3">
                {service.features.map((f) => (
                  <li key={f} className="flex items-start gap-3 text-sm text-[var(--color-ink)]">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-violet-500/15 text-[var(--color-orchid)]">
                      <IconCheck className="h-3 w-3" />
                    </span>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="border-t border-[var(--color-line)] pt-6">
              <p className="font-mono text-xs font-semibold uppercase tracking-[0.25em] text-[var(--color-faint)]">
                Deliverables &amp; Artifacts
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {service.deliverables.map((d) => (
                  <span
                    key={d}
                    className="rounded-lg border border-[var(--color-line)] bg-[var(--color-raise)] px-3 py-1.5 text-xs text-[var(--color-muted)] font-medium"
                  >
                    {d}
                  </span>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-xs text-emerald-400 space-y-1">
              <p className="font-bold">Post-Delivery Guarantee</p>
              <p className="text-[var(--color-muted)]">Includes dedicated post-launch support and handoff session on every project.</p>
            </div>
          </div>
        </Reveal>
      </div>

      {/* Process Phases */}
      <div className="mt-12 sm:mt-20 border-t border-[var(--color-line)] pt-10 sm:pt-16">
        <Reveal>
          <span className="font-mono text-xs font-semibold uppercase tracking-[0.25em] text-[var(--color-orchid)]">
            Execution Flow
          </span>
          <h2 className="mt-3 font-display text-xl sm:text-4xl font-bold text-[var(--color-ink)]">
            How a {service.short} engagement runs
          </h2>
        </Reveal>

        <div className="mt-6 sm:mt-8 grid gap-3.5 sm:gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {service.process.map((step, i) => (
            <Reveal key={step} delay={i * 0.08}>
              <div className="relative h-full overflow-hidden rounded-2xl border border-[var(--color-line)] bg-[var(--color-raise)]/60 p-4 sm:p-6">
                <span className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--color-faint)] block">
                  Phase 0{i + 1}
                </span>
                <p className="mt-2.5 sm:mt-3 font-display text-sm sm:text-base font-bold text-[var(--color-ink)]">
                  {step}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>

      {/* Related Services */}
      <div className="mt-12 sm:mt-20 border-t border-[var(--color-line)] pt-10 sm:pt-16">
        <Reveal>
          <span className="font-mono text-xs font-semibold uppercase tracking-[0.25em] text-[var(--color-faint)]">
            Complementary Disciplines
          </span>
        </Reveal>

        <div className="mt-6 grid gap-3.5 sm:gap-4 sm:grid-cols-3">
          {related.map((rel, i) => {
            const RelIcon = SERVICE_ICONS[rel.slug] || IconSpark;
            return (
              <Reveal key={rel.slug} delay={i * 0.05}>
                <button
                  type="button"
                  onClick={() => navigate(`/services/${rel.slug}`)}
                  className="glass group flex items-center gap-3.5 sm:gap-4 rounded-2xl p-4 sm:p-5 text-left w-full hover:border-violet-500/40 transition cursor-pointer"
                >
                  <span className="flex h-10 w-10 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-xl bg-violet-500/10 text-[var(--color-orchid)] group-hover:bg-gradient-to-br group-hover:from-violet-600 group-hover:to-blue-600 group-hover:text-white transition-colors">
                    <RelIcon className="h-5 w-5" />
                  </span>
                  <div className="min-w-0">
                    <span className="block font-display text-sm font-bold text-[var(--color-ink)] group-hover:text-[var(--color-orchid)] truncate">
                      {rel.name}
                    </span>
                    <span className="mt-0.5 block font-mono text-[10px] text-[var(--color-faint)] truncate">
                      Custom Discussion
                    </span>
                  </div>
                </button>
              </Reveal>
            );
          })}
        </div>
      </div>
    </div>
  );
}
