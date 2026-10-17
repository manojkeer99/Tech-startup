import { useI18n } from '@/lib/i18n';
import { IconGlobe } from './icons';

export function LangToggle({ className = '' }: { className?: string }) {
  const { language, setLanguage } = useI18n();

  return (
    <div
      role="group"
      aria-label="Language selection"
      className={`inline-flex items-center gap-1 rounded-lg border border-[var(--color-line)] bg-[var(--color-raise)] p-1 ${className}`}
    >
      <span className="pl-1.5 pr-0.5 text-[var(--color-faint)]">
        <IconGlobe className="h-3.5 w-3.5" />
      </span>
      <button
        type="button"
        onClick={() => setLanguage('en')}
        className={`px-2 py-0.5 font-mono text-xs rounded transition ${
          language === 'en'
            ? 'bg-[var(--color-panel)] font-bold text-[var(--color-orchid)] shadow-sm'
            : 'text-[var(--color-faint)] hover:text-[var(--color-ink)]'
        }`}
        aria-label="Switch to English"
      >
        EN
      </button>
      <button
        type="button"
        onClick={() => setLanguage('hi')}
        className={`px-2 py-0.5 font-mono text-xs rounded transition ${
          language === 'hi'
            ? 'bg-[var(--color-panel)] font-bold text-[var(--color-orchid)] shadow-sm'
            : 'text-[var(--color-faint)] hover:text-[var(--color-ink)]'
        }`}
        aria-label="Switch to Hindi (हिंदी)"
      >
        HI
      </button>
    </div>
  );
}
