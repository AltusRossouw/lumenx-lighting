# LumenX Lighting — Professional-Grade Website Upgrade Prompt

> **Target tools:** Higgsfield MCP + website-design skills (frontend-design, ui-ux-pro-max, claude-design, web-design-guidelines, shadcn)
> **Project:** `/Users/altus/Documents/lumenx-lighting`
> **Stack:** React 19 + Vite + TypeScript + Tailwind CSS v4 + shadcn/ui (base-nova) + Motion (Framer Motion) + Lucide Icons + Recharts
> **Brand:** B2B technical lighting partner — South Africa, retail/commercial/industrial

---

## PHASE 0 — ABSORB THE CURRENT STATE

Before making ANY changes, thoroughly read and understand:

1. **`SITE-CONTENT.md`** — All copy, product specs, compliance data, company voice
2. **`src/data.ts`** — All structured data (products, services, industries, FAQs, process steps, audience profiles)
3. **`src/types.ts`** — TypeScript interfaces for every data shape
4. **`src/index.css`** — Current design tokens, animations, utility classes
5. **`components.json`** — shadcn/ui config (base-nova style, neutral base, CSS variables enabled)
6. **`src/App.tsx`** — Routing structure, layout, compliance bar
7. **Every component in `src/components/`** — At minimum skim every file to understand the current UI patterns
8. **`src/components/animations/`** — halo-pulse, light-bloom, lightning-bolt, neon-text, page-hero-background, prism-beam
9. **`src/components/kokonutui/`** — background-paths, beams-background, particle-button, scroll-text, shape-hero
10. **`src/components/ui/button.tsx`** — Current shadcn button variant

---

## PHASE 1 — DESIGN SYSTEM AUDIT & UPGRADE

### 1.1 Typography System
**Current state:** `Outfit` (display), `Work Sans` (body), `JetBrains Mono` (mono). Inconsistent usage of `font-serif` class (no serif font defined). Gradient text utility exists but only used on hero.

**Upgrade to:**
- Define a proper **type scale** with 8–10 levels (display-2xl → caption) as Tailwind v4 `@theme` custom utilities or CSS custom properties
- Remove all references to `font-serif` or define an actual serif font (e.g., `Source Serif 4` for section labels)
- Create `.text-balance` utility class for headings
- Ensure every text element maps to a deliberate type-scale token — no ad-hoc `text-[13px]` or `text-[11px]` scattered throughout
- Add proper `letter-spacing` tokens per level
- All headings use `text-wrap: balance`

### 1.2 Color System
**Current state:** `--color-primary: #00D4FF` (cyan), `--color-secondary: #5165FF` (indigo), `--color-tertiary: #E23A2E` (red), `--color-neutral: #71787B`. Background `#06090F`. Cards `#0A101A` / `#0A0D14`.

**Upgrade to:**
- Expand to a full **16-shade scale** for each brand color (50→950) so components can use `bg-primary-50`, `text-primary-700`, `border-primary-200` etc.
- Define semantic color tokens:
  - `--color-surface-primary`, `--color-surface-secondary`, `--color-surface-elevated`
  - `--color-border-default`, `--color-border-muted`, `--color-border-accent`
  - `--color-text-primary`, `--color-text-secondary`, `--color-text-muted`, `--color-text-inverse`
- Add a warm accent (gold/amber) for "premium/quality" moments — lighting is about warmth too
- Ensure WCAG AA contrast ratios across all text/background combinations

### 1.3 Spacing & Layout System
**Current state:** Tailwind default spacing used ad-hoc. Sections use `py-20 sm:py-24` etc inconsistently.

**Upgrade to:**
- Define section spacing tokens: `--section-padding-y`, `--section-padding-y-mobile`
- Standardize the container: every section uses the same `max-w-7xl mx-auto px-4 sm:px-6 lg:px-8` (already mostly there)
- Define a **vertical rhythm** — spacing between sections should follow a consistent pattern (e.g., 120px → 160px → 120px alternating)
- Card grid gaps should be standardized to `gap-6` or `gap-8` everywhere

### 1.4 Border Radius & Elevation
**Current state:** Mix of `rounded-2xl`, `rounded-full`, no consistent elevation system.

**Upgrade to:**
- Define radius tokens: `--radius-sm` (4px), `--radius-md` (8px), `--radius-lg` (12px), `--radius-xl` (16px), `--radius-2xl` (24px)
- Define a **3-level elevation system** with consistent shadow tokens:
  - `--shadow-card` (default card)
  - `--shadow-card-hover` (hover state)
  - `--shadow-modal` (overlays/modals)
- Cards should consistently use one radius token

