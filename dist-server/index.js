import 'dotenv/config';
import { app } from './app.js';
import { runMigrations } from './migrate.js';
import { isDbConfigured, checkDbConnection } from './db.js';
// Port resolution:
// In the AI Studio / Cloud Run container environment:
// Nginx listens on 8080 (Cloud Run external ingress) and proxies all app traffic to http://localhost:3000 (DEFAULT_APP_PORT).
// When running in production (compiled dist-server/index.js or NODE_ENV=production or Cloud Run deployment),
// the Express server MUST listen on DEFAULT_APP_PORT (3000) so Nginx and Cloud Run health probes succeed.
// In direct/standalone environments without an internal Nginx proxy (e.g. Render, standard container), listen on PORT.
// In local dev mode with Vite already listening on 3000, fallback to SERVER_PORT or 5000.
const isCompiledProductionServer = !process.argv[1]?.includes('server/index.ts');
let PORT;
if (isCompiledProductionServer) {
    PORT = Number(process.env.DEFAULT_APP_PORT) || Number(process.env.PORT) || 3000;
}
else {
    PORT = Number(process.env.SERVER_PORT) || 5000;
}
async function bootstrap() {
    console.info('====================================================');
    console.info('   THE CREATORS — Production Backend Core');
    console.info('   "Build. Break. On Demand."');
    console.info('====================================================');
    // Verify database status safely
    if (isDbConfigured) {
        const conn = await checkDbConnection();
        if (conn.ok) {
            console.info('[Database] PostgreSQL connection established.');
            await runMigrations();
        }
        else {
            console.warn('[Database] PostgreSQL is unreachable:', conn.message);
            console.warn('[Database] Server will start safely with fallback persistence.');
        }
    }
    else {
        console.info('[Database] DATABASE_URL is not set. Operating in resilient standalone mode.');
    }
    // Start Express listener
    const server = app.listen(PORT, '0.0.0.0', () => {
        console.info(`[Server] Express API listening on http://0.0.0.0:${PORT}`);
        console.info(`[Health] Liveness:  http://localhost:${PORT}/api/health`);
        console.info(`[Health] Readiness: http://localhost:${PORT}/api/ready`);
    });
    // Graceful termination
    const shutdown = (signal) => {
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
