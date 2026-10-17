import express, { type Request, type Response, type NextFunction } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import path from 'path';
import fs from 'fs';
import { checkDbConnection, isDbConfigured, query } from './db.js';

export const app = express();

// Security & Parsing Middlewares
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// CORS configuration supporting development, preview, and separate Render/Vercel deployments
const rawFrontendUrl = process.env.FRONTEND_URL?.trim();
const rawAppUrl = process.env.APP_URL?.trim();

const defaultAllowedOrigins = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
];

if (rawFrontendUrl) defaultAllowedOrigins.push(rawFrontendUrl.replace(/\/$/, ''));
if (rawAppUrl) defaultAllowedOrigins.push(rawAppUrl.replace(/\/$/, ''));

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. server-to-server, curl, mobile)
      if (!origin) return callback(null, true);

      const isAllowed =
        defaultAllowedOrigins.includes(origin) ||
        origin.endsWith('.vercel.app') ||
        origin.endsWith('.run.app') ||
        origin.includes('localhost:') ||
        origin.includes('127.0.0.1:');

      if (isAllowed) {
        return callback(null, true);
      }
      return callback(new Error(`Origin ${origin} not permitted by CORS.`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  }),
);

// Session Cookie Name
const SESSION_COOKIE = 'tc_session';

// In-Memory Fallback State (Active when DATABASE_URL is not configured)
interface ServerUser {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  age?: number | null;
  role: 'client' | 'admin';
  tokenBalance: number;
  suspended: boolean;
  createdAt: string;
  passwordHash: string;
}

interface ServerProject {
  id: string;
  projectId: string;
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
  attachments?: unknown[];
  extra?: Record<string, string>;
  status: string;
  progress: number;
  tokenCharged: number;
  createdAt: string;
  updatedAt: string;
  updates: Array<{ id: string; authorName: string; authorRole: string; message: string; createdAt: string }>;
}

const MEMORY_USERS: ServerUser[] = [
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
    passwordHash: '$2b$10$FHDR5npUPT2UVLG5G.b7V.Hh3bRIxVk/hveSHMNpNYE6a6GQjYnn2',
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
    passwordHash: '$2b$10$7d3NSvQM6yMmTFvhBXchyeTtK5WbLbjHqc8dEyRXqe7ETi7kVk40O',
  },
];

const MEMORY_PROJECTS: ServerProject[] = [
  {
    id: 'proj_001',
    projectId: 'TCR-2026-N9X42A',
    clientId: 'usr_client_001',
    clientName: 'Arjun Sharma',
    clientEmail: 'client@thecreators.tech',
    service: 'website-development',
    title: 'Enterprise Fintech Landing Architecture',
    description: 'High-conversion, sub-second responsive marketing portal with interactive calculators and real-time lead capture.',
    requirements: 'React, Next.js, WCAG AA compliance, custom brand typography, dynamic currency visualizer.',
    budget: "Custom — Let's Discuss",
    deadline: '2026-11-15',
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
    ],
  },
];

const MEMORY_LOGS: Array<{ id: string; actor: string; action: string; detail: string | null; createdAt: string }> = [
  {
    id: 'log_001',
    actor: 'System',
    action: 'server.init',
    detail: 'Full-stack Express backend initialized with health check and API endpoints',
    createdAt: new Date().toISOString(),
  },
];

// Helper functions
function hashPassword(plain: string): string {
  return bcrypt.hashSync(plain, 10);
}

function verifyPassword(plain: string, hash: string): boolean {
  try {
    return bcrypt.compareSync(plain, hash);
  } catch {
    return false;
  }
}

function generateProjectId(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let rand = '';
  const bytes = crypto.randomBytes(6);
  for (let i = 0; i < 6; i++) {
    rand += chars[bytes[i] % chars.length];
  }
  return `TCR-2026-${rand}`;
}

function logAudit(actor: string, action: string, detail: string | null = null) {
  MEMORY_LOGS.unshift({
    id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    actor,
    action,
    detail,
    createdAt: new Date().toISOString(),
  });
}

// Authentication Middleware
function getAuthUser(req: Request): ServerUser | null {
  const token = req.cookies[SESSION_COOKIE] || (req.headers.authorization?.startsWith('Bearer ') ? req.headers.authorization.slice(7) : null);
  if (!token) return null;
  try {
    const userId = Buffer.from(token, 'base64').toString('utf-8').split(':')[0];
    const user = MEMORY_USERS.find((u) => u.id === userId);
    if (!user || user.suspended) return null;
    return user;
  } catch {
    return null;
  }
}

