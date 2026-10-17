# LumenX Lighting

Marketing site for **LumenX** — a South African technical lighting partner for retail,
commercial, and industrial projects. Design, specification, value engineering, supply, and
project coordination held by one accountable team.

Built with **React 19 + Vite + TypeScript + Tailwind CSS v4 + Motion**, plus a small
**Node.js + Express + PostgreSQL** backend (functional style, no classes) for the IES
walled garden and the lighting design tool.

## Run locally

**Prerequisites:** Node.js 18+ and PostgreSQL. Optional: Poppler for the AI
spec-sheet import (`poppler-utils` on Debian, `brew install poppler` on macOS);
it is already installed in the Docker image.

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

## Deploy (Docker)

Production runs Node + Express in a single container that serves both the API
and the built frontend on port 4000, behind Nginx Proxy Manager (SSL).

1. Create `.env` from `.env.example` and fill in real values (`JWT_SECRET`,
   `ADMIN_API_KEY`, `RESEND_API_KEY`, `COOKIE_SECURE=true`). Add
   `DEEPSEEK_API_KEY` too if you want the AI spec-sheet import; leave it empty
   to disable that feature.
2. Build and start the stack:
   ```bash
   docker compose up -d --build
   ```
   The `db` service (PostgreSQL 16) is provisioned automatically and the app
   applies `db/schema.sql` on start (idempotent). The `lumenx_uploads` volume
   holds admin-uploaded media; back it up alongside `lumenx_pgdata`.
3. Point Nginx Proxy Manager at `http://<host>:4000` for `www.lumenx.co.za`
   with WebSocket support enabled.
4. Create an admin account to view leads and download activity:
   ```bash
   docker compose exec app node server/scripts/make-admin.js you@lumenx.co.za
   ```

Notes:
- To use an external database, override `DATABASE_URL` in `.env` (or edit
  `docker-compose.yml`) and remove/ignore the `db` service.
- Email notifications require a verified `RESEND_FROM` domain in Resend. Leave
  `RESEND_API_KEY` empty to disable email — leads still appear in `/admin`.

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
| `npm run ies:seed`   | Generate sample LumenX IES files                     |

## Environment

See `.env.example`. The key values:

- `DATABASE_URL` — PostgreSQL connection string.
- `JWT_SECRET` — secret for signing session JWTs.
- `ADMIN_API_KEY` — the key a human admin sends as the `x-admin-key` header for script/CLI access to admin endpoints.
- `IES_DIR` — (optional) absolute path to the protected IES directory.
- `IES_UPLOADS_DIR` — (optional) writable IES upload directory; defaults to
  `<UPLOADS_DIR>/ies`.
- `UPLOADS_DIR` — (optional) writable media root for product/category images,
  spec sheets and source PDFs; defaults to `./uploads`.
- `DEEPSEEK_API_KEY` — optional; enables the AI spec-sheet import.
- `DEEPSEEK_MODEL` — optional; defaults to `deepseek-flash`.
- `AI_IMPORT_ENABLED` — optional; set to `false` to disable AI import even when
  a key is present.

## Catalogue admin (products, categories and AI import)

`/admin` → **Catalogue** lets an administrator:

- create and edit categories (title, description, range, image, order);
- create products and edit any product from the base catalogue — edits are stored
  as a database override, and **Reset to catalogue version** removes it;
- toggle each product between **Live** and **Hidden** without deleting it. Hidden
  products are removed from public listings, product pages, the datasheet
  library, IES grouping and the sitemap; they stay in the admin so they can be
  shown again;
- upload multiple product images, choose the main image, and edit alt text /
  contain-vs-cover per image;
- upload a PDF spec sheet, or have LumenX generate a branded A4 datasheet;
- attach one or more IES files (still behind the member login gate);
- open the **Changelog** tab for an append-only per-user activity log —
  sign-ins, authenticated IES downloads and catalogue/content/IES/import changes.
  Filter by user or action, search it, or open a specific user's changelog from
  the **Users** table.

Hidden is a **publication flag, not an access-control boundary**: the base
catalogue is compiled into the public JavaScript bundle, and hidden products
remain in the admin overlay so they can be restored. Use it to delist a product,
not to keep confidential material discoverable.

### AI spec-sheet import

Upload a manufacturer PDF and the server extracts its text (and, for scanned
PDFs, page images) with Poppler, then asks DeepSeek to extract the product data,
specifications and a branded datasheet draft. The result is a **draft** that
opens in the product editor; nothing is published until an administrator reviews
it and clicks **Create product**.

Requirements:

- `DEEPSEEK_API_KEY` in the server environment. Leave it empty to disable AI
  import — the manual editor keeps working.
- [Poppler](https://poppler.freedesktop.org/) (`pdftotext`, `pdftoppm`,
  `pdfimages`, `pdfinfo`). Installed in the Docker image as
  `poppler-utils`; on macOS install it with `brew install poppler`.
- The default model alias is `deepseek-flash` (currently served by
  DeepSeek-V4.1-Flash-1017). Override it with `DEEPSEEK_MODEL` if needed.

The source PDF is stored privately under `uploads/manufacturer-specs/` and is
only downloadable by an administrator. Its text and page images are sent to
DeepSeek for analysis, so confirm that is acceptable for your documents. The
admin UI shows confidence, warnings and source quotes; treat every imported
value as a draft until reviewed.

### Uploads and persistence

- Local development: uploads go to `./uploads` (gitignored).
- Docker: `UPLOADS_DIR=/app/uploads` is backed by the named
  `lumenx_uploads` volume, so images, spec sheets and IES uploads survive
  redeploys. **Back up this volume together with the Postgres volume.**
- Only `uploads/products/` and `uploads/categories/` are served publicly.
  Spec sheets are streamed through the tracked download route, and IES files
  remain behind the authenticated gate.
- Admin-uploaded IES files live in `uploads/ies/`; the committed supplier files
  in `server/files/ies/` stay readable as a read-only fallback.

### Generated LumenX datasheets

Products created in the admin (or base products with an override) can use
**LumenX sheet** as their spec sheet. The existing branded template and headless
Chromium render a one-page A4 PDF from the reviewed product fields. The product
editor has a **Preview LumenX sheet** button; the public download is tracked like
any other datasheet.

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
- IES downloads are offered **only on individual product pages** while signed
  in. The standalone IES library page was removed; `/ies` now redirects to
  `/products`, and the public resources page no longer advertises an IES card.
- Registration: `POST /api/auth/register` (hashes the password and creates the
  account immediately).
- Administrators (for viewing users and download activity) sign in at `/admin`
  with an account whose `role = 'admin'` (create one with `npm run admin:create`).

## Lighting design tool (`/design-tool`)

- Open to everyone — no account required.
- The backend only processes **LumenX** IES files (filename + `[MANUFAC]` allowlist);
  raw files are never returned, so scrapers cannot extract them from the tool's directory.
- Exporting the final report requires a valid email, which is logged to `design_exports`
  via `POST /api/design/export`.
