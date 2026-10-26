import express, { type Request, type Response, type NextFunction } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import path from 'path';
import fs from 'fs';
import { OAuth2Client } from 'google-auth-library';
import { checkDbConnection, isDbConfigured, query, pool } from './db.js';

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
  'https://thecreators-studio.vercel.app',
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

// CSRF Origin verification for state-changing authenticated endpoints
function checkCsrf(req: Request, res: Response, next: NextFunction) {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  const origin = (req.headers.origin as string) || (req.headers.referer as string);
  if (!origin) {
    return next();
  }

  try {
    const originHost = new URL(origin).origin;
    const isAllowed =
      defaultAllowedOrigins.includes(originHost) ||
      originHost.endsWith('.vercel.app') ||
      originHost.endsWith('.run.app') ||
      originHost.includes('localhost:') ||
      originHost.includes('127.0.0.1:');

    if (!isAllowed) {
      return res.status(403).json({ error: 'Cross-origin request rejected.' });
    }
  } catch {
    return res.status(403).json({ error: 'Invalid request origin.' });
  }

  next();
}
app.use(checkCsrf);

// Session Cookie Name & Lifetime (30 days persistent session)
const SESSION_COOKIE = 'tc_session';
const SESSION_DURATION_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

// Trusted administrator emails provisioned exclusively via server-side configuration
// Rule: Public registration and Google Sign-In can NEVER grant admin privileges to an unverified email.
export const TRUSTED_ADMIN_EMAILS: string[] = [
  'thecreators.pvt.ltd@gmail.com',
  ...(process.env.ADMIN_EMAILS ? process.env.ADMIN_EMAILS.split(',').map((e) => e.trim().toLowerCase()) : []),
  ...(process.env.ADMIN_EMAIL ? [process.env.ADMIN_EMAIL.trim().toLowerCase()] : []),
].filter(Boolean);

export interface ServerUser {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  age?: number | null;
  role: 'client' | 'admin';
  tokenBalance: number;
  suspended: boolean;
  googleId?: string | null;
  avatarUrl?: string | null;
  createdAt: string;
  passwordHash: string;
}

export interface ServerProject {
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

// In-Memory Fallback State (Active when DATABASE_URL is not configured or in transient state)
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
    googleId: null,
    avatarUrl: null,
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
    googleId: null,
    avatarUrl: null,
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

const MEMORY_SESSIONS = new Map<string, { sessionId: string; userId: string; expiresAt: number; revoked: boolean }>();

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
  const entry = {
    id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    actor,
    action,
    detail,
    createdAt: new Date().toISOString(),
  };
  MEMORY_LOGS.unshift(entry);
  if (isDbConfigured) {
    query(
      'INSERT INTO audit_logs (id, actor, action, detail) VALUES ($1, $2, $3, $4)',
      [entry.id, actor, action, detail]
    ).catch(() => {});
  }
}

function setSessionCookie(res: Response, rawToken: string, req?: Request) {
  const isProd = process.env.NODE_ENV === 'production';
  const origin = (req?.headers.origin as string) || '';
  const isCrossSite = isProd && origin.length > 0 && !origin.includes('onrender.com') && !origin.includes('localhost');

  res.cookie(SESSION_COOKIE, rawToken, {
    httpOnly: true,
    sameSite: isCrossSite ? 'none' : 'lax',
    secure: isProd || isCrossSite,
    path: '/',
    maxAge: SESSION_DURATION_MS,
  });
}

function clearSessionCookie(res: Response, req?: Request) {
  const isProd = process.env.NODE_ENV === 'production';
  const origin = (req?.headers.origin as string) || '';
  const isCrossSite = isProd && origin.length > 0 && !origin.includes('onrender.com') && !origin.includes('localhost');

  res.clearCookie(SESSION_COOKIE, {
    httpOnly: true,
    sameSite: isCrossSite ? 'none' : 'lax',
    secure: isProd || isCrossSite,
    path: '/',
  });
}

/**
 * Creates a cryptographically random 32-byte opaque session token.
 * Only the SHA-256 hash is stored in PostgreSQL (user_sessions).
 * Sets persistent HttpOnly cookie on the response.
 */
