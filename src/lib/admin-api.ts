import { api } from './api';
import type {
  Project,
  ProjectStatus,
  AuditLog,
  ReferralStatus,
  UserReferralItem,
  UserReferralSummary,
  AdminReferralItem,
} from '@/types';

export interface AdminStats {
  totalUsers: number;
  clients: number;
  admins: number;
  activeUsers: number;
  suspendedUsers: number;
  googleUsers: number;
  projects: number;
  byStatus: {
    submitted: number;
    approved: number;
    in_progress: number;
    delivered: number;
    completed: number;
    rejected: number;
  };
  recentProjects: Array<{
    id: string;
    project_id: string;
    client_name: string;
    client_email: string;
    title: string;
    service: string;
    status: string;
    progress: number;
    created_at: string;
  }>;
  recentUsers: Array<{
    id: string;
    name: string;
    email: string;
    role: string;
    token_balance: number;
    suspended: boolean;
    is_google: boolean;
    created_at: string;
  }>;
  recentActivity: Array<{
    id: string;
    actor: string;
    action: string;
    detail: string | null;
    created_at: string;
  }>;
}

export interface AdminUserItem {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  age?: number | null;
  role: 'client' | 'admin';
  tokenBalance?: number;
  suspended: boolean;
  avatarUrl?: string | null;
  createdAt: string;
  isGoogle: boolean;
  provider: 'google' | 'email';
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface AdminUserQueryParams {
  q?: string;
  role?: 'all' | 'client' | 'admin';
  status?: 'all' | 'active' | 'suspended';
  provider?: 'all' | 'google' | 'email';
  page?: number;
  limit?: number;
}

export interface AdminUsersResponse {
  ok: boolean;
  users: AdminUserItem[];
  pagination: PaginationMeta;
}

export interface AdminUserStatusResponse {
  ok: boolean;
  userId: string;
  suspended: boolean;
  message: string;
}

export interface AdminUserRoleResponse {
  ok: boolean;
  userId: string;
  role: 'client' | 'admin';
  message: string;
}



export interface AdminPasswordResetResponse {
  ok: boolean;
  user: {
    id: string;
    email: string;
    name: string;
  };
  resetToken: string;
  resetPath: string;
  expiresInMinutes: number;
  message: string;
}

export interface AdminProjectsQueryParams {
  q?: string;
  status?: string;
  page?: number;
  limit?: number;
}

export interface AdminProjectsResponse {
  ok: boolean;
  projects: Project[];
  pagination: PaginationMeta;
}

export interface AdminProjectUpdateResponse {
  ok: boolean;
  projectId: string;
  status: ProjectStatus;
  progress: number;
  message: string;
}

export interface AdminProjectDeleteResponse {
  ok: boolean;
  message: string;
}

export interface AdminLogsResponse {
  ok: boolean;
  logs: AuditLog[];
  total: number;
  limit: number;
  offset: number;
}

export interface AdminSystemInfo {
  serverTime: string;
  uptimeSeconds: number;
  nodeVersion: string;
  environment: string;
  database: {
    configured: boolean;
    status: string;
    latencyMs: number | null;
    activeSessionsCount: number;
  };
  googleAuth: {
    configured: boolean;
    clientIdPrefix: string | null;
  };
}

export interface AdminSystemStatusResponse {
  ok: boolean;
  system: AdminSystemInfo;
}

/**
 * Typed client API functions for administrative operations backed by PostgreSQL.
 */

export async function fetchAdminStats(): Promise<AdminStats> {
  const res = await api<{ ok: boolean; stats: AdminStats }>('/api/admin/stats');
  return res.stats;
}

export async function fetchAdminUsers(params: AdminUserQueryParams = {}): Promise<AdminUsersResponse> {
  const query = new URLSearchParams();
  if (params.q) query.set('q', params.q);
  if (params.role && params.role !== 'all') query.set('role', params.role);
  if (params.status && params.status !== 'all') query.set('status', params.status);
  if (params.provider && params.provider !== 'all') query.set('provider', params.provider);
  if (params.page) query.set('page', String(params.page));
  if (params.limit) query.set('limit', String(params.limit));

  const qs = query.toString();
  return api<AdminUsersResponse>(`/api/admin/users${qs ? `?${qs}` : ''}`);
}

export async function updateAdminUserStatus(userId: string, suspended: boolean): Promise<AdminUserStatusResponse> {
  return api<AdminUserStatusResponse>(`/api/admin/users/${encodeURIComponent(userId)}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ suspended }),
  });
}

export async function updateAdminUserRole(userId: string, role: 'client' | 'admin'): Promise<AdminUserRoleResponse> {
  return api<AdminUserRoleResponse>(`/api/admin/users/${encodeURIComponent(userId)}/role`, {
    method: 'PATCH',
    body: JSON.stringify({ role }),
  });
}



export async function generateAdminPasswordResetLink(userId: string): Promise<AdminPasswordResetResponse> {
  return api<AdminPasswordResetResponse>(`/api/admin/users/${encodeURIComponent(userId)}/reset-password`, {
    method: 'POST',
  });
}

export async function fetchAdminProjects(params: AdminProjectsQueryParams = {}): Promise<AdminProjectsResponse> {
  const query = new URLSearchParams();
  if (params.q) query.set('q', params.q);
  if (params.status && params.status !== 'all') query.set('status', params.status);
  if (params.page) query.set('page', String(params.page));
  if (params.limit) query.set('limit', String(params.limit));

  const qs = query.toString();
  return api<AdminProjectsResponse>(`/api/admin/projects${qs ? `?${qs}` : ''}`);
}

export async function updateAdminProject(
  projectId: string,
  data: { status?: ProjectStatus; progress?: number; message?: string }
): Promise<AdminProjectUpdateResponse> {
  return api<AdminProjectUpdateResponse>(`/api/admin/projects/${encodeURIComponent(projectId)}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function deleteAdminProject(projectId: string): Promise<AdminProjectDeleteResponse> {
  return api<AdminProjectDeleteResponse>(`/api/admin/projects/${encodeURIComponent(projectId)}`, {
    method: 'DELETE',
  });
}

export async function fetchAdminLogs(limit = 50, offset = 0): Promise<AdminLogsResponse> {
  return api<AdminLogsResponse>(`/api/admin/logs?limit=${limit}&offset=${offset}`);
}

export async function fetchAdminSystemStatus(): Promise<AdminSystemStatusResponse> {
  return api<AdminSystemStatusResponse>('/api/admin/system');
}

/* -------------------------------------------------------------------------- */
/*                               REFERRAL APIS                                */
/* -------------------------------------------------------------------------- */

export interface ReferralTrackResponse {
  ok: boolean;
  attributed: boolean;
  referralCode?: string;
  referrerName?: string;
  message?: string;
}

export interface MyReferralsResponse {
  ok: boolean;
  referralCode: string;
  referralLink: string;
  summary: UserReferralSummary;
  referrals: UserReferralItem[];
}

export interface AdminReferralsSummary {
  totalAttributedProjects: number;
  pendingCount: number;
  approvedCount: number;
  paidCount: number;
  rejectedCount: number;
  totalEligiblePayments: number;
  totalApprovedUnpaidCommission: number;
  totalPaidCommission: number;
  currency: string;
  byCurrency?: Record<
    string,
    {
      currency: string;
      eligiblePayments: number;
      approvedUnpaidCommission: number;
      paidCommission: number;
    }
  >;
}

export interface AdminReferralsResponse {
  ok: boolean;
  summary: AdminReferralsSummary;
  referrals: AdminReferralItem[];
}

export interface AdminReferralUpdatePayload {
  action: 'approve' | 'reject' | 'mark_paid';
  eligiblePaymentAmount?: number;
  currency?: string;
  payoutReference?: string;
  adminNotes?: string;
}

export interface AdminReferralUpdateResponse {
  ok: boolean;
  referral: AdminReferralItem;
  message: string;
}

export async function trackReferralCode(code: string): Promise<ReferralTrackResponse> {
  return api<ReferralTrackResponse>('/api/referrals/track', {
    method: 'POST',
    body: JSON.stringify({ code }),
  });
}

export async function fetchMyReferrals(): Promise<MyReferralsResponse> {
  return api<MyReferralsResponse>('/api/referrals/me');
}

export async function fetchAdminReferrals(params: { q?: string; status?: 'all' | ReferralStatus } = {}): Promise<AdminReferralsResponse> {
  const query = new URLSearchParams();
  if (params.q) query.set('q', params.q);
  if (params.status && params.status !== 'all') query.set('status', params.status);
  const qs = query.toString();
  return api<AdminReferralsResponse>(`/api/admin/referrals${qs ? `?${qs}` : ''}`);
}

export async function updateAdminReferral(
  referralId: string,
  payload: AdminReferralUpdatePayload
): Promise<AdminReferralUpdateResponse> {
  return api<AdminReferralUpdateResponse>(`/api/admin/referrals/${encodeURIComponent(referralId)}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