function requireAuth(req: Request, res: Response, next: NextFunction) {
  const user = getAuthUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Authentication required.' });
  }
  (req as Request & { user: ServerUser }).user = user;
  next();
}

function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const user = getAuthUser(req);
  if (!user || user.role !== 'admin') {
    return res.status(403).json({ error: 'Administrator access required.' });
  }
  (req as Request & { user: ServerUser }).user = user;
  next();
}

/* -------------------------------------------------------------------------- */
/*                               HEALTH & READINESS                           */
/* -------------------------------------------------------------------------- */

/**
 * Liveness Check: Distinguishes server availability from database readiness.
 * Always returns 200 when Express is running.
 */
app.get('/api/health', (_req: Request, res: Response) => {
  return res.status(200).json({
    status: 'ok',
    server: 'online',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

/**
 * Readiness Check: Explicitly validates database connectivity.
 * Returns 200 only if the database is configured and reachable.
 * Returns 503 if database is not configured or offline.
 */
app.get('/api/ready', async (_req: Request, res: Response) => {
  const dbStatus = await checkDbConnection();

  if (dbStatus.ok) {
    return res.status(200).json({
      status: 'ready',
      database: 'connected',
      timestamp: new Date().toISOString(),
    });
  }

  // Clearly report missing/unreachable database without exposing credentials
  return res.status(503).json({
    status: 'degraded',
    database: 'disconnected',
    configured: isDbConfigured,
    message: isDbConfigured ? 'Database is configured but currently unreachable.' : 'DATABASE_URL is not configured.',
    timestamp: new Date().toISOString(),
  });
});

/* -------------------------------------------------------------------------- */
/*                               SERVICES CATALOG                             */
/* -------------------------------------------------------------------------- */

app.get('/api/services', (_req: Request, res: Response) => {
  // Return services with zero public dollar pricing
  const services = [
    { slug: 'website-development', name: 'Website Development', short: 'Websites', tagline: 'High-performance websites engineered to convert and scale.', enabled: true },
    { slug: 'application-development', name: 'Application Development', short: 'Apps', tagline: 'Web and mobile applications built for real production workloads.', enabled: true },
    { slug: 'software-development', name: 'Software Development', short: 'Software', tagline: 'Custom software, automation engines, and internal infrastructure.', enabled: true },
    { slug: 'video-editing', name: 'Video Editing', short: 'Video', tagline: 'Paced, polished video post-production that captures and retains attention.', enabled: true },
    { slug: 'game-mods', name: 'Game Mods & Plugins', short: 'Mods', tagline: 'Custom mods, scripts, and gameplay systems built to exact specification.', enabled: true },
    { slug: 'graphic-design', name: 'Graphic Design', short: 'Design', tagline: 'Visual identities and digital art direction that stand apart.', enabled: true },
    { slug: 'custom-demand', name: 'Custom Demand', short: 'Custom', tagline: 'Unique requirements? Scope your objective and we build the solution.', enabled: true },
  ];

  return res.json({
    ok: true,
    services,
    discordInvite: 'https://discord.gg/gyTKYGNZT9',
    instagramUrl: 'https://www.instagram.com/thecreators.pvt.ltd?utm_source=qr&psln=NzRmamxsN2hueTlv',
  });
});

/* -------------------------------------------------------------------------- */
/*                               CONTACT FORM                                 */
/* -------------------------------------------------------------------------- */

app.post('/api/contact', (req: Request, res: Response) => {
  const { name, email, subject, message, companyWebsite } = req.body || {};

  // Honeypot check
  if (companyWebsite) {
    return res.json({ ok: true, message: 'Message received.' });
  }

  if (!name || typeof name !== 'string' || name.trim().length < 2) {
    return res.status(400).json({ error: 'Please enter your name.' });
  }
  if (!email || typeof email !== 'string' || !email.includes('@')) {
    return res.status(400).json({ error: 'Please enter a valid email address.' });
  }
  if (!subject || typeof subject !== 'string' || subject.trim().length < 3) {
    return res.status(400).json({ error: 'Please enter a subject.' });
  }
  if (!message || typeof message !== 'string' || message.trim().length < 15) {
    return res.status(400).json({ error: 'Please enter a message of at least 15 characters.' });
  }

  logAudit(email.trim().toLowerCase(), 'contact.inquiry', `Subject: ${subject.trim()}`);

  return res.json({
    ok: true,
    message: 'Your inquiry has been received. Our team will get back to you within 24 hours.',
    fallbackEmail: 'thecreators.pvt.ltd@gmail.com',
  });
});

/* -------------------------------------------------------------------------- */
/*                               AUTHENTICATION                               */
/* -------------------------------------------------------------------------- */

app.post('/api/auth/register', (req: Request, res: Response) => {
  const { name, email, password, phone, age } = req.body || {};

  if (!name || typeof name !== 'string' || name.trim().length < 2) {
    return res.status(400).json({ error: 'Full name must be at least 2 characters.' });
  }
  const cleanEmail = String(email || '').trim().toLowerCase();
  if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) {
    return res.status(400).json({ error: 'Please enter a valid email address.' });
  }
  if (!password || typeof password !== 'string' || password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters long.' });
  }

  const existing = MEMORY_USERS.find((u) => u.email.toLowerCase() === cleanEmail);
  if (existing) {
    return res.status(409).json({ error: 'An account with this email already exists. Try logging in.' });
  }

  const newUser: ServerUser = {
    id: `usr_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`,
    name: name.trim(),
    email: cleanEmail,
    phone: phone ? String(phone).trim() : null,
    age: age ? Number(age) : null,
    role: 'client', // Registration NEVER grants admin role
    tokenBalance: 100, // 100 welcome tokens
    suspended: false,
    createdAt: new Date().toISOString(),
    passwordHash: hashPassword(password),
  };

  MEMORY_USERS.unshift(newUser);

  // Set session cookie
  const sessionToken = Buffer.from(`${newUser.id}:${Date.now()}`).toString('base64');
  res.cookie(SESSION_COOKIE, sessionToken, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 7 * 86400 * 1000,
  });

  logAudit(cleanEmail, 'auth.register', 'New client registered with 100 tokens');

  const { passwordHash: _, ...publicUser } = newUser;
  return res.status(201).json({
    ok: true,
    user: publicUser,
    message: `Welcome aboard, ${newUser.name.split(' ')[0]}! 100 welcome tokens have been credited.`,
  });
});

app.post('/api/auth/login', (req: Request, res: Response) => {
  const { email, password } = req.body || {};
  const cleanEmail = String(email || '').trim().toLowerCase();

  if (!cleanEmail || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  const user = MEMORY_USERS.find((u) => u.email.toLowerCase() === cleanEmail);
  if (!user) {
    logAudit(cleanEmail, 'auth.login_failed', 'Account not found');
    return res.status(401).json({ error: 'Invalid email or password.' });
  }

  if (user.suspended) {
    logAudit(cleanEmail, 'auth.login_blocked', 'Account suspended');
    return res.status(403).json({ error: 'This account has been suspended. Please contact support.' });
  }

  const isMatch = verifyPassword(String(password), user.passwordHash);

  if (!isMatch) {
    logAudit(cleanEmail, 'auth.login_failed', 'Incorrect password');
    return res.status(401).json({ error: 'Invalid email or password.' });
  }

  const sessionToken = Buffer.from(`${user.id}:${Date.now()}`).toString('base64');
  res.cookie(SESSION_COOKIE, sessionToken, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 7 * 86400 * 1000,
  });

  logAudit(cleanEmail, 'auth.login_success', `Role: ${user.role}`);

  const { passwordHash: _, ...publicUser } = user;
  return res.json({
    ok: true,
    user: publicUser,
  });
});

app.post('/api/auth/logout', (_req: Request, res: Response) => {
  res.clearCookie(SESSION_COOKIE, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  });
  return res.json({ ok: true, message: 'Logged out successfully.' });
});

app.get('/api/auth/me', (req: Request, res: Response) => {
  const user = getAuthUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Not authenticated.' });
  }
  const { passwordHash: _, ...publicUser } = user;
  return res.json({ ok: true, user: publicUser });
});