async function createUserSession(user: ServerUser, req: Request, res: Response): Promise<string> {
  const rawToken = crypto.randomBytes(32).toString('base64url');
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
  const sessionId = `sess_${crypto.randomBytes(16).toString('hex')}`;
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);
  const userAgent = (req.headers['user-agent'] as string) || null;
  const ipAddress = (req.ip || req.socket.remoteAddress || null) as string | null;

  if (isDbConfigured) {
    try {
      await query(
        `INSERT INTO user_sessions (id, user_id, token_hash, user_agent, ip_address, expires_at)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [sessionId, user.id, tokenHash, userAgent, ipAddress, expiresAt.toISOString()]
      );
    } catch (err) {
      console.warn('[Session Storage Warning] DB session insert failed, falling back to memory session:', err);
    }
  }

  // Also maintain in-memory record for resilience
  MEMORY_SESSIONS.set(tokenHash, {
    sessionId,
    userId: user.id,
    expiresAt: expiresAt.getTime(),
    revoked: false,
  });

  setSessionCookie(res, rawToken, req);
  return rawToken;
}

/**
 * Resolves the authenticated user from the session cookie or Bearer header.
 * Validates expiration, revocation, and user suspension status against PostgreSQL.
 */
async function resolveAuthUser(req: Request): Promise<ServerUser | null> {
  const rawToken =
    req.cookies[SESSION_COOKIE] ||
    (req.headers.authorization?.startsWith('Bearer ') ? req.headers.authorization.slice(7).trim() : null);

  if (!rawToken) return null;

  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

  // Query PostgreSQL first when configured
  if (isDbConfigured) {
    try {
      const result = await query<{
        session_id: string;
        expires_at: string;
        revoked: boolean;
        id: string;
        name: string;
        email: string;
        phone: string | null;
        age: number | null;
        role: string;
        token_balance: number;
        suspended: boolean;
        google_id: string | null;
        avatar_url: string | null;
        created_at: string;
        password_hash: string;
      }>(
        `SELECT 
           s.id AS session_id,
           s.expires_at,
           s.revoked,
           u.id,
           u.name,
           u.email,
           u.phone,
           u.age,
           u.role,
           u.token_balance,
           u.suspended,
           u.google_id,
           u.avatar_url,
           u.created_at,
           u.password_hash
         FROM user_sessions s
         JOIN users u ON s.user_id = u.id
         WHERE s.token_hash = $1
         LIMIT 1`,
        [tokenHash]
      );

      if (result.rows.length > 0) {
        const row = result.rows[0];
        if (row.revoked) return null;
        if (new Date(row.expires_at).getTime() < Date.now()) return null;
        if (row.suspended) return null;

        // Async touch session activity timestamp
        query('UPDATE user_sessions SET last_used_at = NOW() WHERE token_hash = $1', [tokenHash]).catch(() => {});

        return {
          id: row.id,
          name: row.name,
          email: row.email,
          phone: row.phone,
          age: row.age,
          role: row.role as 'client' | 'admin',
          tokenBalance: row.token_balance,
          suspended: Boolean(row.suspended),
          googleId: row.google_id,
          avatarUrl: row.avatar_url,
          createdAt: new Date(row.created_at).toISOString(),
          passwordHash: row.password_hash,
        };
      }
    } catch (err) {
      console.warn('[Session Lookup Warning] DB query failed, falling back to memory check:', err);
    }
  }

  // Memory fallback
  const memSession = MEMORY_SESSIONS.get(tokenHash);
  if (memSession) {
    if (memSession.revoked || memSession.expiresAt < Date.now()) return null;
    const user = MEMORY_USERS.find((u) => u.id === memSession.userId);
    if (!user || user.suspended) return null;
    return user;
  }

  // Legacy fallback for base64 userId:timestamp tokens during transition
  try {
    const decoded = Buffer.from(rawToken, 'base64').toString('utf-8');
    if (decoded.includes(':')) {
      const [userId] = decoded.split(':');
      const user = MEMORY_USERS.find((u) => u.id === userId);
      if (user && !user.suspended) return user;
    }
  } catch {}

  return null;
}

// Authentication Middlewares
async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const user = await resolveAuthUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Authentication required.' });
  }
  (req as Request & { user: ServerUser }).user = user;
  next();
}

async function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const user = await resolveAuthUser(req);
  if (!user || user.role !== 'admin') {
    return res.status(403).json({ error: 'Administrator access required.' });
  }
  (req as Request & { user: ServerUser }).user = user;
  next();
}

/* -------------------------------------------------------------------------- */
/*                               HEALTH & READINESS                           */
/* -------------------------------------------------------------------------- */

app.get('/api/health', (_req: Request, res: Response) => {
  return res.status(200).json({
    status: 'ok',
    server: 'online',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

app.get('/api/ready', async (_req: Request, res: Response) => {
  const dbStatus = await checkDbConnection();

  if (dbStatus.ok) {
    return res.status(200).json({
      status: 'ready',
      database: 'connected',
      timestamp: new Date().toISOString(),
    });
  }

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

app.post('/api/contact', async (req: Request, res: Response) => {
  const { name, email, subject, message, companyWebsite } = req.body || {};

  // Honeypot: return a generic success response without storing bot submissions.
  if (typeof companyWebsite === 'string' && companyWebsite.trim()) {
    return res.json({ ok: true, message: 'Message received.' });
  }

  const cleanName = typeof name === 'string' ? name.trim() : '';
  const cleanEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
  const cleanSubject = typeof subject === 'string' ? subject.trim() : '';
  const cleanMessage = typeof message === 'string' ? message.trim() : '';
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (cleanName.length < 2 || cleanName.length > 120) {
    return res.status(400).json({ error: 'Please enter a name between 2 and 120 characters.' });
  }
  if (cleanEmail.length > 255 || !emailPattern.test(cleanEmail)) {
    return res.status(400).json({ error: 'Please enter a valid email address.' });
  }
  if (cleanSubject.length < 3 || cleanSubject.length > 255) {
    return res.status(400).json({ error: 'Please enter a subject between 3 and 255 characters.' });
  }
  if (cleanMessage.length < 15 || cleanMessage.length > 10000) {
    return res.status(400).json({ error: 'Please enter a message between 15 and 10000 characters.' });
  }

  // A contact submission is successful only after durable database storage succeeds.
  if (!isDbConfigured) {
    return res.status(503).json({ error: 'Contact submissions are temporarily unavailable. Please email us directly.' });
  }

  const id = `inq_${Date.now()}_${crypto.randomBytes(6).toString('hex')}`;
  try {
    await query(
      'INSERT INTO contact_inquiries (id, name, email, subject, message) VALUES ($1, $2, $3, $4, $5)',
      [id, cleanName, cleanEmail, cleanSubject, cleanMessage]
    );
    logAudit(cleanEmail, 'contact.inquiry', `Subject: ${cleanSubject}`);
    return res.status(201).json({
      ok: true,
      message: 'Your inquiry has been recorded. Our team will review it and respond using the email you provided.',
      inquiryId: id,
    });
  } catch (err) {
    console.error('[Contact Inquiry Save Error]:', err instanceof Error ? err.message : 'Unknown database error');
    return res.status(500).json({ error: 'We could not save your inquiry right now. Please try again or email us directly.' });
  }
});

/* -------------------------------------------------------------------------- */
/*                               AUTHENTICATION                               */
/* -------------------------------------------------------------------------- */

/**
 * Public Auth Configuration Endpoint.
 * Informs the frontend whether Google OAuth is configured and returns the public Client ID.
 * Never exposes secrets.
 */
app.get('/api/auth/config', (_req: Request, res: Response) => {
  const clientId = process.env.GOOGLE_CLIENT_ID?.trim() || process.env.VITE_GOOGLE_CLIENT_ID?.trim() || null;
  return res.json({
    ok: true,
    googleClientId: clientId,
    isConfigured: Boolean(clientId),
  });
});

/**
 * Production Google Sign-In & Verification Endpoint
 * Validates official Google ID token credential, checks email_verified === true,
 * links or registers PostgreSQL user with 'client' role, and issues a 30-day persistent session.
 */
app.post('/api/auth/google', async (req: Request, res: Response) => {
  const { credential } = req.body || {};

  if (!credential || typeof credential !== 'string') {
    return res.status(400).json({ error: 'Google credential ID token is required.' });
  }

  const clientId = process.env.GOOGLE_CLIENT_ID?.trim() || process.env.VITE_GOOGLE_CLIENT_ID?.trim();
  if (!clientId) {
    return res.status(503).json({
      error: 'Google OAuth is not configured on the server. Please set GOOGLE_CLIENT_ID in your environment variables.',
      requiredEnv: ['GOOGLE_CLIENT_ID'],
    });
  }

  let payload;
  try {
    const oauth2Client = new OAuth2Client(clientId);
    const ticket = await oauth2Client.verifyIdToken({
      idToken: credential,
      audience: clientId,
    });
    payload = ticket.getPayload();
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Invalid credential';
    console.warn('[Google Auth] ID Token verification failed:', msg);
    return res.status(401).json({ error: 'Google ID token verification failed. The credential may be invalid or expired.' });
  }

  if (!payload) {
    return res.status(401).json({ error: 'Invalid Google credential payload.' });
  }

  // Strict email verification enforcement
  if (!payload.email_verified) {
    return res.status(400).json({ error: 'Your Google account email has not been verified by Google. Please verify your email with Google first.' });
  }

  if (!payload.sub) {
    return res.status(400).json({ error: 'Missing unique subject identifier in Google credential.' });
  }

  const googleId = payload.sub;
  const cleanEmail = String(payload.email || '').trim().toLowerCase();
  const googleName = String(payload.name || cleanEmail.split('@')[0]).trim();
  const avatarUrl = payload.picture ? String(payload.picture).trim() : null;

  if (!cleanEmail || !cleanEmail.includes('@')) {
    return res.status(400).json({ error: 'Google credential did not supply a valid email address.' });
  }

  let user: ServerUser | null = null;

  if (isDbConfigured) {
    try {
      // 1. Look up existing user by Google sub identifier
      const byGoogle = await query<{
        id: string;
        name: string;
        email: string;
        phone: string | null;
        age: number | null;
        role: string;
        token_balance: number;
        suspended: boolean;
        google_id: string | null;
        avatar_url: string | null;
        created_at: string;
        password_hash: string;
      }>('SELECT * FROM users WHERE google_id = $1 LIMIT 1', [googleId]);

      if (byGoogle.rows.length > 0) {
        const row = byGoogle.rows[0];
        if (row.suspended) {
          logAudit(cleanEmail, 'auth.google_login_blocked', 'Suspended account attempted Google sign-in');
          return res.status(403).json({ error: 'This account has been suspended. Please contact support.' });
        }

        // Strict verification: Verify admin role against server TRUSTED_ADMIN_EMAILS
        let validatedRole = row.role as 'client' | 'admin';
        if (validatedRole === 'admin') {
          const isExplicitAdmin = TRUSTED_ADMIN_EMAILS.includes(cleanEmail);
          if (!isExplicitAdmin) {
            logAudit(cleanEmail, 'security.admin_elevation_blocked', 'Google identity has admin role in DB but email is not in TRUSTED_ADMIN_EMAILS; forcing client role');
            console.warn(`[Security Alert] Non-whitelisted Google login attempted admin session: ${cleanEmail}`);
            validatedRole = 'client';
            await query("UPDATE users SET role = 'client' WHERE id = $1", [row.id]).catch(() => {});
          }
        }

        // Update avatar if not present
        if (!row.avatar_url && avatarUrl) {
          await query('UPDATE users SET avatar_url = $1 WHERE id = $2', [avatarUrl, row.id]).catch(() => {});
          row.avatar_url = avatarUrl;
        }

        user = {
          id: row.id,
          name: row.name,
          email: row.email,
          phone: row.phone,
          age: row.age,
          role: validatedRole,
          tokenBalance: row.token_balance,
          suspended: Boolean(row.suspended),
          googleId: row.google_id,
          avatarUrl: row.avatar_url,
          createdAt: new Date(row.created_at).toISOString(),
          passwordHash: row.password_hash,
        };
        logAudit(cleanEmail, 'auth.google_login', `Logged in via verified Google identity (${validatedRole})`);
      } else {
        // 2. Safe account linking: Check if an existing account with the same verified email exists
        const byEmail = await query<{
          id: string;
          name: string;
          email: string;
          phone: string | null;
          age: number | null;
          role: string;
          token_balance: number;
          suspended: boolean;
          google_id: string | null;
          avatar_url: string | null;
          created_at: string;
          password_hash: string;
        }>('SELECT * FROM users WHERE LOWER(email) = $1 LIMIT 1', [cleanEmail]);

        if (byEmail.rows.length > 0) {
          const row = byEmail.rows[0];
          if (row.suspended) {
            logAudit(cleanEmail, 'auth.google_login_blocked', 'Suspended account attempted Google sign-in');
            return res.status(403).json({ error: 'This account has been suspended. Please contact support.' });
          }

          // CRITICAL SECURITY RULE:
          // An email match alone MUST NOT automatically link to an Administrator account!
          if (row.role === 'admin') {
            const isExplicitAdmin = TRUSTED_ADMIN_EMAILS.includes(cleanEmail);
            if (!isExplicitAdmin) {
              logAudit(cleanEmail, 'security.admin_elevation_blocked', `Google Sign-in email ${cleanEmail} attempted to link to admin account but is not in TRUSTED_ADMIN_EMAILS`);
              return res.status(403).json({ error: 'Administrator accounts cannot be automatically linked via Google Sign-In. Please sign in with administrator credentials.' });
            }

            // Prevent takeover if admin already has a different Google ID
            if (row.google_id && row.google_id !== googleId) {
              logAudit(cleanEmail, 'security.admin_takeover_blocked', `Google Sign-in sub ${googleId} attempted takeover of admin account ${cleanEmail}`);
              return res.status(403).json({ error: 'This administrator account is already linked to a different Google account. Please log in with primary admin credentials.' });
            }
          }

          // Safely link Google identity
          await query(
            'UPDATE users SET google_id = $1, avatar_url = COALESCE(avatar_url, $2) WHERE id = $3',
            [googleId, avatarUrl, row.id]
          );

          let validatedRole = row.role as 'client' | 'admin';
          if (validatedRole === 'admin' && !TRUSTED_ADMIN_EMAILS.includes(cleanEmail)) {
            validatedRole = 'client';
          }

          user = {
            id: row.id,
            name: row.name,
            email: row.email,
            phone: row.phone,
            age: row.age,
            role: validatedRole,
            tokenBalance: row.token_balance,
            suspended: Boolean(row.suspended),
            googleId,
            avatarUrl: row.avatar_url || avatarUrl,
            createdAt: new Date(row.created_at).toISOString(),
            passwordHash: row.password_hash,
          };
          logAudit(cleanEmail, 'auth.google_linked', `Linked verified Google identity to existing user account (${validatedRole})`);
        } else {
          // 3. New public sign-up: Public Google sign-ups ALWAYS receive the ordinary 'client' role (never admin)
          const newUserId = `usr_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
          const unusablePasswordHash = `*GOOGLE_AUTH_LOCKED*${crypto.randomBytes(32).toString('hex')}`;
          const defaultTokens = 0;

          await query(
            `INSERT INTO users (id, name, email, google_id, avatar_url, role, token_balance, suspended, password_hash)
             VALUES ($1, $2, $3, $4, $5, 'client', $6, false, $7)`,
            [newUserId, googleName, cleanEmail, googleId, avatarUrl, defaultTokens, unusablePasswordHash]
          );

          // Welcome notification
          const notifId = `notif_${Date.now()}_${crypto.randomBytes(2).toString('hex')}`;
          await query(
            `INSERT INTO user_notifications (id, user_id, title, body)
             VALUES ($1, $2, $3, $4)`,
            [notifId, newUserId, 'Welcome to THE CREATORS', 'Your client dashboard is active. Submit project briefs and track milestones in real time.']
          ).catch(() => {});

          user = {
            id: newUserId,
            name: googleName,
            email: cleanEmail,
            role: 'client',
            tokenBalance: defaultTokens,
            suspended: false,
            googleId,
            avatarUrl,
            createdAt: new Date().toISOString(),
            passwordHash: unusablePasswordHash,
          };
          logAudit(cleanEmail, 'auth.google_signup', 'New client registered via verified Google Identity');
        }
      }
    } catch (dbErr) {
      console.error('[Google Auth DB Error]:', dbErr);
      return res.status(500).json({ error: 'Database error processing Google authentication.' });
    }
  } else {
    // In-memory fallback
    let mem = MEMORY_USERS.find((u) => u.email.toLowerCase() === cleanEmail);
    if (!mem) {
      mem = {
        id: `usr_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`,
        name: googleName,
        email: cleanEmail,
        role: 'client',
        tokenBalance: 100,
        suspended: false,
        googleId,
        avatarUrl,
        createdAt: new Date().toISOString(),
        passwordHash: `*GOOGLE_LOCKED*${crypto.randomBytes(32).toString('hex')}`,
      };
      MEMORY_USERS.unshift(mem);
    } else {
      if (mem.suspended) {
        return res.status(403).json({ error: 'This account has been suspended. Please contact support.' });
      }
      mem.googleId = googleId;
      if (avatarUrl) mem.avatarUrl = avatarUrl;
    }
    user = mem;
  }

  if (!user) {
    return res.status(500).json({ error: 'Failed to establish user account.' });
  }

  // Create persistent session
  await createUserSession(user, req, res);

  const { passwordHash: _, ...publicUser } = user;
  return res.json({
    ok: true,
    user: publicUser,
    message: `Signed in successfully as ${publicUser.name}.`,
  });
});

