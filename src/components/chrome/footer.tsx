import { TcMonogram, IconDiscord, IconInstagram, IconMail, IconArrow } from '../icons';
import { useI18n } from '@/lib/i18n';
import { OFFICIAL_CHANNELS } from '@/lib/store';
import { SERVICE_DEFINITIONS } from '@/lib/service-meta';

interface FooterProps {
  navigate: (path: string) => void;
}

export function Footer({ navigate }: FooterProps) {
  const { t } = useI18n();

  return (
    <footer className="relative border-t border-[var(--color-line)] bg-[var(--color-abyss)] pt-12 sm:pt-16 pb-10 sm:pb-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-10 sm:gap-12 sm:grid-cols-2 lg:grid-cols-5">
          {/* Brand Column */}
          <div className="lg:col-span-2 space-y-4">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="flex items-center gap-3 cursor-pointer p-1 -ml-1 text-left"
              aria-label="THE CREATORS Home"
            >
              <TcMonogram className="h-9 w-9 shrink-0" />
              <div>
                <span className="font-display text-sm sm:text-base font-bold tracking-[0.18em] sm:tracking-[0.2em] text-[var(--color-ink)] block">
                  THE CREATORS
                </span>
                <span className="font-mono text-[9px] sm:text-[10px] uppercase tracking-[0.18em] sm:tracking-[0.22em] text-[var(--color-orchid)] block">
                  Build · Break · On Demand
                </span>
              </div>
            </button>

            <p className="text-xs sm:text-sm leading-relaxed text-[var(--color-muted)] max-w-sm">
              A premium engineering and digital production studio. Websites, applications, software, video post-production, game mods, and graphic design built to spec and tracked live.
            </p>

            {/* Official Social Links */}
            <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2.5 sm:gap-3 pt-2">
              <a
                href={OFFICIAL_CHANNELS.discord}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center sm:justify-start gap-2 rounded-xl border border-[var(--color-line)] bg-[var(--color-raise)] px-3.5 py-2.5 text-xs font-medium text-[var(--color-ink)] hover:border-[var(--color-violet)] hover:text-[var(--color-orchid)] transition"
              >
                <IconDiscord className="h-4 w-4 text-[#5865F2] shrink-0" />
                <span>Discord Community</span>
              </a>

              <a
                href={OFFICIAL_CHANNELS.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center sm:justify-start gap-2 rounded-xl border border-[var(--color-line)] bg-[var(--color-raise)] px-3.5 py-2.5 text-xs font-medium text-[var(--color-ink)] hover:border-[var(--color-rose)] hover:text-rose-400 transition"
              >
                <IconInstagram className="h-4 w-4 text-rose-400 shrink-0" />
                <span>Instagram</span>
              </a>
            </div>
          </div>

          {/* Disciplines / Services */}
          <div>
            <h5 className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-orchid)] mb-4">
              Disciplines
            </h5>
            <ul className="space-y-2.5 text-sm">
              {SERVICE_DEFINITIONS.map((s) => (
                <li key={s.slug}>
                  <button
                    type="button"
                    onClick={() => navigate(`/services/${s.slug}`)}
                    className="text-[var(--color-muted)] hover:text-[var(--color-ink)] transition cursor-pointer text-left"
                  >
                    {s.name}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Platform Navigation */}
          <div>
            <h5 className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-orchid)] mb-4">
              Platform
            </h5>
            <ul className="space-y-2.5 text-sm">
              <li>
                <button
                  type="button"
                  onClick={() => navigate('/project')}
                  className="text-[var(--color-muted)] hover:text-[var(--color-ink)] transition cursor-pointer"
                >
                  {t('navStartProject')}
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => navigate('/contact')}
                  className="text-[var(--color-muted)] hover:text-[var(--color-ink)] transition cursor-pointer"
                >
                  {t('navContact')}
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => navigate('/dashboard')}
                  className="text-[var(--color-muted)] hover:text-[var(--color-ink)] transition cursor-pointer"
                >
                  {t('navDashboard')}
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => navigate('/login')}
                  className="text-[var(--color-muted)] hover:text-[var(--color-ink)] transition cursor-pointer"
                >
                  {t('navLogin')}
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => navigate('/register')}
                  className="text-[var(--color-muted)] hover:text-[var(--color-ink)] transition cursor-pointer"
                >
                  {t('navSignup')}
                </button>
              </li>
            </ul>
          </div>

          {/* Direct Contact & Response SLA */}
          <div>
            <h5 className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-orchid)] mb-4">
              Direct Contact
            </h5>
            <div className="space-y-3 text-sm">
              <a
                href={`mailto:${OFFICIAL_CHANNELS.email}`}
                className="flex items-center gap-2 text-[var(--color-muted)] hover:text-[var(--color-ink)] transition break-all"
              >
                <IconMail className="h-4 w-4 shrink-0 text-[var(--color-orchid)]" />
                <span>{OFFICIAL_CHANNELS.email}</span>
              </a>

              <div className="rounded-xl border border-[var(--color-line)] bg-[var(--color-raise)] p-3 text-xs text-[var(--color-muted)] space-y-1">
                <p className="font-semibold text-[var(--color-ink)]">Response Guarantee</p>
                <p>Personal human evaluation within 24 hours of brief submission.</p>
              </div>

              <button
                type="button"
                onClick={() => navigate('/project')}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--color-orchid)] hover:underline pt-1 cursor-pointer"
              >
                <span>Submit a project brief</span>
                <IconArrow className="h-3 w-3" />
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-10 sm:mt-14 border-t border-[var(--color-line)] pt-6 sm:pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[var(--color-faint)] text-center sm:text-left">
          <p>© {new Date().getFullYear()} THE CREATORS PVT. LTD. All rights reserved.</p>
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-6 font-mono text-[10px] sm:text-[11px]">
            <span>Build · Break · On Demand</span>
            <span className="hidden sm:inline">·</span>
            <button
              type="button"
              onClick={() => navigate('/admin/login')}
              className="text-[var(--color-faint)] hover:text-[var(--color-orchid)] transition cursor-pointer"
            >
              Admin Access
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
