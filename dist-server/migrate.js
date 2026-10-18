import fs from 'fs';
import path from 'path';
import { pool, isDbConfigured, checkDbConnection } from './db.js';
export async function runMigrations() {
    if (!isDbConfigured || !pool) {
        return {
            success: false,
            message: 'Migrations skipped: DATABASE_URL is not set.',
        };
    }
    const conn = await checkDbConnection();
    if (!conn.ok) {
        return {
            success: false,
            message: `Migrations skipped: ${conn.message}`,
        };
    }
    try {
        const migrationsDir = path.resolve(process.cwd(), 'server/migrations');
        if (!fs.existsSync(migrationsDir)) {
            return { success: false, message: 'Migrations directory not found.' };
        }
        const files = fs.readdirSync(migrationsDir)
            .filter((f) => f.endsWith('.sql'))
            .sort();
        for (const file of files) {
            const filePath = path.join(migrationsDir, file);
            const sql = fs.readFileSync(filePath, 'utf-8');
            await pool.query(sql);
            console.info(`[Migration] Applied ${file}`);
        }
        // Seed default baseline accounts if users table is empty (preserving data if accounts exist)
        const usersCount = await pool.query('SELECT COUNT(*) FROM users');
        if (parseInt(usersCount.rows[0]?.count || '0', 10) === 0) {
            console.info('[Migration] Seeding baseline studio accounts into PostgreSQL...');
            await pool.query(`
        INSERT INTO users (id, name, email, phone, age, role, token_balance, suspended, password_hash)
        VALUES 
          ('usr_admin_001', 'The Creators Admin', 'thecreators.pvt.ltd@gmail.com', '+91 98765 43210', 28, 'admin', 5000, false, '$2b$10$FHDR5npUPT2UVLG5G.b7V.Hh3bRIxVk/hveSHMNpNYE6a6GQjYnn2'),
          ('usr_client_001', 'Arjun Sharma', 'client@thecreators.tech', '+91 98111 22334', 26, 'client', 150, false, '$2b$10$7d3NSvQM6yMmTFvhBXchyeTtK5WbLbjHqc8dEyRXqe7ETi7kVk40O')
        ON CONFLICT (id) DO NOTHING;
      `);
            // Seed baseline demo project for client
            await pool.query(`
        INSERT INTO projects (id, project_id, client_id, client_name, client_email, client_phone, age, service, title, description, requirements, budget, deadline, status, progress, token_charged)
        VALUES (
          'proj_001',
          'TCR-2026-N9X42A',
          'usr_client_001',
          'Arjun Sharma',
          'client@thecreators.tech',
          '+91 98111 22334',
          26,
          'website-development',
          'Enterprise Fintech Landing Architecture',
          'High-conversion, sub-second responsive marketing portal with interactive calculators and real-time lead capture.',
          'React, Next.js, WCAG AA compliance, custom brand typography, dynamic currency visualizer.',
          'Custom — Let''s Discuss',
          '2026-11-15',
          'in_progress',
          65,
          0
        )
        ON CONFLICT (id) DO NOTHING;
      `);
            await pool.query(`
        INSERT INTO project_updates (id, project_id, author_name, author_role, message)
        VALUES (
          'upd_1',
          'proj_001',
          'The Creators Engineering',
          'admin',
          'Sprint 2 completed: Interactive calculator component and responsive navigation tested on iOS/Android.'
        )
        ON CONFLICT (id) DO NOTHING;
      `);
            await pool.query(`
        INSERT INTO audit_logs (id, actor, action, detail)
        VALUES ('log_init_001', 'System', 'database.seed', 'PostgreSQL baseline studio accounts and tables initialized.')
        ON CONFLICT (id) DO NOTHING;
      `);
        }
        console.info('[Migration] Database tables, columns, indexes, and sessions verified successfully.');
        return { success: true, message: 'All migrations executed successfully.' };
    }
    catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.warn('[Migration Warning] Could not apply migrations:', msg);
        return { success: false, message: msg };
    }
}