app.post('/api/auth/register', async (req: Request, res: Response) => {
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

  let newUser: ServerUser;

  if (isDbConfigured) {
    try {
      const existing = await query('SELECT id FROM users WHERE LOWER(email) = $1 LIMIT 1', [cleanEmail]);
      if (existing.rows.length > 0) {
        return res.status(409).json({ error: 'An account with this email already exists. Try logging in.' });
      }

      const id = `usr_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
      const pwHash = hashPassword(password);
      const defaultTokens = 0;

      await query(
        `INSERT INTO users (id, name, email, phone, age, role, token_balance, suspended, password_hash)
         VALUES ($1, $2, $3, $4, $5, 'client', $6, false, $7)`,
        [id, name.trim(), cleanEmail, phone ? String(phone).trim() : null, age ? Number(age) : null, defaultTokens, pwHash]
      );

      newUser = {
        id,
        name: name.trim(),
        email: cleanEmail,
        phone: phone ? String(phone).trim() : null,
        age: age ? Number(age) : null,
        role: 'client',
        tokenBalance: defaultTokens,
        suspended: false,
        googleId: null,
        avatarUrl: null,
        createdAt: new Date().toISOString(),
        passwordHash: pwHash,
      };
    } catch (err) {
      console.error('[Registration DB Error]:', err);
      return res.status(500).json({ error: 'Database error registering account.' });
    }
  } else {
    const existing = MEMORY_USERS.find((u) => u.email.toLowerCase() === cleanEmail);
    if (existing) {
      return res.status(409).json({ error: 'An account with this email already exists. Try logging in.' });
    }

    newUser = {
      id: `usr_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`,
      name: name.trim(),
      email: cleanEmail,
      phone: phone ? String(phone).trim() : null,
      age: age ? Number(age) : null,
      role: 'client',
      tokenBalance: 0,
      suspended: false,
      googleId: null,
      avatarUrl: null,
      createdAt: new Date().toISOString(),
      passwordHash: hashPassword(password),
    };
    MEMORY_USERS.unshift(newUser);
  }

  // Create persistent session
  await createUserSession(newUser, req, res);
  logAudit(cleanEmail, 'auth.register', 'New client registered');

  const { passwordHash: _, ...publicUser } = newUser;
  return res.status(201).json({
    ok: true,
    user: publicUser,
    message: `Welcome aboard, ${newUser.name.split(' ')[0]}! Your account is active.`,
  });
});

app.post('/api/auth/login', async (req: Request, res: Response) => {
  const { email, password } = req.body || {};
  const cleanEmail = String(email || '').trim().toLowerCase();

  if (!cleanEmail || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  let user: ServerUser | null = null;

  if (isDbConfigured) {
    try {
      const result = await query<{
        id: string;
        name: string;
        email: string;
        phone: string | null;
        age: number | null;
        role: string;
        token_balance: number;
        suspended: boolean;
        google_id: string | null;
        avatar_url: string | null;
        created_at: string;
        password_hash: string;
      }>('SELECT * FROM users WHERE LOWER(email) = $1 LIMIT 1', [cleanEmail]);

      if (result.rows.length === 0) {
        logAudit(cleanEmail, 'auth.login_failed', 'Account not found');
        return res.status(401).json({ error: 'Invalid email or password.' });
      }

      const row = result.rows[0];
      if (row.suspended) {
        logAudit(cleanEmail, 'auth.login_blocked', 'Account suspended');
        return res.status(403).json({ error: 'This account has been suspended. Please contact support.' });
      }

      const isMatch = verifyPassword(String(password), row.password_hash);
      if (!isMatch) {
        logAudit(cleanEmail, 'auth.login_failed', 'Incorrect password');
        return res.status(401).json({ error: 'Invalid email or password.' });
      }

      user = {
        id: row.id,
        name: row.name,
        email: row.email,
        phone: row.phone,
        age: row.age,
        role: row.role as 'client' | 'admin',
        tokenBalance: row.token_balance,
        suspended: Boolean(row.suspended),
        googleId: row.google_id,
        avatarUrl: row.avatar_url,
        createdAt: new Date(row.created_at).toISOString(),
        passwordHash: row.password_hash,
      };
    } catch (err) {
      console.error('[Login DB Error]:', err);
      return res.status(500).json({ error: 'Database error processing login.' });
    }
  } else {
    const memUser = MEMORY_USERS.find((u) => u.email.toLowerCase() === cleanEmail);
    if (!memUser) {
      logAudit(cleanEmail, 'auth.login_failed', 'Account not found');
      return res.status(401).json({ error: 'Invalid email or password.' });
    }
    if (memUser.suspended) {
      logAudit(cleanEmail, 'auth.login_blocked', 'Account suspended');
      return res.status(403).json({ error: 'This account has been suspended. Please contact support.' });
    }
    const isMatch = verifyPassword(String(password), memUser.passwordHash);
    if (!isMatch) {
      logAudit(cleanEmail, 'auth.login_failed', 'Incorrect password');
      return res.status(401).json({ error: 'Invalid email or password.' });
    }
    user = memUser;
  }

  // Create persistent session
  await createUserSession(user, req, res);
  logAudit(cleanEmail, 'auth.login_success', `Role: ${user.role}`);

  const { passwordHash: _, ...publicUser } = user;
  return res.json({
    ok: true,
    user: publicUser,
  });
});

app.post('/api/auth/logout', async (req: Request, res: Response) => {
  const rawToken =
    req.cookies[SESSION_COOKIE] ||
    (req.headers.authorization?.startsWith('Bearer ') ? req.headers.authorization.slice(7).trim() : null);

  if (rawToken) {
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    if (isDbConfigured) {
      query('UPDATE user_sessions SET revoked = true WHERE token_hash = $1', [tokenHash]).catch(() => {});
    }
    const mem = MEMORY_SESSIONS.get(tokenHash);
    if (mem) mem.revoked = true;
  }

  clearSessionCookie(res, req);
  return res.json({ ok: true, message: 'Logged out successfully.' });
});

app.get('/api/auth/me', async (req: Request, res: Response) => {
  const user = await resolveAuthUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Not authenticated.' });
  }
  const { passwordHash: _, ...publicUser } = user;
  return res.json({ ok: true, user: publicUser });
});

// Password recovery endpoints (single-use token hash stored in PostgreSQL password_resets table)
app.post('/api/auth/forgot', async (req: Request, res: Response) => {
  const { email } = req.body || {};
  const cleanEmail = String(email || '').trim().toLowerCase();

  if (!cleanEmail || !cleanEmail.includes('@')) {
    return res.status(400).json({ error: 'Valid email address is required.' });
  }

  const rawToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
  const resetId = `rst_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  if (isDbConfigured) {
    try {
      const uRes = await query<{ id: string }>('SELECT id FROM users WHERE LOWER(email) = $1 LIMIT 1', [cleanEmail]);
      if (uRes.rows.length > 0) {
        const userId = uRes.rows[0].id;
        await query(
          'INSERT INTO password_resets (id, user_id, token_hash, expires_at) VALUES ($1, $2, $3, $4)',
          [resetId, userId, tokenHash, expiresAt.toISOString()]
        );
        logAudit(cleanEmail, 'auth.password_reset_request', 'Single-use reset token created');
      }
    } catch (err) {
      console.warn('[Password Reset Warning]:', err);
    }
  }

  // Consistent message to prevent email enumeration
  return res.json({
    ok: true,
    message: 'If that email address is registered, password reset instructions have been generated.',
  });
});

app.post('/api/auth/reset', async (req: Request, res: Response) => {
  const { token, password } = req.body || {};
  if (!token || typeof token !== 'string' || !password || typeof password !== 'string' || password.length < 8) {
    return res.status(400).json({ error: 'Valid token and a new password of at least 8 characters are required.' });
  }

  const tokenHash = crypto.createHash('sha256').update(token.trim()).digest('hex');

  if (isDbConfigured && pool) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const rRes = await client.query<{ id: string; user_id: string; expires_at: string; used_at: string | null }>(
        'SELECT * FROM password_resets WHERE token_hash = $1 FOR UPDATE',
        [tokenHash]
      );

      if (rRes.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: 'Invalid or unrecognized password reset token.' });
      }

      const resetRow = rRes.rows[0];
      if (resetRow.used_at) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: 'This password reset token has already been used.' });
      }

      if (new Date(resetRow.expires_at).getTime() < Date.now()) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: 'This password reset token has expired.' });
      }

      const pwHash = await bcrypt.hash(password, 10);
      await client.query('UPDATE users SET password_hash = $1 WHERE id = $2', [pwHash, resetRow.user_id]);
      await client.query('UPDATE password_resets SET used_at = NOW() WHERE id = $1', [resetRow.id]);
      // Security measure: Revoke all existing active sessions when password is reset
      await client.query('UPDATE user_sessions SET revoked = true WHERE user_id = $1', [resetRow.user_id]);

      await client.query('COMMIT');
      logAudit(resetRow.user_id, 'auth.password_reset_success', 'Password reset successfully completed; sessions revoked');

      return res.json({
        ok: true,
        message: 'Your password has been updated successfully. You can now log in.',
      });
    } catch (err) {
      await client.query('ROLLBACK');
      console.error('[Password Reset Error]:', err);
      return res.status(500).json({ error: 'Server error processing password reset.' });
    } finally {
      client.release();
    }
  }

  return res.status(503).json({ error: 'Database service unavailable.' });
});

