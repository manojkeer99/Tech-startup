import { useState, useEffect, useCallback, useTransition } from 'react';
import { motion, AnimatePresence } from 'motion/react';
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
  Spinner,
} from '@/components/ui';
import {
  TcMonogram,
  IconShield,
  IconFolder,
  IconUser,
  IconCheck,
  IconX,
  IconSearch,
  IconActivity,
  IconFile,
  IconClock,
  IconCopy,
  IconLogout,
  IconCpu,
  IconChart,
} from '@/components/icons';
import { formatDate, timeAgo } from '@/lib/utils';
import type { Project, ProjectStatus, PublicUser, AuditLog } from '@/types';
import { api, ApiError } from '@/lib/api';
import {
  fetchAdminStats,
  fetchAdminUsers,
  updateAdminUserStatus,
  updateAdminUserRole,
  generateAdminPasswordResetLink,
  fetchAdminProjects,
  updateAdminProject,
  deleteAdminProject,
  fetchAdminLogs,
  fetchAdminSystemStatus,
  type AdminStats,
  type AdminUserItem,
  type AdminSystemInfo,
  type PaginationMeta,
} from '@/lib/admin-api';

interface AdminPageProps {
  navigate: (path: string) => void;
  initialTab?: string;
}

type TabKey = 'overview' | 'users' | 'projects' | 'logs' | 'system';