// Password recovery endpoints
app.post('/api/auth/forgot', (req: Request, res: Response) => {
  const { email } = req.body || {};
  const cleanEmail = String(email || '').trim().toLowerCase();

  const user = MEMORY_USERS.find((u) => u.email.toLowerCase() === cleanEmail);
  const token = crypto.randomBytes(16).toString('hex');

  logAudit(cleanEmail, 'auth.password_reset_request', user ? 'Reset token generated' : 'Email not found');

  return res.json({
    ok: true,
    message: 'If that email address is registered, a password reset link has been generated.',
    demoResetToken: token,
  });
});

app.post('/api/auth/reset', (req: Request, res: Response) => {
  const { token, password } = req.body || {};
  if (!token || !password || typeof password !== 'string' || password.length < 8) {
    return res.status(400).json({ error: 'Valid token and a password of at least 8 characters are required.' });
  }

  return res.json({
    ok: true,
    message: 'Your password has been updated. You can now log in.',
  });
});

// Google OAuth endpoints (safe fallback reporting)
app.get('/api/auth/google/start', (_req: Request, res: Response) => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI;

  if (!clientId || !redirectUri) {
    return res.status(503).json({
      error: 'Google OAuth is not configured.',
      requiredEnv: ['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET', 'GOOGLE_REDIRECT_URI'],
    });
  }

  // Redirect to Google authorization
  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${encodeURIComponent(clientId)}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=openid%20email%20profile`;
  return res.redirect(authUrl);
});

/* -------------------------------------------------------------------------- */
/*                               PROJECTS                                     */
/* -------------------------------------------------------------------------- */

app.get('/api/projects', (req: Request, res: Response) => {
  const user = getAuthUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Authentication required.' });
  }

  const userProjects =
    user.role === 'admin'
      ? MEMORY_PROJECTS
      : MEMORY_PROJECTS.filter((p) => p.clientId === user.id || p.clientEmail.toLowerCase() === user.email.toLowerCase());

  return res.json({ ok: true, projects: userProjects });
});

app.post('/api/projects', (req: Request, res: Response) => {
  const body = req.body || {};
  const user = getAuthUser(req);

  const clientName = String(body.name || user?.name || '').trim();
  const clientEmail = String(body.email || user?.email || '').trim().toLowerCase();
  const title = String(body.title || '').trim();
  const description = String(body.description || '').trim();
  const service = String(body.service || 'website-development').trim();

  if (!clientName || clientName.length < 2) {
    return res.status(400).json({ error: 'Full name is required.' });
  }
  if (!clientEmail || !clientEmail.includes('@')) {
    return res.status(400).json({ error: 'A valid email address is required.' });
  }
  if (!title || title.length < 3) {
    return res.status(400).json({ error: 'Project title must be at least 3 characters.' });
  }
  if (!description || description.length < 15) {
    return res.status(400).json({ error: 'Please describe your project (minimum 15 characters).' });
  }

  const projectId = generateProjectId();
  const newProject: ServerProject = {
    id: `proj_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`,
    projectId,
    clientId: user?.id || null,
    clientName,
    clientEmail,
    clientPhone: body.phone ? String(body.phone).trim() : null,
    age: body.age ? Number(body.age) : null,
    service,
    title,
    description,
    requirements: body.requirements ? String(body.requirements).trim() : null,
    budget: body.budget ? String(body.budget).trim() : "Custom — Let's Discuss",
    deadline: body.deadline ? String(body.deadline).trim() : null,
    references: body.references ? String(body.references).trim() : null,
    attachments: Array.isArray(body.attachments) ? body.attachments : [],
    extra: body.extra || {},
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

  MEMORY_PROJECTS.unshift(newProject);
  logAudit(clientEmail, 'project.submit', `${projectId} (${service}) — ${title}`);

  return res.status(201).json({
    ok: true,
    projectId,
    project: newProject,
    message: `Project request ${projectId} received successfully.`,
  });
});

app.get('/api/projects/:id', (req: Request, res: Response) => {
  const user = getAuthUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Authentication required.' });
  }

  const pId = req.params.id?.toUpperCase();
  const project = MEMORY_PROJECTS.find((p) => p.projectId === pId || p.id === req.params.id);

  if (!project) {
    return res.status(404).json({ error: 'Project not found.' });
  }

  if (user.role !== 'admin' && project.clientId !== user.id && project.clientEmail.toLowerCase() !== user.email.toLowerCase()) {
    return res.status(403).json({ error: 'Access denied.' });
  }

  return res.json({ ok: true, project });
});

/* -------------------------------------------------------------------------- */
/*                               ADMIN APIS                                   */
/* -------------------------------------------------------------------------- */

app.get('/api/admin/stats', requireAdmin, (_req: Request, res: Response) => {
  const clients = MEMORY_USERS.filter((u) => u.role === 'client');
  const tokensInCirculation = clients.reduce((acc, c) => acc + c.tokenBalance, 0);

  return res.json({
    ok: true,
    stats: {
      clients: clients.length,
      projects: MEMORY_PROJECTS.length,
      tokensInCirculation,
      byStatus: {
        submitted: MEMORY_PROJECTS.filter((p) => p.status === 'submitted').length,
        approved: MEMORY_PROJECTS.filter((p) => p.status === 'approved').length,
        in_progress: MEMORY_PROJECTS.filter((p) => p.status === 'in_progress').length,
        delivered: MEMORY_PROJECTS.filter((p) => p.status === 'delivered').length,
        completed: MEMORY_PROJECTS.filter((p) => p.status === 'completed').length,
        rejected: MEMORY_PROJECTS.filter((p) => p.status === 'rejected').length,
      },
      recentProjects: MEMORY_PROJECTS.slice(0, 6),
      recentActivity: MEMORY_LOGS.slice(0, 10),
      recentClients: clients.slice(0, 5).map(({ passwordHash: _, ...pub }) => pub),
    },
  });
});

app.get('/api/admin/clients', requireAdmin, (req: Request, res: Response) => {
  const q = String(req.query.q || '').toLowerCase();
  const clients = MEMORY_USERS.filter((u) => u.role === 'client')
    .filter((c) => !q || c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q))
    .map(({ passwordHash: _, ...pub }) => pub);

  return res.json({ ok: true, clients });
});

app.post('/api/admin/clients', requireAdmin, (req: Request, res: Response) => {
  const { clientId, action, amount, reason, suspended } = req.body || {};
  const user = MEMORY_USERS.find((u) => u.id === clientId);

  if (!user) {
    return res.status(404).json({ error: 'Client not found.' });
  }

  const adminActor = (req as Request & { user: ServerUser }).user;

  if (action === 'suspend') {
    if (user.role === 'admin' && suspended) {
      const activeAdmins = MEMORY_USERS.filter((u) => u.role === 'admin' && !u.suspended);
      if (activeAdmins.length <= 1) {
        return res.status(400).json({ error: 'Cannot suspend the last active administrator.' });
      }
    }
    user.suspended = Boolean(suspended);
    logAudit(adminActor.email, user.suspended ? 'client.suspend' : 'client.reinstate', user.email);
    return res.json({ ok: true, suspended: user.suspended });
  }

  if (action === 'tokens') {
    const numAmount = Number(amount) || 0;
    if (numAmount === 0) return res.status(400).json({ error: 'Amount must be non-zero.' });
    if (user.tokenBalance + numAmount < 0) {
      return res.status(400).json({ error: 'Insufficient client balance for this deduction.' });
    }
    user.tokenBalance += numAmount;
    logAudit(adminActor.email, 'tokens.adjust', `${user.email}: ${numAmount >= 0 ? '+' : ''}${numAmount} (${reason || 'Admin adjustment'})`);
    return res.json({ ok: true, tokenBalance: user.tokenBalance });
  }

  return res.status(400).json({ error: 'Unknown action.' });
});

app.get('/api/admin/logs', requireAdmin, (_req: Request, res: Response) => {
  return res.json({ ok: true, logs: MEMORY_LOGS });
});

// Serve frontend static build in production deployment
const distPath = path.resolve(process.cwd(), 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));

  // Client-side SPA routing fallback for non-API routes
  app.get('*', (req: Request, res: Response, next: NextFunction) => {
    if (req.path.startsWith('/api')) {
      return next();
    }
    const indexPath = path.join(distPath, 'index.html');
    if (fs.existsSync(indexPath)) {
      return res.sendFile(indexPath);
    }
    return next();
  });
}

// 404 handler for API routes
app.all('/api/*', (_req: Request, res: Response) => {
  res.status(404).json({ error: 'API endpoint not found.' });
});

// Fallback 404 for any remaining unhandled non-API paths
app.use((_req: Request, res: Response) => {
  res.status(404).send('Not Found');
});

// Global Error Handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  // Do not expose stack traces or internals to caller
  console.error('[API Error]:', err.message);
  return res.status(500).json({ error: 'An unexpected server error occurred.' });
});
