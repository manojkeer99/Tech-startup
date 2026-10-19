import bcrypt from 'bcryptjs';
import type {
  User,
  PublicUser,
  Project,
  ProjectStatus,
  ProjectUpdate,
  TokenTransaction,
  Notification,
  AuditLog,
  PasswordResetToken,
  Attachment,
} from '@/types';
import { SERVICE_DEFINITIONS } from './service-meta';
import { api } from './api';

// Keys
const STORAGE_PREFIX = 'tc_store_v4_';
const USERS_KEY = `${STORAGE_PREFIX}users`;
const PROJECTS_KEY = `${STORAGE_PREFIX}projects`;
const TXS_KEY = `${STORAGE_PREFIX}txs`;
const NOTIFS_KEY = `${STORAGE_PREFIX}notifs`;
const LOGS_KEY = `${STORAGE_PREFIX}logs`;
const RESETS_KEY = `${STORAGE_PREFIX}resets`;
const SESSION_KEY = `${STORAGE_PREFIX}session_user`;

// Official verified channels from prompt
export const OFFICIAL_CHANNELS = {
  discord: 'https://discord.gg/gyTKYGNZT9',
  instagram: 'https://www.instagram.com/thecreators.pvt.ltd?utm_source=qr&psln=NzRmamxsN2hueTlv',
  email: 'thecreators.pvt.ltd@gmail.com',
};

// Safe helper for hashing passwords with bcrypt
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export function verifyPassword(password: string, hash: string): boolean {
  try {
    return bcrypt.compareSync(password, hash);
  } catch {
    return false;
  }
}

export function generateProjectId(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let rand = '';
  const arr = new Uint8Array(6);
  crypto.getRandomValues(arr);
  for (let i = 0; i < 6; i++) {
    rand += chars[arr[i] % chars.length];
  }
  return `TCR-2026-${rand}`;
}

export function sanitizePublicUser(user: User): PublicUser {
  // Never expose passwordHash
  const { passwordHash: _, ...pub } = user;
  return pub;
}

// Initial Seed Data with real Bcrypt hashes
const DEFAULT_ADMIN_HASH = '$2b$10$FHDR5npUPT2UVLG5G.b7V.Hh3bRIxVk/hveSHMNpNYE6a6GQjYnn2'; // bcrypt for admin12345
const DEFAULT_CLIENT_HASH = '$2b$10$7d3NSvQM6yMmTFvhBXchyeTtK5WbLbjHqc8dEyRXqe7ETi7kVk40O'; // bcrypt for client12345

const INITIAL_USERS: User[] = [
  {
    id: 'usr_admin_001',
    name: 'The Creators Admin',
    email: 'thecreators.pvt.ltd@gmail.com',
    phone: '+91 98765 43210',
    age: 28,
    role: 'admin',
    tokenBalance: 5000,
    suspended: false,
    createdAt: new Date(Date.now() - 90 * 86400000).toISOString(),
    passwordHash: DEFAULT_ADMIN_HASH,
    authProvider: 'email',
  },
  {
    id: 'usr_client_001',
    name: 'Arjun Sharma',
    email: 'client@thecreators.tech',
    phone: '+91 98111 22334',
    age: 26,
    role: 'client',
    tokenBalance: 150,
    suspended: false,
    createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
    passwordHash: DEFAULT_CLIENT_HASH,
    authProvider: 'email',
  },
];