---

## PHASE 2 — COMPONENT ARCHITECTURE REFINEMENT

### 2.1 Replace Inline Styles with Design Tokens
**Problem:** Many components use inline `style={{}}` for colors, backgrounds, and animations. This makes theming impossible and bloats the DOM.

**Fix:**
- Extract ALL inline `backgroundImage`, `backgroundColor`, `borderColor` into CSS custom properties or Tailwind classes
- Move LED dot animation parameters into CSS custom properties (already partially done with `--led-duration`, `--led-delay` — extend this pattern)
- Move light-ray parameters similarly

### 2.2 Button System
**Current state:** Buttons are re-implemented inline everywhere with duplicate Tailwind classes. No shared button component beyond the basic shadcn one.

**Fix:**
- Create a proper `<Button>` component with variants:
  - `primary` — filled cyan, dark text, glow hover
  - `secondary` — outline, white/10 border
  - `ghost` — no border, hover reveal
  - `link` — text-only with arrow
- Add `size` prop: `sm`, `md`, `lg`
- Add `icon` support (leading/trailing)
- Add loading state with spinner
- All existing buttons refactored to use this single component

### 2.3 Card System
**Current state:** Cards use `.gradient-border-card` class with `::before` pseudo-element. Inconsistent across product cards, service cards, etc.

**Fix:**
- Create a `<Card>` component with variants:
  - `default` — gradient border, dark bg, lift hover
  - `elevated` — subtle shadow, no gradient border
  - `interactive` — clickable, full hover treatment
- Card should accept `imageUrl`, `badge`, `title`, `description`, `footer` slots
- Product cards, service cards, industry cards, project cards should ALL use this

### 2.4 Section Wrapper
**Current state:** Every section manually repeats `py-20 sm:py-28`, `max-w-7xl mx-auto px-4 sm:px-6 lg:px-8`, background divs.

