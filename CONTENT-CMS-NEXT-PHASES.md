# LumenX Content CMS — Handoff & Next-Phase Plan

> Purpose: a self-contained brief for the next agent to extend the content-editing
> system ("WordPress-lite") built for the LumenX marketing site. Read this end-to-end
> before writing code.

---

## 1. Context

LumenX is a **React 19 + Vite + TypeScript + Tailwind v4 + Motion** SPA with a small
**Node.js + Express + PostgreSQL** backend (functional style — **no classes**). The
site runs in production as a single Docker container behind Nginx Proxy Manager.

The goal: let a non-technical person edit marketing copy through the existing
`/admin` without developer access.

### What is already shipped (Phase 1)

A **"Content" tab in `/admin`** that edits site copy via labeled form fields and a
**Publish** button. Copy is stored in Postgres, the public site fetches it on load,
and everything falls back to hardcoded defaults until the first save.

- Commit: **`a91d82d`** on `main`, pushed to `origin/main`
  (`github.com/AltusRossouw/lumenx-lighting`).
- No CI in the repo. Production deploys via `docker-compose.yml` (Portainer/Proxmox).
- The Docker entrypoint runs `node server/scripts/migrate.js` before starting, so new
  tables are created idempotently on redeploy.

### Current edit scope

Editable now: company/brand, homepage hero, all 6 homepage teasers, Solution /
Compliance / Why LumenX / Process / Audience sections, industries, FAQs, contact
details, CTA section, Services/Products/Resources/Projects page headers, SEO titles +
meta descriptions, and the compliance bar.

**Not editable yet** (the next phases): product catalogue, project cards, the
installation gallery, images/uploads, and several small hardcoded strings.

---

## 2. Architecture (data flow)

```
                    ┌────────────────────────────────────────────────┐
                    │                 PostgreSQL                    │
                    │  site_content (single row, id=1, data JSONB)  │
                    │  content_revisions (snapshot on every save)   │
                    └────────────────────────────────────────────────┘
                                       ▲ │
                          PUT (admin)   │ │ GET
                    (snapshots previous)│ │ (returns { content })
                                       │ ▼
   ┌──────────────┐   PUT /api/admin/content   ┌──────────────────────────────┐
   │  Content tab │ ─────────────────────────► │  server/routes/content.js   │
   │  (/admin)    │   GET /api/admin/content   │  (requireAdmin gate)        │
   └──────────────┘                            └──────────────────────────────┘
         │ publish → setSiteContent(draft)         GET /api/content (public)
         ▼                                                    │
   ┌──────────────────────────────────────────────────────────┴─────────────┐
   │                        Frontend (src/content.ts)                       │
   │  DEFAULT_CONTENT  ←── deep-merge ←── stored document (or null)          │
   │        │                                                               │
   │   resolve() → ResolvedContent (icons/images zipped back in from data.ts)│
   │        │                                                               │
   │   useSiteContent()  →  consumed by ~18 components                       │
   └────────────────────────────────────────────────────────────────────────┘
```

**Fail-safe rule:** if the DB or `/api/content` is unreachable, the frontend keeps
`DEFAULT_CONTENT` and the site renders exactly as it does today. Nothing can break
the live site because of an empty/broken content store.

---

## 3. Key files

| File | Role |
|---|---|
| `db/schema.sql` | `site_content` (single row `id=1`, `data jsonb`) + `content_revisions` |
| `server/routes/content.js` | public `GET /api/content`; admin `GET/PUT /api/admin/content` |
| `server/app.js` | mounts `contentRouter()` at `/api` |
| `server/middleware/auth.js` | `requireAdmin` (admin session OR `x-admin-key` header) |
| `src/lib/api.ts` | `api.content()`, `api.adminContent()`, `api.saveContent()` |
| `src/content.ts` | `SiteContent` type, `DEFAULT_CONTENT`, store, `useSiteContent()` |
| `src/content-schema.ts` | declarative form schema (`CONTENT_SCHEMA`) |
| `src/components/ContentEditor.tsx` | generic editor UI (publish / reset) |
| `src/components/AdminPage.tsx` | hosts the new **Content** tab |
| `src/data.ts` | hardcoded copy (now the *defaults*) |
| `src/products.ts` | product catalogue (~90 KB — **not yet in the CMS**) |

---

## 4. Core patterns (follow these exactly)

### 4.1 The content model — `src/content.ts`

`SiteContent` is the **stored** shape (text only). It is grouped, and lists are plain
text arrays — icons/images are deliberately excluded so they stay owned by `data.ts`.

```ts
export interface Heading { lead: string; accent: string; tail: string; }  // accent = gradient word
export interface TextItem  { title: string; description: string; }
export interface LabelItem { label: string; description: string; }
export interface QaItem    { question: string; answer: string; }
export interface Teaser    { label?: string; title: Heading; copy: string; link: string; }
```

