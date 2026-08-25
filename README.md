# LumenX Lighting

Marketing site for **LumenX** — a South African technical lighting partner for retail,
commercial, and industrial projects. Design, specification, value engineering, supply, and
project coordination held by one accountable team.

Built with **React 19 + Vite + TypeScript + Tailwind CSS v4 + Motion**, plus a small
**Node.js + Express + PostgreSQL** backend (functional style, no classes) for the IES
walled garden and the lighting design tool.

## Run locally

**Prerequisites:** Node.js 18+ and PostgreSQL.

1. Install dependencies:
   ```bash
   npm install
   ```
2. Configure environment variables (copy `.env.example` to `.env`).
3. Create the database schema:
   ```bash
   npm run db:migrate
   ```
4. Generate the sample IES placeholder files:
   ```bash
   npm run ies:seed
   ```
5. Run the frontend and backend (two terminals):
   ```bash
   npm run dev:web      # Vite at http://localhost:3000 (proxies /api -> :4000)
   npm run dev:server   # Express API at http://localhost:4000
   ```
   Or build and serve everything from the backend:
   ```bash
   npm run build && npm start   # http://localhost:4000
   ```

## Scripts

| Command              | Description                                          |
| -------------------- | ---------------------------------------------------- |
| `npm run dev:web`    | Start the Vite dev server (port 3000)                |
| `npm run dev:server` | Start the Express API with watch (port 4000)         |
| `npm run server`     | Start the Express API (serves `dist/` when present)  |
| `npm run start`      | Alias for `server`                                   |
| `npm run build`      | Production build to `dist/`                          |
| `npm run preview`    | Preview the production build                         |
| `npm run lint`       | TypeScript check (`tsc --noEmit`)                    |
| `npm run db:migrate` | Apply `db/schema.sql`                                |
| `npm run ies:seed`   | Generate sample Luminex IES files                    |

## Environment

See `.env.example`. The key values:

- `DATABASE_URL` — PostgreSQL connection string.
- `JWT_SECRET` — secret for signing session JWTs.
- `ADMIN_API_KEY` — the key a human admin sends as the `x-admin-key` header for script/CLI access to admin endpoints.
- `IES_DIR` — (optional) absolute path to the protected IES directory.

## Structure

- `src/` — React frontend (`data.ts`, `components/`, `lib/api.ts`)
- `server/` — Express backend (functional, no classes)
  - `routes/` — auth, admin, ies, design
  - `middleware/` — auth/approval and validation
  - `services/` — password, token, IES parsing, lumen-method calc
  - `files/ies/` — **protected** IES directory (never served statically)
- `db/schema.sql` — `users` and `design_exports` tables
- `public/datasheets/` — open, public product datasheets

## IES walled garden

- Standard product **datasheets remain public** (`/datasheets/…`).
- Raw **IES files** live outside the public root and are only served through
  `GET /api/ies/:filename`, which requires a signed-in account (sign-up is
  self-serve — no admin approval).
- Registration: `POST /api/auth/register` (hashes the password and creates the
  account immediately).
- Administrators (for viewing users and download activity) sign in at `/admin`
  with an account whose `role = 'admin'` (create one with `npm run admin:create`).

## Lighting design tool (`/design-tool`)

- Open to everyone — no account required.
- The backend only processes **Luminex** IES files (filename + `[MANUFAC]` allowlist);
  raw files are never returned, so scrapers cannot extract them from the tool's directory.
- Exporting the final report requires a valid email, which is logged to `design_exports`
  via `POST /api/design/export`.
