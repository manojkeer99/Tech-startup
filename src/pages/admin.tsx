import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { store, OFFICIAL_CHANNELS } from '@/lib/store';
import { useI18n } from '@/lib/i18n';
import { useToast } from '@/components/toast';
import {
  Button,
  Field,
  Input,
  Modal,
  ProgressBar,
  SectionLabel,
  Select,
  StatusBadge,
  STATUS_META,
  Textarea,
  EmptyState,
} from '@/components/ui';
import {
  TcMonogram,
  IconShield,
  IconFolder,
  IconUser,
  IconToken,
  IconCheck,
  IconX,
  IconSearch,
  IconActivity,
  IconDiscord,
  IconInstagram,
  IconFile,
  IconClock,
} from '@/components/icons';
import { formatDate, timeAgo } from '@/lib/utils';
import type { Project, ProjectStatus, PublicUser, TokenTransaction, AuditLog } from '@/types';
import { SERVICE_DEFINITIONS } from '@/lib/service-meta';

interface AdminPageProps {
  navigate: (path: string) => void;
  initialTab?: string;
}

export function AdminPage({ navigate, initialTab = 'overview' }: AdminPageProps) {
  const { t } = useI18n();
  const { push } = useToast();
  const [tab, setTab] = useState(initialTab);
  const sessionUser = store.getSessionUser();

  useEffect(() => {
    if (initialTab) {
      setTab(initialTab);
    }
  }, [initialTab]);

  // Redirect if not admin
  useEffect(() => {
    if (!sessionUser || sessionUser.role !== 'admin') {
      navigate('/admin/login');
    }
  }, [sessionUser, navigate]);

  const [projects, setProjects] = useState<Project[]>([]);
  const [clients, setClients] = useState<PublicUser[]>([]);
  const [txs, setTxs] = useState<TokenTransaction[]>([]);
  const [logs, setLogs] = useState<AuditLog[]>([]);

  // Project management state
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [projectSearch, setProjectSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [updateMsg, setUpdateMsg] = useState('');
  const [progressVal, setProgressVal] = useState(0);
  const [statusVal, setStatusVal] = useState<ProjectStatus>('in_progress');
  const [confirmDeleteProject, setConfirmDeleteProject] = useState(false);

  // Client management state
  const [clientSearch, setClientSearch] = useState('');
  const [selectedClientForTokens, setSelectedClientForTokens] = useState<PublicUser | null>(null);
  const [tokenAmount, setTokenAmount] = useState(50);
  const [tokenReason, setTokenReason] = useState('');

  // Service toggle state
  const [servicesList, setServicesList] = useState(SERVICE_DEFINITIONS);

  const refreshAll = useCallback(() => {
    setProjects(store.getProjects());
    setClients(store.getAllClients());
    setTxs(store.getTransactions());
    setLogs(store.getAuditLogs());
  }, []);

  useEffect(() => {
    refreshAll();
    const unsub = store.subscribe(() => {
      refreshAll();
    });
    return unsub;
  }, [refreshAll]);

  if (!sessionUser || sessionUser.role !== 'admin') return null;

  // Filter projects
  const filteredProjects = projects.filter((p) => {
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    const q = projectSearch.toLowerCase();
    const matchesSearch =
      !q ||
      p.title.toLowerCase().includes(q) ||
      p.projectId.toLowerCase().includes(q) ||
      p.clientName.toLowerCase().includes(q) ||
      p.clientEmail.toLowerCase().includes(q);
    return matchesStatus && matchesSearch;
  });

  // Filter clients
  const filteredClients = clients.filter((c) => {
    const q = clientSearch.toLowerCase();
    return !q || c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q);
  });

  const handleOpenProject = (p: Project) => {
    setSelectedProject(p);
    setProgressVal(p.progress);
    setStatusVal(p.status);
    setUpdateMsg('');
    setConfirmDeleteProject(false);
  };

  const handleProjectDecision = (decision: 'approved' | 'rejected') => {
    if (!selectedProject) return;
    const upd = store.updateProject(
      selectedProject.projectId,
      {
        decision,
        message: decision === 'approved'
          ? 'Project specifications approved. Sprints and deliverables scheduled.'
          : 'After initial review, we are unable to take on this project scope at this time.',
      },
      sessionUser.name,
    );
    if (upd) {
      setSelectedProject({ ...upd });
      push('success', `Project ${upd.projectId} marked as ${decision}.`);
    }
  };

  const handlePublishProjectUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject) return;
    const upd = store.updateProject(
      selectedProject.projectId,
      {
        status: statusVal,
        progress: progressVal,
        message: updateMsg,
      },
      sessionUser.name,
    );
    if (upd) {
      setSelectedProject({ ...upd });
      push('success', `Milestone update published to client for ${upd.projectId}.`);
      setUpdateMsg('');
    }
  };

  const handleDeleteProject = () => {
    if (!selectedProject || !confirmDeleteProject) return;
    store.deleteProject(selectedProject.projectId, sessionUser.name);
    push('success', `Project ${selectedProject.projectId} deleted.`);
    setSelectedProject(null);
  };

  const handleSuspendToggle = (client: PublicUser) => {
    const newStatus = !client.suspended;
    const ok = store.suspendUser(client.id, newStatus, sessionUser.name);
    if (ok) {
      push('success', `${client.name} ${newStatus ? 'suspended' : 'reinstated'}.`);
    } else {
      push('error', 'Cannot suspend the last active administrator.');
    }
  };

  const handleTokenAdjustment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClientForTokens) return;
    if (tokenAmount === 0) return push('error', 'Amount must be non-zero.');
    if (!tokenReason.trim()) return push('error', 'Reason is required for audit trail.');

    const ok = store.adjustTokens(
      selectedClientForTokens.id,
      tokenAmount,
      tokenReason.trim(),
      sessionUser.name,
    );
    if (ok) {
      push('success', `Adjusted tokens for ${selectedClientForTokens.email}.`);
      setSelectedClientForTokens(null);
      setTokenAmount(50);
      setTokenReason('');
    } else {
      push('error', 'Insufficient client token balance for this deduction.');
    }
  };

  const handleLogout = () => {
    store.logout();
    push('info', 'Logged out of admin panel.');
    navigate('/admin/login');
  };

  const TABS = [
    { id: 'overview', label: t('tabOverview'), icon: IconActivity },
    { id: 'projects', label: t('tabProjects'), icon: IconFolder },
    { id: 'clients', label: t('tabClients'), icon: IconUser },
    { id: 'tokens', label: t('tabTokens'), icon: IconToken },
    { id: 'services', label: t('tabServices'), icon: IconFolder },
    { id: 'integrations', label: t('tabIntegrations'), icon: IconDiscord },
    { id: 'audit', label: t('tabAudit'), icon: IconShield },
  ];

  return (
    <div className="min-h-screen bg-[var(--color-void)] text-[var(--color-ink)]">
      {/* Top Header */}
      <header className="sticky top-0 z-40 border-b border-[var(--color-line)] bg-[var(--color-abyss)]/95 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 lg:px-8">
          <div className="flex items-center gap-4">
            <button type="button" onClick={() => navigate('/')} className="flex items-center gap-2.5">
              <TcMonogram className="h-8 w-8" />
              <span className="font-display text-sm font-bold tracking-[0.2em] text-[var(--color-ink)]">
                THE CREATORS
              </span>
            </button>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-wider text-amber-400">
              <IconShield className="h-3 w-3" />
              Admin
            </span>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-5 font-mono text-xs text-[var(--color-muted)]">
              <span><strong>{clients.length}</strong> clients</span>
              <span><strong>{projects.length}</strong> briefs</span>
            </div>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              {t('navLogout')}
            </Button>
          </div>
        </div>

        {/* Tab Strip */}
        <div className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-5 lg:px-8">
          {TABS.map((tItem) => (
            <button
              key={tItem.id}
              type="button"
              onClick={() => setTab(tItem.id)}
              className={`flex items-center gap-2 shrink-0 border-b-2 px-4 py-3 text-xs font-semibold transition cursor-pointer ${
                tab === tItem.id
                  ? 'border-[var(--color-violet)] text-[var(--color-ink)] font-bold'
                  : 'border-transparent text-[var(--color-muted)] hover:text-[var(--color-ink)]'
              }`}
            >
              <tItem.icon className="h-3.5 w-3.5" />
              <span>{tItem.label}</span>
            </button>
          ))}
        </div>
      </header>

      {/* Main Workspace */}
      <main className="mx-auto max-w-7xl px-5 py-8 lg:px-8 lg:py-12">
        {/* OVERVIEW */}
        {tab === 'overview' && (
          <div className="space-y-8">
            <div>
              <SectionLabel>Mission Control</SectionLabel>
              <h1 className="mt-2 font-display text-3xl font-bold text-[var(--color-ink)]">
                Studio Operations Overview
              </h1>
            </div>

            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div className="glass rounded-2xl p-5">
                <span className="font-mono text-xs uppercase text-[var(--color-faint)]">Total Clients</span>
                <p className="mt-2 font-display text-3xl font-extrabold text-[var(--color-ink)]">{clients.length}</p>
              </div>
              <div className="glass rounded-2xl p-5">
                <span className="font-mono text-xs uppercase text-[var(--color-faint)]">Total Briefs</span>
                <p className="mt-2 font-display text-3xl font-extrabold text-blue-400">{projects.length}</p>
              </div>
              <div className="glass rounded-2xl p-5">
                <span className="font-mono text-xs uppercase text-[var(--color-faint)]">Awaiting Review</span>
                <p className="mt-2 font-display text-3xl font-extrabold text-amber-400">
                  {projects.filter((p) => p.status === 'submitted').length}
                </p>
              </div>
              <div className="glass rounded-2xl p-5">
                <span className="font-mono text-xs uppercase text-[var(--color-faint)]">Active Production</span>
                <p className="mt-2 font-display text-3xl font-extrabold text-emerald-400">
                  {projects.filter((p) => p.status === 'in_progress').length}
                </p>
              </div>
            </div>

            {/* Pipeline Strip */}
            <div className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-raise)]/60 p-5 overflow-x-auto">
              <span className="font-mono text-xs uppercase tracking-wider text-[var(--color-faint)] block mb-3 font-semibold">
                Pipeline Status Breakdown
              </span>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                {Object.keys(STATUS_META).map((st) => (
                  <div key={st} className="rounded-xl border border-[var(--color-line)] bg-[var(--color-panel)] p-3 text-center">
                    <span className="text-[10px] font-mono uppercase text-[var(--color-faint)] block">{st.replace('_', ' ')}</span>
                    <span className="font-display text-xl font-bold text-[var(--color-ink)] block mt-1">
                      {projects.filter((p) => p.status === st).length}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Actions & Recent Briefs */}
            <div className="grid gap-8 lg:grid-cols-[1.3fr_0.9fr]">
              <div className="glass rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-display text-base font-bold text-[var(--color-ink)]">Incoming Project Briefs</h3>
                  <button type="button" onClick={() => setTab('projects')} className="text-xs text-[var(--color-orchid)] hover:underline">
                    View all pipeline
                  </button>
                </div>
                {projects.length === 0 ? (
                  <p className="text-xs text-[var(--color-faint)]">No projects submitted yet.</p>
                ) : (
                  <div className="space-y-3">
                    {projects.slice(0, 5).map((p) => (
                      <div
                        key={p.id}
                        onClick={() => handleOpenProject(p)}
                        className="rounded-xl border border-[var(--color-line)] bg-[var(--color-raise)]/60 p-3.5 flex items-center justify-between cursor-pointer hover:border-violet-500/40 transition"
                      >
                        <div className="min-w-0 pr-2">
                          <p className="text-xs font-bold text-[var(--color-ink)] truncate">{p.title}</p>
                          <span className="font-mono text-[10px] text-[var(--color-orchid)] block mt-0.5">{p.projectId} · {p.clientName}</span>
                        </div>
                        <StatusBadge status={p.status} />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Recent Audit Events */}
              <div className="glass rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-display text-base font-bold text-[var(--color-ink)]">Audit Stream</h3>
                  <button type="button" onClick={() => setTab('audit')} className="text-xs text-[var(--color-orchid)] hover:underline">
                    Full log
                  </button>
                </div>
                <div className="space-y-2.5">
                  {logs.slice(0, 6).map((log) => (
                    <div key={log.id} className="text-xs font-mono rounded-lg border border-[var(--color-line)]/60 bg-[var(--color-raise)]/40 p-2.5">
                      <div className="flex items-center justify-between text-[10px] text-[var(--color-faint)]">
                        <span className="text-[var(--color-orchid)] font-bold">{log.action}</span>
                        <span>{timeAgo(log.createdAt)}</span>
                      </div>
                      <p className="mt-1 text-[var(--color-ink)] truncate">{log.detail || log.actor}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* PROJECTS PIPELINE */}
        {tab === 'projects' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <SectionLabel>Project Pipeline</SectionLabel>
                <h1 className="mt-2 font-display text-3xl font-bold text-[var(--color-ink)]">
                  All Client Project Briefs
                </h1>
              </div>

              {/* Search */}
              <div className="relative w-full sm:w-72">
                <IconSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-faint)]" />
                <Input
                  type="text"
                  placeholder="Search ID, title, client..."
                  value={projectSearch}
                  onChange={(e) => setProjectSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Filter pills */}
            <div className="flex flex-wrap gap-2">
              {['all', 'submitted', 'approved', 'in_progress', 'delivered', 'completed', 'rejected'].map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setStatusFilter(st)}
                  className={`rounded-lg px-3 py-1.5 font-mono text-xs uppercase tracking-wider transition cursor-pointer ${
                    statusFilter === st
                      ? 'bg-violet-600 text-white font-bold'
                      : 'border border-[var(--color-line)] bg-[var(--color-raise)] text-[var(--color-muted)] hover:border-violet-500/40'
                  }`}
                >
                  {st === 'all' ? 'All Briefs' : st.replace('_', ' ')}
                </button>
              ))}
            </div>

            {/* Projects Table */}
            <div className="glass rounded-2xl border border-[var(--color-line)] overflow-x-auto">
              <table className="w-full text-left text-xs min-w-[760px]">
                <thead>
                  <tr className="border-b border-[var(--color-line)] bg-[var(--color-raise)] font-mono text-[10px] uppercase tracking-wider text-[var(--color-faint)]">
                    <th className="px-5 py-3.5">Reference ID / Title</th>
                    <th className="px-5 py-3.5">Client</th>
                    <th className="px-5 py-3.5">Discipline</th>
                    <th className="px-5 py-3.5">Status</th>
                    <th className="px-5 py-3.5">Milestone</th>
                    <th className="px-5 py-3.5">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-line)]">
                  {filteredProjects.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-5 py-10 text-center text-xs text-[var(--color-faint)]">
                        No projects found matching the filter criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredProjects.map((p) => (
                      <tr
                        key={p.id}
                        onClick={() => handleOpenProject(p)}
                        className="cursor-pointer hover:bg-[var(--color-raise)]/60 transition"
                      >
                        <td className="px-5 py-4">
                          <span className="font-mono font-bold text-[var(--color-orchid)] block">{p.projectId}</span>
                          <span className="font-display font-semibold text-[var(--color-ink)] block mt-0.5">{p.title}</span>
                        </td>
                        <td className="px-5 py-4">
                          <span className="font-medium text-[var(--color-ink)] block">{p.clientName}</span>
                          <span className="font-mono text-[10px] text-[var(--color-faint)]">{p.clientEmail}</span>
                        </td>
                        <td className="px-5 py-4 font-mono text-[11px] text-[var(--color-muted)]">
                          {p.service}
                        </td>
                        <td className="px-5 py-4">
                          <StatusBadge status={p.status} />
                        </td>
                        <td className="px-5 py-4">
                          <div className="w-28 space-y-1">
                            <ProgressBar value={p.progress} />
                            <span className="font-mono text-[10px] text-[var(--color-faint)]">{p.progress}%</span>
                          </div>
                        </td>
                        <td className="px-5 py-4 font-mono text-[11px] text-[var(--color-faint)]">
                          {timeAgo(p.createdAt)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* CLIENTS & USER MANAGEMENT */}
        {tab === 'clients' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <SectionLabel>Account Governance</SectionLabel>
                <h1 className="mt-2 font-display text-3xl font-bold text-[var(--color-ink)]">
                  {t('clientDirectory')}
                </h1>
                <p className="mt-1 text-sm text-[var(--color-muted)]">
                  Manage registered client access, status, and token balances. Passwords and hashes are strictly protected.
                </p>
              </div>

              <div className="relative w-full sm:w-72">
                <IconSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-faint)]" />
                <Input
                  type="text"
                  placeholder="Search name or email..."
                  value={clientSearch}
                  onChange={(e) => setClientSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Clients Table */}
            <div className="glass rounded-2xl border border-[var(--color-line)] overflow-x-auto">
              <table className="w-full text-left text-xs min-w-[760px]">
                <thead>
                  <tr className="border-b border-[var(--color-line)] bg-[var(--color-raise)] font-mono text-[10px] uppercase tracking-wider text-[var(--color-faint)]">
                    <th className="px-5 py-3.5">Client Profile</th>
                    <th className="px-5 py-3.5">Contact Details</th>
                    <th className="px-5 py-3.5">Registered</th>
                    <th className="px-5 py-3.5">Status</th>
                    <th className="px-5 py-3.5">Token Balance</th>
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-line)]">
                  {filteredClients.map((c) => (
                    <tr key={c.id} className="hover:bg-[var(--color-raise)]/60 transition">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-600/15 font-display text-xs font-bold text-[var(--color-orchid)]">
                            {c.name.charAt(0).toUpperCase()}
                          </span>
                          <div>
                            <span className="font-bold text-[var(--color-ink)] block">{c.name}</span>
                            <span className="font-mono text-[10px] text-[var(--color-faint)]">{c.email}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 font-mono text-[11px] text-[var(--color-muted)]">
                        {c.phone || '—'} {c.age ? `· Age ${c.age}` : ''}
                      </td>
                      <td className="px-5 py-4 font-mono text-[11px] text-[var(--color-faint)]">
                        {formatDate(c.createdAt)}
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider ${
                            c.suspended
                              ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                              : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          }`}
                        >
                          {c.suspended ? 'Suspended' : 'Active'}
                        </span>
                      </td>
                      <td className="px-5 py-4 font-mono font-bold text-sm text-[var(--color-ink)]">
                        {c.tokenBalance} tok
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedClientForTokens(c);
                              setTokenAmount(50);
                              setTokenReason('');
                            }}
                          >
                            <IconToken className="h-3.5 w-3.5" /> <span>Tokens</span>
                          </Button>

                          <Button
                            size="sm"
                            variant={c.suspended ? 'outline' : 'danger'}
                            onClick={() => handleSuspendToggle(c)}
                          >
                            {c.suspended ? t('reinstateAccount') : t('suspendAccount')}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TOKEN LEDGER */}
        {tab === 'tokens' && (
          <div className="space-y-6">
            <div>
              <SectionLabel>Audit Compliance</SectionLabel>
              <h1 className="mt-2 font-display text-3xl font-bold text-[var(--color-ink)]">
                {t('tabTokens')}
              </h1>
              <p className="mt-1 text-sm text-[var(--color-muted)]">
                Chronological ledger of every token balance allocation, deduction, and project transaction.
              </p>
            </div>

            <div className="glass rounded-2xl border border-[var(--color-line)] overflow-x-auto">
              <table className="w-full text-left text-xs min-w-[700px]">
                <thead>
                  <tr className="border-b border-[var(--color-line)] bg-[var(--color-raise)] font-mono text-[10px] uppercase tracking-wider text-[var(--color-faint)]">
                    <th className="px-5 py-3.5">Timestamp</th>
                    <th className="px-5 py-3.5">Client</th>
                    <th className="px-5 py-3.5">Amount</th>
                    <th className="px-5 py-3.5">Audit Reason</th>
                    <th className="px-5 py-3.5">Project Ref</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-line)]">
                  {txs.map((tx) => (
                    <tr key={tx.id} className="hover:bg-[var(--color-raise)]/60">
                      <td className="px-5 py-3.5 font-mono text-[11px] text-[var(--color-faint)]">
                        {formatDate(tx.createdAt)}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="font-bold text-[var(--color-ink)] block">{tx.clientName}</span>
                        <span className="font-mono text-[10px] text-[var(--color-faint)]">{tx.clientEmail}</span>
                      </td>
                      <td className="px-5 py-3.5 font-mono font-bold text-sm">
                        <span className={tx.amount >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                          {tx.amount >= 0 ? `+${tx.amount}` : tx.amount}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-[var(--color-muted)]">
                        {tx.reason}
                      </td>
                      <td className="px-5 py-3.5 font-mono text-xs text-[var(--color-orchid)]">
                        {tx.projectId || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* SERVICES MANAGEMENT */}
        {tab === 'services' && (
          <div className="space-y-6">
            <div>
              <SectionLabel>Discipline Availability</SectionLabel>
              <h1 className="mt-2 font-display text-3xl font-bold text-[var(--color-ink)]">
                Service Catalog Configuration
              </h1>
              <p className="mt-1 text-sm text-[var(--color-muted)]">
                Enable or temporarily suspend client intake for individual disciplines.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {servicesList.map((svc) => (
                <div key={svc.slug} className="glass rounded-2xl p-6 flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-display text-base font-bold text-[var(--color-ink)]">{svc.name}</h3>
                    <p className="mt-1 text-xs text-[var(--color-muted)]">{svc.tagline}</p>
                    <span className="mt-3 inline-block font-mono text-[10px] uppercase tracking-wider text-emerald-400">
                      ✓ Zero public pricing enforced
                    </span>
                  </div>

                  <span className="inline-flex items-center gap-1 rounded-md px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
                    Active
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* INTEGRATIONS */}
        {tab === 'integrations' && (
          <div className="space-y-6">
            <div>
              <SectionLabel>Studio Integrations</SectionLabel>
              <h1 className="mt-2 font-display text-3xl font-bold text-[var(--color-ink)]">
                Verified Social &amp; Service Channels
              </h1>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="glass rounded-2xl p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#5865F2]/20 text-[#5865F2]">
                    <IconDiscord className="h-5 w-5" />
                  </span>
                  <div>
                    <h3 className="font-display text-base font-bold text-[var(--color-ink)]">Discord Community</h3>
                    <p className="text-xs text-[var(--color-muted)]">Verified public invite link</p>
                  </div>
                </div>

                <div className="rounded-xl border border-[var(--color-line)] bg-[var(--color-raise)] p-3 text-xs font-mono text-[var(--color-orchid)] break-all">
                  {OFFICIAL_CHANNELS.discord}
                </div>

                <p className="text-xs text-[var(--color-faint)]">
                  Live across the homepage community banner and footer.
                </p>
              </div>

              <div className="glass rounded-2xl p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500/20 text-rose-400">
                    <IconInstagram className="h-5 w-5" />
                  </span>
                  <div>
                    <h3 className="font-display text-base font-bold text-[var(--color-ink)]">Instagram Profile</h3>
                    <p className="text-xs text-[var(--color-muted)]">Official studio handle</p>
                  </div>
                </div>

                <div className="rounded-xl border border-[var(--color-line)] bg-[var(--color-raise)] p-3 text-xs font-mono text-rose-400 break-all">
                  {OFFICIAL_CHANNELS.instagram}
                </div>

                <p className="text-xs text-[var(--color-faint)]">
                  Direct handle for social media creative updates.
                </p>
              </div>

              <div className="glass rounded-2xl p-6 space-y-4 md:col-span-2">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/20 text-blue-400">
                    <IconShield className="h-5 w-5" />
                  </span>
                  <div>
                    <h3 className="font-display text-base font-bold text-[var(--color-ink)]">Google OAuth &amp; Identity Configuration</h3>
                    <p className="text-xs text-[var(--color-muted)]">Client Authentication Protocol</p>
                  </div>
                </div>

                <p className="text-xs text-[var(--color-muted)] leading-relaxed">
                  Google OAuth is integrated with client-role enforcement. To deploy live GCP credentials, set <code>GOOGLE_CLIENT_ID</code>, <code>GOOGLE_CLIENT_SECRET</code>, and <code>GOOGLE_REDIRECT_URI</code> in environment variables.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* AUDIT TRAIL */}
        {tab === 'audit' && (
          <div className="space-y-6">
            <div>
              <SectionLabel>Compliance &amp; Security</SectionLabel>
              <h1 className="mt-2 font-display text-3xl font-bold text-[var(--color-ink)]">
                Chronological Audit Trail
              </h1>
              <p className="mt-1 text-sm text-[var(--color-muted)]">
                Immutable security logs recording logins, project status changes, and token allocations.
              </p>
            </div>

            <div className="glass rounded-2xl border border-[var(--color-line)] overflow-hidden">
              <div className="divide-y divide-[var(--color-line)]">
                {logs.map((log) => (
                  <div key={log.id} className="p-4 flex flex-wrap items-center justify-between gap-4 text-xs">
                    <div className="flex items-center gap-3">
                      <span className="rounded bg-[var(--color-raise)] px-2 py-1 font-mono text-[10px] font-bold text-[var(--color-orchid)]">
                        {log.action}
                      </span>
                      <span className="font-semibold text-[var(--color-ink)]">{log.actor}</span>
                      {log.detail && (
                        <span className="text-[var(--color-muted)]">— {log.detail}</span>
                      )}
                    </div>
                    <span className="font-mono text-[10px] text-[var(--color-faint)]">
                      {formatDate(log.createdAt)} ({timeAgo(log.createdAt)})
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Project Review & Update Modal */}
      <Modal
        open={!!selectedProject}
        onClose={() => setSelectedProject(null)}
        title={selectedProject ? `Manage Brief: ${selectedProject.projectId}` : ''}
        wide
      >
        {selectedProject && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--color-line)] pb-4">
              <div>
                <h4 className="font-display text-lg font-bold text-[var(--color-ink)]">{selectedProject.title}</h4>
                <p className="text-xs text-[var(--color-muted)] mt-0.5">
                  Client: <strong>{selectedProject.clientName}</strong> ({selectedProject.clientEmail})
                  {selectedProject.clientPhone ? ` · ${selectedProject.clientPhone}` : ''}
                </p>
              </div>
              <StatusBadge status={selectedProject.status} />
            </div>

            {/* Scope details */}
            <div className="grid gap-3 sm:grid-cols-3 font-mono text-xs">
              <div className="rounded-xl border border-[var(--color-line)] bg-[var(--color-raise)] p-3">
                <span className="text-[10px] uppercase text-[var(--color-faint)] block">Discipline</span>
                <span className="text-[var(--color-ink)] font-bold">{selectedProject.service}</span>
              </div>
              <div className="rounded-xl border border-[var(--color-line)] bg-[var(--color-raise)] p-3">
                <span className="text-[10px] uppercase text-[var(--color-faint)] block">Budget Preference</span>
                <span className="text-[var(--color-ink)] font-bold">{selectedProject.budget || 'Custom Discussion'}</span>
              </div>
              <div className="rounded-xl border border-[var(--color-line)] bg-[var(--color-raise)] p-3">
                <span className="text-[10px] uppercase text-[var(--color-faint)] block">Deadline</span>
                <span className="text-[var(--color-ink)] font-bold">{formatDate(selectedProject.deadline)}</span>
              </div>
            </div>

            {/* Description */}
            <div>
              <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--color-faint)] block mb-1.5">
                Technical Brief
              </span>
              <p className="rounded-xl border border-[var(--color-line)] bg-[var(--color-raise)] p-4 text-xs leading-relaxed text-[var(--color-ink)] whitespace-pre-wrap">
                {selectedProject.description}
              </p>
            </div>

            {/* Decision controls if submitted */}
            {selectedProject.status === 'submitted' && (
              <div className="rounded-2xl border border-violet-500/30 bg-violet-500/10 p-5 space-y-3">
                <p className="text-xs font-semibold text-[var(--color-ink)]">
                  Initial Scoping Decision for this Brief
                </p>
                <div className="flex gap-3">
                  <Button size="sm" onClick={() => handleProjectDecision('approved')}>
                    <IconCheck className="h-4 w-4" /> <span>{t('approveProject')}</span>
                  </Button>
                  <Button size="sm" variant="danger" onClick={() => handleProjectDecision('rejected')}>
                    <IconX className="h-4 w-4" /> <span>{t('rejectProject')}</span>
                  </Button>
                </div>
              </div>
            )}

            {/* Update Milestone / Post Note Form */}
            <form onSubmit={handlePublishProjectUpdate} className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-raise)] p-5 space-y-4">
              <h5 className="font-display text-sm font-bold text-[var(--color-ink)]">
                {t('publishUpdate')}
              </h5>

              <div className="grid gap-3 sm:grid-cols-2">
                <Field label={t('status')}>
                  <Select
                    value={statusVal}
                    onChange={(e) => setStatusVal(e.target.value as ProjectStatus)}
                  >
                    <option value="approved">Approved</option>
                    <option value="in_progress">In Progress</option>
                    <option value="delivered">Delivered</option>
                    <option value="completed">Completed</option>
                    <option value="rejected">Rejected</option>
                  </Select>
                </Field>

                <Field label={`Milestone Progress (${progressVal}%)`}>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={progressVal}
                    onChange={(e) => setProgressVal(Number(e.target.value))}
                    className="w-full accent-violet-500 cursor-pointer mt-2"
                  />
                </Field>
              </div>

              <Field label={t('messageToClient')}>
                <Textarea
                  placeholder="e.g. Sprint 2 deliverables reviewed. Database schema migration executed and prototype ready for staging."
                  value={updateMsg}
                  onChange={(e) => setUpdateMsg(e.target.value)}
                  className="min-h-[70px]"
                />
              </Field>

              <div className="flex justify-end">
                <Button type="submit" size="sm">
                  {t('publishUpdate')}
                </Button>
              </div>
            </form>

            {/* Danger Zone: Delete */}
            <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <div>
                <p className="font-bold text-rose-400">{t('deleteProject')}</p>
                <p className="text-[var(--color-muted)]">Permanent removal of this project record and updates.</p>
              </div>
              <div className="flex items-center gap-2">
                <label className="flex items-center gap-1.5 cursor-pointer text-[var(--color-muted)]">
                  <input
                    type="checkbox"
                    checked={confirmDeleteProject}
                    onChange={(e) => setConfirmDeleteProject(e.target.checked)}
                    className="accent-rose-500"
                  />
                  <span>Confirm</span>
                </label>
                <Button
                  size="sm"
                  variant="danger"
                  disabled={!confirmDeleteProject}
                  onClick={handleDeleteProject}
                >
                  Delete
                </Button>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Adjust Tokens Modal */}
      <Modal
        open={!!selectedClientForTokens}
        onClose={() => setSelectedClientForTokens(null)}
        title={selectedClientForTokens ? `Adjust Tokens: ${selectedClientForTokens.name}` : ''}
      >
        {selectedClientForTokens && (
          <form onSubmit={handleTokenAdjustment} className="space-y-4">
            <div className="flex items-center justify-between rounded-xl border border-[var(--color-line)] bg-[var(--color-raise)] p-4">
              <span className="text-xs text-[var(--color-muted)]">Current Client Balance</span>
              <span className="font-mono text-xl font-bold text-[var(--color-ink)]">
                {selectedClientForTokens.tokenBalance} tok
              </span>
            </div>

            <Field label="Token Amount" hint="Positive to credit, negative to deduct">
              <Input
                type="number"
                value={tokenAmount}
                onChange={(e) => setTokenAmount(Number(e.target.value))}
                required
              />
            </Field>

            <Field label="Audit Reason" hint="Recorded in client ledger and audit stream">
              <Input
                type="text"
                placeholder="e.g. Deposit for web development sprint"
                value={tokenReason}
                onChange={(e) => setTokenReason(e.target.value)}
                required
              />
            </Field>

            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => setSelectedClientForTokens(null)}>
                Cancel
              </Button>
              <Button type="submit">
                Apply Adjustment
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
