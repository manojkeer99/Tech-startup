import { useReducedMotion } from 'motion/react';
import { useI18n } from '@/lib/i18n';

export function TaglineStrip() {
  const { t } = useI18n();
  const reduce = useReducedMotion();
  const text = t('taglineBanner');

  return (
    <div
      role="region"
      aria-label="Direct Agreement Tagline"
      className="tagline-strip sticky top-16 z-40 w-full border-b border-[var(--color-line)] bg-[var(--color-abyss)]/95 backdrop-blur-md overflow-hidden py-1.5 sm:py-2 select-none"
    >
      <div className={`relative mx-auto flex items-center overflow-hidden ${reduce ? 'min-h-[1.5rem] py-1' : 'h-6'}`}>
        {/* Soft edge gradient fades */}
        <div
          className="pointer-events-none absolute left-0 inset-y-0 z-10 w-6 sm:w-16 bg-gradient-to-r from-[var(--color-abyss)] to-transparent"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute right-0 inset-y-0 z-10 w-6 sm:w-16 bg-gradient-to-l from-[var(--color-abyss)] to-transparent"
          aria-hidden="true"
        />

        {reduce ? (
          <div className="mx-auto flex items-center justify-center gap-2.5 px-3 sm:px-4 text-center font-mono text-[10px] sm:text-xs text-[var(--color-ink)] leading-snug">
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" />
            <span className="font-medium">{text}</span>
          </div>
        ) : (
          <div className="flex w-full overflow-hidden">
            {/* Track 1 */}
            <div className="flex shrink-0 items-center justify-around min-w-full gap-6 sm:gap-10 animate-tagline-marquee pr-6 sm:pr-10 whitespace-nowrap">
              <span className="flex items-center gap-2 font-mono text-[11px] sm:text-xs font-medium text-[var(--color-ink)] whitespace-nowrap">
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400 animate-pulse" />
                <span className="whitespace-nowrap">{text}</span>
              </span>
              <span className="text-[var(--color-orchid)]/60 text-xs select-none">✦</span>
              <span className="flex items-center gap-2 font-mono text-[11px] sm:text-xs font-medium text-[var(--color-ink)] whitespace-nowrap">
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400 animate-pulse" />
                <span className="whitespace-nowrap">{text}</span>
              </span>
              <span className="text-[var(--color-orchid)]/60 text-xs select-none">✦</span>
            </div>

            {/* Track 2 (Clone for infinite seamless loop) */}
            <div
              aria-hidden="true"
              className="flex shrink-0 items-center justify-around min-w-full gap-6 sm:gap-10 animate-tagline-marquee pr-6 sm:pr-10 whitespace-nowrap"
            >
              <span className="flex items-center gap-2 font-mono text-[11px] sm:text-xs font-medium text-[var(--color-ink)] whitespace-nowrap">
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400 animate-pulse" />
                <span className="whitespace-nowrap">{text}</span>
              </span>
              <span className="text-[var(--color-orchid)]/60 text-xs select-none">✦</span>
              <span className="flex items-center gap-2 font-mono text-[11px] sm:text-xs font-medium text-[var(--color-ink)] whitespace-nowrap">
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400 animate-pulse" />
                <span className="whitespace-nowrap">{text}</span>
              </span>
              <span className="text-[var(--color-orchid)]/60 text-xs select-none">✦</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