// Alias for /api/auth/reset-password
app.post('/api/auth/reset-password', (req: Request, res: Response) => {
  req.url = '/api/auth/reset';
  return (app._router.handle as any)(req, res);
});

/* -------------------------------------------------------------------------- */
/*                               PROJECTS                                     */
/* -------------------------------------------------------------------------- */

app.get('/api/projects', async (req: Request, res: Response) => {
  const user = await resolveAuthUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Authentication required.' });
  }

  if (isDbConfigured) {
    try {
      const q =
        user.role === 'admin'
          ? `SELECT p.*, COALESCE(
               json_agg(
                 json_build_object(
                   'id', u.id,
                   'authorName', u.author_name,
                   'authorRole', u.author_role,
                   'message', u.message,
                   'createdAt', u.created_at
                 ) ORDER BY u.created_at ASC
               ) FILTER (WHERE u.id IS NOT NULL),
               '[]'::json
             ) AS updates
             FROM projects p
             LEFT JOIN project_updates u ON u.project_id = p.id
             GROUP BY p.id
             ORDER BY p.created_at DESC`
          : `SELECT p.*, COALESCE(
               json_agg(
                 json_build_object(
                   'id', u.id,
                   'authorName', u.author_name,
                   'authorRole', u.author_role,
                   'message', u.message,
                   'createdAt', u.created_at
                 ) ORDER BY u.created_at ASC
               ) FILTER (WHERE u.id IS NOT NULL),
               '[]'::json
             ) AS updates
             FROM projects p
             LEFT JOIN project_updates u ON u.project_id = p.id
             WHERE p.client_id = $1 OR LOWER(p.client_email) = LOWER($2)
             GROUP BY p.id
             ORDER BY p.created_at DESC`;

      const params = user.role === 'admin' ? [] : [user.id, user.email];
      const result = await query(q, params);

      const projects = result.rows.map((row: any) => ({
        id: row.id,
        projectId: row.project_id,
        clientId: row.client_id,
        clientName: row.client_name,
        clientEmail: row.client_email,
        clientPhone: row.client_phone,
        age: row.age,
        service: row.service,
        title: row.title,
        description: row.description,
        requirements: row.requirements,
        budget: row.budget,
        deadline: row.deadline,
        references: row.references_text,
        attachments: row.attachments || [],
        extra: row.extra || {},
        status: row.status,
        progress: row.progress,
        tokenCharged: row.token_charged,
        createdAt: new Date(row.created_at).toISOString(),
        updatedAt: new Date(row.updated_at).toISOString(),
        updates: (row.updates || []).map((u: any) => ({
          ...u,
          createdAt: new Date(u.createdAt).toISOString(),
        })),
      }));

      return res.json({ ok: true, projects });
    } catch (err) {
      console.warn('[Projects Query DB Warning] Falling back to memory:', err);
    }
  }

  const userProjects =
    user.role === 'admin'
      ? MEMORY_PROJECTS
      : MEMORY_PROJECTS.filter((p) => p.clientId === user.id || p.clientEmail.toLowerCase() === user.email.toLowerCase());

  return res.json({ ok: true, projects: userProjects });
});