const INITIAL_PROJECTS: Project[] = [
  {
    id: 'proj_001',
    projectId: 'TCR-2026-N9X42A',
    clientId: 'usr_client_001',
    clientName: 'Arjun Sharma',
    clientEmail: 'client@thecreators.tech',
    clientPhone: '+91 98111 22334',
    age: 26,
    service: 'website-development',
    title: 'Enterprise Fintech Landing Architecture',
    description: 'High-conversion, sub-second responsive marketing portal with interactive calculators and real-time lead capture.',
    requirements: 'React, Next.js, WCAG AA compliance, custom brand typography, dynamic currency visualizer.',
    budget: "Custom — Let's Discuss",
    deadline: '2026-11-15',
    references: 'https://linear.app, https://stripe.com',
    status: 'in_progress',
    progress: 65,
    tokenCharged: 0,
    createdAt: new Date(Date.now() - 14 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 86400000).toISOString(),
    updates: [
      {
        id: 'upd_1',
        authorName: 'The Creators Engineering',
        authorRole: 'admin',
        message: 'Sprint 2 completed: Interactive calculator component and responsive navigation tested on iOS/Android.',
        createdAt: new Date(Date.now() - 1 * 86400000).toISOString(),
      },
      {
        id: 'upd_2',
        authorName: 'The Creators Design',
        authorRole: 'admin',
        message: 'Project brief approved. Layout wireframes and tokenized color system finalized.',
        createdAt: new Date(Date.now() - 12 * 86400000).toISOString(),
      },
    ],
  },
  {
    id: 'proj_002',
    projectId: 'TCR-2026-K7M18P',
    clientId: 'usr_client_001',
    clientName: 'Arjun Sharma',
    clientEmail: 'client@thecreators.tech',
    service: 'application-development',
    title: 'Real-Time Workflow Telemetry Console',
    description: 'Cross-platform mobile and web application monitoring distributed task queues and node health.',
    requirements: 'Offline-ready cache, push notifications, role-based access control, export to CSV.',
    budget: 'Scope-dependent discussion',
    deadline: '2026-12-01',
    status: 'approved',
    progress: 20,
    tokenCharged: 0,
    createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 4 * 86400000).toISOString(),
    updates: [
      {
        id: 'upd_3',
        authorName: 'The Creators Lead',
        authorRole: 'admin',
        message: 'Scope agreed. Backend data model schema drafted and repository initialized.',
        createdAt: new Date(Date.now() - 4 * 86400000).toISOString(),
      },
    ],
  },
];

const INITIAL_TXS: TokenTransaction[] = [
  {
    id: 'tx_001',
    clientId: 'usr_client_001',
    clientName: 'Arjun Sharma',
    clientEmail: 'client@thecreators.tech',
    amount: 100,
    reason: 'Welcome bonus upon registration',
    createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
  },
  {
    id: 'tx_002',
    clientId: 'usr_client_001',
    clientName: 'Arjun Sharma',
    clientEmail: 'client@thecreators.tech',
    amount: 50,
    reason: 'Milestone credit by The Creators Admin',
    createdAt: new Date(Date.now() - 10 * 86400000).toISOString(),
  },
];

const INITIAL_LOGS: AuditLog[] = [
  {
    id: 'log_001',
    actor: 'System',
    action: 'system.init',
    detail: 'Platform bootstrap initialized with verified TC monogram and multi-theme engine',
    createdAt: new Date(Date.now() - 90 * 86400000).toISOString(),
  },
  {
    id: 'log_002',
    actor: 'The Creators Admin',
    action: 'project.update',
    detail: 'TCR-2026-N9X42A status set to in_progress (65%)',
    createdAt: new Date(Date.now() - 1 * 86400000).toISOString(),
  },
];

