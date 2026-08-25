// Promote an existing account to administrator, or create a new admin account.
// The first administrator is bootstrapped from the command line (a chicken-and-egg
// problem that cannot be solved from the web UI itself).
//
// Usage:
//   node server/scripts/make-admin.js <email> [password]
//
// If no password is supplied, a strong random one is generated and printed once.

import crypto from 'node:crypto';
import { getPool, queryOne } from '../db.js';
import { hashPassword } from '../services/password.js';
import { normalizeEmail, isValidEmail, isValidPassword } from '../middleware/validation.js';

const [emailArg, passwordArg] = process.argv.slice(2);
const email = normalizeEmail(emailArg);

if (!isValidEmail(email)) {
  console.error('Usage: node server/scripts/make-admin.js <email> [password]');
  process.exit(1);
}

const password = passwordArg ?? crypto.randomBytes(15).toString('base64url');
if (!isValidPassword(password)) {
  console.error('[make-admin] password must be at least 8 characters.');
  process.exit(1);
}

const run = async () => {
  const hash = await hashPassword(password);
  const existing = await queryOne('SELECT id FROM users WHERE email = $1', [email]);

  if (existing) {
    await queryOne(
      `UPDATE users
       SET role = 'admin', password_hash = $1, updated_at = now()
       WHERE id = $2`,
      [hash, existing.id],
    );
    console.log(`[make-admin] promoted ${email} to administrator (password updated).`);
  } else {
    await queryOne(
      `INSERT INTO users (email, password_hash, role)
       VALUES ($1, $2, 'admin')`,
      [email, hash],
    );
    console.log(`[make-admin] created administrator ${email}.`);
  }

  if (!passwordArg) {
    console.log(`[make-admin] generated password: ${password}`);
    console.log('[make-admin] store this securely — it will not be shown again.');
  }
};

run()
  .catch((err) => {
    console.error('[make-admin] failed:', err.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await getPool().end();
  });