**Fix:**
- Create a `<Section>` component:
  - `variant`: `dark` (default #06090F), `darker` (#04070D), `elevated` (#0A101A)
  - `id`: for scroll-to navigation
  - `container`: boolean (default true)
  - `backgroundGlow`: optional glow orb position (left/right/center)
- This eliminates ~500 lines of repeated layout markup

### 2.5 Typography Components
- Create `<Heading>` component: `level` (h1-h4), `gradient` boolean, `align`
- Create `<Badge>` component: the `text-[10px] font-mono tracking-[0.3em] uppercase` pattern used 15+ times across the site
- Create `<SectionLabel>`: the `w-6 h-px bg-primary/30` + label pattern repeated everywhere

---

## PHASE 3 — PAGE-BY-PAGE POLISH

### 3.1 HomePage
**Current state:** Hero is strong. Below the fold needs work — the CTA and content sections feel disconnected.

**Upgrade:**
- **Hero:** Keep the blueprint grid, LED dots, light rays. Add a slow parallax on the light rays on scroll. The "ENGINEERED" gradient text should have a subtle animated shimmer.
- **Services strip:** The 4-capability row (Design → Specification → Value Engineering → Supply) should have animated connecting lines with a `circuit-draw` animation — visually showing the "complete solution" flow.
- **Product categories preview:** Add a horizontal scroll with snap points on mobile, showing 3-4 featured categories with large images.
- **Trust/Stats bar:** Add animated counters for: "500+ Projects", "8-Year Guarantees", "Nationwide Coverage", "B-BBEE Level 2"
- **Testimonials/Projects:** Add a carousel or masonry of project images with hover overlays showing project name and sector.
- **CTA section:** The "Bring LumenX into the project" section should have the particle button from kokonutui, not a standard button.

### 3.2 ProductsPage & ProductDetailPage
**Current state:** Category cards with images. Product detail shows spec tables.

**Upgrade:**
- **Category cards:** Larger images (h-64 instead of h-52). Add a subtle tilt effect on hover (3D card). Each card should have a unique accent color from the expanded palette.
- **Product detail:** Spec tables should use a styled `<table>` or definition list with alternating row colors, not plain text. Add a "Download Datasheet" button that's prominent.
- **Product images:** Add a lightbox/gallery for product images. Add a "technical drawing" toggle view.
- **Filtering:** Add category filter chips at the top that animate between categories.

### 3.3 ServicesPage
**Current state:** Inherits from data. Likely a list of service cards.

**Upgrade:**
- Each service should have an icon illustration (use Lucide icons or custom SVG).
- Add a "How we work" process timeline with numbered steps and animated progress line — use the existing `ProcessStep` data.
- Add a "Service guarantee" callout box with the warranty/support promise.

### 3.4 ProjectsPage (ProjectsPageWrapper)
**Upgrade:**
- Masonry grid layout for project images with varying aspect ratios.
- Hover overlay with: project name, sector, location, year.
- Filter by sector (Commercial, Industrial, Retail, etc.).
- Lightbox for full-size images.

### 3.5 AboutPage
**Upgrade:**
- Team section (if data exists) with hover-reveal bios.
- Timeline of company milestones.
- Values displayed as large typography blocks with animated reveals.
- Compliance & certifications shown as a grid of badges.

### 3.6 ContactPage
**Upgrade:**
- Contact form with proper validation, floating labels, and a success animation.
- Map or coverage area visualization.
- Quick-contact cards: Email, Phone, Projects Email — each with icon and copy-to-clipboard.
- "Typical response time: within 24 hours" trust indicator.

### 3.7 ResourcesPage
**Upgrade:**
- Resource cards with file type icons (PDF, IES, DWG).
- Search/filter by resource type.
- Download counter or "popular" badge.

---

## PHASE 4 — ANIMATION & MICRO-INTERACTION SYSTEM

### 4.1 Scroll-Triggered Reveals
**Current state:** Some `whileInView` animations on the Products page. No systematic approach.

**Upgrade:**
- Create a `<Reveal>` wrapper component that handles all scroll-triggered animations:
  - `direction`: `up`, `down`, `left`, `right`
  - `distance`: `sm`, `md`, `lg`
  - `delay`: number (stagger children)
  - `once`: boolean
- Apply to every section on every page for consistent entrance animations
- Use `useReducedMotion()` to respect user preferences

### 4.2 Hover States
**Current state:** Cards lift 3px. Buttons have sliding overlay. Links change color.

**Upgrade:**
- **Cards:** Lift + glow intensifies + border color shifts to primary
- **Buttons:** Primary gets a ripple effect on click. Outline gets a fill-from-left animation.
- **Nav links:** Subtle underline animation that slides in from left
- **Images:** Slow zoom (scale 1.05) with brightness increase
- **Icons:** Subtle pulse on hover for interactive icons

### 4.3 Page Transitions
**Current state:** No page transitions between routes.

**Upgrade:**
- Add a page transition wrapper using Motion's `AnimatePresence`:
  - Fade up + blur out on exit
  - Fade down + blur in on enter
  - Duration: 400ms, ease: cubic-bezier(0.16, 1, 0.3, 1)

### 4.4 Lighting-Specific Animations
**Current state:** LED dots, light rays, neon glow. Good start.

**Upgrade:**
- **Light bloom on CTA buttons:** Cursor position tracks a radial glow that follows the mouse
- **Product cards:** Subtle light sweep across the card on hover (diagonal shine)
- **Data/spec reveal:** Numbers count up when they scroll into view
- **Circuit traces:** The blueprint grid lines could animate in a wave pattern on the hero
- **Color temperature toggle:** On product pages, a CCT slider (3000K→4000K→6000K) that warms/cools a demo area

---

## PHASE 5 — RESPONSIVE DESIGN & ACCESSIBILITY

### 5.1 Responsive Audit
- Test every page at: 375px, 768px, 1024px, 1440px, 1920px
- Fix any horizontal overflow
- Ensure touch targets are ≥44px on mobile
- Mobile nav should have a smooth slide-in drawer with backdrop blur
- Tables (spec sheets) should scroll horizontally on mobile with a gradient fade indicator

### 5.2 Accessibility (WCAG 2.1 AA)
- Add `aria-label` to all interactive elements
- Add `role` attributes where semantic HTML isn't enough
- Ensure focus states are visible on all interactive elements (not just `:focus-visible` outlines — design custom focus rings that match the brand)
- Add `alt` text to all images (product images, project images, logo)
- Add skip-to-content link
- Ensure the mobile menu traps focus when open
- Test with keyboard navigation (Tab, Enter, Escape)
- Add `aria-current="page"` to active nav links
- Ensure color is not the only differentiator (icons + text, not just color changes)

### 5.3 Performance
- Lazy load all images with `loading="lazy"` and blur-up placeholder
- Use `decoding="async"` on below-fold images
- Add `fetchpriority="high"` to hero/above-fold images
- Preload the heading font (Outfit)
- The product images in `product-images/` and `public/` folders should be optimized (WebP format, responsive srcset)
- Add a `<link rel="preload">` for the logo image
- Ensure Motion animations use `will-change` sparingly and only where needed

---

## PHASE 6 — CONTENT & SEO

### 6.1 Metadata
- Add proper `<title>` per page (not just "React Example")
- Add `<meta name="description">` per page using content from SITE-CONTENT.md
- Add Open Graph tags for social sharing
- Add `robots.txt` and `sitemap.xml` generation
- Add structured data (JSON-LD) for: Organization, Product, FAQ

### 6.2 Content Polish
- Review all copy against SITE-CONTENT.md for consistency
- Ensure the "8-year guarantee" messaging is prominent (it's a key differentiator)
- Add social proof: "Trusted by leading developers, consultants, and contractors across South Africa"
- The compliance bar should be more prominent — it's a key trust signal

---

## PHASE 7 — FINAL QUALITY GATES

Before declaring the upgrade complete, verify:

- [ ] Every page has a unique, descriptive `<title>`
- [ ] No inline `style={{}}` remains except for truly dynamic values (animation delays, positions)
- [ ] No `text-[11px]`, `text-[13px]` — all map to type-scale tokens
- [ ] All buttons use the shared `<Button>` component
- [ ] All cards use the shared `<Card>` component
- [ ] All sections use the shared `<Section>` component
- [ ] Every image has `alt` text
- [ ] Keyboard navigation works on all pages
- [ ] Mobile menu opens/closes with proper focus management
- [ ] Scroll animations respect `prefers-reduced-motion`
- [ ] No console errors or warnings
- [ ] The site builds without TypeScript errors (`npm run lint`)
- [ ] Lighthouse score ≥ 90 on Performance, Accessibility, Best Practices, SEO
- [ ] The site feels like a $50K+ agency build, not a template

---

## EXECUTION INSTRUCTIONS FOR THE AI AGENT

1. **Start with Phase 0** — read every file listed. Do not skip this. You cannot improve what you don't understand.
2. **Work through phases 1→7 in order.** Each phase builds on the previous. Do not jump ahead.
3. **After each phase, run `npm run lint`** to catch TypeScript errors early.
4. **After each phase, run `npm run dev`** and visually verify in the browser.
5. **Commit after each completed phase** with a descriptive message (e.g., `feat: Phase 1 — design system upgrade`).
6. **Use the shadcn skill** for any component that exists in shadcn/ui (buttons, cards, dialogs, etc.).
7. **Use the ui-ux-pro-max skill** for design decisions — color palettes, font pairings, spacing rhythms, style direction.
8. **Use the frontend-design skill** for implementing polished, distinctive UI patterns.
9. **Use the web-design-guidelines skill** to audit accessibility, responsiveness, and UX after Phase 5.
10. **Use the claude-design skill** if any page needs a creative design direction (hero, product showcase, about page).
11. **Higgsfield MCP:** Use for generating or refining any image assets — product hero images, background textures, gradient treatments, or decorative elements. If product images need enhancement (consistent lighting, background removal, professional framing), use Higgsfield.

---

## PROJECT FILES REFERENCE

```
/Users/altus/Documents/lumenx-lighting/
├── SITE-CONTENT.md          # All copy & specs
├── src/
│   ├── data.ts              # Structured data
│   ├── types.ts             # TypeScript interfaces
│   ├── index.css            # Design tokens & animations
│   ├── App.tsx              # Routes & layout
│   ├── lib/utils.ts         # Utility functions (cn, etc.)
│   └── components/
│       ├── HomePage.tsx
│       ├── HeroSection.tsx
│       ├── Header.tsx
│       ├── Footer.tsx
│       ├── ProductsPage.tsx
│       ├── ProductDetailPage.tsx
│       ├── ServicesPage.tsx
│       ├── ProjectsPageWrapper.tsx
│       ├── ResourcesPage.tsx
│       ├── AboutPage.tsx
│       ├── ContactPage.tsx
│       ├── CTASection.tsx
│       ├── CompleteSolutionSection.tsx
│       ├── ComplianceSection.tsx
│       ├── ContactSection.tsx
│       ├── FAQSection.tsx
│       ├── HowWeWorkSection.tsx
│       ├── OverviewSection.tsx
│       ├── PortfolioSection.tsx
│       ├── ProductCategoriesSection.tsx
│       ├── ProjectsSection.tsx
│       ├── ServicesSection.tsx
│       ├── WhoWeWorkWithSection.tsx
│       ├── WhyLumenXSection.tsx
│       ├── animations/       # Custom animation components
│       ├── kokonutui/        # Third-party UI components
│       └── ui/               # shadcn/ui components
├── product-images/           # Product photography
├── public/
│   ├── datasheets/
│   └── downloads/
│       ├── ies/
│       └── specs/
├── components.json           # shadcn config
├── package.json
├── tsconfig.json
└── vite.config.ts
```