// Memory / LocalStorage bridge
class AppStore {
  private users: User[] = [];
  private projects: Project[] = [];
  private txs: TokenTransaction[] = [];
  private notifs: Notification[] = [];
  private logs: AuditLog[] = [];
  private resets: PasswordResetToken[] = [];
  private sessionUser: PublicUser | null = null;
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.init();
  }

  private init() {
    if (typeof window === 'undefined') return;
    try {
      // Users
      const storedUsers = localStorage.getItem(USERS_KEY);
      if (storedUsers) {
        this.users = JSON.parse(storedUsers);
      } else {
        this.users = INITIAL_USERS;
        this.saveUsers();
      }

      // Projects
      const storedProjects = localStorage.getItem(PROJECTS_KEY);
      if (storedProjects) {
        this.projects = JSON.parse(storedProjects);
      } else {
        this.projects = INITIAL_PROJECTS;
        this.saveProjects();
      }

      // Transactions
      const storedTxs = localStorage.getItem(TXS_KEY);
      if (storedTxs) {
        this.txs = JSON.parse(storedTxs);
      } else {
        this.txs = INITIAL_TXS;
        this.saveTxs();
      }

      // Notifications
      const storedNotifs = localStorage.getItem(NOTIFS_KEY);
      if (storedNotifs) {
        this.notifs = JSON.parse(storedNotifs);
      } else {
        this.notifs = [
          {
            id: 'notif_1',
            userId: 'usr_client_001',
            title: 'Project Update: TCR-2026-N9X42A',
            body: 'Sprint 2 completed: Interactive calculator component and responsive navigation tested.',
            read: false,
            projectId: 'TCR-2026-N9X42A',
            createdAt: new Date(Date.now() - 1 * 86400000).toISOString(),
          },
        ];
        this.saveNotifs();
      }

      // Logs
      const storedLogs = localStorage.getItem(LOGS_KEY);
      if (storedLogs) {
        this.logs = JSON.parse(storedLogs);
      } else {
        this.logs = INITIAL_LOGS;
        this.saveLogs();
      }

      // Resets
      const storedResets = localStorage.getItem(RESETS_KEY);
      if (storedResets) {
        this.resets = JSON.parse(storedResets);
      }

      // Session
      const storedSession = localStorage.getItem(SESSION_KEY);
      if (storedSession) {
        const parsed = JSON.parse(storedSession);
        // Verify user still exists in memory
        const u = this.users.find((x) => x.id === parsed.id);
        if (u && !u.suspended) {
          this.sessionUser = sanitizePublicUser(u);
        } else {
          this.sessionUser = null;
          localStorage.removeItem(SESSION_KEY);
        }
      }
    } catch {
      // Fallback in-memory
      this.users = INITIAL_USERS;
      this.projects = INITIAL_PROJECTS;
      this.txs = INITIAL_TXS;
      this.logs = INITIAL_LOGS;
    }

    // Proactively validate and sync server-managed persistent session on startup
    this.checkSession().catch(() => {});
  }

  public subscribe(cb: () => void): () => void {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }

  private emit() {
    for (const cb of this.listeners) {
      try {
        cb();
      } catch {
        // Ignore
      }
    }
  }

  private saveUsers() {
    try {
      localStorage.setItem(USERS_KEY, JSON.stringify(this.users));
    } catch {}
  }

  private saveProjects() {
    try {
      localStorage.setItem(PROJECTS_KEY, JSON.stringify(this.projects));
    } catch {}
  }

  private saveTxs() {
    try {
      localStorage.setItem(TXS_KEY, JSON.stringify(this.txs));
    } catch {}
  }

  private saveNotifs() {
    try {
      localStorage.setItem(NOTIFS_KEY, JSON.stringify(this.notifs));
    } catch {}
  }

  private saveLogs() {
    try {
      localStorage.setItem(LOGS_KEY, JSON.stringify(this.logs));
    } catch {}
  }

  private saveResets() {
    try {
      localStorage.setItem(RESETS_KEY, JSON.stringify(this.resets));
    } catch {}
  }

  public logAudit(actor: string, action: string, detail?: string) {
    const entry: AuditLog = {
      id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      actor,
      action,
      detail: detail ?? null,
      createdAt: new Date().toISOString(),
    };
    this.logs.unshift(entry);
    if (this.logs.length > 500) this.logs = this.logs.slice(0, 500);
    this.saveLogs();
    this.emit();
  }

  // Auth Methods
  public async login(email: string, passwordPlain: string): Promise<{ success: boolean; user?: PublicUser; error?: string }> {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !passwordPlain) {
      return { success: false, error: 'Email and password are required.' };
    }

    try {
      const res = await api<{ ok: boolean; user: PublicUser }>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: cleanEmail, password: passwordPlain }),
      });

      if (res && res.ok && res.user) {
        this.sessionUser = res.user;
        this.logAudit(cleanEmail, 'auth.login_success', `Role: ${res.user.role}`);
        this.emit();
        return { success: true, user: res.user };
      }
      return { success: false, error: 'Invalid email or password.' };
    } catch (err: any) {
      const msg = err?.message || 'Invalid email or password.';
      this.logAudit(cleanEmail, 'auth.login_failed', msg);
      return { success: false, error: msg };
    }
  }

  public async register(params: {
    name: string;
    email: string;
    passwordPlain: string;
    phone?: string;
    age?: number;
  }): Promise<{ success: boolean; user?: PublicUser; error?: string }> {
    const cleanEmail = params.email.trim().toLowerCase();
    const cleanName = params.name.trim();

    if (!cleanName || cleanName.length < 2) {
      return { success: false, error: 'Full name must be at least 2 characters.' };
    }
    if (!cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      return { success: false, error: 'Please enter a valid email address.' };
    }
    if (!params.passwordPlain || params.passwordPlain.length < 8) {
      return { success: false, error: 'Password must be at least 8 characters long.' };
    }

    try {
      const res = await api<{ ok: boolean; user: PublicUser }>('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          name: cleanName,
          email: cleanEmail,
          password: params.passwordPlain,
          phone: params.phone?.trim() || null,
          age: params.age ?? null,
        }),
      });

      if (res && res.ok && res.user) {
        this.sessionUser = res.user;
        this.logAudit(cleanEmail, 'auth.register', `Role: ${res.user.role}`);
        this.emit();
        return { success: true, user: res.user };
      }
      return { success: false, error: 'Registration failed.' };
    } catch (err: any) {
      const msg = err?.message || 'Registration failed.';
      return { success: false, error: msg };
    }
  }

  public async logout() {
    if (this.sessionUser) {
      this.logAudit(this.sessionUser.email, 'auth.logout', 'User logged out');
    }
    this.sessionUser = null;
    try {
      localStorage.removeItem(SESSION_KEY);
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    } catch {}
    this.emit();
  }

  public getSessionUser(): PublicUser | null {
    return this.sessionUser;
  }

  public updateUserProfile(userId: string, data: { name?: string; phone?: string; age?: number | null }): boolean {
    const idx = this.users.findIndex((u) => u.id === userId);
    if (idx === -1) return false;
    const u = this.users[idx];
    if (data.name) u.name = data.name.trim();
    if (data.phone !== undefined) u.phone = data.phone?.trim() || null;
    if (data.age !== undefined) u.age = data.age;

    this.saveUsers();
    if (this.sessionUser?.id === userId) {
      this.sessionUser = sanitizePublicUser(u);
      try {
        localStorage.setItem(SESSION_KEY, JSON.stringify(this.sessionUser));
      } catch {}
    }
    this.logAudit(u.email, 'user.profile_update', 'Profile details updated');
    this.emit();
    return true;
  }

  public async changePassword(userId: string, currentPlain: string, newPlain: string): Promise<{ success: boolean; error?: string }> {
    const idx = this.users.findIndex((u) => u.id === userId);
    if (idx === -1) return { success: false, error: 'User not found.' };
    const u = this.users[idx];

    const isCurrentValid = verifyPassword(currentPlain, u.passwordHash);
    if (!isCurrentValid) {
      return { success: false, error: 'Current password is incorrect.' };
    }

    if (newPlain.length < 8) {
      return { success: false, error: 'New password must be at least 8 characters long.' };
    }

    u.passwordHash = await hashPassword(newPlain);
    this.saveUsers();
    this.logAudit(u.email, 'user.password_change', 'Password updated from account settings');
    this.emit();
    return { success: true };
  }

  // Password Reset Flow
  public async requestPasswordReset(email: string): Promise<{ success: boolean; token?: string; error?: string }> {
    const cleanEmail = email.trim().toLowerCase();
    try {
      await api<{ ok: boolean; message: string }>('/api/auth/forgot', {
        method: 'POST',
        body: JSON.stringify({ email: cleanEmail }),
      });
      return { success: true };
    } catch {
      // Fallback
      const user = this.users.find((u) => u.email.toLowerCase() === cleanEmail);
      if (!user) {
        return { success: true };
      }
      const tokenBytes = new Uint8Array(16);
      crypto.getRandomValues(tokenBytes);
      const token = Array.from(tokenBytes).map((b) => b.toString(16).padStart(2, '0')).join('');
      const tokenHash = await hashPassword(token);
      const resetRecord: PasswordResetToken = {
        token,
        tokenHash,
        email: cleanEmail,
        userId: user.id,
        expiresAt: Date.now() + 60 * 60 * 1000,
        used: false,
      };
      this.resets.push(resetRecord);
      this.saveResets();
      this.logAudit(cleanEmail, 'auth.password_reset_requested', 'Reset token created (valid 1 hr)');
      return { success: true, token };
    }
  }

  public async completePasswordReset(token: string, newPlain: string): Promise<{ success: boolean; error?: string }> {
    if (!token || !newPlain || newPlain.length < 8) {
      return { success: false, error: 'Password must be at least 8 characters.' };
    }

    try {
      const res = await api<{ ok: boolean; message: string }>('/api/auth/reset', {
        method: 'POST',
        body: JSON.stringify({ token: token.trim(), password: newPlain }),
      });
      if (res && res.ok) {
        return { success: true };
      }
    } catch (err: any) {
      if (err?.message) {
        return { success: false, error: err.message };
      }
    }

    // In-memory fallback
    const record = this.resets.find((r) => r.token === token && !r.used);
    if (!record) {
      return { success: false, error: 'This reset token is invalid or has already been used.' };
    }

    if (Date.now() > record.expiresAt) {
      return { success: false, error: 'This reset link has expired. Please request a new one.' };
    }

    const user = this.users.find((u) => u.id === record.userId);
    if (!user) {
      return { success: false, error: 'Account not found.' };
    }

    user.passwordHash = await hashPassword(newPlain);
    record.used = true;
    this.saveUsers();
    this.saveResets();
    this.logAudit(user.email, 'auth.password_reset_completed', 'Password reset with single-use token');
    this.emit();
    return { success: true };
  }

  // Server-Managed Persistent Session Verification
  public async checkSession(): Promise<PublicUser | null> {
    try {
      const res = await api<{ ok: boolean; user: PublicUser }>('/api/auth/me');
      if (res && res.ok && res.user) {
        this.sessionUser = res.user;
        this.emit();
        return res.user;
      }
    } catch {
      // If server session is rejected/expired, clear frontend session
      if (this.sessionUser) {
        this.sessionUser = null;
        try {
          localStorage.removeItem(SESSION_KEY);
        } catch {}
        this.emit();
      }
    }
    return null;
  }

  // Production Google OAuth Flow (verifies real ID token with backend)
  public async loginWithGoogleCredential(
    credential: string
  ): Promise<{ success: boolean; user?: PublicUser; error?: string }> {
    try {
      const res = await api<{ ok: boolean; user: PublicUser; message?: string }>('/api/auth/google', {
        method: 'POST',
        body: JSON.stringify({ credential }),
      });

      if (res && res.ok && res.user) {
        this.sessionUser = res.user;
        // Keep in-memory list synchronized
        const existing = this.users.find((u) => u.id === res.user.id || u.email.toLowerCase() === res.user.email.toLowerCase());
        if (!existing) {
          this.users.unshift({
            ...res.user,
            passwordHash: '',
            authProvider: 'google',
          });
          this.saveUsers();
        } else {
          Object.assign(existing, res.user);
          this.saveUsers();
        }
        this.logAudit(res.user.email, 'auth.google_login', 'Authenticated via verified Google session');
        this.emit();
        return { success: true, user: res.user };
      }
      return { success: false, error: 'Google authentication failed.' };
    } catch (err: any) {
      const msg = err?.message || 'Google authentication encountered an error.';
      return { success: false, error: msg };
    }
  }

  // Projects API
  public getProjects(userId?: string): Project[] {
    if (!userId) return [...this.projects];
    return this.projects.filter((p) => p.clientId === userId || p.clientEmail.toLowerCase() === this.sessionUser?.email.toLowerCase());
  }

  public getProjectByPublicId(publicId: string): Project | undefined {
    return this.projects.find((p) => p.projectId.toUpperCase() === publicId.trim().toUpperCase());
  }

  public createProject(data: {
    service: string;
    title: string;
    description: string;
    requirements?: string;
    budget?: string;
    deadline?: string;
    references?: string;
    extra?: Record<string, string>;
    attachments?: Attachment[];
    clientName: string;
    clientEmail: string;
    clientPhone?: string;
    age?: number;
    clientId?: string | null;
  }): Project {
    const projectId = generateProjectId();
    const newProject: Project = {
      id: `proj_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      projectId,
      clientId: data.clientId ?? this.sessionUser?.id ?? null,
      clientName: data.clientName.trim(),
      clientEmail: data.clientEmail.trim().toLowerCase(),
      clientPhone: data.clientPhone?.trim() || null,
      age: data.age ?? null,
      service: data.service,
      title: data.title.trim(),
      description: data.description.trim(),
      requirements: data.requirements?.trim() || null,
      budget: data.budget?.trim() || "Custom — Let's Discuss",
      deadline: data.deadline?.trim() || null,
      references: data.references?.trim() || null,
      extra: data.extra || {},
      attachments: data.attachments || [],
      status: 'submitted',
      progress: 0,
      tokenCharged: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      updates: [
        {
          id: `upd_${Date.now()}`,
          authorName: 'The Creators Intake',
          authorRole: 'admin',
          message: 'Project brief received. Our engineering lead will review your specifications within 24 hours.',
          createdAt: new Date().toISOString(),
        },
      ],
    };

    this.projects.unshift(newProject);
    this.saveProjects();

    // Client notification if logged in or email matches
    if (newProject.clientId) {
      this.notifs.unshift({
        id: `notif_${Date.now()}`,
        userId: newProject.clientId,
        title: `Project Received: ${projectId}`,
        body: `Your project request "${newProject.title}" is in our review queue.`,
        read: false,
        projectId,
        createdAt: new Date().toISOString(),
      });
      this.saveNotifs();
    }

    this.logAudit(newProject.clientEmail, 'project.submit', `${projectId} (${newProject.service}) — ${newProject.title}`);
    this.emit();
    return newProject;
  }

  public updateProject(
    projectId: string,
    updates: {
      status?: ProjectStatus;
      progress?: number;
      message?: string;
      decision?: 'approved' | 'rejected';
    },
    actorName: string,
  ): Project | null {
    const p = this.projects.find((x) => x.projectId === projectId || x.id === projectId);
    if (!p) return null;

    if (updates.decision) {
      p.status = updates.decision;
      p.progress = updates.decision === 'approved' ? 10 : 0;
    } else if (updates.status) {
      p.status = updates.status;
      if (updates.status === 'completed') p.progress = 100;
    }

    if (updates.progress !== undefined) {
      p.progress = Math.min(100, Math.max(0, updates.progress));
    }

    p.updatedAt = new Date().toISOString();

    if (updates.message && updates.message.trim()) {
      const upd: ProjectUpdate = {
        id: `upd_${Date.now()}`,
        authorName: actorName,
        authorRole: 'admin',
        message: updates.message.trim(),
        createdAt: new Date().toISOString(),
      };
      p.updates.unshift(upd);

      if (p.clientId) {
        this.notifs.unshift({
          id: `notif_${Date.now()}`,
          userId: p.clientId,
          title: `Update on ${p.projectId} (${p.status.replace('_', ' ').toUpperCase()})`,
          body: updates.message.trim(),
          read: false,
          projectId: p.projectId,
          createdAt: new Date().toISOString(),
        });
        this.saveNotifs();
      }
    }

    this.saveProjects();
    this.logAudit(actorName, 'project.update', `${p.projectId} set to ${p.status} (${p.progress}%)`);
    this.emit();
    return p;
  }

  public deleteProject(projectId: string, actorName: string): boolean {
    const idx = this.projects.findIndex((x) => x.projectId === projectId || x.id === projectId);
    if (idx === -1) return false;
    const removed = this.projects.splice(idx, 1)[0];
    this.saveProjects();
    this.logAudit(actorName, 'project.delete', `Deleted project ${removed.projectId}`);
    this.emit();
    return true;
  }

  // Clients & Users Management
  public getAllClients(): PublicUser[] {
    return this.users.filter((u) => u.role === 'client').map(sanitizePublicUser);
  }

  public getAllUsers(): PublicUser[] {
    return this.users.map(sanitizePublicUser);
  }

  public suspendUser(userId: string, suspended: boolean, actorName: string): boolean {
    const u = this.users.find((x) => x.id === userId);
    if (!u) return false;
    // Prevent suspending the last active administrator
    if (u.role === 'admin' && suspended) {
      const activeAdmins = this.users.filter((x) => x.role === 'admin' && !x.suspended);
      if (activeAdmins.length <= 1) return false;
    }
    u.suspended = suspended;
    this.saveUsers();
    this.logAudit(actorName, suspended ? 'client.suspend' : 'client.reinstate', u.email);
    this.emit();
    return true;
  }

  public adjustTokens(userId: string, amount: number, reason: string, actorName: string): boolean {
    const u = this.users.find((x) => x.id === userId);
    if (!u) return false;
    if (u.tokenBalance + amount < 0) return false;

    u.tokenBalance += amount;
    this.saveUsers();

    const tx: TokenTransaction = {
      id: `tx_${Date.now()}`,
      clientId: u.id,
      clientName: u.name,
      clientEmail: u.email,
      amount,
      reason: `${reason} (by ${actorName})`,
      createdAt: new Date().toISOString(),
    };
    this.txs.unshift(tx);
    this.saveTxs();

    this.notifs.unshift({
      id: `notif_${Date.now()}`,
      userId: u.id,
      title: amount >= 0 ? 'Tokens Credited' : 'Tokens Deducted',
      body: `${amount >= 0 ? '+' : ''}${amount} tokens — ${reason}`,
      read: false,
      createdAt: new Date().toISOString(),
    });
    this.saveNotifs();

    this.logAudit(actorName, 'tokens.adjust', `${u.email}: ${amount >= 0 ? '+' : ''}${amount} (${reason})`);
    this.emit();
    return true;
  }

  // Token Transactions
  public getTransactions(clientId?: string): TokenTransaction[] {
    if (!clientId) return [...this.txs];
    return this.txs.filter((t) => t.clientId === clientId);
  }

  // Notifications
  public getNotifications(userId: string): Notification[] {
    return this.notifs.filter((n) => n.userId === userId);
  }

  public markAllNotificationsRead(userId: string) {
    let changed = false;
    for (const n of this.notifs) {
      if (n.userId === userId && !n.read) {
        n.read = true;
        changed = true;
      }
    }
    if (changed) {
      this.saveNotifs();
      this.emit();
    }
  }

  // Logs
  public getAuditLogs(): AuditLog[] {
    return [...this.logs];
  }
}

export const store = new AppStore();