app.post('/api/projects', async (req: Request, res: Response) => {
  const body = req.body || {};
  const user = await resolveAuthUser(req);

  const clientName = String(body.name || user?.name || '').trim();
  const clientEmail = String(body.email || user?.email || '').trim().toLowerCase();
  const title = String(body.title || '').trim();
  const description = String(body.description || '').trim();
  const service = String(body.service || 'website-development').trim();

  if (!clientName || clientName.length < 2 || clientName.length > 120) {
    return res.status(400).json({ error: 'Full name must be between 2 and 120 characters.' });
  }
  if (!clientEmail || clientEmail.length > 255 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clientEmail)) {
    return res.status(400).json({ error: 'A valid email address is required.' });
  }
  if (!title || title.length < 3 || title.length > 255) {
    return res.status(400).json({ error: 'Project title must be between 3 and 255 characters.' });
  }
  if (!description || description.length < 15) {
    return res.status(400).json({ error: 'Please describe your project (minimum 15 characters).' });
  }
  if (description.length > 20000) {
    return res.status(400).json({ error: 'Project description is too long.' });
  }
  if (service.length > 80) {
    return res.status(400).json({ error: 'Invalid service selection.' });
  }

  const now = new Date().toISOString();
  const projectId = generateProjectId();
  const id = `proj_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
  const updateId = `upd_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;

  const newProject: ServerProject = {
    id,
    projectId,
    // Never trust a clientId submitted in the request body; derive it from the validated session.
    clientId: user?.id || null,
    clientName,
    clientEmail,
    clientPhone: body.phone ? String(body.phone).trim().slice(0, 40) : null,
    age: body.age && Number.isInteger(Number(body.age)) && Number(body.age) >= 0 && Number(body.age) <= 120 ? Number(body.age) : null,
    service,
    title,
    description,
    requirements: body.requirements ? String(body.requirements).trim().slice(0, 20000) : null,
    budget: body.budget ? String(body.budget).trim().slice(0, 80) : "Custom — Let's Discuss",
    deadline: body.deadline ? String(body.deadline).trim().slice(0, 80) : null,
    references: body.references ? String(body.references).trim().slice(0, 2000) : null,
    attachments: Array.isArray(body.attachments) ? body.attachments.slice(0, 5) : [],
    extra: body.extra && typeof body.extra === 'object' && !Array.isArray(body.extra) ? body.extra : {},
    status: 'submitted',
    progress: 0,
    tokenCharged: 0,
    createdAt: now,
    updatedAt: now,
    updates: [
      {
        id: updateId,
        authorName: 'The Creators Intake',
        authorRole: 'admin',
        message: 'Project brief received. Our team will review your specifications.',
        createdAt: now,
      },
    ],
  };

  if (isDbConfigured && pool) {
    let client;
    try {
      client = await pool.connect();
      await client.query('BEGIN');
      await client.query(
        `INSERT INTO projects (
           id, project_id, client_id, client_name, client_email, client_phone, age,
           service, title, description, requirements, budget, deadline, references_text,
           attachments, extra, status, progress, token_charged
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15::jsonb, $16::jsonb, $17, $18, $19)`,
        [
          id,
          projectId,
          newProject.clientId,
          clientName,
          clientEmail,
          newProject.clientPhone,
          newProject.age,
          service,
          title,
          description,
          newProject.requirements,
          newProject.budget,
          newProject.deadline,
          newProject.references,
          JSON.stringify(newProject.attachments),
          JSON.stringify(newProject.extra),
          newProject.status,
          newProject.progress,
          newProject.tokenCharged,
        ]
      );

      await client.query(
        `INSERT INTO project_updates (id, project_id, author_name, author_role, message)
         VALUES ($1, $2, $3, $4, $5)`,
        [updateId, id, newProject.updates[0].authorName, newProject.updates[0].authorRole, newProject.updates[0].message]
      );
      await client.query('COMMIT');
    } catch (err) {
      if (client) {
        try { await client.query('ROLLBACK'); } catch { /* preserve original database error */ }
      }
      console.error('[Project Submission DB Error]:', err instanceof Error ? err.message : 'Unknown database error');
      return res.status(503).json({ error: 'Project request could not be saved right now. Please try again shortly.' });
    } finally {
      client?.release();
    }
  } else if (process.env.NODE_ENV === 'production') {
    return res.status(503).json({ error: 'Project submission is temporarily unavailable because persistent storage is not configured.' });
  } else {
    // Development-only fallback; do not use volatile memory as production persistence.
    MEMORY_PROJECTS.unshift(newProject);
  }

  MEMORY_PROJECTS.unshift(newProject);
  logAudit(clientEmail, 'project.submit', `${projectId} (${service}) — ${title}`);

  return res.status(201).json({
    ok: true,
    projectId,
    project: newProject,
    message: `Project request ${projectId} received successfully.`,
  });
});

