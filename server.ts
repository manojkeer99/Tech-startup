import 'dotenv/config';
import express, { type Request, type Response, type NextFunction } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import { app } from './server/app.js';
import { runMigrations } from './server/migrate.js';
import { isDbConfigured, checkDbConnection } from './server/db.js';

const isProduction = process.env.NODE_ENV === 'production';
const PORT = Number(process.env.PORT) || Number(process.env.DEFAULT_APP_PORT) || 3000;

async function bootstrap() {
  console.info('====================================================');
  console.info('   THE CREATORS — Unified Full-Stack Application');
  console.info('   "Build. Break. On Demand."');
  console.info('====================================================');

  // Verify and run database migrations safely
  if (isDbConfigured) {
    const conn = await checkDbConnection();
    if (conn.ok) {
      console.info('[Database] PostgreSQL connection established.');
      await runMigrations().catch((err) => {
        console.warn('[Database Migration Warning]:', err instanceof Error ? err.message : String(err));
      });
    } else {
      console.warn('[Database] PostgreSQL is unreachable:', conn.message);
    }
  } else {
    console.info('[Database] DATABASE_URL is not set. Operating in resilient standalone mode.');
  }

  if (!isProduction) {
    // Development mode: mount Vite dev server middlewares for live frontend compilation
    console.info('[Server] Mounting Vite dev server middleware...');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });

    app.use(vite.middlewares);
  } else {
    // Production mode: serve static pre-built files from dist/
    const distPath = path.resolve(process.cwd(), 'dist');
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
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
  }

  const server = app.listen(PORT, '0.0.0.0', () => {
    console.info(`[Server] Full-stack application listening on http://0.0.0.0:${PORT}`);
    console.info(`[Health] API Health: http://localhost:${PORT}/api/health`);
    console.info(`[Health] API Ready:  http://localhost:${PORT}/api/ready`);
  });

  const shutdown = (signal: string) => {
    console.info(`[Server] Received ${signal}. Shutting down gracefully...`);
    server.close(() => {
      console.info('[Server] HTTP server closed.');
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

bootstrap().catch((err) => {
  console.error('[Fatal Bootstrap Error]:', err instanceof Error ? err.message : String(err));
  process.exit(1);
});
