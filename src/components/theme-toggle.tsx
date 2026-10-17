import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { ThemeMode } from '@/types';
import { IconSun, IconMoon, IconMonitor } from './icons';
import { useI18n } from '@/lib/i18n';

interface ThemeContextType {
  theme: ThemeMode;
  resolvedTheme: 'light' | 'dark';
  setTheme: (theme: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'system',
  resolvedTheme: 'dark',
  setTheme: () => {},
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeMode>('system');
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('dark');

  useEffect(() => {
    try {
      const stored = localStorage.getItem('tc_theme') as ThemeMode;
      if (stored === 'light' || stored === 'dark' || stored === 'system') {
        setThemeState(stored);
      }
    } catch {
      // Ignore
    }
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    const media = window.matchMedia('(prefers-color-scheme: dark)');

    const apply = (mode: ThemeMode) => {
      const isDark = mode === 'dark' || (mode === 'system' && media.matches);
      if (isDark) {
        root.classList.add('dark');
        root.classList.remove('light');
        setResolvedTheme('dark');
      } else {
        root.classList.remove('dark');
        root.classList.add('light');
        setResolvedTheme('light');
      }
    };

    apply(theme);

    const onMediaChange = () => {
      if (theme === 'system') {
        apply('system');
      }
    };

    media.addEventListener('change', onMediaChange);
    return () => media.removeEventListener('change', onMediaChange);
  }, [theme]);

  const setTheme = (mode: ThemeMode) => {
    setThemeState(mode);
    try {
      localStorage.setItem('tc_theme', mode);
    } catch {
      // Ignore
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}

export function ThemeToggle({ className = '' }: { className?: string }) {
  const { theme, setTheme } = useTheme();
  const { t } = useI18n();

  return (
    <div
      role="group"
      aria-label="Theme selection"
      className={`inline-flex items-center gap-0.5 rounded-lg border border-[var(--color-line)] bg-[var(--color-raise)] p-1 ${className}`}
    >
      <button
        type="button"
        onClick={() => setTheme('light')}
        title={t('themeLight')}
        className={`flex h-7 w-7 items-center justify-center rounded-md transition ${
          theme === 'light'
            ? 'bg-[var(--color-panel)] text-[var(--color-violet)] shadow-sm'
            : 'text-[var(--color-faint)] hover:text-[var(--color-ink)]'
        }`}
        aria-label="Switch to light mode"
      >
        <IconSun className="h-3.5 w-3.5" />
      </button>

      <button
        type="button"
        onClick={() => setTheme('dark')}
        title={t('themeDark')}
        className={`flex h-7 w-7 items-center justify-center rounded-md transition ${
          theme === 'dark'
            ? 'bg-[var(--color-panel)] text-[var(--color-orchid)] shadow-sm'
            : 'text-[var(--color-faint)] hover:text-[var(--color-ink)]'
        }`}
        aria-label="Switch to dark mode"
      >
        <IconMoon className="h-3.5 w-3.5" />
      </button>

      <button
        type="button"
        onClick={() => setTheme('system')}
        title={t('themeSystem')}
        className={`flex h-7 w-7 items-center justify-center rounded-md transition ${
          theme === 'system'
            ? 'bg-[var(--color-panel)] text-[var(--color-royal)] shadow-sm'
            : 'text-[var(--color-faint)] hover:text-[var(--color-ink)]'
        }`}
        aria-label="Switch to system theme"
      >
        <IconMonitor className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
