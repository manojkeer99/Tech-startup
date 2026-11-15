# TheCreators

**Build. Break. On Demand.**

TheCreators is a full-stack digital services platform. It combines a public-facing services website with client account, project intake, referral, and administration features.

## Features

- Marketing pages for the studio, services, and individual service details
- Client registration and login with email/password or Google sign-in
- Password recovery and persistent server-managed sessions
- Project submission and client dashboard with project status and updates
- Admin dashboard for managing users, projects, referrals, and audit activity
- Referral-code tracking and commission management
- Contact form, theme selection, and English/Hindi language toggle
- Cloudflare Turnstile support for bot protection on authentication forms

## Tech stack

| Area | Technologies |
| --- | --- |
| Frontend | React, TypeScript, Vite |
| UI and styling | Tailwind CSS, Motion, Lucide |
| Backend | Node.js, Express, TypeScript |
| Database | PostgreSQL (`pg`) |
| Authentication | bcrypt, Google OAuth, secure HTTP-only session cookies |
| Bot protection | Cloudflare Turnstile |

## Project structure

```text
src/
  components/    Shared UI and layout components
  lib/           API client, application store, translations, service metadata
  pages/         Home, services, authentication, dashboard, admin, and other pages
  types/         Shared TypeScript types
server/
  app.ts         Express middleware and API routes
  db.ts          PostgreSQL connection and query helpers
  index.ts       Backend startup and production static-file serving
  migrate.ts     Database migration runner
  migrations/    SQL schema migrations
server.ts        Combined development server (Express + Vite)
```

## Requirements

- [Bun](https://bun.sh/) (recommended; the repository includes `bun.lock`)
- Node.js is also required by the runtime and supported by the npm scripts
- PostgreSQL for persistent data (optional for local development)

## Run locally

Install dependencies and start the integrated development server:

```bash
bun install
bun run dev
```

The app is served at `http://localhost:3000` by default. The development server runs Express and Vite together; API requests use the `/api` path.

You can run the frontend and backend separately if needed:

```bash
bun run dev:client
bun run dev:server
```

The separate Vite client proxies `/api` requests to `http://localhost:5000` by default. Set `VITE_BACKEND_URL` to use another backend URL.

## Environment variables

Create a local `.env` file as needed. Do not commit credentials or secrets.

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | PostgreSQL connection string. If omitted, the server uses in-memory data, which is not durable and is intended for local/demo use. |
| `SESSION_SECRET` | Secret used for session-related signing. Set a strong value in production. |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID. |
| `TURNSTILE_SITE_KEY` | Cloudflare Turnstile public site key. |
| `TURNSTILE_SECRET_KEY` | Cloudflare Turnstile server-side secret. Configure both keys together. |
| `FRONTEND_URL` / `APP_URL` | Additional allowed frontend origins for cross-origin deployments. |
| `VITE_API_BASE_URL` | Optional API base URL for a separately deployed frontend. |
| `VITE_BACKEND_URL` | Optional backend URL for the Vite development proxy. |
| `ADMIN_EMAILS` | Comma-separated email addresses trusted as administrators. |

In development, Turnstile can be omitted. In production, configure it; the server does not allow an unconfigured production bypass. When `DATABASE_URL` is configured and reachable, the server runs the SQL migrations at startup.

## Build and run

```bash
bun run build
bun run typecheck
bun run start
```

The build produces the frontend in `dist/` and compiled server files in `dist-server/`. The production server serves the frontend build and API from the same app. `bun run preview` previews the Vite frontend build.

## Deployment notes

- The frontend can be deployed separately (for example, to Vercel) with an API base URL or platform rewrite to the Express backend.
- The Express backend requires its environment variables and a reachable PostgreSQL database for durable user, project, session, and referral data.
- Health endpoints are available at `/api/health` and `/api/ready`.

**TheCreators — Build. Break. On Demand.**
