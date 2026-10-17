export type Role = 'client' | 'admin';

export type User = {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  age?: number | null;
  role: Role;
  tokenBalance: number;
  suspended: boolean;
  createdAt: string;
  passwordHash: string;
  authProvider?: 'email' | 'google';
};

export type PublicUser = Omit<User, 'passwordHash'>;

export type ProjectStatus =
  | 'submitted'
  | 'approved'
  | 'in_progress'
  | 'delivered'
  | 'completed'
  | 'rejected';

export type Attachment = {
  name: string;
  size: number;
  mime?: string;
  data?: string;
};

export type ProjectUpdate = {
  id: string;
  authorName: string;
  authorRole: string;
  message: string;
  createdAt: string;
};

export type Project = {
  id: string;
  projectId: string; // e.g. TCR-2026-XXXXXX
  clientId?: string | null;
  clientName: string;
  clientEmail: string;
  clientPhone?: string | null;
  age?: number | null;
  service: string;
  title: string;
  description: string;
  requirements?: string | null;
  budget?: string | null;
  deadline?: string | null;
  references?: string | null;
  extra?: Record<string, string>;
  attachments?: Attachment[];
  status: ProjectStatus;
  progress: number;
  tokenCharged: number;
  createdAt: string;
  updatedAt: string;
  updates: ProjectUpdate[];
};

export type TokenTransaction = {
  id: string;
  clientId: string;
  clientName: string;
  clientEmail: string;
  amount: number;
  reason: string;
  projectId?: string | null;
  createdAt: string;
};

export type Notification = {
  id: string;
  userId: string;
  title: string;
  body: string;
  read: boolean;
  projectId?: string | null;
  createdAt: string;
};

export type AuditLog = {
  id: string;
  actor: string;
  action: string;
  detail?: string | null;
  createdAt: string;
};

export type PasswordResetToken = {
  token: string;
  tokenHash: string;
  email: string;
  userId: string;
  expiresAt: number;
  used: boolean;
};

export type ThemeMode = 'light' | 'dark' | 'system';
export type Language = 'en' | 'hi';

export type ServiceFormField = {
  key: string;
  label: string;
  type: 'text' | 'select' | 'textarea' | 'checkbox';
  options?: string[];
  placeholder?: string;
};

export type ServiceDefinition = {
  slug: string;
  name: string;
  short: string;
  tagline: string;
  description: string;
  longDescription: string[];
  features: string[];
  deliverables: string[];
  process: string[];
  formFields: ServiceFormField[];
  enabled: boolean;
  tokenCost: number;
};