app.get('/api/projects/:id', async (req: Request, res: Response) => {
  const user = await resolveAuthUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Authentication required.' });
  }

  const pId = req.params.id?.toUpperCase();

  if (isDbConfigured) {
    try {
      const result = await query(
        `SELECT p.*, COALESCE(
           json_agg(
             json_build_object(
               'id', u.id,
               'authorName', u.author_name,
               'authorRole', u.author_role,
               'message', u.message,
               'createdAt', u.created_at
             ) ORDER BY u.created_at ASC
           ) FILTER (WHERE u.id IS NOT NULL),
           '[]'::json
         ) AS updates
         FROM projects p
         LEFT JOIN project_updates u ON u.project_id = p.id
         WHERE (p.id = $1 OR p.project_id = $2)
         GROUP BY p.id`,
        [req.params.id, pId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Project not found.' });
      }

      const row = result.rows[0];
      const isOwner = row.client_id === user.id || row.client_email?.toLowerCase() === user.email.toLowerCase();
      if (user.role !== 'admin' && !isOwner) {
        return res.status(403).json({ error: 'Access denied.' });
      }

      const project = {
        id: row.id,
        projectId: row.project_id,
        clientId: row.client_id,
        clientName: row.client_name,
        clientEmail: row.client_email,
        clientPhone: row.client_phone,
        age: row.age,
        service: row.service,
        title: row.title,
        description: row.description,
        requirements: row.requirements,
        budget: row.budget,
        deadline: row.deadline,
        references: row.references_text,
        attachments: row.attachments || [],
        extra: row.extra || {},
        status: row.status,
        progress: row.progress,
        tokenCharged: row.token_charged,
        createdAt: new Date(row.created_at).toISOString(),
        updatedAt: new Date(row.updated_at).toISOString(),
        updates: (row.updates || []).map((u: any) => ({
          ...u,
          createdAt: new Date(u.createdAt).toISOString(),
        })),
      };

      return res.json({ ok: true, project });
    } catch (err) {
      console.warn('[Project Detail DB Warning]:', err);
    }
  }

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

app.get('/api/admin/stats', requireAdmin, async (_req: Request, res: Response) => {
  if (isDbConfigured) {
    try {
      const usersCountRes = await query(`
        SELECT 
          COUNT(*) AS total_users,
          COUNT(*) FILTER (WHERE role = 'client') AS total_clients,
          COUNT(*) FILTER (WHERE role = 'admin') AS total_admins,
          COUNT(*) FILTER (WHERE not suspended) AS active_users,
          COUNT(*) FILTER (WHERE suspended) AS suspended_users,
          COUNT(*) FILTER (WHERE google_id IS NOT NULL) AS google_users
        FROM users
      `);

      const projectsCountRes = await query(`
        SELECT 
          COUNT(*) AS total_projects,
          COUNT(*) FILTER (WHERE status = 'submitted') AS submitted,
          COUNT(*) FILTER (WHERE status = 'approved') AS approved,
          COUNT(*) FILTER (WHERE status = 'in_progress') AS in_progress,
          COUNT(*) FILTER (WHERE status = 'delivered') AS delivered,
          COUNT(*) FILTER (WHERE status = 'completed') AS completed,
          COUNT(*) FILTER (WHERE status = 'rejected') AS rejected
        FROM projects
      `);

      const recentProjectsRes = await query(`
        SELECT id, project_id, client_name, client_email, title, service, status, progress, created_at
        FROM projects
        ORDER BY created_at DESC
        LIMIT 5
      `);

      const recentUsersRes = await query(`
        SELECT id, name, email, role, token_balance, suspended, (google_id IS NOT NULL) AS is_google, created_at
        FROM users
        ORDER BY created_at DESC
        LIMIT 5
      `);

      const recentLogsRes = await query(`
        SELECT id, actor, action, detail, created_at
        FROM audit_logs
        ORDER BY created_at DESC
        LIMIT 8
      `);

      const uRow = usersCountRes.rows[0];
      const pRow = projectsCountRes.rows[0];

      return res.json({
        ok: true,
        stats: {
          totalUsers: Number(uRow.total_users),
          clients: Number(uRow.total_clients),
          admins: Number(uRow.total_admins),
          activeUsers: Number(uRow.active_users),
          suspendedUsers: Number(uRow.suspended_users),
          googleUsers: Number(uRow.google_users),
          projects: Number(pRow.total_projects),
          byStatus: {
            submitted: Number(pRow.submitted),
            approved: Number(pRow.approved),
            in_progress: Number(pRow.in_progress),
            delivered: Number(pRow.delivered),
            completed: Number(pRow.completed),
            rejected: Number(pRow.rejected),
          },
          recentProjects: recentProjectsRes.rows,
          recentUsers: recentUsersRes.rows,
          recentActivity: recentLogsRes.rows,
        },
      });
    } catch (err) {
      console.error('[Admin Stats DB Error]:', err);
      return res.status(500).json({ error: 'Failed to aggregate admin statistics.' });
    }
  }

  const clients = MEMORY_USERS.filter((u) => u.role === 'client');
  return res.json({
    ok: true,
    stats: {
      totalUsers: MEMORY_USERS.length,
      clients: clients.length,
      admins: MEMORY_USERS.filter((u) => u.role === 'admin').length,
      activeUsers: MEMORY_USERS.filter((u) => !u.suspended).length,
      suspendedUsers: MEMORY_USERS.filter((u) => u.suspended).length,
      googleUsers: 0,
      projects: MEMORY_PROJECTS.length,
      byStatus: {
        submitted: MEMORY_PROJECTS.filter((p) => p.status === 'submitted').length,
        approved: MEMORY_PROJECTS.filter((p) => p.status === 'approved').length,
        in_progress: MEMORY_PROJECTS.filter((p) => p.status === 'in_progress').length,
        delivered: MEMORY_PROJECTS.filter((p) => p.status === 'delivered').length,
        completed: MEMORY_PROJECTS.filter((p) => p.status === 'completed').length,
        rejected: MEMORY_PROJECTS.filter((p) => p.status === 'rejected').length,
      },
      recentProjects: MEMORY_PROJECTS.slice(0, 5),
      recentActivity: MEMORY_LOGS.slice(0, 8),
      recentUsers: clients.slice(0, 5).map(({ passwordHash: _, ...pub }) => pub),
    },
  });
});

app.get('/api/admin/users', requireAdmin, async (req: Request, res: Response) => {
  const q = String(req.query.q || '').trim().toLowerCase();
  const role = String(req.query.role || 'all').trim().toLowerCase();
  const status = String(req.query.status || 'all').trim().toLowerCase();
  const provider = String(req.query.provider || 'all').trim().toLowerCase();
  const page = Math.max(1, parseInt(String(req.query.page || '1'), 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit || '20'), 10) || 20));
  const offset = (page - 1) * limit;

  if (isDbConfigured) {
    try {
      const conditions: string[] = [];
      const params: unknown[] = [];

      if (q) {
        params.push(`%${q}%`);
        conditions.push(`(LOWER(name) LIKE $${params.length} OR LOWER(email) LIKE $${params.length} OR id LIKE $${params.length})`);
      }

      if (role === 'client' || role === 'admin') {
        params.push(role);
        conditions.push(`role = $${params.length}`);
      }

      if (status === 'active') {
        conditions.push('suspended = false');
      } else if (status === 'suspended') {
        conditions.push('suspended = true');
      }

      if (provider === 'google') {
        conditions.push('google_id IS NOT NULL');
      } else if (provider === 'email') {
        conditions.push('google_id IS NULL');
      }

      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

      const countRes = await query(`SELECT COUNT(*) AS total FROM users ${whereClause}`, params);
      const total = parseInt(countRes.rows[0].total, 10);

      const queryParams = [...params, limit, offset];
      const limitParamIdx = params.length + 1;
      const offsetParamIdx = params.length + 2;

      const usersRes = await query(`
        SELECT 
          id, name, email, phone, age, role, token_balance, suspended, 
          avatar_url, created_at,
          (google_id IS NOT NULL) AS is_google,
          (CASE WHEN google_id IS NOT NULL THEN 'google' ELSE 'email' END) AS provider
        FROM users
        ${whereClause}
        ORDER BY created_at DESC
        LIMIT $${limitParamIdx} OFFSET $${offsetParamIdx}
      `, queryParams);

      return res.json({
        ok: true,
        users: usersRes.rows.map((row: any) => ({
          id: row.id,
          name: row.name,
          email: row.email,
          phone: row.phone,
          age: row.age,
          role: row.role,
          tokenBalance: row.token_balance,
          suspended: Boolean(row.suspended),
          avatarUrl: row.avatar_url,
          createdAt: row.created_at,
          isGoogle: Boolean(row.is_google),
          provider: row.provider,
        })),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit) || 1,
        },
      });
    } catch (err) {
      console.error('[Admin Users Query Error]:', err);
      return res.status(500).json({ error: 'Database error fetching users list.' });
    }
  }

  // Memory fallback
  const filtered = MEMORY_USERS
    .filter((u) => !q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q))
    .filter((u) => role === 'all' || u.role === role)
    .filter((u) => status === 'all' || (status === 'active' ? !u.suspended : u.suspended))
    .map(({ passwordHash: _, ...pub }) => pub);

  return res.json({
    ok: true,
    users: filtered.slice(offset, offset + limit),
    pagination: {
      page,
      limit,
      total: filtered.length,
      totalPages: Math.ceil(filtered.length / limit) || 1,
    },
  });
});

// Backward compatibility alias for /api/admin/clients
app.get('/api/admin/clients', requireAdmin, (req: Request, res: Response) => {
  return res.redirect(307, `/api/admin/users?${new URLSearchParams(req.query as any).toString()}`);
});