`DEFAULT_CONTENT` is seeded from `data.ts` + the inline strings that used to live in
components. `mergeSiteContent(stored)` deep-merges a stored document over
`DEFAULT_CONTENT` (arrays replace wholesale).

`resolve(content)` produces `ResolvedContent`, which **zips** icon-bearing `data.ts`
arrays back in:

```ts
const zip = (defaults, overrides) =>
  defaults.map((d, i) => {
    const o = overrides?.[i];
    return o ? { ...d, title: o.title, description: o.description } : d;
  });
```

This is why Solution/Why/Process/Audience items keep their `icon`/`iconImg`/`number`
even though the editor only edits text.

### 4.2 The store / hook

```ts
let content = DEFAULT_CONTENT;
export const setSiteContent = (next) => { content = mergeSiteContent(next); listeners.forEach(cb => cb()); };
export const loadSiteContent = async () => { /* GET /api/content, fall back silently */ };
export const useSiteContent = () => {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  return useMemo(() => resolve(snapshot), [snapshot]);  // stable ref between renders
};
```

`loadSiteContent()` is called once in `AppLayout` (`src/App.tsx`).

### 4.3 The editor schema — `src/content-schema.ts`

`CONTENT_SCHEMA: Group[]` where each `Group = { title, description?, fields }`.
`FieldDef` kinds: `text` | `textarea` | `heading` (renders lead/accent/tail) |
`stringList` | `objectList`. Paths are **string arrays** into `SiteContent`.

```ts
{ kind: 'objectList', label: 'Capabilities', path: ['solution', 'items'],
  addable: false, itemFields: [textItem, descriptionItem] }
```

### 4.4 The editor UI — `src/components/ContentEditor.tsx`

- Loads via `api.adminContent()` on mount; `draft = res.content ?? DEFAULT_CONTENT`.
- Immutable updates with `getAt(obj, path)` / `setAt(obj, path, value)` path helpers.
- **Publish** → `api.saveContent(draft)` then `setSiteContent(draft)` (updates the
  live store in-session so the change is visible without a reload).
- **Reset to defaults** → `draft = clone(DEFAULT_CONTENT)` (still requires Publish).

---

## 5. Conventions & gotchas

1. **Icon-bearing lists are edit-only.** `solution`, `whyChoose`, `process`,
   `audience`, and `industries` use `addable: false` because icons come from `data.ts`
   and can't be minted in the editor. Adding/removing those items needs image/icon
   support (Phase 4). `compliance` items and `faqs` are addable (no icons).
2. **Headings containing the LumenX wordmark logo are intentionally not editable.**
   e.g. WhyLumenX "The █ LumenX difference", and the contact heading
   "Bring █ into the project". Leave those fixed; edit only their subcopy.
3. **`Heading.accent` is the highlighted (gradient) word.** Render it as
   `{lead}<span className="gradient-text">{accent}</span>{tail}`.
4. **SEO** lives in `App.tsx` `SeoManager`, which reads `seo` from `useSiteContent()`.
   Effect deps are `[pathname, seo]`.
5. **Deep-merge semantics:** arrays replace wholesale, objects merge recursively,
   `undefined` keeps the default. Use `mergeSiteContent` (exported) anywhere a stored
   doc is applied.
6. **`requireAdmin`** sets `req.user` only for session auth; for the `x-admin-key`
   path `req.user` is undefined, so `updated_by` falls back to `'admin'`.
7. **Body limit** is `express.json({ limit: '1mb' })` — keep the content document
   comfortably under that (it is today; watch it if product text is added).

---

## 6. Next phases (proposed order)

### Phase 2 — Product catalogue copy (largest)

Make category and product marketing text editable without moving the catalogue out of
code. **Do not** try to migrate `products.ts` to the DB; use override-by-key, matching
the existing merge pattern.

