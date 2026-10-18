import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import path from 'path';
import fs from 'fs';
import { OAuth2Client } from 'google-auth-library';
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
if (rawFrontendUrl)
    defaultAllowedOrigins.push(rawFrontendUrl.replace(/\/$/, ''));
if (rawAppUrl)
    defaultAllowedOrigins.push(rawAppUrl.replace(/\/$/, ''));
app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (e.g. server-to-server, curl, mobile)
        if (!origin)
            return callback(null, true);
        const isAllowed = defaultAllowedOrigins.includes(origin) ||
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
}));
// CSRF Origin verification for state-changing authenticated endpoints
function checkCsrf(req, res, next) {
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
        return next();
    }
    const origin = req.headers.origin || req.headers.referer;
    if (!origin) {
        return next();
    }
    try {
        const originHost = new URL(origin).origin;
        const isAllowed = defaultAllowedOrigins.includes(originHost) ||
            originHost.endsWith('.vercel.app') ||
            originHost.endsWith('.run.app') ||
            originHost.includes('localhost:') ||
            originHost.includes('127.0.0.1:');
        if (!isAllowed) {
            return res.status(403).json({ error: 'Cross-origin request rejected.' });
        }
    }
    catch {
        return res.status(403).json({ error: 'Invalid request origin.' });
    }
    next();
}
app.use(checkCsrf);
// Session Cookie Name & Lifetime (30 days persistent session)
const SESSION_COOKIE = 'tc_session';
const SESSION_DURATION_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
// In-Memory Fallback State (Active when DATABASE_URL is not configured or in transient state)
const MEMORY_USERS = [
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
const MEMORY_PROJECTS = [
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
const MEMORY_LOGS = [
    {
        id: 'log_001',
        actor: 'System',
        action: 'server.init',
        detail: 'Full-stack Express backend initialized with health check and API endpoints',
        createdAt: new Date().toISOString(),
    },
];
const MEMORY_SESSIONS = new Map();
// Helper functions
function hashPassword(plain) {
    return bcrypt.hashSync(plain, 10);
}
function verifyPassword(plain, hash) {
    try {
        return bcrypt.compareSync(plain, hash);
    }
    catch {
        return false;
    }
}
function generateProjectId() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let rand = '';
    const bytes = crypto.randomBytes(6);
    for (let i = 0; i < 6; i++) {
        rand += chars[bytes[i] % chars.length];
    }
    return `TCR-2026-${rand}`;
}
function logAudit(actor, action, detail = null) {
    const entry = {
        id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        actor,
        action,
        detail,
        createdAt: new Date().toISOString(),
    };
    MEMORY_LOGS.unshift(entry);
    if (isDbConfigured) {
        query('INSERT INTO audit_logs (id, actor, action, detail) VALUES ($1, $2, $3, $4)', [entry.id, actor, action, detail]).catch(() => { });
    }
}
function setSessionCookie(res, rawToken) {
    res.cookie(SESSION_COOKIE, rawToken, {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        maxAge: SESSION_DURATION_MS,
    });
}
function clearSessionCookie(res) {
    res.clearCookie(SESSION_COOKIE, {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        path: '/',
    });
}
/**
 * Creates a cryptographically random 32-byte opaque session token.
 * Only the SHA-256 hash is stored in PostgreSQL (user_sessions).
 * Sets persistent HttpOnly cookie on the response.
 */
async function createUserSession(user, req, res) {
    const rawToken = crypto.randomBytes(32).toString('base64url');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const sessionId = `sess_${crypto.randomBytes(16).toString('hex')}`;
    const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);
    const userAgent = req.headers['user-agent'] || null;
    const ipAddress = (req.ip || req.socket.remoteAddress || null);
    if (isDbConfigured) {
        try {
            await query(`INSERT INTO user_sessions (id, user_id, token_hash, user_agent, ip_address, expires_at)
         VALUES ($1, $2, $3, $4, $5, $6)`, [sessionId, user.id, tokenHash, userAgent, ipAddress, expiresAt.toISOString()]);
        }
        catch (err) {
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
    setSessionCookie(res, rawToken);
    return rawToken;
}
/**
 * Resolves the authenticated user from the session cookie or Bearer header.
 * Validates expiration, revocation, and user suspension status against PostgreSQL.
 */
async function resolveAuthUser(req) {
    const rawToken = req.cookies[SESSION_COOKIE] ||
        (req.headers.authorization?.startsWith('Bearer ') ? req.headers.authorization.slice(7).trim() : null);
    if (!rawToken)
        return null;
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    // Query PostgreSQL first when configured
    if (isDbConfigured) {
        try {
            const result = await query(`SELECT 
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
         LIMIT 1`, [tokenHash]);
            if (result.rows.length > 0) {
                const row = result.rows[0];
                if (row.revoked)
                    return null;
                if (new Date(row.expires_at).getTime() < Date.now())
                    return null;
                if (row.suspended)
                    return null;
                // Async touch session activity timestamp
                query('UPDATE user_sessions SET last_used_at = NOW() WHERE token_hash = $1', [tokenHash]).catch(() => { });
                return {
                    id: row.id,
                    name: row.name,
                    email: row.email,
                    phone: row.phone,
                    age: row.age,
                    role: row.role,
                    tokenBalance: row.token_balance,
                    suspended: Boolean(row.suspended),
                    googleId: row.google_id,
                    avatarUrl: row.avatar_url,
                    createdAt: new Date(row.created_at).toISOString(),
                    passwordHash: row.password_hash,
                };
            }
        }
        catch (err) {
            console.warn('[Session Lookup Warning] DB query failed, falling back to memory check:', err);
        }
    }
    // Memory fallback
    const memSession = MEMORY_SESSIONS.get(tokenHash);
    if (memSession) {
        if (memSession.revoked || memSession.expiresAt < Date.now())
            return null;
        const user = MEMORY_USERS.find((u) => u.id === memSession.userId);
        if (!user || user.suspended)
            return null;
        return user;
    }
    // Legacy fallback for base64 userId:timestamp tokens during transition
    try {
        const decoded = Buffer.from(rawToken, 'base64').toString('utf-8');
        if (decoded.includes(':')) {
            const [userId] = decoded.split(':');
            const user = MEMORY_USERS.find((u) => u.id === userId);
            if (user && !user.suspended)
                return user;
        }
    }
    catch { }
    return null;
}
// Authentication Middlewares
async function requireAuth(req, res, next) {
    const user = await resolveAuthUser(req);
    if (!user) {
        return res.status(401).json({ error: 'Authentication required.' });
    }
    req.user = user;
    next();
}
async function requireAdmin(req, res, next) {
    const user = await resolveAuthUser(req);
    if (!user || user.role !== 'admin') {
        return res.status(403).json({ error: 'Administrator access required.' });
    }
    req.user = user;
    next();
}
/* -------------------------------------------------------------------------- */
/*                               HEALTH & READINESS                           */
/* -------------------------------------------------------------------------- */
app.get('/api/health', (_req, res) => {
    return res.status(200).json({
        status: 'ok',
        server: 'online',
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
    });
});
app.get('/api/ready', async (_req, res) => {
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
app.get('/api/services', (_req, res) => {
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
app.post('/api/contact', (req, res) => {
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
/**
 * Public Auth Configuration Endpoint.
 * Informs the frontend whether Google OAuth is configured and returns the public Client ID.
 * Never exposes secrets.
 */
app.get('/api/auth/config', (_req, res) => {
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
app.post('/api/auth/google', async (req, res) => {
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
    }
    catch (err) {
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
    let user = null;
    if (isDbConfigured) {
        try {
            // 1. Look up existing user by Google sub identifier
            const byGoogle = await query('SELECT * FROM users WHERE google_id = $1 LIMIT 1', [googleId]);
            if (byGoogle.rows.length > 0) {
                const row = byGoogle.rows[0];
                if (row.suspended) {
                    logAudit(cleanEmail, 'auth.google_login_blocked', 'Suspended account attempted Google sign-in');
                    return res.status(403).json({ error: 'This account has been suspended. Please contact support.' });
                }
                // Update avatar if not present
                if (!row.avatar_url && avatarUrl) {
                    await query('UPDATE users SET avatar_url = $1 WHERE id = $2', [avatarUrl, row.id]).catch(() => { });
                    row.avatar_url = avatarUrl;
                }
                user = {
                    id: row.id,
                    name: row.name,
                    email: row.email,
                    phone: row.phone,
                    age: row.age,
                    role: row.role,
                    tokenBalance: row.token_balance,
                    suspended: Boolean(row.suspended),
                    googleId: row.google_id,
                    avatarUrl: row.avatar_url,
                    createdAt: new Date(row.created_at).toISOString(),
                    passwordHash: row.password_hash,
                };
                logAudit(cleanEmail, 'auth.google_login', `Logged in via verified Google identity`);
            }
            else {
                // 2. Safe account linking: Check if an existing account with the same verified email exists
                const byEmail = await query('SELECT * FROM users WHERE LOWER(email) = $1 LIMIT 1', [cleanEmail]);
                if (byEmail.rows.length > 0) {
                    const row = byEmail.rows[0];
                    if (row.suspended) {
                        logAudit(cleanEmail, 'auth.google_login_blocked', 'Suspended account attempted Google sign-in');
                        return res.status(403).json({ error: 'This account has been suspended. Please contact support.' });
                    }
                    // Safely link Google identity without modifying existing password hash, role, or balance
                    await query('UPDATE users SET google_id = $1, avatar_url = COALESCE(avatar_url, $2) WHERE id = $3', [googleId, avatarUrl, row.id]);
                    user = {
                        id: row.id,
                        name: row.name,
                        email: row.email,
                        phone: row.phone,
                        age: row.age,
                        role: row.role,
                        tokenBalance: row.token_balance,
                        suspended: Boolean(row.suspended),
                        googleId,
                        avatarUrl: row.avatar_url || avatarUrl,
                        createdAt: new Date(row.created_at).toISOString(),
                        passwordHash: row.password_hash,
                    };
                    logAudit(cleanEmail, 'auth.google_linked', 'Linked verified Google identity to existing user account');
                }
                else {
                    // 3. New public sign-up: Public Google sign-ups ALWAYS receive the ordinary 'client' role (never admin)
                    const newUserId = `usr_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
                    const unusablePasswordHash = `*GOOGLE_AUTH_LOCKED*${crypto.randomBytes(32).toString('hex')}`;
                    const defaultTokens = 100;
                    await query(`INSERT INTO users (id, name, email, google_id, avatar_url, role, token_balance, suspended, password_hash)
             VALUES ($1, $2, $3, $4, $5, 'client', $6, false, $7)`, [newUserId, googleName, cleanEmail, googleId, avatarUrl, defaultTokens, unusablePasswordHash]);
                    // Credit welcome bonus tokens
                    const txId = `tx_${Date.now()}_${crypto.randomBytes(2).toString('hex')}`;
                    await query(`INSERT INTO token_transactions (id, client_id, amount, reason)
             VALUES ($1, $2, $3, $4)`, [txId, newUserId, defaultTokens, 'Welcome bonus upon verified Google registration to The Creators']).catch(() => { });
                    // Welcome notification
                    const notifId = `notif_${Date.now()}_${crypto.randomBytes(2).toString('hex')}`;
                    await query(`INSERT INTO user_notifications (id, user_id, title, body)
             VALUES ($1, $2, $3, $4)`, [notifId, newUserId, 'Welcome to THE CREATORS', 'Your client dashboard is active. 100 welcome tokens have been credited to your wallet.']).catch(() => { });
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
                    logAudit(cleanEmail, 'auth.google_signup', 'New client registered via verified Google Identity (100 welcome tokens credited)');
                }
            }
        }
        catch (dbErr) {
            console.error('[Google Auth DB Error]:', dbErr);
            return res.status(500).json({ error: 'Database error processing Google authentication.' });
        }
    }
    else {
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
        }
        else {
            if (mem.suspended) {
                return res.status(403).json({ error: 'This account has been suspended. Please contact support.' });
            }
            mem.googleId = googleId;
            if (avatarUrl)
                mem.avatarUrl = avatarUrl;
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
app.post('/api/auth/register', async (req, res) => {
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
    let newUser;
    if (isDbConfigured) {
        try {
            const existing = await query('SELECT id FROM users WHERE LOWER(email) = $1 LIMIT 1', [cleanEmail]);
            if (existing.rows.length > 0) {
                return res.status(409).json({ error: 'An account with this email already exists. Try logging in.' });
            }
            const id = `usr_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
            const pwHash = hashPassword(password);
            const defaultTokens = 100;
            await query(`INSERT INTO users (id, name, email, phone, age, role, token_balance, suspended, password_hash)
         VALUES ($1, $2, $3, $4, $5, 'client', $6, false, $7)`, [id, name.trim(), cleanEmail, phone ? String(phone).trim() : null, age ? Number(age) : null, defaultTokens, pwHash]);
            // Welcome transaction
            const txId = `tx_${Date.now()}_${crypto.randomBytes(2).toString('hex')}`;
            await query(`INSERT INTO token_transactions (id, client_id, amount, reason)
         VALUES ($1, $2, $3, $4)`, [txId, id, defaultTokens, 'Welcome bonus upon registration to The Creators']).catch(() => { });
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
        }
        catch (err) {
            console.error('[Registration DB Error]:', err);
            return res.status(500).json({ error: 'Database error registering account.' });
        }
    }
    else {
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
            tokenBalance: 100,
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
    logAudit(cleanEmail, 'auth.register', 'New client registered with 100 tokens');
    const { passwordHash: _, ...publicUser } = newUser;
    return res.status(201).json({
        ok: true,
        user: publicUser,
        message: `Welcome aboard, ${newUser.name.split(' ')[0]}! 100 welcome tokens have been credited.`,
    });
});
app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body || {};
    const cleanEmail = String(email || '').trim().toLowerCase();
    if (!cleanEmail || !password) {
        return res.status(400).json({ error: 'Email and password are required.' });
    }
    let user = null;
    if (isDbConfigured) {
        try {
            const result = await query('SELECT * FROM users WHERE LOWER(email) = $1 LIMIT 1', [cleanEmail]);
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
                role: row.role,
                tokenBalance: row.token_balance,
                suspended: Boolean(row.suspended),
                googleId: row.google_id,
                avatarUrl: row.avatar_url,
                createdAt: new Date(row.created_at).toISOString(),
                passwordHash: row.password_hash,
            };
        }
        catch (err) {
            console.error('[Login DB Error]:', err);
            return res.status(500).json({ error: 'Database error processing login.' });
        }
    }
    else {
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
app.post('/api/auth/logout', async (req, res) => {
    const rawToken = req.cookies[SESSION_COOKIE] ||
        (req.headers.authorization?.startsWith('Bearer ') ? req.headers.authorization.slice(7).trim() : null);
    if (rawToken) {
        const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
        if (isDbConfigured) {
            query('UPDATE user_sessions SET revoked = true WHERE token_hash = $1', [tokenHash]).catch(() => { });
        }
        const mem = MEMORY_SESSIONS.get(tokenHash);
        if (mem)
            mem.revoked = true;
    }
    clearSessionCookie(res);
    return res.json({ ok: true, message: 'Logged out successfully.' });
});
app.get('/api/auth/me', async (req, res) => {
    const user = await resolveAuthUser(req);
    if (!user) {
        return res.status(401).json({ error: 'Not authenticated.' });
    }
    const { passwordHash: _, ...publicUser } = user;
    return res.json({ ok: true, user: publicUser });
});
// Password recovery endpoints
app.post('/api/auth/forgot', (req, res) => {
    const { email } = req.body || {};
    const cleanEmail = String(email || '').trim().toLowerCase();
    const token = crypto.randomBytes(16).toString('hex');
    logAudit(cleanEmail, 'auth.password_reset_request', 'Reset token requested');
    return res.json({
        ok: true,
        message: 'If that email address is registered, password reset instructions have been generated.',
        demoResetToken: token,
    });
});
app.post('/api/auth/reset', (req, res) => {
    const { token, password } = req.body || {};
    if (!token || !password || typeof password !== 'string' || password.length < 8) {
        return res.status(400).json({ error: 'Valid token and a password of at least 8 characters are required.' });
    }
    return res.json({
        ok: true,
        message: 'Your password has been updated. You can now log in.',
    });
});
/* -------------------------------------------------------------------------- */
/*                               PROJECTS                                     */
/* -------------------------------------------------------------------------- */
app.get('/api/projects', async (req, res) => {
    const user = await resolveAuthUser(req);
    if (!user) {
        return res.status(401).json({ error: 'Authentication required.' });
    }
    if (isDbConfigured) {
        try {
            const q = user.role === 'admin'
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
            const projects = result.rows.map((row) => ({
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
                updates: (row.updates || []).map((u) => ({
                    ...u,
                    createdAt: new Date(u.createdAt).toISOString(),
                })),
            }));
            return res.json({ ok: true, projects });
        }
        catch (err) {
            console.warn('[Projects Query DB Warning] Falling back to memory:', err);
        }
    }
    const userProjects = user.role === 'admin'
        ? MEMORY_PROJECTS
        : MEMORY_PROJECTS.filter((p) => p.clientId === user.id || p.clientEmail.toLowerCase() === user.email.toLowerCase());
    return res.json({ ok: true, projects: userProjects });
});
app.post('/api/projects', async (req, res) => {
    const body = req.body || {};
    const user = await resolveAuthUser(req);
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
    const id = `proj_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
    const newProject = {
        id,
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
    if (isDbConfigured) {
        try {
            await query(`INSERT INTO projects (
           id, project_id, client_id, client_name, client_email, client_phone, age,
           service, title, description, requirements, budget, deadline, references_text,
           attachments, extra, status, progress, token_charged
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)`, [
                newProject.id,
                newProject.projectId,
                newProject.clientId,
                newProject.clientName,
                newProject.clientEmail,
                newProject.clientPhone,
                newProject.age,
                newProject.service,
                newProject.title,
                newProject.description,
                newProject.requirements,
                newProject.budget,
                newProject.deadline,
                newProject.references,
                JSON.stringify(newProject.attachments),
                JSON.stringify(newProject.extra),
                newProject.status,
                newProject.progress,
                newProject.tokenCharged,
            ]);
            await query(`INSERT INTO project_updates (id, project_id, author_name, author_role, message)
         VALUES ($1, $2, $3, $4, $5)`, [
                newProject.updates[0].id,
                newProject.id,
                newProject.updates[0].authorName,
                newProject.updates[0].authorRole,
                newProject.updates[0].message,
            ]);
        }
        catch (err) {
            console.warn('[Project Insert DB Warning]:', err);
        }
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
app.get('/api/projects/:id', async (req, res) => {
    const user = await resolveAuthUser(req);
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
app.get('/api/admin/stats', requireAdmin, async (_req, res) => {
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
app.get('/api/admin/clients', requireAdmin, (req, res) => {
    const q = String(req.query.q || '').toLowerCase();
    const clients = MEMORY_USERS.filter((u) => u.role === 'client')
        .filter((c) => !q || c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q))
        .map(({ passwordHash: _, ...pub }) => pub);
    return res.json({ ok: true, clients });
});
app.post('/api/admin/clients', requireAdmin, (req, res) => {
    const { clientId, action, amount, reason, suspended } = req.body || {};
    const user = MEMORY_USERS.find((u) => u.id === clientId);
    if (!user) {
        return res.status(404).json({ error: 'Client not found.' });
    }
    const adminActor = req.user;
    if (action === 'suspend') {
        if (user.role === 'admin' && suspended) {
            const activeAdmins = MEMORY_USERS.filter((u) => u.role === 'admin' && !u.suspended);
            if (activeAdmins.length <= 1) {
                return res.status(400).json({ error: 'Cannot suspend the last active administrator.' });
            }
        }
        user.suspended = Boolean(suspended);
        if (isDbConfigured) {
            query('UPDATE users SET suspended = $1 WHERE id = $2', [user.suspended, user.id]).catch(() => { });
            if (user.suspended) {
                query('UPDATE user_sessions SET revoked = true WHERE user_id = $1', [user.id]).catch(() => { });
            }
        }
        logAudit(adminActor.email, user.suspended ? 'client.suspend' : 'client.reinstate', user.email);
        return res.json({ ok: true, suspended: user.suspended });
    }
    if (action === 'tokens') {
        const numAmount = Number(amount) || 0;
        if (numAmount === 0)
            return res.status(400).json({ error: 'Amount must be non-zero.' });
        if (user.tokenBalance + numAmount < 0) {
            return res.status(400).json({ error: 'Insufficient client balance for this deduction.' });
        }
        user.tokenBalance += numAmount;
        if (isDbConfigured) {
            query('UPDATE users SET token_balance = $1 WHERE id = $2', [user.tokenBalance, user.id]).catch(() => { });
        }
        logAudit(adminActor.email, 'tokens.adjust', `${user.email}: ${numAmount >= 0 ? '+' : ''}${numAmount} (${reason || 'Admin adjustment'})`);
        return res.json({ ok: true, tokenBalance: user.tokenBalance });
    }
    return res.status(400).json({ error: 'Unknown action.' });
});
app.get('/api/admin/logs', requireAdmin, (_req, res) => {
    return res.json({ ok: true, logs: MEMORY_LOGS });
});
// Serve frontend static build in production deployment
const distPath = path.resolve(process.cwd(), 'dist');
if (fs.existsSync(distPath)) {
    app.use(express.static(distPath));
    // Client-side SPA routing fallback for non-API routes
    app.get('*', (req, res, next) => {
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
app.all('/api/*', (_req, res) => {
    res.status(404).json({ error: 'API endpoint not found.' });
});
// Fallback 404 for any remaining unhandled non-API paths
app.use((_req, res) => {
    res.status(404).send('Not Found');
});
// Global Error Handler
app.use((err, _req, res, _next) => {
    console.error('[API Error]:', err.message);
    return res.status(500).json({ error: 'An unexpected server error occurred.' });
});
