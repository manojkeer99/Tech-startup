import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { store, OFFICIAL_CHANNELS } from '@/lib/store';
import { useI18n } from '@/lib/i18n';
import { useToast } from '@/components/toast';
import { ProjectForm } from '@/components/project-form';
import {
  Button,
  Field,
  Input,
  Modal,
  ProgressBar,
  SectionLabel,
  StatusBadge,
  STATUS_META,
  EmptyState,
} from '@/components/ui';
import {
  TcMonogram,
  IconFolder,
  IconPlus,
  IconBell,
  IconUser,
  IconChart,
  IconLogout,
  IconDiscord,
  IconClock,
  IconEye,
  IconFile,
  IconSpark,
  IconCopy,
  IconCheck,
} from '@/components/icons';
import { formatDate, timeAgo } from '@/lib/utils';
import { fetchMyReferrals, type MyReferralsResponse } from '@/lib/admin-api';
import type { Project, Notification, PublicUser } from '@/types';

interface DashboardPageProps {
  navigate: (path: string) => void;
  initialTab?: string;
}

export function DashboardPage({ navigate, initialTab = 'overview' }: DashboardPageProps) {
  const { t } = useI18n();
  const { push } = useToast();
  const [tab, setTab] = useState(initialTab);
  const [sessionUser, setSessionUser] = useState<PublicUser | null>(store.getSessionUser());
  const [authChecking, setAuthChecking] = useState<boolean>(!store.isSessionChecked());

  useEffect(() => {
    if (initialTab) {
      setTab(initialTab);
    }
  }, [initialTab]);

  const [projects, setProjects] = useState<Project[]>([]);
  const [notifs, setNotifs] = useState<Notification[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [referralData, setReferralData] = useState<MyReferralsResponse | null>(null);
  const [referralsLoading, setReferralsLoading] = useState(false);
  const [copiedRefLink, setCopiedRefLink] = useState(false);

  // Profile forms
  const [profileForm, setProfileForm] = useState({
    name: sessionUser?.name || '',
    phone: sessionUser?.phone || '',
    age: sessionUser?.age ? String(sessionUser.age) : '',
  });
  const [pwForm, setPwForm] = useState({ current: '', next: '', confirm: '' });
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPw, setSavingPw] = useState(false);

  const loadReferrals = () => {
    setReferralsLoading(true);
    fetchMyReferrals()
      .then((res) => {
        setReferralData(res);
      })
      .catch(() => {})
      .finally(() => {
        setReferralsLoading(false);
      });
  };

  useEffect(() => {
    let active = true;

    const syncFromStore = () => {
      if (!active) return;
      const user = store.getSessionUser();
      const checked = store.isSessionChecked();
      setSessionUser(user);
      setAuthChecking(!checked);

      if (user) {
        setProfileForm({
          name: user.name,
          phone: user.phone || '',
          age: user.age ? String(user.age) : '',
        });
        setProjects(store.getProjects(user.id));
        setNotifs(store.getNotifications(user.id));
      } else if (checked) {
        navigate('/login');
      }
    };

    syncFromStore();

    store.checkSession().then((verifiedUser) => {
      if (!active) return;
      if (verifiedUser) {
        loadReferrals();
        store.syncServerProjects().catch(() => {});
      } else {
        navigate('/login');
      }
    });

    const unsub = store.subscribe(syncFromStore);
    return () => {
      active = false;
      unsub();
    };
  }, []);

  useEffect(() => {
    if (tab === 'referrals' && sessionUser) {
      loadReferrals();
    }
  }, [tab, sessionUser?.id]);

  if (authChecking && !sessionUser) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--color-void)] p-6 text-center">
        <TcMonogram className="h-12 w-12 mb-4 animate-pulse" />
        <p className="font-mono text-xs uppercase tracking-widest text-[var(--color-muted)]">
          Verifying your session...
        </p>
      </div>
    );
  }

  if (!sessionUser) return null;

  const unreadCount = notifs.filter((n) => !n.read).length;

  const handleLogout = async () => {
    await store.logout();
    push('info', 'Logged out.');
    navigate('/');
  };

  const handleProfileSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    const ok = store.updateUserProfile(sessionUser.id, {
      name: profileForm.name,
      phone: profileForm.phone,
      age: profileForm.age ? Number(profileForm.age) : null,
    });
    setSavingProfile(false);
    if (ok) {
      push('success', 'Profile updated successfully.');
    } else {
      push('error', 'Failed to update profile.');
    }
  };

  const handlePasswordSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pwForm.next !== pwForm.confirm) {
      return push('error', "New passwords don't match.");
    }
    if (pwForm.next.length < 8) {
      return push('error', 'New password must be at least 8 characters.');
    }

    setSavingPw(true);
    const res = await store.changePassword(sessionUser.id, pwForm.current, pwForm.next);
    setSavingPw(false);

    if (res.success) {
      push('success', 'Password updated.');
      setPwForm({ current: '', next: '', confirm: '' });
    } else {
      push('error', res.error || 'Password update failed.');
    }
  };

  const handleMarkAllRead = () => {
    store.markAllNotificationsRead(sessionUser.id);
    push('success', 'All notifications marked as read.');
  };

  const TABS = [
    { id: 'overview', label: 'Overview', icon: IconChart },
    { id: 'projects', label: t('myProjects'), icon: IconFolder },
    { id: 'new', label: t('newProject'), icon: IconPlus },
    { id: 'referrals', label: 'My Referrals', icon: IconSpark },
    { id: 'notifications', label: t('notifications'), icon: IconBell, count: unreadCount },
    { id: 'profile', label: t('profile'), icon: IconUser },
  ];

  const PUBLIC_LINKS = [
    { path: '/', label: 'Homepage' },
    { path: '/services', label: t('navServices') },
    { path: '/project', label: t('navStartProject') },
    { path: '/refer-and-earn', label: 'Refer & Earn (10%)' },
    { path: '/contact', label: t('navContact') },
  ];

  return (
    <div className="flex min-h-screen bg-[var(--color-void)]">
      {/* Sidebar (Desktop) */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-[var(--color-line)] bg-[var(--color-abyss)] lg:flex">
        <button
          type="button"
          onClick={() => navigate('/')}
          className="flex items-center gap-3 border-b border-[var(--color-line)] px-6 py-5 text-left cursor-pointer hover:bg-[var(--color-raise)]/40 transition"
          title="Return to THE CREATORS Homepage"
        >
          <TcMonogram className="h-8 w-8" />
          <div>
            <span className="font-display text-sm font-bold tracking-[0.2em] text-[var(--color-ink)] block">
              THE CREATORS
            </span>
            <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-[var(--color-orchid)] block">
              Client Portal
            </span>
          </div>
        </button>

        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
          <div>
            <p className="px-3 font-mono text-[10px] uppercase tracking-[0.25em] text-[var(--color-faint)]">
              Dashboard
            </p>
            <nav className="mt-3 space-y-1">
              {TABS.map((tItem) => (
                <button
                  key={tItem.id}
                  type="button"
                  onClick={() => setTab(tItem.id)}
                  className={`flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-semibold transition cursor-pointer ${
                    tab === tItem.id
                      ? 'bg-violet-500/15 text-[var(--color-orchid)]'
                      : 'text-[var(--color-muted)] hover:bg-[var(--color-raise)] hover:text-[var(--color-ink)]'
                  }`}
                >
                  <tItem.icon className="h-4.5 w-4.5" />
                  <span>{tItem.label}</span>
                  {tItem.count !== undefined && tItem.count > 0 && (
                    <span className="ml-auto rounded-full bg-violet-600 px-1.5 py-0.5 font-mono text-[10px] font-bold text-white">
                      {tItem.count}
                    </span>
                  )}
                </button>
              ))}
            </nav>
          </div>

          {/* Public Website Navigation (Never signs out) */}
          <div className="border-t border-[var(--color-line)] pt-5">
            <p className="px-3 font-mono text-[10px] uppercase tracking-[0.25em] text-[var(--color-faint)]">
              Explore Website
            </p>
            <nav className="mt-2.5 space-y-1">
              {PUBLIC_LINKS.map((link) => (
                <button
                  key={link.path}
                  type="button"
                  onClick={() => navigate(link.path)}
                  className="flex w-full items-center justify-between rounded-xl px-3.5 py-2 text-xs font-medium text-[var(--color-muted)] hover:bg-[var(--color-raise)] hover:text-[var(--color-ink)] transition cursor-pointer"
                >
                  <span>{link.label}</span>
                  <span className="font-mono text-[10px] text-[var(--color-faint)]">&rarr;</span>
                </button>
              ))}
              {sessionUser.role === 'admin' && (
                <button
                  type="button"
                  onClick={() => navigate('/admin')}
                  className="flex w-full items-center justify-between rounded-xl px-3.5 py-2 text-xs font-semibold text-amber-300 hover:bg-amber-500/10 transition cursor-pointer"
                >
                  <span>Admin Console</span>
                  <span className="font-mono text-[10px]">&rarr;</span>
                </button>
              )}
            </nav>
          </div>

          {/* Official Community Link */}
          <a
            href={OFFICIAL_CHANNELS.discord}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2.5 rounded-xl border border-[#5865F2]/30 bg-[#5865F2]/10 p-3 text-xs font-medium text-[#5865F2] hover:bg-[#5865F2]/20 transition"
          >
            <IconDiscord className="h-4 w-4" />
            <span>Join Discord Community</span>
          </a>
        </div>

        {/* User Footer */}
        <div className="border-t border-[var(--color-line)] p-4 flex items-center justify-between gap-2">
          <div className="min-w-0 flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-violet-600 to-blue-600 text-xs font-bold text-white shrink-0">
              {sessionUser.name.charAt(0).toUpperCase()}
            </span>
            <div className="min-w-0">
              <p className="truncate text-xs font-bold text-[var(--color-ink)]">{sessionUser.name}</p>
              <p className="truncate text-[10px] text-[var(--color-faint)] font-mono">{sessionUser.email}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex items-center gap-1 rounded-lg border border-[var(--color-line)] px-2.5 py-1.5 text-[11px] font-medium text-[var(--color-muted)] hover:text-rose-400 hover:border-rose-500/30 transition cursor-pointer shrink-0"
            title="Sign Out"
          >
            <IconLogout className="h-3.5 w-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="min-w-0 flex-1 lg:pl-64">
        {/* Mobile Top Bar */}
        <div className="sticky top-0 z-30 flex flex-col border-b border-[var(--color-line)] bg-[var(--color-abyss)] px-4 py-3 lg:hidden">
          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="flex items-center gap-2 cursor-pointer"
              title="Return to THE CREATORS Homepage"
            >
              <TcMonogram className="h-7 w-7" />
              <span className="font-display text-xs font-bold tracking-wider">THE CREATORS</span>
            </button>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => navigate('/')}
                className="rounded-lg border border-[var(--color-line)] bg-[var(--color-raise)] px-2.5 py-1 text-[11px] font-semibold text-[var(--color-ink)] hover:border-[var(--color-violet)] transition cursor-pointer"
              >
                Home
              </button>
              <button
                type="button"
                onClick={() => navigate('/services')}
                className="rounded-lg border border-[var(--color-line)] bg-[var(--color-raise)] px-2.5 py-1 text-[11px] font-semibold text-[var(--color-ink)] hover:border-[var(--color-violet)] transition cursor-pointer"
              >
                Services
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex items-center gap-1 rounded-lg border border-[var(--color-line)] px-2 py-1 text-[11px] text-[var(--color-muted)] hover:text-rose-400 cursor-pointer"
                title="Sign Out"
              >
                <IconLogout className="h-3.5 w-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>

          {/* Mobile Tabs Scroll */}
          <div className="mt-2.5 flex gap-1.5 overflow-x-auto pb-1">
            {TABS.map((tItem) => (
              <button
                key={tItem.id}
                type="button"
                onClick={() => setTab(tItem.id)}
                className={`shrink-0 rounded-lg px-3 py-1 text-xs font-semibold transition ${
                  tab === tItem.id
                    ? 'bg-violet-500/20 text-[var(--color-orchid)]'
                    : 'text-[var(--color-muted)] hover:bg-[var(--color-raise)]'
                }`}
              >
                {tItem.label}
              </button>
            ))}
          </div>
        </div>

        {/* Dynamic Tab Panes */}
        <div className="mx-auto max-w-5xl px-4 py-8 sm:px-8 lg:py-12">
          {tab === 'overview' && (
            <div className="space-y-10">
              <div>
                <SectionLabel>Client Operations</SectionLabel>
                <h1 className="mt-3 font-display text-3xl sm:text-4xl font-extrabold text-[var(--color-ink)]">
                  Welcome back, <span className="text-gradient">{sessionUser.name.split(' ')[0]}</span>
                </h1>
                <p className="mt-2 text-sm text-[var(--color-muted)]">
                  Here is the real-time status of your projects and milestone pipeline.
                </p>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <div className="glass rounded-2xl p-5">
                  <span className="text-xs uppercase tracking-wider text-[var(--color-faint)] block">Active Projects</span>
                  <p className="mt-2 font-display text-3xl font-extrabold text-blue-400">
                    {projects.filter((p) => ['approved', 'in_progress', 'delivered'].includes(p.status)).length}
                  </p>
                </div>
                <div className="glass rounded-2xl p-5">
                  <span className="text-xs uppercase tracking-wider text-[var(--color-faint)] block">Total Briefs</span>
                  <p className="mt-2 font-display text-3xl font-extrabold text-[var(--color-ink)]">{projects.length}</p>
                </div>
                <div className="glass rounded-2xl p-5">
                  <span className="text-xs uppercase tracking-wider text-[var(--color-faint)] block">Completed</span>
                  <p className="mt-2 font-display text-3xl font-extrabold text-emerald-400">
                    {projects.filter((p) => p.status === 'completed').length}
                  </p>
                </div>
                <div className="glass rounded-2xl p-5">
                  <span className="text-xs uppercase tracking-wider text-[var(--color-faint)] block">Member Since</span>
                  <p className="mt-2 font-display text-sm font-semibold text-[var(--color-muted)]">{formatDate(sessionUser.createdAt)}</p>
                </div>
              </div>

              {/* Recent Projects and Updates */}
              <div className="grid gap-8 lg:grid-cols-[1.3fr_0.9fr]">
                {/* Recent Projects */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="font-display text-lg font-bold text-[var(--color-ink)]">
                      Recent Project Briefs
                    </h2>
                    <button
                      type="button"
                      onClick={() => setTab('new')}
                      className="text-xs font-semibold text-[var(--color-orchid)] hover:underline cursor-pointer"
                    >
                      + {t('newProject')}
                    </button>
                  </div>

                  {projects.length === 0 ? (
                    <EmptyState
                      icon={<IconFolder className="h-6 w-6" />}
                      title={t('noProjectsYet')}
                      body={t('submitFirstProject')}
                    />
                  ) : (
                    <div className="space-y-3">
                      {projects.slice(0, 4).map((p) => (
                        <div
                          key={p.id}
                          onClick={() => setSelectedProject(p)}
                          className="glass card-lift rounded-2xl p-5 cursor-pointer hover:border-violet-500/40"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="font-display text-base font-bold text-[var(--color-ink)]">{p.title}</p>
                              <p className="font-mono text-xs text-[var(--color-orchid)] mt-0.5">{p.projectId}</p>
                            </div>
                            <StatusBadge status={p.status} />
                          </div>
                          <div className="mt-4">
                            <div className="flex items-center justify-between text-xs text-[var(--color-faint)] mb-1.5 font-mono">
                              <span>Milestone Progress</span>
                              <span>{p.progress}%</span>
                            </div>
                            <ProgressBar value={p.progress} />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Notifications & Updates */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="font-display text-lg font-bold text-[var(--color-ink)]">
                      Latest Updates
                    </h2>
                    {unreadCount > 0 && (
                      <button
                        type="button"
                        onClick={handleMarkAllRead}
                        className="text-xs text-[var(--color-orchid)] hover:underline cursor-pointer"
                      >
                        {t('markAllRead')}
                      </button>
                    )}
                  </div>

                  {notifs.length === 0 ? (
                    <p className="rounded-2xl border border-dashed border-[var(--color-line)] p-6 text-center text-xs text-[var(--color-faint)]">
                      No notifications yet.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {notifs.slice(0, 4).map((n) => (
                        <div
                          key={n.id}
                          className={`rounded-xl border p-4 text-xs transition ${
                            n.read
                              ? 'border-[var(--color-line)] bg-[var(--color-raise)]/40 text-[var(--color-muted)]'
                              : 'border-violet-500/30 bg-violet-500/10 text-[var(--color-ink)]'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-bold truncate">{n.title}</span>
                            <span className="font-mono text-[10px] text-[var(--color-faint)] shrink-0">
                              {timeAgo(n.createdAt)}
                            </span>
                          </div>
                          <p className="mt-1 leading-relaxed text-[var(--color-muted)]">{n.body}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {tab === 'projects' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <SectionLabel>Pipeline</SectionLabel>
                  <h1 className="mt-2 font-display text-3xl font-bold text-[var(--color-ink)]">
                    {t('myProjects')}
                  </h1>
                </div>
                <Button onClick={() => setTab('new')}>
                  <IconPlus className="h-4 w-4" /> <span>{t('newProject')}</span>
                </Button>
              </div>

              {projects.length === 0 ? (
                <EmptyState
                  icon={<IconFolder className="h-6 w-6" />}
                  title={t('noProjectsYet')}
                  body={t('submitFirstProject')}
                />
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  {projects.map((p) => (
                    <div
                      key={p.id}
                      onClick={() => setSelectedProject(p)}
                      className="glass card-lift rounded-2xl p-6 cursor-pointer hover:border-violet-500/40 flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="font-mono text-xs text-[var(--color-orchid)] block">{p.projectId}</span>
                            <h3 className="font-display text-base font-bold text-[var(--color-ink)] mt-1">{p.title}</h3>
                          </div>
                          <StatusBadge status={p.status} />
                        </div>
                        <p className="mt-3 text-xs text-[var(--color-muted)] line-clamp-2">{p.description}</p>
                      </div>

                      <div className="mt-6 border-t border-[var(--color-line)] pt-4">
                        <div className="flex items-center justify-between text-xs text-[var(--color-faint)] font-mono mb-2">
                          <span>{p.status.replace('_', ' ').toUpperCase()}</span>
                          <span>{p.progress}%</span>
                        </div>
                        <ProgressBar value={p.progress} />
                        <div className="mt-3 flex items-center justify-between text-[11px] text-[var(--color-faint)] font-mono">
                          <span>{formatDate(p.createdAt)}</span>
                          <span className="text-[var(--color-orchid)] flex items-center gap-1 font-semibold">
                            <IconEye className="h-3.5 w-3.5" /> View updates ({p.updates.length})
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {tab === 'new' && (
            <div className="space-y-6">
              <div>
                <SectionLabel>Intake Brief</SectionLabel>
                <h1 className="mt-2 font-display text-3xl font-bold text-[var(--color-ink)]">
                  {t('newProject')}
                </h1>
                <p className="mt-1 text-sm text-[var(--color-muted)]">
                  Your client details are pre-filled. Submitted briefs instantly appear in your active pipeline.
                </p>
              </div>

              <div className="grad-border glass rounded-3xl p-6 sm:p-8">
                <ProjectForm
                  compact
                  navigate={navigate}
                  onComplete={() => {
                    store.syncServerProjects();
                    setTab('projects');
                  }}
                />
              </div>
            </div>
          )}

          {tab === 'referrals' && (
            <div className="space-y-8">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <SectionLabel>Refer &amp; Earn · 10% Commission</SectionLabel>
                  <h1 className="mt-2 font-display text-3xl font-bold text-[var(--color-ink)]">
                    My Referrals
                  </h1>
                  <p className="mt-1 text-sm text-[var(--color-muted)]">
                    Share your unique referral link and earn a 10% commission when a referred client completes an eligible project payment.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => navigate('/refer-and-earn')}>
                    Program Rules
                  </Button>
                  <Button variant="ghost" size="sm" onClick={loadReferrals} loading={referralsLoading}>
                    Refresh
                  </Button>
                </div>
              </div>

              {/* Personal Referral Link Card */}
              <div className="grad-border glass rounded-2xl p-6 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <span className="font-mono text-[11px] uppercase tracking-wider text-[var(--color-orchid)] font-semibold block">
                      Personal Shareable Referral Link
                    </span>
                    <p className="text-xs text-[var(--color-muted)] mt-0.5">
                      New clients who arrive via this link and submit a project brief are automatically attributed to your account.
                    </p>
                  </div>
                  {referralData?.referralCode && (
                    <span className="rounded-lg border border-violet-500/30 bg-violet-500/15 px-2.5 py-1 font-mono text-xs font-bold text-violet-300">
                      Code: {referralData.referralCode}
                    </span>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  <div className="flex-1 rounded-xl border border-[var(--color-line)] bg-[var(--color-abyss)] px-4 py-3 font-mono text-xs text-[var(--color-ink)] truncate select-all">
                    {referralData?.referralCode
                      ? `${window.location.origin}/refer-and-earn?ref=${referralData.referralCode}`
                      : sessionUser.referralCode
                        ? `${window.location.origin}/refer-and-earn?ref=${sessionUser.referralCode}`
                        : 'Loading your referral link...'}
                  </div>
                  <Button
                    variant="primary"
                    onClick={() => {
                      const code = referralData?.referralCode || sessionUser.referralCode;
                      if (!code) return;
                      const url = `${window.location.origin}/refer-and-earn?ref=${code}`;
                      navigator.clipboard.writeText(url);
                      setCopiedRefLink(true);
                      push('success', 'Referral link copied to clipboard.');
                      setTimeout(() => setCopiedRefLink(false), 2500);
                    }}
                  >
                    {copiedRefLink ? <IconCheck className="h-4 w-4" /> : <IconCopy className="h-4 w-4" />}
                    <span>{copiedRefLink ? 'Copied' : 'Copy Link'}</span>
                  </Button>
                </div>
              </div>

              {/* Real Database-Backed Referral & Commission Metrics */}
              <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
                <div className="glass rounded-2xl p-4 sm:p-5">
                  <span className="text-[11px] font-mono uppercase tracking-wider text-[var(--color-faint)] block">
                    Attributed Requests
                  </span>
                  <p className="mt-2 font-display text-2xl sm:text-3xl font-extrabold text-[var(--color-ink)]">
                    {referralData?.summary.totalAttributedProjects ?? 0}
                  </p>
                  <span className="mt-1 text-[11px] text-[var(--color-muted)] block">
                    Submitted project briefs
                  </span>
                </div>

                <div className="glass rounded-2xl p-4 sm:p-5">
                  <span className="text-[11px] font-mono uppercase tracking-wider text-[var(--color-faint)] block">
                    Eligible Paid Referrals
                  </span>
                  <p className="mt-2 font-display text-2xl sm:text-3xl font-extrabold text-blue-400">
                    {referralData?.summary.eligibleCompletedReferrals ?? 0}
                  </p>
                  <span className="mt-1 text-[11px] text-[var(--color-muted)] block">
                    Verified client payments
                  </span>
                </div>

                <div className="glass rounded-2xl p-4 sm:p-5">
                  <span className="text-[11px] font-mono uppercase tracking-wider text-[var(--color-faint)] block">
                    Pending Approval
                  </span>
                  <p className="mt-2 font-display text-2xl sm:text-3xl font-extrabold text-amber-400">
                    {referralData?.summary.pendingReferralsCount ?? 0}
                  </p>
                  <span className="mt-1 text-[11px] text-[var(--color-muted)] block">
                    Awaiting payment verification
                  </span>
                </div>

                <div className="glass rounded-2xl p-4 sm:p-5">
                  <span className="text-[11px] font-mono uppercase tracking-wider text-[var(--color-faint)] block">
                    Approved Commission
                  </span>
                  <p className="mt-2 font-display text-xl sm:text-2xl font-extrabold text-violet-300">
                    {referralData?.summary.byCurrency &&
                    Object.values(referralData.summary.byCurrency).filter((b) => b.approvedCommission > 0).length > 1
                      ? Object.values(referralData.summary.byCurrency)
                          .filter((b) => b.approvedCommission > 0)
                          .map((b) => `${b.currency} ${b.approvedCommission.toFixed(2)}`)
                          .join(' + ')
                      : `${referralData?.summary.currency || 'INR'} ${(referralData?.summary.approvedCommission ?? 0).toFixed(2)}`}
                  </p>
                  <span className="mt-1 text-[11px] text-[var(--color-muted)] block">
                    10% verified, awaiting payout
                  </span>
                </div>

                <div className="glass rounded-2xl p-4 sm:p-5 col-span-2 lg:col-span-1">
                  <span className="text-[11px] font-mono uppercase tracking-wider text-[var(--color-faint)] block">
                    Paid Commission
                  </span>
                  <p className="mt-2 font-display text-xl sm:text-2xl font-extrabold text-emerald-400">
                    {referralData?.summary.byCurrency &&
                    Object.values(referralData.summary.byCurrency).filter((b) => b.paidCommission > 0).length > 1
                      ? Object.values(referralData.summary.byCurrency)
                          .filter((b) => b.paidCommission > 0)
                          .map((b) => `${b.currency} ${b.paidCommission.toFixed(2)}`)
                          .join(' + ')
                      : `${referralData?.summary.currency || 'INR'} ${(referralData?.summary.paidCommission ?? 0).toFixed(2)}`}
                  </p>
                  <span className="mt-1 text-[11px] text-[var(--color-muted)] block">
                    Disbursed to you
                  </span>
                </div>
              </div>

              {/* Attributed Referrals List */}
              <div className="space-y-4">
                <h2 className="font-display text-lg font-bold text-[var(--color-ink)]">
                  Attributed Client Project Requests
                </h2>

                {!referralData || referralData.referrals.length === 0 ? (
                  <EmptyState
                    icon={<IconSpark className="h-6 w-6" />}
                    title="No attributed referrals yet"
                    body="Share your personal referral link above. When a new client submits a project request through your link, it will appear here."
                  />
                ) : (
                  <div className="overflow-x-auto rounded-2xl border border-[var(--color-line)] bg-[var(--color-raise)]/30">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-[var(--color-line)] bg-[var(--color-abyss)]/60 font-mono text-[10px] uppercase tracking-wider text-[var(--color-faint)]">
                          <th className="py-3.5 px-4">Project</th>
                          <th className="py-3.5 px-4">Referred Client</th>
                          <th className="py-3.5 px-4">Project Status</th>
                          <th className="py-3.5 px-4">Eligible Payment</th>
                          <th className="py-3.5 px-4">Commission (10%)</th>
                          <th className="py-3.5 px-4">Commission Status</th>
                          <th className="py-3.5 px-4">Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--color-line)]/60">
                        {referralData.referrals.map((r) => (
                          <tr key={r.id} className="hover:bg-[var(--color-raise)]/40 transition">
                            <td className="py-3.5 px-4">
                              <div className="font-mono font-bold text-[var(--color-orchid)]">{r.projectPublicId}</div>
                              <div className="text-[var(--color-ink)] font-medium truncate max-w-[200px]">{r.projectTitle}</div>
                            </td>
                            <td className="py-3.5 px-4">
                              <div className="font-medium text-[var(--color-ink)]">{r.clientName}</div>
                              <div className="font-mono text-[11px] text-[var(--color-faint)]">{r.clientEmailMasked}</div>
                            </td>
                            <td className="py-3.5 px-4">
                              <StatusBadge status={r.projectStatus} />
                            </td>
                            <td className="py-3.5 px-4 font-mono">
                              {r.eligiblePaymentAmount > 0
                                ? `${(r.currency || 'INR').toUpperCase()} ${r.eligiblePaymentAmount.toFixed(2)}`
                                : 'Pending verification'}
                            </td>
                            <td className="py-3.5 px-4 font-mono font-bold text-emerald-400">
                              {r.commissionAmount > 0
                                ? `${(r.currency || 'INR').toUpperCase()} ${r.commissionAmount.toFixed(2)}`
                                : '—'}
                            </td>
                            <td className="py-3.5 px-4">
                              <span
                                className={`inline-flex items-center rounded-md px-2 py-0.5 font-mono text-[10px] font-semibold uppercase ${
                                  r.status === 'paid'
                                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                    : r.status === 'approved'
                                      ? 'bg-violet-500/20 text-violet-300 border border-violet-500/30'
                                      : r.status === 'rejected'
                                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                }`}
                              >
                                {r.status}
                              </span>
                              {r.payoutReference && (
                                <div className="font-mono text-[10px] text-[var(--color-faint)] mt-1">
                                  Ref: {r.payoutReference}
                                </div>
                              )}
                            </td>
                            <td className="py-3.5 px-4 font-mono text-[11px] text-[var(--color-muted)]">
                              {formatDate(r.createdAt)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {tab === 'notifications' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <SectionLabel>Activity Stream</SectionLabel>
                  <h1 className="mt-2 font-display text-3xl font-bold text-[var(--color-ink)]">
                    {t('notifications')}
                  </h1>
                </div>
                {unreadCount > 0 && (
                  <Button variant="outline" size="sm" onClick={handleMarkAllRead}>
                    {t('markAllRead')}
                  </Button>
                )}
              </div>

              {notifs.length === 0 ? (
                <EmptyState
                  icon={<IconBell className="h-6 w-6" />}
                  title="No notifications"
                  body="Milestone updates and scoping notices will be recorded here."
                />
              ) : (
                <div className="space-y-3">
                  {notifs.map((n) => (
                    <div
                      key={n.id}
                      className={`rounded-2xl border p-5 ${
                        n.read
                          ? 'border-[var(--color-line)] bg-[var(--color-raise)]/30 text-[var(--color-muted)]'
                          : 'border-violet-500/40 bg-violet-500/10 text-[var(--color-ink)] shadow-md'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          {!n.read && <span className="h-2 w-2 rounded-full bg-[var(--color-orchid)] animate-pulse" />}
                          <h4 className="font-display text-sm font-bold">{n.title}</h4>
                        </div>
                        <span className="font-mono text-[10px] text-[var(--color-faint)]">
                          {timeAgo(n.createdAt)}
                        </span>
                      </div>
                      <p className="mt-2 text-xs leading-relaxed text-[var(--color-muted)]">{n.body}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {tab === 'profile' && (
            <div className="space-y-8">
              <div>
                <SectionLabel>Account Security</SectionLabel>
                <h1 className="mt-2 font-display text-3xl font-bold text-[var(--color-ink)]">
                  {t('profile')}
                </h1>
              </div>

              <div className="grid gap-8 lg:grid-cols-2">
                {/* Profile Form */}
                <form onSubmit={handleProfileSave} className="glass rounded-2xl p-6 sm:p-7 space-y-4">
                  <h3 className="font-display text-base font-bold text-[var(--color-ink)]">Personal Information</h3>
                  <Field label={t('fullName')}>
                    <Input
                      type="text"
                      value={profileForm.name}
                      onChange={(e) => setProfileForm((p) => ({ ...p, name: e.target.value }))}
                      required
                    />
                  </Field>
                  <Field label={t('emailAddress')} hint="cannot be changed">
                    <Input type="email" value={sessionUser.email} disabled className="opacity-60 cursor-not-allowed" />
                  </Field>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label={t('contactNumber')}>
                      <Input
                        type="tel"
                        value={profileForm.phone}
                        onChange={(e) => setProfileForm((p) => ({ ...p, phone: e.target.value }))}
                      />
                    </Field>
                    <Field label={t('ageField')}>
                      <Input
                        type="number"
                        min={13}
                        max={120}
                        value={profileForm.age}
                        onChange={(e) => setProfileForm((p) => ({ ...p, age: e.target.value }))}
                      />
                    </Field>
                  </div>
                  <Button type="submit" loading={savingProfile}>
                    Save Profile Changes
                  </Button>
                </form>

                {/* Change Password */}
                <form onSubmit={handlePasswordSave} className="glass rounded-2xl p-6 sm:p-7 space-y-4">
                  <h3 className="font-display text-base font-bold text-[var(--color-ink)]">Update Password</h3>
                  <Field label="Current Password">
                    <Input
                      type="password"
                      value={pwForm.current}
                      onChange={(e) => setPwForm((p) => ({ ...p, current: e.target.value }))}
                      required
                    />
                  </Field>
                  <Field label={t('newPassword')} hint="min. 8 characters">
                    <Input
                      type="password"
                      value={pwForm.next}
                      onChange={(e) => setPwForm((p) => ({ ...p, next: e.target.value }))}
                      required
                      minLength={8}
                    />
                  </Field>
                  <Field label={t('confirmPassword')}>
                    <Input
                      type="password"
                      value={pwForm.confirm}
                      onChange={(e) => setPwForm((p) => ({ ...p, confirm: e.target.value }))}
                      required
                      minLength={8}
                    />
                  </Field>
                  <Button type="submit" loading={savingPw}>
                    Update Password
                  </Button>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Project Detail Modal */}
      <Modal
        open={!!selectedProject}
        onClose={() => setSelectedProject(null)}
        title={selectedProject ? `${selectedProject.projectId} · ${selectedProject.title}` : ''}
        wide
      >
        {selectedProject && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--color-line)] pb-4">
              <div>
                <span className="font-mono text-xs uppercase tracking-wider text-[var(--color-orchid)]">
                  {selectedProject.service}
                </span>
                <p className="font-display text-lg font-bold text-[var(--color-ink)] mt-1">
                  {selectedProject.title}
                </p>
              </div>
              <StatusBadge status={selectedProject.status} />
            </div>

            <div>
              <div className="flex items-center justify-between text-xs font-mono text-[var(--color-muted)] mb-1.5">
                <span>Milestone Progress</span>
                <span>{selectedProject.progress}%</span>
              </div>
              <ProgressBar value={selectedProject.progress} />
            </div>

            <div className="space-y-3">
              <span className="font-mono text-[11px] uppercase tracking-wider text-[var(--color-faint)] block">
                Technical Brief
              </span>
              <p className="rounded-xl border border-[var(--color-line)] bg-[var(--color-raise)] p-4 text-xs leading-relaxed text-[var(--color-ink)]">
                {selectedProject.description}
              </p>
            </div>

            {selectedProject.requirements && (
              <div className="space-y-2">
                <span className="font-mono text-[11px] uppercase tracking-wider text-[var(--color-faint)] block">
                  Key Requirements
                </span>
                <p className="rounded-xl border border-[var(--color-line)] bg-[var(--color-raise)] p-4 text-xs leading-relaxed text-[var(--color-muted)]">
                  {selectedProject.requirements}
                </p>
              </div>
            )}

            {/* Attachments if any */}
            {selectedProject.attachments && selectedProject.attachments.length > 0 && (
              <div className="space-y-2">
                <span className="font-mono text-[11px] uppercase tracking-wider text-[var(--color-faint)] block">
                  Attached Files ({selectedProject.attachments.length})
                </span>
                <div className="flex flex-wrap gap-2">
                  {selectedProject.attachments.map((a, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-2 rounded-lg border border-[var(--color-line)] bg-[var(--color-raise)] px-3 py-1.5 text-xs text-[var(--color-ink)]"
                    >
                      <IconFile className="h-3.5 w-3.5 text-[var(--color-orchid)]" />
                      <span>{a.name}</span>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Updates thread from engineering */}
            <div className="border-t border-[var(--color-line)] pt-5 space-y-3">
              <span className="font-mono text-xs uppercase tracking-wider text-[var(--color-orchid)] font-semibold block">
                {t('updatesFromTeam')}
              </span>
              {selectedProject.updates.length === 0 ? (
                <p className="text-xs text-[var(--color-faint)] italic">{t('noUpdatesYet')}</p>
              ) : (
                <div className="space-y-3">
                  {selectedProject.updates.map((upd) => (
                    <div key={upd.id} className="rounded-xl border border-[var(--color-line)] bg-[var(--color-raise)] p-4 text-xs">
                      <div className="flex items-center justify-between text-[var(--color-faint)] mb-1 font-mono">
                        <span className="text-[var(--color-orchid)] font-bold">{upd.authorName}</span>
                        <span>{timeAgo(upd.createdAt)}</span>
                      </div>
                      <p className="text-[var(--color-ink)] leading-relaxed">{upd.message}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
