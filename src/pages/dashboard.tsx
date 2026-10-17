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
  IconToken,
  IconBell,
  IconUser,
  IconChart,
  IconLogout,
  IconDiscord,
  IconClock,
  IconEye,
  IconFile,
} from '@/components/icons';
import { formatDate, timeAgo } from '@/lib/utils';
import type { Project, TokenTransaction, Notification, PublicUser } from '@/types';

interface DashboardPageProps {
  navigate: (path: string) => void;
  initialTab?: string;
}

export function DashboardPage({ navigate, initialTab = 'overview' }: DashboardPageProps) {
  const { t } = useI18n();
  const { push } = useToast();
  const [tab, setTab] = useState(initialTab);
  const [sessionUser, setSessionUser] = useState<PublicUser | null>(store.getSessionUser());

  useEffect(() => {
    if (initialTab) {
      setTab(initialTab);
    }
  }, [initialTab]);

  const [projects, setProjects] = useState<Project[]>([]);
  const [txs, setTxs] = useState<TokenTransaction[]>([]);
  const [notifs, setNotifs] = useState<Notification[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  // Profile forms
  const [profileForm, setProfileForm] = useState({
    name: sessionUser?.name || '',
    phone: sessionUser?.phone || '',
    age: sessionUser?.age ? String(sessionUser.age) : '',
  });
  const [pwForm, setPwForm] = useState({ current: '', next: '', confirm: '' });
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPw, setSavingPw] = useState(false);

  const loadData = () => {
    const user = store.getSessionUser();
    if (!user) {
      navigate('/login');
      return;
    }
    setSessionUser(user);
    setProfileForm({
      name: user.name,
      phone: user.phone || '',
      age: user.age ? String(user.age) : '',
    });

    setProjects(store.getProjects(user.id));
    setTxs(store.getTransactions(user.id));
    setNotifs(store.getNotifications(user.id));
  };

  useEffect(() => {
    loadData();
    const unsub = store.subscribe(() => {
      loadData();
    });
    return unsub;
  }, []);

  if (!sessionUser) return null;

  const unreadCount = notifs.filter((n) => !n.read).length;

  const handleLogout = () => {
    store.logout();
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
    { id: 'wallet', label: t('tokenWallet'), icon: IconToken },
    { id: 'notifications', label: t('notifications'), icon: IconBell, count: unreadCount },
    { id: 'profile', label: t('profile'), icon: IconUser },
  ];

  return (
    <div className="flex min-h-screen bg-[var(--color-void)]">
      {/* Sidebar (Desktop) */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-[var(--color-line)] bg-[var(--color-abyss)] lg:flex">
        <button
          type="button"
          onClick={() => navigate('/')}
          className="flex items-center gap-3 border-b border-[var(--color-line)] px-6 py-5 text-left cursor-pointer"
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

        <div className="flex-1 overflow-y-auto px-4 py-6">
          <p className="px-3 font-mono text-[10px] uppercase tracking-[0.25em] text-[var(--color-faint)]">
            Navigation
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

          {/* Token Card */}
          <div className="mt-8 rounded-2xl border border-violet-500/25 bg-gradient-to-br from-violet-500/15 to-blue-500/10 p-5 space-y-1">
            <span className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-[var(--color-orchid)]">
              <IconToken className="h-3.5 w-3.5" /> Platform Tokens
            </span>
            <p className="font-display text-3xl font-extrabold text-[var(--color-ink)]">
              {sessionUser.tokenBalance}
            </p>
            <p className="text-[11px] text-[var(--color-muted)]">
              Inquiries are always free. Token credits apply to priority scopes.
            </p>
          </div>

          {/* Official Community Link */}
          <a
            href={OFFICIAL_CHANNELS.discord}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 flex items-center gap-2.5 rounded-xl border border-[#5865F2]/30 bg-[#5865F2]/10 p-3 text-xs font-medium text-[#5865F2] hover:bg-[#5865F2]/20 transition"
          >
            <IconDiscord className="h-4 w-4" />
            <span>Join Discord Community</span>
          </a>
        </div>

        {/* User Footer */}
        <div className="border-t border-[var(--color-line)] p-4 flex items-center justify-between">
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
            className="p-1.5 text-[var(--color-faint)] hover:text-rose-400 transition cursor-pointer"
            title="Log out"
          >
            <IconLogout className="h-4 w-4" />
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="min-w-0 flex-1 lg:pl-64">
        {/* Mobile Top Bar */}
        <div className="sticky top-0 z-30 flex flex-col border-b border-[var(--color-line)] bg-[var(--color-abyss)] px-4 py-3 lg:hidden">
          <div className="flex items-center justify-between">
            <button type="button" onClick={() => navigate('/')} className="flex items-center gap-2">
              <TcMonogram className="h-7 w-7" />
              <span className="font-display text-xs font-bold tracking-wider">THE CREATORS</span>
            </button>
            <div className="flex items-center gap-2">
              <span className="rounded-lg border border-[var(--color-line)] bg-[var(--color-raise)] px-2 py-1 font-mono text-xs">
                {sessionUser.tokenBalance} tok
              </span>
              <button type="button" onClick={handleLogout} className="p-1.5 text-[var(--color-faint)]">
                <IconLogout className="h-4 w-4" />
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
                  <span className="text-xs uppercase tracking-wider text-[var(--color-faint)] block">Token Balance</span>
                  <p className="mt-2 font-display text-3xl font-extrabold text-[var(--color-ink)]">{sessionUser.tokenBalance}</p>
                </div>
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
                    loadData();
                    setTab('projects');
                  }}
                />
              </div>
            </div>
          )}

          {tab === 'wallet' && (
            <div className="space-y-6">
              <div>
                <SectionLabel>Internal Credits</SectionLabel>
                <h1 className="mt-2 font-display text-3xl font-bold text-[var(--color-ink)]">
                  {t('tokenWallet')}
                </h1>
                <p className="mt-1 text-sm text-[var(--color-muted)]">
                  Tokens are internal studio credits used for priority queue access and specialized services. Project inquiries are always free.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="glass rounded-2xl p-6">
                  <span className="font-mono text-xs uppercase tracking-wider text-[var(--color-faint)] block">Current Balance</span>
                  <p className="mt-2 font-display text-3xl font-extrabold text-[var(--color-ink)]">{sessionUser.tokenBalance}</p>
                </div>
                <div className="glass rounded-2xl p-6">
                  <span className="font-mono text-xs uppercase tracking-wider text-[var(--color-faint)] block">Total Credited</span>
                  <p className="mt-2 font-display text-3xl font-extrabold text-emerald-400">
                    +{txs.filter((tItem) => tItem.amount > 0).reduce((acc, curr) => acc + curr.amount, 0)}
                  </p>
                </div>
                <div className="glass rounded-2xl p-6">
                  <span className="font-mono text-xs uppercase tracking-wider text-[var(--color-faint)] block">Ledger Records</span>
                  <p className="mt-2 font-display text-3xl font-extrabold text-[var(--color-orchid)]">{txs.length}</p>
                </div>
              </div>

              {/* Transactions Ledger */}
              <div className="glass rounded-2xl border border-[var(--color-line)] overflow-hidden">
                <div className="border-b border-[var(--color-line)] p-4 font-mono text-xs font-semibold uppercase tracking-wider text-[var(--color-orchid)]">
                  Token Transaction Ledger
                </div>
                {txs.length === 0 ? (
                  <p className="p-8 text-center text-xs text-[var(--color-faint)]">No transaction records found.</p>
                ) : (
                  <div className="divide-y divide-[var(--color-line)]">
                    {txs.map((tx) => (
                      <div key={tx.id} className="flex items-center justify-between p-4 text-xs">
                        <div>
                          <p className="font-medium text-[var(--color-ink)]">{tx.reason}</p>
                          <span className="font-mono text-[10px] text-[var(--color-faint)]">{formatDate(tx.createdAt)}</span>
                        </div>
                        <span className={`font-mono text-sm font-bold ${tx.amount >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {tx.amount >= 0 ? `+${tx.amount}` : tx.amount} tok
                        </span>
                      </div>
                    ))}
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
