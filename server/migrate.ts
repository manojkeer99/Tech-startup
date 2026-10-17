import fs from 'fs';
import path from 'path';
import { pool, isDbConfigured, checkDbConnection } from './db.js';

export async function runMigrations(): Promise<{ success: boolean; message: string }> {
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
    const migrationFile = path.resolve(process.cwd(), 'server/migrations/001_initial.sql');
    if (!fs.existsSync(migrationFile)) {
      return { success: false, message: 'Migration file not found.' };
    }

    const sql = fs.readFileSync(migrationFile, 'utf-8');
    await pool.query(sql);

    console.info('[Migration] Database tables and indexes verified successfully.');
    return { success: true, message: 'Migrations executed successfully.' };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn('[Migration Warning] Could not apply migrations:', msg);
    return { success: false, message: msg };
  }
}