app.patch('/api/admin/users/:id/status', requireAdmin, async (req: Request, res: Response) => {
  const targetUserId = req.params.id;
  const { suspended } = req.body || {};
  const adminActor = (req as Request & { user: ServerUser }).user;

  if (typeof suspended !== 'boolean') {
    return res.status(400).json({ error: 'Invalid suspended parameter. Must be boolean.' });
  }

  if (targetUserId === adminActor.id && suspended) {
    return res.status(400).json({ error: 'You cannot suspend your own administrative account.' });
  }

  if (isDbConfigured) {
    try {
      const uRes = await query('SELECT * FROM users WHERE id = $1', [targetUserId]);
      if (uRes.rows.length === 0) {
        return res.status(404).json({ error: 'User not found.' });
      }
      const target = uRes.rows[0];

      if (target.role === 'admin' && suspended) {
        const activeAdminsRes = await query("SELECT COUNT(*) AS count FROM users WHERE role = 'admin' AND NOT suspended");
        const activeAdmins = parseInt(activeAdminsRes.rows[0].count, 10);
        if (activeAdmins <= 1) {
          return res.status(400).json({ error: 'Cannot suspend the last active administrator.' });
        }
      }

      await query('UPDATE users SET suspended = $1 WHERE id = $2', [suspended, targetUserId]);

      if (suspended) {
        await query('UPDATE user_sessions SET revoked = true WHERE user_id = $1', [targetUserId]);
      }

      logAudit(adminActor.email, suspended ? 'admin.user_suspend' : 'admin.user_reinstate', `${target.email} (${target.id})`);

      return res.json({
        ok: true,
        userId: targetUserId,
        suspended,
        message: `User account ${suspended ? 'suspended and sessions revoked' : 'reinstated'}.`,
      });
    } catch (err) {
      console.error('[Admin Status Update Error]:', err);
      return res.status(500).json({ error: 'Failed to update user status.' });
    }
  }

  return res.status(503).json({ error: 'Database service unavailable.' });
});

app.patch('/api/admin/users/:id/role', requireAdmin, async (req: Request, res: Response) => {
  const targetUserId = req.params.id;
  const { role } = req.body || {};
  const adminActor = (req as Request & { user: ServerUser }).user;

  if (role !== 'client' && role !== 'admin') {
    return res.status(400).json({ error: "Role must be 'client' or 'admin'." });
  }

  if (targetUserId === adminActor.id && role !== 'admin') {
    return res.status(400).json({ error: 'You cannot demote your own administrator account.' });
  }

  if (isDbConfigured) {
    try {
      const uRes = await query('SELECT * FROM users WHERE id = $1', [targetUserId]);
      if (uRes.rows.length === 0) {
        return res.status(404).json({ error: 'User not found.' });
      }
      const target = uRes.rows[0];

      if (target.role === 'admin' && role === 'client') {
        const activeAdminsRes = await query("SELECT COUNT(*) AS count FROM users WHERE role = 'admin' AND NOT suspended");
        const activeAdmins = parseInt(activeAdminsRes.rows[0].count, 10);
        if (activeAdmins <= 1) {
          return res.status(400).json({ error: 'Cannot demote the last active administrator.' });
        }
      }

      await query('UPDATE users SET role = $1 WHERE id = $2', [role, targetUserId]);

      logAudit(adminActor.email, 'admin.role_change', `${target.email}: ${target.role} -> ${role}`);

      return res.json({
        ok: true,
        userId: targetUserId,
        role,
        message: `User role updated to ${role}.`,
      });
    } catch (err) {
      console.error('[Admin Role Update Error]:', err);
      return res.status(500).json({ error: 'Failed to update user role.' });
    }
  }

  return res.status(503).json({ error: 'Database service unavailable.' });
});