export function AdminPage({ navigate, initialTab = 'overview' }: AdminPageProps) {
  const { push } = useToast();
  const [, startTransition] = useTransition();

  // Active navigation tab
  const [tab, setTab] = useState<TabKey>(() => {
    const validTabs: TabKey[] = ['overview', 'users', 'projects', 'logs', 'system'];
    return validTabs.includes(initialTab as TabKey) ? (initialTab as TabKey) : 'overview';
  });

  // Authentication & Authorization state
  const [authLoading, setAuthLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<PublicUser | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);

  // Switch tab and sync URL
  const handleTabChange = (newTab: TabKey) => {
    setTab(newTab);
    startTransition(() => {
      try {
        const url = new URL(window.location.href);
        url.searchParams.set('tab', newTab);
        window.history.replaceState({}, '', url.pathname + url.search);
      } catch {
        // Safe fallback
      }
    });
  };

  // 1. Verify Authentication & Admin Role with server
  const verifyAdminAuth = useCallback(async () => {
    setAuthLoading(true);
    setAuthError(null);
    try {
      const res = await api<{ ok: boolean; user: PublicUser }>('/api/auth/me');
      if (res && res.ok && res.user) {
        if (res.user.role === 'admin') {
          setCurrentUser(res.user);
        } else {
          setCurrentUser(res.user);
          setAuthError(`Access restricted. Your account (${res.user.email}) has role '${res.user.role}'. Administrator authorization is required.`);
        }
      } else {
        setAuthError('Authentication required. Please sign in to access the administrator console.');
      }
    } catch (err: unknown) {
      if (err instanceof ApiError && err.status === 401) {
        setAuthError('Your session has expired or is invalid. Please sign in as an administrator.');
      } else if (err instanceof ApiError && err.status === 403) {
        setAuthError('Access denied. Administrator privileges are required.');
      } else {
        setAuthError('Unable to verify administrator session with the server. Please check your connection.');
      }
    } finally {
      setAuthLoading(false);
    }
  }, []);

  useEffect(() => {
    verifyAdminAuth();
  }, [verifyAdminAuth]);

  // Handle Logout
  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    } catch {
      // Ignore
    }
    navigate('/admin/login');
  };

  /* -------------------------------------------------------------------------- */
  /*                            TAB 1: OVERVIEW STATE                           */
  /* -------------------------------------------------------------------------- */
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [statsError, setStatsError] = useState<string | null>(null);

  const loadStats = useCallback(async () => {
    setStatsLoading(true);
    setStatsError(null);
    try {
      const data = await fetchAdminStats();
      setStats(data);
    } catch (err: unknown) {
      setStatsError(err instanceof Error ? err.message : 'Failed to load administrative overview statistics.');
    } finally {
      setStatsLoading(false);
    }
  }, []);

  /* -------------------------------------------------------------------------- */
  /*                             TAB 2: USERS STATE                             */
  /* -------------------------------------------------------------------------- */
  const [users, setUsers] = useState<AdminUserItem[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState<string | null>(null);
  const [usersPagination, setUsersPagination] = useState<PaginationMeta>({ page: 1, limit: 15, total: 0, totalPages: 1 });
  
  // User Filters
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState<'all' | 'client' | 'admin'>('all');
  const [userStatusFilter, setUserStatusFilter] = useState<'all' | 'active' | 'suspended'>('all');
  const [userProviderFilter, setUserProviderFilter] = useState<'all' | 'google' | 'email'>('all');

  // Modals for User Actions
  const [detailUser, setDetailUser] = useState<AdminUserItem | null>(null);
  const [statusConfirmUser, setStatusConfirmUser] = useState<AdminUserItem | null>(null);
  const [statusLoading, setStatusLoading] = useState(false);
  const [roleChangeUser, setRoleChangeUser] = useState<AdminUserItem | null>(null);
  const [newRole, setNewRole] = useState<'client' | 'admin'>('client');
  const [roleLoading, setRoleLoading] = useState(false);
  const [resetModalUser, setResetModalUser] = useState<AdminUserItem | null>(null);
  const [resetResult, setResetResult] = useState<{ resetToken: string; resetPath: string; expiresInMinutes: number } | null>(null);
  const [resetLoading, setResetLoading] = useState(false);

  const loadUsers = useCallback(async (page = 1) => {
    setUsersLoading(true);
    setUsersError(null);
    try {
      const res = await fetchAdminUsers({
        q: userSearch.trim(),
        role: userRoleFilter,
        status: userStatusFilter,
        provider: userProviderFilter,
        page,
        limit: usersPagination.limit,
      });
      setUsers(res.users);
      setUsersPagination(res.pagination);
    } catch (err: unknown) {
      setUsersError(err instanceof Error ? err.message : 'Failed to query users from database.');
    } finally {
      setUsersLoading(false);
    }
  }, [userSearch, userRoleFilter, userStatusFilter, userProviderFilter, usersPagination.limit]);

  /* -------------------------------------------------------------------------- */
  /*                            TAB 3: PROJECTS STATE                           */
  /* -------------------------------------------------------------------------- */
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(false);
  const [projectsError, setProjectsError] = useState<string | null>(null);
  const [projectsPagination, setProjectsPagination] = useState<PaginationMeta>({ page: 1, limit: 12, total: 0, totalPages: 1 });

  // Project Filters
  const [projectSearch, setProjectSearch] = useState('');
  const [projectStatusFilter, setProjectStatusFilter] = useState('all');

  // Modals for Project Actions
  const [detailProject, setDetailProject] = useState<Project | null>(null);
  const [updateProjectModal, setUpdateProjectModal] = useState<Project | null>(null);
  const [editStatus, setEditStatus] = useState<ProjectStatus>('in_progress');
  const [editProgress, setEditProgress] = useState<number>(0);
  const [editMessage, setEditMessage] = useState<string>('');
  const [projectUpdateLoading, setProjectUpdateLoading] = useState(false);
  const [deleteProjectModal, setDeleteProjectModal] = useState<Project | null>(null);
  const [projectDeleteLoading, setProjectDeleteLoading] = useState(false);

  const loadProjects = useCallback(async (page = 1) => {
    setProjectsLoading(true);
    setProjectsError(null);
    try {
      const res = await fetchAdminProjects({
        q: projectSearch.trim(),
        status: projectStatusFilter,
        page,
        limit: projectsPagination.limit,
      });
      setProjects(res.projects);
      setProjectsPagination(res.pagination);
    } catch (err: unknown) {
      setProjectsError(err instanceof Error ? err.message : 'Failed to query projects from database.');
    } finally {
      setProjectsLoading(false);
    }
  }, [projectSearch, projectStatusFilter, projectsPagination.limit]);

  /* -------------------------------------------------------------------------- */
  /*                          TAB 4: ACTIVITY LOGS STATE                        */
  /* -------------------------------------------------------------------------- */
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [logsError, setLogsError] = useState<string | null>(null);
  const [logsLimit, setLogsLimit] = useState(50);
  const [logsTotal, setLogsTotal] = useState(0);

  const loadLogs = useCallback(async () => {
    setLogsLoading(true);
    setLogsError(null);
    try {
      const res = await fetchAdminLogs(logsLimit, 0);
      setLogs(res.logs);
      setLogsTotal(res.total);
    } catch (err: unknown) {
      setLogsError(err instanceof Error ? err.message : 'Failed to fetch audit logs.');
    } finally {
      setLogsLoading(false);
    }
  }, [logsLimit]);

  /* -------------------------------------------------------------------------- */
  /*                         TAB 5: SYSTEM STATUS STATE                         */
  /* -------------------------------------------------------------------------- */
  const [systemInfo, setSystemInfo] = useState<AdminSystemInfo | null>(null);
  const [systemLoading, setSystemLoading] = useState(false);
  const [systemError, setSystemError] = useState<string | null>(null);

  const loadSystemInfo = useCallback(async () => {
    setSystemLoading(true);
    setSystemError(null);
    try {
      const res = await fetchAdminSystemStatus();
      setSystemInfo(res.system);
    } catch (err: unknown) {
      setSystemError(err instanceof Error ? err.message : 'Failed to retrieve system diagnostic metrics.');
    } finally {
      setSystemLoading(false);
    }
  }, []);

  // Fetch tab data whenever active tab or verified admin changes
  useEffect(() => {
    if (!currentUser || currentUser.role !== 'admin') return;

    if (tab === 'overview') {
      loadStats();
    } else if (tab === 'users') {
      loadUsers(1);
    } else if (tab === 'projects') {
      loadProjects(1);
    } else if (tab === 'logs') {
      loadLogs();
    } else if (tab === 'system') {
      loadSystemInfo();
    }
  }, [tab, currentUser, loadStats, loadUsers, loadProjects, loadLogs, loadSystemInfo]);

  /* -------------------------------------------------------------------------- */
  /*                              ACTION HANDLERS                               */
  /* -------------------------------------------------------------------------- */

  // Suspend / Reinstate User
  const handleExecuteStatusToggle = async () => {
    if (!statusConfirmUser) return;
    setStatusLoading(true);
    try {
      const newSuspended = !statusConfirmUser.suspended;
      const res = await updateAdminUserStatus(statusConfirmUser.id, newSuspended);
      push('success', res.message);
      setStatusConfirmUser(null);
      // Refresh user lists
      loadUsers(usersPagination.page);
      if (tab === 'overview') loadStats();
    } catch (err: unknown) {
      push('error', err instanceof Error ? err.message : 'Failed to update user status.');
    } finally {
      setStatusLoading(false);
    }
  };

  // Change User Role
  const handleExecuteRoleChange = async () => {
    if (!roleChangeUser) return;
    setRoleLoading(true);
    try {
      const res = await updateAdminUserRole(roleChangeUser.id, newRole);
      push('success', res.message);
      setRoleChangeUser(null);
      loadUsers(usersPagination.page);
      if (tab === 'overview') loadStats();
    } catch (err: unknown) {
      push('error', err instanceof Error ? err.message : 'Failed to update user role.');
    } finally {
      setRoleLoading(false);
    }
  };



  // Generate Password Reset Link
  const handleExecutePasswordResetLink = async () => {
    if (!resetModalUser) return;
    setResetLoading(true);
    try {
      const res = await generateAdminPasswordResetLink(resetModalUser.id);
      setResetResult({
        resetToken: res.resetToken,
        resetPath: res.resetPath,
        expiresInMinutes: res.expiresInMinutes,
      });
      push('success', 'Single-use password reset link generated.');
    } catch (err: unknown) {
      push('error', err instanceof Error ? err.message : 'Failed to generate reset link.');
    } finally {
      setResetLoading(false);
    }
  };

  // Update Project Status & Progress
  const handleExecuteProjectUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!updateProjectModal) return;
    setProjectUpdateLoading(true);
    try {
      const res = await updateAdminProject(updateProjectModal.id, {
        status: editStatus,
        progress: editProgress,
        message: editMessage.trim() || undefined,
      });
      push('success', res.message);
      setUpdateProjectModal(null);
      setEditMessage('');
      loadProjects(projectsPagination.page);
      if (tab === 'overview') loadStats();
    } catch (err: unknown) {
      push('error', err instanceof Error ? err.message : 'Failed to update project.');
    } finally {
      setProjectUpdateLoading(false);
    }
  };

  // Delete Project
  const handleExecuteProjectDelete = async () => {
    if (!deleteProjectModal) return;
    setProjectDeleteLoading(true);
    try {
      const res = await deleteAdminProject(deleteProjectModal.id);
      push('success', res.message);
      setDeleteProjectModal(null);
      loadProjects(projectsPagination.page);
      if (tab === 'overview') loadStats();
    } catch (err: unknown) {
      push('error', err instanceof Error ? err.message : 'Failed to delete project.');
    } finally {
      setProjectDeleteLoading(false);
    }
  };

  // Copy helper
  const handleCopy = (text: string, label = 'Copied') => {
    navigator.clipboard.writeText(text);
    push('info', `${label} to clipboard`);
  };

  /* -------------------------------------------------------------------------- */
  /*                         RENDER GUARD: AUTH CHECKING                        */
  /* -------------------------------------------------------------------------- */

  if (authLoading) {
    return (
      <div className="flex min-h-[80vh] flex-col items-center justify-center p-6 text-center">
        <div className="relative mb-6">
          <div className="absolute -inset-4 rounded-full bg-violet-600/20 blur-xl animate-pulse" />
          <TcMonogram className="relative h-16 w-16 shadow-2xl" />
        </div>
        <div className="flex items-center gap-3 font-mono text-sm tracking-wider uppercase text-[var(--color-muted)]">
          <Spinner className="h-4 w-4 text-[var(--color-violet)]" />
          Verifying administrator authorization...
        </div>
      </div>
    );
  }

  if (authError || !currentUser || currentUser.role !== 'admin') {
    return (
      <div className="mx-auto flex min-h-[75vh] max-w-lg flex-col items-center justify-center p-6 text-center">
        <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-rose-500/30 bg-rose-500/10 text-rose-400 shadow-xl shadow-rose-950/20">
          <IconShield className="h-8 w-8" />
        </div>
        <SectionLabel className="mb-2">Security Enforcement</SectionLabel>
        <h2 className="font-display text-2xl font-bold tracking-tight text-[var(--color-ink)] sm:text-3xl">
          Administrator Access Required
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-[var(--color-muted)]">
          {authError || 'Only server-verified administrator identities have permission to access database records, user accounts, and system controls.'}
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          {currentUser ? (
            <>
              <Button variant="outline" onClick={() => navigate('/dashboard')}>
                Go to Client Dashboard
              </Button>
              <Button variant="primary" onClick={handleLogout}>
                Sign In as Administrator
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={() => navigate('/')}>
                Return to Home
              </Button>
              <Button variant="primary" onClick={() => navigate('/admin/login')}>
                Administrator Login
              </Button>
            </>
          )}
        </div>
      </div>
    );
  }

  /* -------------------------------------------------------------------------- */
  /*                           MAIN ADMIN CONSOLE UI                            */
  /* -------------------------------------------------------------------------- */

  return (
    <div className="min-h-screen bg-[var(--color-void)] text-[var(--color-ink)] pb-20">
      {/* Top Admin Bar */}
      <header className="sticky top-0 z-40 border-b border-[var(--color-line)] bg-[var(--color-surface)]/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <TcMonogram className="h-9 w-9" />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-display text-base font-bold tracking-tight text-[var(--color-ink)]">THE CREATORS</span>
                <span className="rounded-md border border-violet-500/40 bg-violet-500/15 px-1.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-violet-300">
                  Admin Panel
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] font-mono text-[var(--color-faint)]">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                PostgreSQL Neon Connected
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Admin identity indicator */}
            <div className="hidden sm:flex items-center gap-2.5 rounded-xl border border-[var(--color-line)] bg-[var(--color-raise)]/60 px-3 py-1.5 text-xs">
              {currentUser.avatarUrl ? (
                <img src={currentUser.avatarUrl} alt="" className="h-5 w-5 rounded-full object-cover" />
              ) : (
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-violet-500/20 text-violet-300 font-mono text-[10px]">
                  {currentUser.name.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="text-left font-mono">
                <div className="font-medium text-[var(--color-ink)] leading-none">{currentUser.name}</div>
                <div className="text-[10px] text-[var(--color-faint)] leading-tight">{currentUser.email}</div>
              </div>
            </div>

            <Button variant="ghost" size="sm" onClick={handleLogout} title="Sign Out">
              <IconLogout className="h-4 w-4" />
              <span className="hidden sm:inline">Sign Out</span>
            </Button>
          </div>
        </div>

        {/* Responsive Tab Bar Navigation */}
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <nav className="flex space-x-1 sm:space-x-2 overflow-x-auto py-2 no-scrollbar border-t border-[var(--color-line)]/50 text-xs sm:text-sm font-display font-medium">
            <button
              onClick={() => handleTabChange('overview')}
              className={`flex items-center gap-2 rounded-lg px-3.5 py-2 transition whitespace-nowrap cursor-pointer ${
                tab === 'overview'
                  ? 'bg-violet-600/15 text-violet-300 border border-violet-500/30'
                  : 'text-[var(--color-muted)] hover:text-[var(--color-ink)] hover:bg-[var(--color-raise)]'
              }`}
            >
              <IconChart className="h-4 w-4 shrink-0" />
              Overview
            </button>

            <button
              onClick={() => handleTabChange('users')}
              className={`flex items-center gap-2 rounded-lg px-3.5 py-2 transition whitespace-nowrap cursor-pointer ${
                tab === 'users'
                  ? 'bg-violet-600/15 text-violet-300 border border-violet-500/30'
                  : 'text-[var(--color-muted)] hover:text-[var(--color-ink)] hover:bg-[var(--color-raise)]'
              }`}
            >
              <IconUser className="h-4 w-4 shrink-0" />
              Users
              {stats?.totalUsers !== undefined && (
                <span className="rounded-full bg-[var(--color-raise)] px-1.5 py-0.2 font-mono text-[10px] text-[var(--color-muted)]">
                  {stats.totalUsers}
                </span>
              )}
            </button>

            <button
              onClick={() => handleTabChange('projects')}
              className={`flex items-center gap-2 rounded-lg px-3.5 py-2 transition whitespace-nowrap cursor-pointer ${
                tab === 'projects'
                  ? 'bg-violet-600/15 text-violet-300 border border-violet-500/30'
                  : 'text-[var(--color-muted)] hover:text-[var(--color-ink)] hover:bg-[var(--color-raise)]'
              }`}
            >
              <IconFolder className="h-4 w-4 shrink-0" />
              Projects
              {stats?.projects !== undefined && (
                <span className="rounded-full bg-[var(--color-raise)] px-1.5 py-0.2 font-mono text-[10px] text-[var(--color-muted)]">
                  {stats.projects}
                </span>
              )}
            </button>

            <button
              onClick={() => handleTabChange('logs')}
              className={`flex items-center gap-2 rounded-lg px-3.5 py-2 transition whitespace-nowrap cursor-pointer ${
                tab === 'logs'
                  ? 'bg-violet-600/15 text-violet-300 border border-violet-500/30'
                  : 'text-[var(--color-muted)] hover:text-[var(--color-ink)] hover:bg-[var(--color-raise)]'
              }`}
            >
              <IconActivity className="h-4 w-4 shrink-0" />
              Activity Logs
            </button>

            <button
              onClick={() => handleTabChange('system')}
              className={`flex items-center gap-2 rounded-lg px-3.5 py-2 transition whitespace-nowrap cursor-pointer ${
                tab === 'system'
                  ? 'bg-violet-600/15 text-violet-300 border border-violet-500/30'
                  : 'text-[var(--color-muted)] hover:text-[var(--color-ink)] hover:bg-[var(--color-raise)]'
              }`}
            >
              <IconCpu className="h-4 w-4 shrink-0" />
              System Status
            </button>
          </nav>
        </div>
      </header>

      {/* Main Tab Content */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        {/* ==================================================================== */}
        {/* TAB 1: OVERVIEW                                                      */}
        {/* ==================================================================== */}
        {tab === 'overview' && (
          <div className="space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[var(--color-ink)]">
                  System Overview
                </h1>
                <p className="mt-1 text-sm text-[var(--color-muted)]">
                  Real-time PostgreSQL aggregates and database-backed metrics across client engagements.
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={loadStats} loading={statsLoading}>
                Refresh Overview
              </Button>
            </div>

            {statsError && (
              <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-300 flex items-center justify-between">
                <span>{statsError}</span>
                <Button variant="danger" size="sm" onClick={loadStats}>Retry</Button>
              </div>
            )}

            {/* KPI Cards Grid */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {/* Users KPI */}
              <div className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-raise)]/40 p-5 backdrop-blur-sm">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs uppercase tracking-wider text-[var(--color-muted)]">Total Users</span>
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/10 text-violet-400">
                    <IconUser className="h-4 w-4" />
                  </div>
                </div>
                <div className="mt-3 font-mono text-3xl font-bold tracking-tight text-[var(--color-ink)]">
                  {statsLoading ? <Spinner className="h-7 w-7" /> : stats?.totalUsers ?? '—'}
                </div>
                <div className="mt-2 flex items-center gap-2 text-xs text-[var(--color-faint)] font-mono">
                  <span>{stats?.clients ?? 0} Clients</span>
                  <span>•</span>
                  <span>{stats?.admins ?? 0} Admins</span>
                </div>
              </div>

              {/* Active / Suspended Accounts */}
              <div className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-raise)]/40 p-5 backdrop-blur-sm">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs uppercase tracking-wider text-[var(--color-muted)]">Active Accounts</span>
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
                    <IconCheck className="h-4 w-4" />
                  </div>
                </div>
                <div className="mt-3 font-mono text-3xl font-bold tracking-tight text-emerald-400">
                  {statsLoading ? <Spinner className="h-7 w-7" /> : stats?.activeUsers ?? '—'}
                </div>
                <div className="mt-2 text-xs text-[var(--color-faint)] font-mono">
                  {stats?.suspendedUsers ?? 0} Suspended accounts
                </div>
              </div>

              {/* Active Accounts */}
              <div className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-raise)]/40 p-5 backdrop-blur-sm">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs uppercase tracking-wider text-[var(--color-muted)]">Active Accounts</span>
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
                    <IconCheck className="h-4 w-4" />
                  </div>
                </div>
                <div className="mt-3 font-mono text-3xl font-bold tracking-tight text-emerald-300">
                  {statsLoading ? <Spinner className="h-7 w-7" /> : stats?.activeUsers ?? '—'}
                </div>
                <div className="mt-2 text-xs text-[var(--color-faint)] font-mono">
                  Verified active client accounts
                </div>
              </div>

              {/* Project Requests */}
              <div className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-raise)]/40 p-5 backdrop-blur-sm">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs uppercase tracking-wider text-[var(--color-muted)]">Project Intake</span>
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400">
                    <IconFolder className="h-4 w-4" />
                  </div>
                </div>
                <div className="mt-3 font-mono text-3xl font-bold tracking-tight text-[var(--color-ink)]">
                  {statsLoading ? <Spinner className="h-7 w-7" /> : stats?.projects ?? '—'}
                </div>
                <div className="mt-2 flex items-center gap-1.5 text-xs text-[var(--color-faint)] font-mono">
                  <span>{stats?.byStatus?.in_progress ?? 0} In Progress</span>
                  <span>•</span>
                  <span>{stats?.byStatus?.completed ?? 0} Completed</span>
                </div>
              </div>
            </div>

            {/* Split Grid: Recent Projects & Recent Activity */}
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
              {/* Recent Projects Table */}
              <div className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-raise)]/30 p-6 backdrop-blur-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-display text-base font-semibold text-[var(--color-ink)]">Recent Project Requests</h3>
                  <button
                    onClick={() => handleTabChange('projects')}
                    className="text-xs font-mono text-violet-400 hover:text-violet-300 transition cursor-pointer"
                  >
                    View All →
                  </button>
                </div>

                {statsLoading ? (
                  <div className="py-12 text-center text-sm text-[var(--color-faint)]"><Spinner className="mx-auto mb-2" /> Loading projects...</div>
                ) : !stats?.recentProjects?.length ? (
                  <EmptyState icon={<IconFolder className="h-6 w-6" />} title="No Projects" body="No client project requests have been recorded yet." />
                ) : (
                  <div className="divide-y divide-[var(--color-line)]">
                    {stats.recentProjects.map((p) => (
                      <div key={p.id} className="py-3 flex items-center justify-between gap-4">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-semibold text-violet-300">{p.project_id}</span>
                            <StatusBadge status={p.status} />
                          </div>
                          <p className="mt-1 truncate text-sm font-medium text-[var(--color-ink)]">{p.title}</p>
                          <p className="text-xs text-[var(--color-muted)] truncate">{p.client_name} ({p.client_email})</p>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="font-mono text-xs text-[var(--color-faint)]">{timeAgo(p.created_at)}</span>
                          <div className="mt-1 font-mono text-xs text-violet-400">{p.progress}%</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Recent Activity Stream */}
              <div className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-raise)]/30 p-6 backdrop-blur-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-display text-base font-semibold text-[var(--color-ink)]">Persisted Audit Stream</h3>
                  <button
                    onClick={() => handleTabChange('logs')}
                    className="text-xs font-mono text-violet-400 hover:text-violet-300 transition cursor-pointer"
                  >
                    View All Logs →
                  </button>
                </div>

                {statsLoading ? (
                  <div className="py-12 text-center text-sm text-[var(--color-faint)]"><Spinner className="mx-auto mb-2" /> Loading logs...</div>
                ) : !stats?.recentActivity?.length ? (
                  <EmptyState icon={<IconActivity className="h-6 w-6" />} title="No Activity" body="No administrative actions logged yet." />
                ) : (
                  <div className="space-y-3">
                    {stats.recentActivity.map((log) => (
                      <div key={log.id} className="flex items-start gap-3 rounded-xl border border-[var(--color-line)]/50 bg-[var(--color-raise)]/50 p-3 text-xs">
                        <div className="mt-0.5 rounded-full p-1 bg-violet-500/10 text-violet-400">
                          <IconActivity className="h-3.5 w-3.5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-mono font-semibold text-[var(--color-ink)] truncate">{log.action}</span>
                            <span className="font-mono text-[10px] text-[var(--color-faint)] shrink-0">{timeAgo(log.created_at)}</span>
                          </div>
                          <p className="mt-0.5 font-mono text-[11px] text-violet-300 truncate">{log.actor}</p>
                          {log.detail && (
                            <p className="mt-1 text-[var(--color-muted)] line-clamp-1">{log.detail}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ==================================================================== */}
        {/* TAB 2: USERS                                                         */}
        {/* ==================================================================== */}
        {tab === 'users' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[var(--color-ink)]">
                  User Management
                </h1>
                <p className="mt-1 text-sm text-[var(--color-muted)]">
                  Registered accounts, roles, verified Google identities, credit balances, and session security.
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={() => loadUsers(usersPagination.page)} loading={usersLoading}>
                Refresh Users
              </Button>
            </div>

            {/* Filter & Search Bar */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5 rounded-2xl border border-[var(--color-line)] bg-[var(--color-raise)]/30 p-4">
              <div className="lg:col-span-2 relative">
                <IconSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-faint)]" />
                <Input
                  placeholder="Search name, email, or user ID..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="pl-9"
                />
              </div>

              <div>
                <Select
                  value={userRoleFilter}
                  onChange={(e) => setUserRoleFilter(e.target.value as 'all' | 'client' | 'admin')}
                >
                  <option value="all">All Roles</option>
                  <option value="client">Clients Only</option>
                  <option value="admin">Administrators</option>
                </Select>
              </div>

              <div>
                <Select
                  value={userStatusFilter}
                  onChange={(e) => setUserStatusFilter(e.target.value as 'all' | 'active' | 'suspended')}
                >
                  <option value="all">All Statuses</option>
                  <option value="active">Active Only</option>
                  <option value="suspended">Suspended Only</option>
                </Select>
              </div>

              <div>
                <Select
                  value={userProviderFilter}
                  onChange={(e) => setUserProviderFilter(e.target.value as 'all' | 'google' | 'email')}
                >
                  <option value="all">All Providers</option>
                  <option value="google">Google OAuth</option>
                  <option value="email">Email / Password</option>
                </Select>
              </div>
            </div>

            {usersError && (
              <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-300 flex items-center justify-between">
                <span>{usersError}</span>
                <Button variant="danger" size="sm" onClick={() => loadUsers(1)}>Retry</Button>
              </div>
            )}

            {/* Users Table */}
            <div className="overflow-hidden rounded-2xl border border-[var(--color-line)] bg-[var(--color-raise)]/20 shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-[var(--color-line)] bg-[var(--color-raise)]/60 font-mono text-[11px] uppercase tracking-wider text-[var(--color-muted)]">
                      <th className="px-5 py-3.5">User</th>
                      <th className="px-4 py-3.5">Role</th>
                      <th className="px-4 py-3.5">Provider</th>
                      <th className="px-4 py-3.5">Status</th>
                      <th className="px-4 py-3.5">Created</th>
                      <th className="px-5 py-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--color-line)]">
                    {usersLoading ? (
                      <tr>
                        <td colSpan={6} className="px-5 py-12 text-center text-sm text-[var(--color-faint)]">
                          <Spinner className="mx-auto mb-2" /> Loading registered users from PostgreSQL...
                        </td>
                      </tr>
                    ) : users.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-5 py-12">
                          <EmptyState icon={<IconUser className="h-6 w-6" />} title="No Users Found" body="No user accounts match the current filter and search criteria." />
                        </td>
                      </tr>
                    ) : (
                      users.map((u) => {
                        const isSelf = currentUser.id === u.id;
                        return (
                          <tr key={u.id} className="hover:bg-[var(--color-raise)]/40 transition">
                            <td className="px-5 py-4">
                              <div className="flex items-center gap-3">
                                {u.avatarUrl ? (
                                  <img src={u.avatarUrl} alt="" className="h-9 w-9 rounded-full object-cover shrink-0" />
                                ) : (
                                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-violet-500/20 text-violet-300 font-mono font-bold text-xs shrink-0">
                                    {u.name.charAt(0).toUpperCase()}
                                  </div>
                                )}
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className="font-display font-semibold text-[var(--color-ink)] truncate">{u.name}</span>
                                    {isSelf && (
                                      <span className="rounded bg-violet-500/20 px-1.5 py-0.2 font-mono text-[10px] text-violet-300 font-medium">You</span>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-1.5 text-xs text-[var(--color-muted)]">
                                    <span className="truncate">{u.email}</span>
                                    <button
                                      onClick={() => handleCopy(u.email, 'Email copied')}
                                      className="text-[var(--color-faint)] hover:text-[var(--color-ink)] transition"
                                      title="Copy email"
                                    >
                                      <IconCopy className="h-3 w-3" />
                                    </button>
                                  </div>
                                  <div className="font-mono text-[10px] text-[var(--color-faint)]">{u.id}</div>
                                </div>
                              </div>
                            </td>

                            <td className="px-4 py-4 whitespace-nowrap">
                              <span className={`inline-flex items-center rounded-md px-2 py-0.5 font-mono text-[11px] font-semibold uppercase tracking-wider ${
                                u.role === 'admin'
                                  ? 'bg-violet-500/20 text-violet-300 border border-violet-500/30'
                                  : 'bg-[var(--color-raise)] text-[var(--color-muted)] border border-[var(--color-line)]'
                              }`}>
                                {u.role}
                              </span>
                            </td>

                            <td className="px-4 py-4 whitespace-nowrap">
                              <span className="inline-flex items-center gap-1 text-xs font-mono text-[var(--color-muted)]">
                                {u.isGoogle ? (
                                  <span className="flex items-center gap-1 text-emerald-400">
                                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                                    Google
                                  </span>
                                ) : (
                                  <span className="flex items-center gap-1 text-[var(--color-faint)]">
                                    <IconFile className="h-3 w-3" />
                                    Email
                                  </span>
                                )}
                              </span>
                            </td>

                            <td className="px-4 py-4 whitespace-nowrap">
                              {u.suspended ? (
                                <span className="inline-flex items-center gap-1 rounded-md border border-rose-500/30 bg-rose-500/10 px-2 py-0.5 font-mono text-[11px] text-rose-400">
                                  <span className="h-1.5 w-1.5 rounded-full bg-rose-400" />
                                  Suspended
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 font-mono text-[11px] text-emerald-400">
                                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                                  Active
                                </span>
                              )}
                            </td>

                            <td className="px-4 py-4 whitespace-nowrap font-mono text-xs text-[var(--color-faint)]">
                              {formatDate(u.createdAt)}
                            </td>

                            <td className="px-5 py-4 text-right whitespace-nowrap">
                              <div className="flex items-center justify-end gap-1.5">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setDetailUser(u)}
                                  title="View User Details"
                                >
                                  Details
                                </Button>

                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setResetModalUser(u);
                                    setResetResult(null);
                                  }}
                                  title="Generate Single-Use Password Reset Link"
                                >
                                  Reset
                                </Button>

                                <Button
                                  variant={u.suspended ? 'primary' : 'danger'}
                                  size="sm"
                                  disabled={isSelf && !u.suspended}
                                  onClick={() => setStatusConfirmUser(u)}
                                  title={isSelf ? 'Cannot suspend self' : u.suspended ? 'Reinstate Account' : 'Suspend Account'}
                                >
                                  {u.suspended ? 'Reinstate' : 'Suspend'}
                                </Button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination Controls */}
              {usersPagination.totalPages > 1 && (
                <div className="flex items-center justify-between border-t border-[var(--color-line)] bg-[var(--color-raise)]/40 px-5 py-3 text-xs font-mono">
                  <span className="text-[var(--color-muted)]">
                    Showing {(usersPagination.page - 1) * usersPagination.limit + 1} to{' '}
                    {Math.min(usersPagination.page * usersPagination.limit, usersPagination.total)} of {usersPagination.total} users
                  </span>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={usersPagination.page <= 1 || usersLoading}
                      onClick={() => loadUsers(usersPagination.page - 1)}
                    >
                      Previous
                    </Button>
                    <span className="px-2 text-[var(--color-ink)]">
                      Page {usersPagination.page} of {usersPagination.totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={usersPagination.page >= usersPagination.totalPages || usersLoading}
                      onClick={() => loadUsers(usersPagination.page + 1)}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ==================================================================== */}
        {/* TAB 3: PROJECTS                                                      */}
        {/* ==================================================================== */}
        {tab === 'projects' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[var(--color-ink)]">
                  Project Requests
                </h1>
                <p className="mt-1 text-sm text-[var(--color-muted)]">
                  Full lifecycle management of client project inquiries, delivery statuses, progress, and engineering sprint logs.
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={() => loadProjects(projectsPagination.page)} loading={projectsLoading}>
                Refresh Projects
              </Button>
            </div>

            {/* Filter Bar */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 rounded-2xl border border-[var(--color-line)] bg-[var(--color-raise)]/30 p-4">
              <div className="sm:col-span-2 relative">
                <IconSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-faint)]" />
                <Input
                  placeholder="Search project ID, title, client name, or email..."
                  value={projectSearch}
                  onChange={(e) => setProjectSearch(e.target.value)}
                  className="pl-9"
                />
              </div>

              <div>
                <Select
                  value={projectStatusFilter}
                  onChange={(e) => setProjectStatusFilter(e.target.value)}
                >
                  <option value="all">All Project Statuses</option>
                  <option value="submitted">Submitted</option>
                  <option value="approved">Approved</option>
                  <option value="in_progress">In Progress</option>
                  <option value="delivered">Delivered</option>
                  <option value="completed">Completed</option>
                  <option value="rejected">Rejected</option>
                </Select>
              </div>
            </div>

            {projectsError && (
              <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-300 flex items-center justify-between">
                <span>{projectsError}</span>
                <Button variant="danger" size="sm" onClick={() => loadProjects(1)}>Retry</Button>
              </div>
            )}

            {/* Projects Table */}
            <div className="overflow-hidden rounded-2xl border border-[var(--color-line)] bg-[var(--color-raise)]/20 shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-[var(--color-line)] bg-[var(--color-raise)]/60 font-mono text-[11px] uppercase tracking-wider text-[var(--color-muted)]">
                      <th className="px-5 py-3.5">Project ID</th>
                      <th className="px-4 py-3.5">Service & Scope</th>
                      <th className="px-4 py-3.5">Client</th>
                      <th className="px-4 py-3.5">Status</th>
                      <th className="px-4 py-3.5">Progress</th>
                      <th className="px-4 py-3.5">Submitted</th>
                      <th className="px-5 py-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--color-line)]">
                    {projectsLoading ? (
                      <tr>
                        <td colSpan={7} className="px-5 py-12 text-center text-sm text-[var(--color-faint)]">
                          <Spinner className="mx-auto mb-2" /> Loading project requests from PostgreSQL...
                        </td>
                      </tr>
                    ) : projects.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-5 py-12">
                          <EmptyState icon={<IconFolder className="h-6 w-6" />} title="No Projects Found" body="No project requests match the current filters." />
                        </td>
                      </tr>
                    ) : (
                      projects.map((p) => (
                        <tr key={p.id} className="hover:bg-[var(--color-raise)]/40 transition">
                          <td className="px-5 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono text-xs font-bold text-violet-300">{p.projectId}</span>
                              <button
                                onClick={() => handleCopy(p.projectId, 'Project ID copied')}
                                className="text-[var(--color-faint)] hover:text-[var(--color-ink)] transition"
                                title="Copy ID"
                              >
                                <IconCopy className="h-3 w-3" />
                              </button>
                            </div>
                          </td>

                          <td className="px-4 py-4">
                            <div className="max-w-xs">
                              <p className="font-display font-semibold text-[var(--color-ink)] truncate">{p.title}</p>
                              <span className="font-mono text-xs text-[var(--color-muted)]">{p.service}</span>
                            </div>
                          </td>

                          <td className="px-4 py-4">
                            <div className="max-w-[200px]">
                              <p className="font-medium text-[var(--color-ink)] truncate">{p.clientName}</p>
                              <p className="text-xs text-[var(--color-muted)] truncate">{p.clientEmail}</p>
                            </div>
                          </td>

                          <td className="px-4 py-4 whitespace-nowrap">
                            <StatusBadge status={p.status} />
                          </td>

                          <td className="px-4 py-4 whitespace-nowrap">
                            <div className="w-24">
                              <div className="flex justify-between text-[11px] font-mono text-[var(--color-muted)] mb-1">
                                <span>{p.progress}%</span>
                              </div>
                              <ProgressBar value={p.progress} />
                            </div>
                          </td>

                          <td className="px-4 py-4 whitespace-nowrap font-mono text-xs text-[var(--color-faint)]">
                            {formatDate(p.createdAt)}
                          </td>

                          <td className="px-5 py-4 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1.5">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setDetailProject(p)}
                                title="View Full Project Details"
                              >
                                Details
                              </Button>

                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setUpdateProjectModal(p);
                                  setEditStatus(p.status);
                                  setEditProgress(p.progress);
                                  setEditMessage('');
                                }}
                                title="Update Status & Progress"
                              >
                                Update
                              </Button>

                              <Button
                                variant="danger"
                                size="sm"
                                onClick={() => setDeleteProjectModal(p)}
                                title="Delete Project"
                              >
                                Delete
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination Controls */}
              {projectsPagination.totalPages > 1 && (
                <div className="flex items-center justify-between border-t border-[var(--color-line)] bg-[var(--color-raise)]/40 px-5 py-3 text-xs font-mono">
                  <span className="text-[var(--color-muted)]">
                    Showing {(projectsPagination.page - 1) * projectsPagination.limit + 1} to{' '}
                    {Math.min(projectsPagination.page * projectsPagination.limit, projectsPagination.total)} of {projectsPagination.total} projects
                  </span>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={projectsPagination.page <= 1 || projectsLoading}
                      onClick={() => loadProjects(projectsPagination.page - 1)}
                    >
                      Previous
                    </Button>
                    <span className="px-2 text-[var(--color-ink)]">
                      Page {projectsPagination.page} of {projectsPagination.totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={projectsPagination.page >= projectsPagination.totalPages || projectsLoading}
                      onClick={() => loadProjects(projectsPagination.page + 1)}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ==================================================================== */}
        {/* TAB 4: ACTIVITY LOGS                                                 */}
        {/* ==================================================================== */}
        {tab === 'logs' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[var(--color-ink)]">
                  Persisted Audit Logs
                </h1>
                <p className="mt-1 text-sm text-[var(--color-muted)]">
                  Immutable audit records of sensitive operations, identity verifications, credit allocations, and security events.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <Select
                  value={logsLimit}
                  onChange={(e) => setLogsLimit(Number(e.target.value))}
                  className="w-32 py-1.5 text-xs font-mono"
                >
                  <option value={25}>Show 25</option>
                  <option value={50}>Show 50</option>
                  <option value={100}>Show 100</option>
                </Select>
                <Button variant="outline" size="sm" onClick={loadLogs} loading={logsLoading}>
                  Refresh Logs
                </Button>
              </div>
            </div>

            {logsError && (
              <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-300 flex items-center justify-between">
                <span>{logsError}</span>
                <Button variant="danger" size="sm" onClick={loadLogs}>Retry</Button>
              </div>
            )}

            <div className="overflow-hidden rounded-2xl border border-[var(--color-line)] bg-[var(--color-raise)]/20 shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-[var(--color-line)] bg-[var(--color-raise)]/60 font-mono text-[11px] uppercase tracking-wider text-[var(--color-muted)]">
                      <th className="px-5 py-3.5">Timestamp</th>
                      <th className="px-4 py-3.5">Actor</th>
                      <th className="px-4 py-3.5">Action</th>
                      <th className="px-5 py-3.5">Event Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--color-line)]">
                    {logsLoading ? (
                      <tr>
                        <td colSpan={4} className="px-5 py-12 text-center text-sm text-[var(--color-faint)]">
                          <Spinner className="mx-auto mb-2" /> Querying audit log records from PostgreSQL...
                        </td>
                      </tr>
                    ) : logs.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-5 py-12">
                          <EmptyState icon={<IconActivity className="h-6 w-6" />} title="No Logs Found" body="No administrative audit records found in the database." />
                        </td>
                      </tr>
                    ) : (
                      logs.map((log) => (
                        <tr key={log.id} className="hover:bg-[var(--color-raise)]/40 transition">
                          <td className="px-5 py-3.5 whitespace-nowrap font-mono text-xs text-[var(--color-faint)]">
                            <div>{formatDate(log.createdAt)}</div>
                            <div className="text-[10px] text-[var(--color-muted)]">{timeAgo(log.createdAt)}</div>
                          </td>

                          <td className="px-4 py-3.5 font-mono text-xs text-violet-300 whitespace-nowrap">
                            {log.actor}
                          </td>

                          <td className="px-4 py-3.5 whitespace-nowrap">
                            <span className="inline-flex items-center rounded-md border border-violet-500/20 bg-violet-500/10 px-2 py-0.5 font-mono text-[11px] font-semibold text-violet-300">
                              {log.action}
                            </span>
                          </td>

                          <td className="px-5 py-3.5 text-xs text-[var(--color-ink)] max-w-md break-words">
                            {log.detail || '—'}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <div className="border-t border-[var(--color-line)] bg-[var(--color-raise)]/40 px-5 py-3 text-xs font-mono text-[var(--color-muted)]">
                Total audit entries logged in database: <span className="font-semibold text-[var(--color-ink)]">{logsTotal}</span>
              </div>
            </div>
          </div>
        )}

        {/* ==================================================================== */}
        {/* TAB 5: SYSTEM STATUS                                                 */}
        {/* ==================================================================== */}
        {tab === 'system' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[var(--color-ink)]">
                  System Diagnostics & Status
                </h1>
                <p className="mt-1 text-sm text-[var(--color-muted)]">
                  PostgreSQL connection health, query latency, active session tokens, and security enforcement status.
                </p>
              </div>

              <Button variant="outline" size="sm" onClick={loadSystemInfo} loading={systemLoading}>
                Refresh Diagnostics
              </Button>
            </div>

            {systemError && (
              <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-300 flex items-center justify-between">
                <span>{systemError}</span>
                <Button variant="danger" size="sm" onClick={loadSystemInfo}>Retry</Button>
              </div>
            )}

            {systemLoading && !systemInfo ? (
              <div className="py-20 text-center text-sm text-[var(--color-faint)]">
                <Spinner className="mx-auto mb-3" /> Checking system health and database latency...
              </div>
            ) : systemInfo ? (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                {/* Database Diagnostics */}
                <div className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-raise)]/30 p-6 backdrop-blur-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-[var(--color-line)] pb-3">
                    <h3 className="font-display text-base font-semibold text-[var(--color-ink)] flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                      PostgreSQL Database (Neon)
                    </h3>
                    <span className="rounded bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 font-mono text-[11px] text-emerald-400 font-semibold uppercase">
                      {systemInfo.database.status}
                    </span>
                  </div>

                  <div className="space-y-3 font-mono text-xs">
                    <div className="flex justify-between py-1 border-b border-[var(--color-line)]/50">
                      <span className="text-[var(--color-muted)]">Configuration Status:</span>
                      <span className="text-[var(--color-ink)]">{systemInfo.database.configured ? 'Configured & Active' : 'Unconfigured'}</span>
                    </div>

                    <div className="flex justify-between py-1 border-b border-[var(--color-line)]/50">
                      <span className="text-[var(--color-muted)]">Round-Trip Latency:</span>
                      <span className="text-emerald-400 font-bold">{systemInfo.database.latencyMs !== null ? `${systemInfo.database.latencyMs} ms` : '—'}</span>
                    </div>

                    <div className="flex justify-between py-1 border-b border-[var(--color-line)]/50">
                      <span className="text-[var(--color-muted)]">Active Authenticated Sessions:</span>
                      <span className="text-violet-300 font-bold">{systemInfo.database.activeSessionsCount} active sessions</span>
                    </div>

                    <div className="flex justify-between py-1">
                      <span className="text-[var(--color-muted)]">SSL Transport Security:</span>
                      <span className="text-emerald-400">verify-full / TLS 1.3</span>
                    </div>
                  </div>
                </div>

                {/* Google OAuth & Auth Security */}
                <div className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-raise)]/30 p-6 backdrop-blur-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-[var(--color-line)] pb-3">
                    <h3 className="font-display text-base font-semibold text-[var(--color-ink)] flex items-center gap-2">
                      <IconShield className="h-4 w-4 text-violet-400" />
                      Authentication Security
                    </h3>
                    <span className="rounded bg-violet-500/10 border border-violet-500/30 px-2 py-0.5 font-mono text-[11px] text-violet-300 font-semibold uppercase">
                      Verified
                    </span>
                  </div>

                  <div className="space-y-3 font-mono text-xs">
                    <div className="flex justify-between py-1 border-b border-[var(--color-line)]/50">
                      <span className="text-[var(--color-muted)]">Google OAuth Integration:</span>
                      <span className={systemInfo.googleAuth.configured ? 'text-emerald-400' : 'text-amber-400'}>
                        {systemInfo.googleAuth.configured ? 'Configured' : 'Missing Client ID'}
                      </span>
                    </div>

                    {systemInfo.googleAuth.clientIdPrefix && (
                      <div className="flex justify-between py-1 border-b border-[var(--color-line)]/50">
                        <span className="text-[var(--color-muted)]">Client ID Prefix:</span>
                        <span className="text-[var(--color-ink)]">{systemInfo.googleAuth.clientIdPrefix}</span>
                      </div>
                    )}

                    <div className="flex justify-between py-1 border-b border-[var(--color-line)]/50">
                      <span className="text-[var(--color-muted)]">Session Tokens:</span>
                      <span className="text-[var(--color-ink)]">Opaque (SHA-256 Hashed)</span>
                    </div>

                    <div className="flex justify-between py-1">
                      <span className="text-[var(--color-muted)]">Password Hashes:</span>
                      <span className="text-[var(--color-ink)]">Bcrypt (cost factor 10)</span>
                    </div>
                  </div>
                </div>

                {/* Runtime Environment */}
                <div className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-raise)]/30 p-6 backdrop-blur-sm space-y-4 md:col-span-2">
                  <h3 className="font-display text-base font-semibold text-[var(--color-ink)] flex items-center gap-2 border-b border-[var(--color-line)] pb-3">
                    <IconCpu className="h-4 w-4 text-violet-400" />
                    Host Runtime Environment
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 font-mono text-xs">
                    <div className="rounded-xl border border-[var(--color-line)]/50 bg-[var(--color-raise)]/50 p-3">
                      <span className="text-[var(--color-muted)] block text-[10px] uppercase">Node Engine</span>
                      <span className="text-[var(--color-ink)] font-bold text-sm mt-1 block">{systemInfo.nodeVersion}</span>
                    </div>

                    <div className="rounded-xl border border-[var(--color-line)]/50 bg-[var(--color-raise)]/50 p-3">
                      <span className="text-[var(--color-muted)] block text-[10px] uppercase">Environment</span>
                      <span className="text-violet-300 font-bold text-sm mt-1 block capitalize">{systemInfo.environment}</span>
                    </div>

                    <div className="rounded-xl border border-[var(--color-line)]/50 bg-[var(--color-raise)]/50 p-3">
                      <span className="text-[var(--color-muted)] block text-[10px] uppercase">Process Uptime</span>
                      <span className="text-[var(--color-ink)] font-bold text-sm mt-1 block">
                        {Math.floor(systemInfo.uptimeSeconds / 3600)}h {Math.floor((systemInfo.uptimeSeconds % 3600) / 60)}m
                      </span>
                    </div>

                    <div className="rounded-xl border border-[var(--color-line)]/50 bg-[var(--color-raise)]/50 p-3">
                      <span className="text-[var(--color-muted)] block text-[10px] uppercase">Server UTC Time</span>
                      <span className="text-[var(--color-ink)] font-bold text-xs mt-1 block truncate">
                        {new Date(systemInfo.serverTime).toUTCString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        )}
      </main>

      {/* ==================================================================== */}
      {/* MODALS FOR ADMINISTRATIVE ACTIONS                                    */}
      {/* ==================================================================== */}

      {/* 1. User Details Modal */}
      <Modal
        open={Boolean(detailUser)}
        onClose={() => setDetailUser(null)}
        title="User Account Details"
      >
        {detailUser && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 border-b border-[var(--color-line)] pb-4">
              {detailUser.avatarUrl ? (
                <img src={detailUser.avatarUrl} alt="" className="h-12 w-12 rounded-full object-cover" />
              ) : (
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-violet-500/20 text-violet-300 font-mono font-bold text-base">
                  {detailUser.name.charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <h4 className="font-display font-bold text-lg text-[var(--color-ink)]">{detailUser.name}</h4>
                <p className="text-xs text-[var(--color-muted)]">{detailUser.email}</p>
                <div className="mt-1 flex items-center gap-2">
                  <span className="rounded bg-violet-500/20 px-1.5 py-0.5 font-mono text-[10px] text-violet-300 uppercase">
                    {detailUser.role}
                  </span>
                  <span className={`rounded px-1.5 py-0.5 font-mono text-[10px] uppercase ${
                    detailUser.suspended ? 'bg-rose-500/20 text-rose-300' : 'bg-emerald-500/20 text-emerald-300'
                  }`}>
                    {detailUser.suspended ? 'Suspended' : 'Active'}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 font-mono text-xs">
              <div className="rounded-lg border border-[var(--color-line)] bg-[var(--color-raise)] p-2.5">
                <span className="text-[var(--color-muted)] text-[10px] block uppercase">User ID</span>
                <span className="text-[var(--color-ink)] font-bold break-all">{detailUser.id}</span>
              </div>

              <div className="rounded-lg border border-[var(--color-line)] bg-[var(--color-raise)] p-2.5">
                <span className="text-[var(--color-muted)] text-[10px] block uppercase">Role</span>
                <span className="text-[var(--color-ink)] font-bold uppercase">{detailUser.role}</span>
              </div>

              <div className="rounded-lg border border-[var(--color-line)] bg-[var(--color-raise)] p-2.5">
                <span className="text-[var(--color-muted)] text-[10px] block uppercase">Auth Provider</span>
                <span className="text-[var(--color-ink)] capitalize">{detailUser.provider}</span>
              </div>

              <div className="rounded-lg border border-[var(--color-line)] bg-[var(--color-raise)] p-2.5">
                <span className="text-[var(--color-muted)] text-[10px] block uppercase">Registration Date</span>
                <span className="text-[var(--color-ink)]">{formatDate(detailUser.createdAt)}</span>
              </div>
            </div>

            <div className="pt-3 border-t border-[var(--color-line)] flex items-center justify-between">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setRoleChangeUser(detailUser);
                  setNewRole(detailUser.role);
                  setDetailUser(null);
                }}
              >
                Change Role
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setDetailUser(null)}>
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* 2. Suspend / Reinstate User Modal */}
      <Modal
        open={Boolean(statusConfirmUser)}
        onClose={() => setStatusConfirmUser(null)}
        title={statusConfirmUser?.suspended ? 'Reinstate User Account' : 'Suspend User Account'}
      >
        {statusConfirmUser && (
          <div className="space-y-4">
            <p className="text-sm text-[var(--color-muted)] leading-relaxed">
              {statusConfirmUser.suspended ? (
                <>
                  Are you sure you want to reinstate the account for{' '}
                  <strong className="text-[var(--color-ink)]">{statusConfirmUser.name}</strong> ({statusConfirmUser.email})?
                  The user will be able to sign in and submit project requests again.
                </>
              ) : (
                <>
                  Suspending <strong className="text-[var(--color-ink)]">{statusConfirmUser.name}</strong> ({statusConfirmUser.email}) will{' '}
                  <span className="text-rose-400 font-medium">immediately revoke all active user sessions</span> and block any subsequent login attempts.
                </>
              )}
            </p>

            <div className="flex justify-end gap-2 pt-4 border-t border-[var(--color-line)]">
              <Button variant="ghost" size="sm" onClick={() => setStatusConfirmUser(null)}>
                Cancel
              </Button>
              <Button
                variant={statusConfirmUser.suspended ? 'primary' : 'danger'}
                size="sm"
                loading={statusLoading}
                onClick={handleExecuteStatusToggle}
              >
                {statusConfirmUser.suspended ? 'Confirm Reinstatement' : 'Confirm Suspension'}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* 3. Change Role Modal */}
      <Modal
        open={Boolean(roleChangeUser)}
        onClose={() => setRoleChangeUser(null)}
        title="Modify Administrator Role"
      >
        {roleChangeUser && (
          <div className="space-y-4">
            <p className="text-sm text-[var(--color-muted)]">
              Select the new security role for <strong className="text-[var(--color-ink)]">{roleChangeUser.name}</strong> ({roleChangeUser.email}).
            </p>

            <Field label="System Role">
              <Select
                value={newRole}
                onChange={(e) => setNewRole(e.target.value as 'client' | 'admin')}
              >
                <option value="client">Client (Standard user access)</option>
                <option value="admin">Administrator (Full console & database access)</option>
              </Select>
            </Field>

            <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-300">
              Note: Self-demotion and removal of the final active administrator are strictly blocked server-side.
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-[var(--color-line)]">
              <Button variant="ghost" size="sm" onClick={() => setRoleChangeUser(null)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                loading={roleLoading}
                onClick={handleExecuteRoleChange}
              >
                Save Role Change
              </Button>
            </div>
          </div>
        )}
      </Modal>



      {/* 5. Password Reset Link Modal */}
      <Modal
        open={Boolean(resetModalUser)}
        onClose={() => {
          setResetModalUser(null);
          setResetResult(null);
        }}
        title="Generate Secure Single-Use Reset Link"
      >
        {resetModalUser && (
          <div className="space-y-4">
            {!resetResult ? (
              <>
                <p className="text-sm text-[var(--color-muted)] leading-relaxed">
                  Generate a cryptographically random, single-use password recovery token for{' '}
                  <strong className="text-[var(--color-ink)]">{resetModalUser.name}</strong> ({resetModalUser.email}).
                </p>
                <div className="rounded-xl border border-violet-500/30 bg-violet-500/10 p-3 text-xs text-violet-300">
                  The raw token hash will be securely stored in the PostgreSQL <code className="font-mono">password_resets</code> table with a 60-minute expiration window.
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t border-[var(--color-line)]">
                  <Button variant="ghost" size="sm" onClick={() => setResetModalUser(null)}>
                    Cancel
                  </Button>
                  <Button variant="primary" size="sm" loading={resetLoading} onClick={handleExecutePasswordResetLink}>
                    Generate Token Link
                  </Button>
                </div>
              </>
            ) : (
              <>
                <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-300">
                  Password reset link generated successfully! This link is single-use and expires in {resetResult.expiresInMinutes} minutes.
                </div>

                <Field label="Direct Reset URL">
                  <div className="flex items-center gap-2">
                    <Input
                      readOnly
                      value={`${window.location.origin}${resetResult.resetPath}`}
                      className="font-mono text-xs select-all"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleCopy(`${window.location.origin}${resetResult.resetPath}`, 'Reset URL copied')}
                    >
                      <IconCopy className="h-4 w-4" />
                    </Button>
                  </div>
                </Field>

                <div className="flex justify-end pt-4 border-t border-[var(--color-line)]">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => {
                      setResetModalUser(null);
                      setResetResult(null);
                    }}
                  >
                    Done
                  </Button>
                </div>
              </>
            )}
          </div>
        )}
      </Modal>

      {/* 6. Project Details Modal */}
      <Modal
        open={Boolean(detailProject)}
        onClose={() => setDetailProject(null)}
        title={`Project Request ${detailProject?.projectId}`}
        wide
      >
        {detailProject && (
          <div className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--color-line)] pb-4">
              <div>
                <h4 className="font-display font-bold text-xl text-[var(--color-ink)]">{detailProject.title}</h4>
                <p className="font-mono text-xs text-violet-300 uppercase tracking-wider">{detailProject.service}</p>
              </div>
              <div className="flex items-center gap-3">
                <StatusBadge status={detailProject.status} />
                <span className="font-mono text-sm font-bold text-violet-400">{detailProject.progress}%</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-mono text-xs">
              <div className="rounded-xl border border-[var(--color-line)] bg-[var(--color-raise)] p-3">
                <span className="text-[var(--color-muted)] text-[10px] uppercase block">Client Name</span>
                <span className="text-[var(--color-ink)] font-bold text-sm">{detailProject.clientName}</span>
                <span className="text-[var(--color-faint)] block mt-0.5">{detailProject.clientEmail}</span>
              </div>

              <div className="rounded-xl border border-[var(--color-line)] bg-[var(--color-raise)] p-3">
                <span className="text-[var(--color-muted)] text-[10px] uppercase block">Timeline & Budget</span>
                <span className="text-[var(--color-ink)] font-bold text-sm">{detailProject.budget || 'Custom'}</span>
                <span className="text-[var(--color-faint)] block mt-0.5">Deadline: {detailProject.deadline || 'Flexible'}</span>
              </div>
            </div>

            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--color-muted)] block mb-1">Project Scope & Requirements</span>
              <p className="rounded-xl border border-[var(--color-line)] bg-[var(--color-raise)]/60 p-4 text-sm text-[var(--color-ink)] leading-relaxed">
                {detailProject.description}
              </p>
              {detailProject.requirements && (
                <div className="mt-2 text-xs text-[var(--color-muted)] bg-[var(--color-raise)]/30 p-3 rounded-lg border border-[var(--color-line)]/50">
                  <span className="font-mono font-semibold text-violet-300 block mb-0.5">Specifications:</span>
                  {detailProject.requirements}
                </div>
              )}
            </div>

            {/* Updates Stream */}
            {detailProject.updates && detailProject.updates.length > 0 && (
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--color-muted)] block mb-2">Engineering Sprint Logs</span>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {detailProject.updates.map((u) => (
                    <div key={u.id} className="rounded-lg border border-[var(--color-line)] bg-[var(--color-raise)]/40 p-3 text-xs">
                      <div className="flex items-center justify-between font-mono text-[10px] text-[var(--color-faint)]">
                        <span className="text-violet-300 font-semibold">{u.authorName} ({u.authorRole})</span>
                        <span>{formatDate(u.createdAt)}</span>
                      </div>
                      <p className="mt-1 text-[var(--color-ink)]">{u.message}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-4 border-t border-[var(--color-line)]">
              <Button variant="ghost" size="sm" onClick={() => setDetailProject(null)}>
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* 7. Update Project Status & Progress Modal */}
      <Modal
        open={Boolean(updateProjectModal)}
        onClose={() => setUpdateProjectModal(null)}
        title="Update Project Deliverable"
      >
        {updateProjectModal && (
          <form onSubmit={handleExecuteProjectUpdate} className="space-y-4">
            <p className="text-sm text-[var(--color-muted)]">
              Update status, progress percentage, and log engineering notes for{' '}
              <strong className="text-[var(--color-ink)]">{updateProjectModal.projectId}</strong> ({updateProjectModal.title}).
            </p>

            <Field label="Project Status">
              <Select
                value={editStatus}
                onChange={(e) => setEditStatus(e.target.value as ProjectStatus)}
              >
                <option value="submitted">Submitted</option>
                <option value="approved">Approved</option>
                <option value="in_progress">In Progress</option>
                <option value="delivered">Delivered</option>
                <option value="completed">Completed</option>
                <option value="rejected">Rejected</option>
              </Select>
            </Field>

            <Field label={`Progress Completion: ${editProgress}%`}>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={editProgress}
                  onChange={(e) => setEditProgress(Number(e.target.value))}
                  className="w-full accent-violet-500 cursor-pointer"
                />
                <span className="font-mono text-xs w-10 text-right">{editProgress}%</span>
              </div>
            </Field>

            <Field label="Sprint Note / Client Update Message" hint="Saved to project updates timeline">
              <Textarea
                value={editMessage}
                onChange={(e) => setEditMessage(e.target.value)}
                placeholder="e.g. Sprints 1 & 2 completed. API gateway and database indexes deployed."
                className="min-h-[80px]"
              />
            </Field>

            <div className="flex justify-end gap-2 pt-4 border-t border-[var(--color-line)]">
              <Button variant="ghost" size="sm" type="button" onClick={() => setUpdateProjectModal(null)}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" type="submit" loading={projectUpdateLoading}>
                Save Updates
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* 8. Delete Project Modal */}
      <Modal
        open={Boolean(deleteProjectModal)}
        onClose={() => setDeleteProjectModal(null)}
        title="Delete Project Request"
      >
        {deleteProjectModal && (
          <div className="space-y-4">
            <p className="text-sm text-[var(--color-muted)]">
              Are you sure you want to delete project{' '}
              <strong className="text-[var(--color-ink)]">{deleteProjectModal.projectId}</strong> ({deleteProjectModal.title})?
            </p>
            <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300">
              This action permanently deletes the project and its sprint timeline from PostgreSQL. This action cannot be undone.
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-[var(--color-line)]">
              <Button variant="ghost" size="sm" onClick={() => setDeleteProjectModal(null)}>
                Cancel
              </Button>
              <Button
                variant="danger"
                size="sm"
                loading={projectDeleteLoading}
                onClick={handleExecuteProjectDelete}
              >
                Confirm Delete
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