**First, inspect `src/products.ts`** (it's large) and `src/types.ts` `Product` /
`ProductCategory`. Known exports: `PRODUCT_CATEGORIES`, `PRODUCTS`,
`PRODUCTS_BY_CATEGORY` (derived by `reduce`), `getCategory`, `getProductsByCategory`,
`getProduct`, `datasheetDownloadUrl`, `getAllDatasheets`, `DATASHEET_LIBRARY`.

Tasks:

1. Add a `catalogue` group to `SiteContent` + `DEFAULT_CONTENT`:
   - `categories`: editable `title` / `description` per category id (keyed map or list).
   - `products`: editable `name` / `summary` / `description` per product, keyed by
     `categoryId + '/' + slug` (or `slug` if globally unique — verify).
2. Extend `resolve()` to overlay overrides onto `PRODUCT_CATEGORIES` / `PRODUCTS`
   (same zip/overlay approach), leaving `specs`/`features`/`imageUrl`/`pdfUrl`/`iesUrl`
   untouched.
3. Add schema groups to `CONTENT_SCHEMA`. Given ~90 KB of products, **do not** render
   every product at once — add per-category sections or a search-filtered sub-editor.
4. Wire `ProductsPage`, `ProductDetailPage`, `ProductPage` to read resolved catalogue.

**Acceptance:** editing a category description and a product summary in `/admin` and
publishing updates the live pages; specs/images/IES links stay intact.

### Phase 3 — Projects & installation gallery text

`FEATURED_PROJECTS` and `INSTALLATION_IMAGES` live in `src/data.ts` and are consumed by
`HomePage` (projects teaser), `ProjectsSection`, and the hero slideshow.

1. Add `projects: { heading/subcopy already done }` + a `featuredProjects` objectList
   (editable: `name`, `location`, `scope`, `delivered`, `category`, `imageAlt`;
   **imageUrl stays locked**).
2. Add an `installationImages` objectList (editable: `alt`, `category`, `application`;
   **src stays locked**).
3. New/removed projects will lack an image — render the existing
   "Project imagery — to be supplied" placeholder (already in `ProjectsSection`) for
   empty `imageUrl`. For the gallery, decide a graceful fallback for empty `src`.

**Acceptance:** project card and gallery captions are editable; existing images remain.

### Phase 4 — Image uploads (biggest infra lift)

Currently all media is static under `public/` (datasheets, installation images,
headshots, icons). This phase adds upload + storage.

Decisions to make first (document your choice in the PR):
- **Storage:** a Docker volume path served by Express, vs. object storage (S3/R2).
  Local volume is simplest for a single-container deploy and matches the existing
  "single container" architecture.
- **Upload lib:** `multer` (multipart) fits the functional Express style.

Tasks:
1. Add `POST /api/admin/upload` (admin-gated) + a public static route for the uploads
   dir (mirror how `public/` is served; keep it **outside** the SPA fallback).
2. Watch `helmet` CSP (`server/app.js` `imgSrc` is `['self', 'data:']`) — the new
   origin/path must be allowed, or `data:` used, if applicable.
3. Add media fields to the content model where needed (hero slides, gallery `src`,
   project `imageUrl`, headshot/signature).
4. Add an image field type to the editor (`ContentEditor` + `content-schema.ts`).
5. Update components to use the resolved media URLs.

**Acceptance:** a user can upload/replace a hero or gallery image from `/admin`.

### Phase 5 — Publish workflow & revision rollback

Currently publishing is instant (with revision snapshots stored but not exposed).

1. Expose `content_revisions` in the Content tab: list (date, author) + **Restore this
   version** button (restore = set draft to that revision, then Publish).
2. Optionally add draft vs. published state (a `status` column or a second row) plus a
   `?preview` route that renders the draft for an admin session.

**Acceptance:** an editor can view history and revert a bad publish in two clicks.

### Phase 6 — Remaining hardcoded copy (quick wins)

Small strings still hardcoded — sweep these into the CMS the same way:

- `ContactSection.tsx` — eyebrow label "Submit Your Lighting Requirement" + the
  subcopy paragraph (leave the wordmark heading fixed).
- `ProductsPage.tsx` — value-props bar (3 title/desc pairs) and bottom CTA
  ("Need a Quote?" heading + subcopy + button).
- `ResourcesPage.tsx` — the 4 download card `label`/`description` strings.
- `src/data.ts` `MANAGING_DIRECTOR` — name/role/phone/email (headshot/signature are
  images → Phase 4).
- `AccreditationBar.tsx` items and `Header.tsx`/`Footer.tsx` nav link labels, if
  desired.

---

## 7. Runbook — adding one new editable field

1. **Model** — add the field to `SiteContent` and a matching value in `DEFAULT_CONTENT`
   (`src/content.ts`). If it's icon-bearing, keep only text here and add it to
   `resolve()`.
2. **Schema** — add the `FieldDef` to the right group in `CONTENT_SCHEMA`
   (`src/content-schema.ts`).
3. **Consume** — in the component, call `useSiteContent()` and read the resolved value
   instead of the hardcoded string / `data.ts` import.
4. **Typecheck** — `npx tsc --noEmit` (must be clean) and `npm run build`.
5. **Deploy** — commit + push; the Docker entrypoint migrates automatically.

---

## 8. Testing checklist

- [ ] `npx tsc --noEmit` clean.
- [ ] `npm run build` succeeds.
- [ ] Fresh DB: site renders defaults; `/api/content` returns `{ content: null }`.
- [ ] Save in `/admin` → Content → Publish; reload page; copy persists and renders.
- [ ] Second save creates a revision; restore works (Phase 5).
- [ ] Stop the DB / API → site still renders defaults (fail-safe).
- [ ] `requireAdmin` blocks unauthenticated access to `/api/admin/content`.

---

## 9. Deploy notes

- Push to `main`. Production = `docker compose up -d --build` on the host
  (Portainer "Re-pull and redeploy", or SSH + `git pull && docker compose up -d --build`).
- Migration is automatic via the container `CMD` (`migrate.js` → `index.js`).
- The production host alias `wlc` (192.168.1.150) may only be reachable from the
  192.168.1.x network / VPN — not from an external network.