app.post('/api/admin/users/:id/reset-password', requireAdmin, async (req: Request, res: Response) => {
  const targetUserId = req.params.id;
  const adminActor = (req as Request & { user: ServerUser }).user;

  if (isDbConfigured) {
    try {
      const uRes = await query('SELECT id, email, name FROM users WHERE id = $1', [targetUserId]);
      if (uRes.rows.length === 0) {
        return res.status(404).json({ error: 'User not found.' });
      }
      const target = uRes.rows[0];

      const rawToken = crypto.randomBytes(32).toString('hex');
      const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
      const resetId = `rst_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      await query(
        'INSERT INTO password_resets (id, user_id, token_hash, expires_at) VALUES ($1, $2, $3, $4)',
        [resetId, target.id, tokenHash, expiresAt.toISOString()]
      );

      logAudit(adminActor.email, 'admin.password_reset_link_generated', `Generated single-use reset token for ${target.email}`);

      return res.json({
        ok: true,
        user: { id: target.id, email: target.email, name: target.name },
        resetToken: rawToken,
        resetPath: `/reset-password?token=${rawToken}`,
        expiresInMinutes: 60,
        message: 'Single-use password reset link generated successfully. Expires in 60 minutes.',
      });
    } catch (err) {
      console.error('[Admin Password Reset Link Error]:', err);
      return res.status(500).json({ error: 'Failed to generate reset link.' });
    }
  }

  return res.status(503).json({ error: 'Database service unavailable.' });
});

app.get('/api/admin/projects', requireAdmin, async (req: Request, res: Response) => {
  const q = String(req.query.q || '').trim().toLowerCase();
  const status = String(req.query.status || 'all').trim().toLowerCase();
  const page = Math.max(1, parseInt(String(req.query.page || '1'), 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit || '20'), 10) || 20));
  const offset = (page - 1) * limit;

  if (isDbConfigured) {
    try {
      const conditions: string[] = [];
      const params: unknown[] = [];

      if (q) {
        params.push(`%${q}%`);
        conditions.push(`(LOWER(p.title) LIKE $${params.length} OR LOWER(p.project_id) LIKE $${params.length} OR LOWER(p.client_name) LIKE $${params.length} OR LOWER(p.client_email) LIKE $${params.length})`);
      }

      if (status !== 'all') {
        params.push(status);
        conditions.push(`p.status = $${params.length}`);
      }

      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

      const countRes = await query(`SELECT COUNT(*) AS total FROM projects p ${whereClause}`, params);
      const total = parseInt(countRes.rows[0].total, 10);

      const queryParams = [...params, limit, offset];
      const limitParamIdx = params.length + 1;
      const offsetParamIdx = params.length + 2;

      const result = await query(
        `SELECT p.*, COALESCE(
           json_agg(
             json_build_object(
               'id', u.id,
               'authorName', u.author_name,
               'authorRole', u.author_role,
               'message', u.message,
               'createdAt', u.created_at
             ) ORDER BY u.created_at ASC
           ) FILTER (WHERE u.id IS NOT NULL),
           '[]'::json
         ) AS updates
         FROM projects p
         LEFT JOIN project_updates u ON u.project_id = p.id
         ${whereClause}
         GROUP BY p.id
         ORDER BY p.created_at DESC
         LIMIT $${limitParamIdx} OFFSET $${offsetParamIdx}`,
        queryParams
      );

      const projects = result.rows.map((row: any) => ({
        id: row.id,
        projectId: row.project_id,
        clientId: row.client_id,
        clientName: row.client_name,
        clientEmail: row.client_email,
        clientPhone: row.client_phone,
        age: row.age,
        service: row.service,
        title: row.title,
        description: row.description,
        requirements: row.requirements,
        budget: row.budget,
        deadline: row.deadline,
        references: row.references_text,
        attachments: row.attachments || [],
        extra: row.extra || {},
        status: row.status,
        progress: row.progress,
        tokenCharged: row.token_charged,
        createdAt: new Date(row.created_at).toISOString(),
        updatedAt: new Date(row.updated_at).toISOString(),
        updates: (row.updates || []).map((u: any) => ({
          ...u,
          createdAt: new Date(u.createdAt).toISOString(),
        })),
      }));

      return res.json({
        ok: true,
        projects,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit) || 1,
        },
      });
    } catch (err) {
      console.error('[Admin Projects Query Error]:', err);
      return res.status(500).json({ error: 'Database error fetching admin projects.' });
    }
  }

  // Memory fallback
  const filtered = MEMORY_PROJECTS
    .filter((p) => !q || p.title.toLowerCase().includes(q) || p.projectId.toLowerCase().includes(q) || p.clientName.toLowerCase().includes(q) || p.clientEmail.toLowerCase().includes(q))
    .filter((p) => status === 'all' || p.status === status);

  return res.json({
    ok: true,
    projects: filtered.slice(offset, offset + limit),
    pagination: {
      page,
      limit,
      total: filtered.length,
      totalPages: Math.ceil(filtered.length / limit) || 1,
    },
  });
});

app.patch('/api/admin/projects/:id', requireAdmin, async (req: Request, res: Response) => {
  const targetProjectId = req.params.id;
  const { status, progress, message } = req.body || {};
  const adminActor = (req as Request & { user: ServerUser }).user;

  const VALID_STATUSES = ['submitted', 'approved', 'in_progress', 'delivered', 'completed', 'rejected'];

  if (status && !VALID_STATUSES.includes(status)) {
    return res.status(400).json({ error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}` });
  }

  const numProgress = progress !== undefined ? Math.max(0, Math.min(100, parseInt(String(progress), 10))) : undefined;

  if (isDbConfigured && pool) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const pRes = await client.query('SELECT * FROM projects WHERE id = $1 OR project_id = $1 FOR UPDATE', [targetProjectId]);
      if (pRes.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: 'Project not found.' });
      }
      const project = pRes.rows[0];

      const newStatus = status || project.status;
      const newProgress = numProgress !== undefined ? numProgress : project.progress;

      await client.query(
        'UPDATE projects SET status = $1, progress = $2, updated_at = NOW() WHERE id = $3',
        [newStatus, newProgress, project.id]
      );

      if (message && typeof message === 'string' && message.trim().length > 0) {
        const updId = `upd_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
        await client.query(
          'INSERT INTO project_updates (id, project_id, author_name, author_role, message, created_at) VALUES ($1, $2, $3, $4, $5, NOW())',
          [updId, project.id, adminActor.name, 'admin', message.trim()]
        );
      }

      await client.query('COMMIT');

      logAudit(adminActor.email, 'admin.project_update', `${project.project_id} -> status: ${newStatus}, progress: ${newProgress}%`);

      return res.json({
        ok: true,
        projectId: project.project_id,
        status: newStatus,
        progress: newProgress,
        message: 'Project updated successfully.',
      });
    } catch (err) {
      await client.query('ROLLBACK');
      console.error('[Admin Project Update Error]:', err);
      return res.status(500).json({ error: 'Failed to update project.' });
    } finally {
      client.release();
    }
  }

  return res.status(503).json({ error: 'Database service unavailable.' });
});

app.delete('/api/admin/projects/:id', requireAdmin, async (req: Request, res: Response) => {
  const targetProjectId = req.params.id;
  const adminActor = (req as Request & { user: ServerUser }).user;

  if (isDbConfigured) {
    try {
      const pRes = await query('SELECT * FROM projects WHERE id = $1 OR project_id = $1', [targetProjectId]);
      if (pRes.rows.length === 0) {
        return res.status(404).json({ error: 'Project not found.' });
      }
      const project = pRes.rows[0];
      await query('DELETE FROM projects WHERE id = $1', [project.id]);
      logAudit(adminActor.email, 'admin.project_delete', `${project.project_id} (${project.title})`);
      return res.json({ ok: true, message: `Project ${project.project_id} deleted successfully.` });
    } catch (err) {
      console.error('[Admin Project Delete Error]:', err);
      return res.status(500).json({ error: 'Failed to delete project.' });
    }
  }

  const idx = MEMORY_PROJECTS.findIndex((p) => p.id === targetProjectId || p.projectId === targetProjectId);
  if (idx !== -1) {
    const deleted = MEMORY_PROJECTS.splice(idx, 1)[0];
    logAudit(adminActor.email, 'admin.project_delete', `${deleted.projectId} (${deleted.title})`);
    return res.json({ ok: true, message: `Project ${deleted.projectId} deleted.` });
  }
  return res.status(404).json({ error: 'Project not found.' });
});

app.get('/api/admin/contact-inquiries', requireAdmin, async (req: Request, res: Response) => {
  if (!isDbConfigured) {
    return res.status(503).json({ error: 'Contact inquiry storage is unavailable because the database is not configured.' });
  }

  const page = Math.max(1, parseInt(String(req.query.page || '1'), 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit || '20'), 10) || 20));
  const offset = (page - 1) * limit;

  try {
    const countRes = await query('SELECT COUNT(*) AS total FROM contact_inquiries');
    const inquiriesRes = await query(
      'SELECT id, name, email, subject, message, created_at FROM contact_inquiries ORDER BY created_at DESC LIMIT $1 OFFSET $2',
      [limit, offset]
    );
    const total = parseInt(countRes.rows[0]?.total || '0', 10);
    return res.json({
      ok: true,
      inquiries: inquiriesRes.rows,
      pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) },
    });
  } catch (err) {
    console.error('[Admin Contact Inquiries Query Error]:', err instanceof Error ? err.message : 'Unknown database error');
    return res.status(500).json({ error: 'Failed to fetch contact inquiries.' });
  }
});

app.get('/api/admin/logs', requireAdmin, async (req: Request, res: Response) => {
  const limit = Math.min(200, Math.max(1, parseInt(String(req.query.limit || '50'), 10) || 50));
  const offset = Math.max(0, parseInt(String(req.query.offset || '0'), 10) || 0);

  if (isDbConfigured) {
    try {
      const countRes = await query('SELECT COUNT(*) AS total FROM audit_logs');
      const logsRes = await query(
        'SELECT id, actor, action, detail, created_at FROM audit_logs ORDER BY created_at DESC LIMIT $1 OFFSET $2',
        [limit, offset]
      );
      return res.json({
        ok: true,
        logs: logsRes.rows,
        total: parseInt(countRes.rows[0].total, 10),
        limit,
        offset,
      });
    } catch (err) {
      console.error('[Admin Logs Query Error]:', err);
      return res.status(500).json({ error: 'Failed to fetch audit logs.' });
    }
  }

  return res.json({ ok: true, logs: MEMORY_LOGS, total: MEMORY_LOGS.length, limit, offset });
});

app.get('/api/admin/system', requireAdmin, async (_req: Request, res: Response) => {
  let dbStatus = 'disconnected';
  let dbLatencyMs: number | null = null;
  let activeSessionsCount = 0;

  if (isDbConfigured) {
    try {
      const start = Date.now();
      await query('SELECT 1');
      dbLatencyMs = Date.now() - start;
      dbStatus = 'connected';

      const sRes = await query('SELECT COUNT(*) AS count FROM user_sessions WHERE NOT revoked AND expires_at > NOW()');
      activeSessionsCount = parseInt(sRes.rows[0].count, 10) || 0;
    } catch {
      dbStatus = 'error';
    }
  }

  const clientId = process.env.GOOGLE_CLIENT_ID?.trim() || process.env.VITE_GOOGLE_CLIENT_ID?.trim();

  return res.json({
    ok: true,
    system: {
      serverTime: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
      nodeVersion: process.version,
      environment: process.env.NODE_ENV || 'development',
      database: {
        configured: isDbConfigured,
        status: dbStatus,
        latencyMs: dbLatencyMs,
        activeSessionsCount,
      },
      googleAuth: {
        configured: Boolean(clientId),
        clientIdPrefix: clientId ? clientId.slice(0, 12) + '...' : null,
      },
    },
  });
});

// Backward compatibility for legacy POST /api/admin/clients
app.post('/api/admin/clients', requireAdmin, (req: Request, res: Response) => {
  const { clientId, action, amount, reason, suspended } = req.body || {};
  if (action === 'suspend') {
    req.params.id = clientId;
    req.body.suspended = Boolean(suspended);
    return (app._router.handle as any)(req, res);
  }

  return res.status(400).json({ error: 'Unknown action.' });
});

// 404 handler for API routes
app.all('/api/*', (_req: Request, res: Response) => {
  res.status(404).json({ error: 'API endpoint not found.' });
});

// Global Error Handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[API Error]:', err.message);
  return res.status(500).json({ error: 'An unexpected server error occurred.' });
});
