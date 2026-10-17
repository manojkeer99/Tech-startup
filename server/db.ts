import pg from 'pg';
const { Pool } = pg;

// Read configuration from environment
const rawDbUrl = process.env.DATABASE_URL?.trim();

export const isDbConfigured = Boolean(rawDbUrl && rawDbUrl.length > 0);

let pool: pg.Pool | null = null;

if (isDbConfigured) {
  try {
    pool = new Pool({
      connectionString: rawDbUrl,
      ssl: process.env.NODE_ENV === 'production' && !rawDbUrl?.includes('localhost') && !rawDbUrl?.includes('127.0.0.1')
        ? { rejectUnauthorized: false }
        : undefined,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });

    pool.on('error', (err) => {
      // Do not log connection string or secrets
      console.warn('[Database Pool Warning] Idle client encountered an error:', err.message);
    });
  } catch (err) {
    console.warn('[Database Init] Failed to initialize connection pool:', err instanceof Error ? err.message : String(err));
    pool = null;
  }
} else {
  // Clear report without crashing
  console.info('[Database Notice] DATABASE_URL is not set. Service is operating with in-memory persistence layer.');
}

/**
 * Checks whether the PostgreSQL database is reachable.
 * Never throws; returns { ok: boolean; message: string }.
 */
export async function checkDbConnection(): Promise<{ ok: boolean; message: string }> {
  if (!pool || !isDbConfigured) {
    return {
      ok: false,
      message: 'DATABASE_URL is not configured.',
    };
  }

  try {
    const client = await pool.connect();
    try {
      await client.query('SELECT 1');
      return { ok: true, message: 'Database connection verified.' };
    } finally {
      client.release();
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Connection failed';
    return { ok: false, message: `Database unreachable: ${msg}` };
  }
}

/**
 * Safe query execution wrapper.
 */
export async function query<T extends pg.QueryResultRow = pg.QueryResultRow>(
  text: string,
  params?: unknown[],
): Promise<pg.QueryResult<T>> {
  if (!pool) {
    throw new Error('Database is not configured.');
  }
  return pool.query<T>(text, params);
}

export { pool };
