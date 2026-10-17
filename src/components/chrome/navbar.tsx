import { useState, useEffect } from 'react';
import { TcMonogram, IconMenu, IconX, IconToken, IconUser, IconShield, IconArrow } from '../icons';
import { ThemeToggle } from '../theme-toggle';
import { LangToggle } from '../lang-toggle';
import { useI18n } from '@/lib/i18n';
import { store } from '@/lib/store';
import { useToast } from '../toast';

interface NavbarProps {
  currentPath: string;
  navigate: (path: string) => void;
}

export function Navbar({ currentPath, navigate }: NavbarProps) {
  const { t } = useI18n();
  const { push } = useToast();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sessionUser, setSessionUser] = useState(store.getSessionUser());

  useEffect(() => {
    const unsub = store.subscribe(() => {
      setSessionUser(store.getSessionUser());
    });
    return unsub;
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleLogout = () => {
    store.logout();
    push('info', 'Logged out. See you soon.');
    navigate('/');
  };

  const navLinks = [
    { path: '/services', label: t('navServices') },
    { path: '/#process', label: t('navProcess') },
    { path: '/#community', label: t('navCommunity') },
    { path: '/contact', label: t('navContact') },
  ];

  const handleLinkClick = (path: string) => {
    setMobileMenuOpen(false);
    if (path.startsWith('/#')) {
      if (currentPath !== '/') {
        navigate('/');
        setTimeout(() => {
          const el = document.getElementById(path.slice(2));
          el?.scrollIntoView({ behavior: 'smooth' });
        }, 150);
      } else {
        const el = document.getElementById(path.slice(2));
        el?.scrollIntoView({ behavior: 'smooth' });
      }
    } else {
      navigate(path);
    }
  };

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        scrolled || mobileMenuOpen
          ? 'glass-strong border-b border-[var(--color-line)] shadow-sm'
          : 'border-b border-transparent bg-transparent'
      }`}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-3.5 sm:px-5 lg:px-8">
        {/* Zone 1: Clickable TC Monogram + Brand */}
        <button
          type="button"
          onClick={() => handleLinkClick('/')}
          className="group flex items-center gap-2.5 sm:gap-3 text-left cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-violet)] rounded-lg p-1"
          aria-label="THE CREATORS Homepage"
        >
          <TcMonogram className="h-8 w-8 sm:h-9 sm:w-9 transition-transform group-hover:scale-105 duration-200 shrink-0" />
          <div className="flex flex-col min-w-0">
            <span className="font-display text-xs sm:text-sm font-bold tracking-[0.16em] sm:tracking-[0.2em] text-[var(--color-ink)] truncate">
              THE CREATORS
            </span>
            <span className="font-mono text-[8px] sm:text-[9px] uppercase tracking-[0.16em] sm:tracking-[0.22em] text-[var(--color-orchid)] truncate">
              Build · Break · On Demand
            </span>
          </div>
        </button>

        {/* Zone 2: Navigation Links */}
        <nav className="hidden md:flex items-center gap-7">
          {navLinks.map((l) => (
            <button
              key={l.path}
              type="button"
              onClick={() => handleLinkClick(l.path)}
              className={`text-sm font-medium transition cursor-pointer ${
                currentPath === l.path
                  ? 'text-[var(--color-orchid)] font-semibold'
                  : 'text-[var(--color-muted)] hover:text-[var(--color-ink)]'
              }`}
            >
              {l.label}
            </button>
          ))}
        </nav>

        {/* Zone 3: Actions + Theme + Lang + Auth */}
        <div className="hidden md:flex items-center gap-3">
          <LangToggle />
          <ThemeToggle />

          {sessionUser ? (
            <div className="flex items-center gap-2 border-l border-[var(--color-line)] pl-3">
              {sessionUser.role === 'client' && (
                <button
                  type="button"
                  onClick={() => handleLinkClick('/dashboard')}
                  className="flex items-center gap-1.5 rounded-lg border border-[var(--color-line)] bg-[var(--color-raise)] px-2.5 py-1.5 font-mono text-xs text-[var(--color-ink)] hover:border-[var(--color-violet)] transition cursor-pointer"
                  title="Token wallet balance"
                >
                  <IconToken className="h-3.5 w-3.5 text-[var(--color-orchid)]" />
                  <span>{sessionUser.tokenBalance}</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => handleLinkClick(sessionUser.role === 'admin' ? '/admin' : '/dashboard')}
                className="flex items-center gap-2 rounded-lg border border-[var(--color-violet)]/40 bg-[var(--color-violet)]/10 px-3 py-1.5 text-xs font-semibold text-[var(--color-orchid)] hover:bg-[var(--color-violet)]/20 transition cursor-pointer"
              >
                {sessionUser.role === 'admin' ? (
                  <IconShield className="h-3.5 w-3.5 text-amber-400" />
                ) : (
                  <IconUser className="h-3.5 w-3.5" />
                )}
                <span>{sessionUser.role === 'admin' ? t('navAdmin') : t('navDashboard')}</span>
              </button>

              <button
                type="button"
                onClick={handleLogout}
                className="rounded-lg p-2 text-[var(--color-faint)] hover:text-[var(--color-ink)] hover:bg-[var(--color-raise)] transition cursor-pointer"
                title={t('navLogout')}
                aria-label={t('navLogout')}
              >
                <IconX className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 border-l border-[var(--color-line)] pl-3">
              <button
                type="button"
                onClick={() => handleLinkClick('/login')}
                className="px-3 py-1.5 text-xs font-semibold text-[var(--color-muted)] hover:text-[var(--color-ink)] transition cursor-pointer"
              >
                {t('navLogin')}
              </button>
              <button
                type="button"
                onClick={() => handleLinkClick('/register')}
                className="rounded-lg border border-[var(--color-line)] bg-[var(--color-raise)] px-3 py-1.5 text-xs font-semibold text-[var(--color-ink)] hover:border-[var(--color-violet)] transition cursor-pointer"
              >
                {t('navSignup')}
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={() => handleLinkClick('/project')}
            className="btn-grad flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold text-white shadow-md cursor-pointer ml-1"
          >
            <span>{t('navStartProject')}</span>
            <IconArrow className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Mobile menu hamburger */}
        <div className="flex items-center gap-2 md:hidden">
          <ThemeToggle />
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="rounded-lg p-2 text-[var(--color-ink)] hover:bg-[var(--color-raise)] transition"
            aria-label="Toggle mobile menu"
          >
            {mobileMenuOpen ? <IconX className="h-6 w-6" /> : <IconMenu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="border-b border-[var(--color-line)] bg-[var(--color-panel)] px-5 py-5 shadow-2xl md:hidden animate-in slide-in-from-top duration-200">
          <div className="flex items-center justify-between pb-4 border-b border-[var(--color-line)]">
            <LangToggle />
            {sessionUser && (
              <span className="font-mono text-xs text-[var(--color-orchid)]">
                {sessionUser.tokenBalance} tokens
              </span>
            )}
          </div>

          <div className="space-y-1.5 py-4">
            {navLinks.map((l) => (
              <button
                key={l.path}
                type="button"
                onClick={() => handleLinkClick(l.path)}
                className="block w-full text-left rounded-lg px-3 py-2 text-sm font-medium text-[var(--color-ink)] hover:bg-[var(--color-raise)]"
              >
                {l.label}
              </button>
            ))}
          </div>

          <div className="pt-3 border-t border-[var(--color-line)] space-y-2">
            <button
              type="button"
              onClick={() => handleLinkClick('/project')}
              className="btn-grad w-full py-3 rounded-xl text-center text-sm font-bold text-white shadow"
            >
              {t('navStartProject')}
            </button>

            {sessionUser ? (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => handleLinkClick(sessionUser.role === 'admin' ? '/admin' : '/dashboard')}
                  className="flex-1 py-2.5 rounded-xl border border-[var(--color-violet)] bg-[var(--color-violet)]/10 text-center text-xs font-semibold text-[var(--color-orchid)]"
                >
                  {sessionUser.role === 'admin' ? t('navAdmin') : t('navDashboard')}
                </button>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="px-4 py-2.5 rounded-xl border border-[var(--color-line)] text-center text-xs text-[var(--color-muted)] hover:text-rose-400"
                >
                  {t('navLogout')}
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => handleLinkClick('/login')}
                  className="flex-1 py-2.5 rounded-xl border border-[var(--color-line)] text-center text-xs font-semibold text-[var(--color-ink)]"
                >
                  {t('navLogin')}
                </button>
                <button
                  type="button"
                  onClick={() => handleLinkClick('/register')}
                  className="flex-1 py-2.5 rounded-xl bg-[var(--color-raise)] text-center text-xs font-semibold text-[var(--color-orchid)]"
                >
                  {t('navSignup')}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
