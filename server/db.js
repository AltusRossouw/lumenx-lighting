// PostgreSQL access layer — a single lazily-initialised connection pool.
// Functional style: exported pure-ish helpers, no classes.

import pg from 'pg';
import { config } from './config.js';

const { Pool } = pg;

let pool = null;

// The pool is created on first use so the server can boot even when the
// database is temporarily unavailable (routes then return a clean 503).
export const getPool = () => {
  if (pool === null) {
    pool = new Pool({
      connectionString: config.databaseUrl,
      max: 10,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 5_000,
    });
    // Surface idle client errors without crashing the process.
    pool.on('error', (err) => {
      console.error('[db] idle client error:', err.message);
    });
  }
  return pool;
};

// Parametrised query helper. Returns { rows, rowCount }.
export const query = (text, params = []) => getPool().query(text, params);

// Convenience: query a single row or null.
export const queryOne = async (text, params = []) => {
  const result = await query(text, params);
  return result.rows[0] ?? null;
};
