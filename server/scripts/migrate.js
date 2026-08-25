// Run db/schema.sql against the configured PostgreSQL database.
// Usage: npm run db:migrate
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { config } from '../config.js';
import { getPool } from '../db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const schemaPath = path.resolve(__dirname, '..', '..', 'db', 'schema.sql');

const migrate = async () => {
  const sql = await fs.readFile(schemaPath, 'utf8');
  const client = await getPool().connect();
  try {
    await client.query(sql);
    console.log('[migrate] schema applied successfully.');
  } finally {
    client.release();
    await getPool().end();
  }
};

migrate().catch((err) => {
  console.error('[migrate] failed:', err.message);
  process.exit(1);
});
