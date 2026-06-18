# Phase 4 Plan — Polish + Portfolio Expansion

Created: 2026-05-27
Capacity: 5-10 hours/week

---

## Decisions made

- **Page transitions**: deferred. Not a priority while the site is actively shared.
- **OG image style**: minimal dark branded — one static image site-wide. Dark bg (#050d10), "jonkeen.dev", "Jon Keen", "Software Engineer", cyan accent line. Clean, recognizable, low maintenance. Design approach TBD: static asset (`public/og.png`) vs. dynamic `ImageResponse` via Next.js `opengraph-image.tsx` route convention.
- **Headshot on About page**: deferred. No photo available yet.
- **New project direction**: retail analytics tool — backend/SQL-heavy, leverages 20 years of retail domain knowledge.
- **PaletteForge case study**: writing now with real content. Tone: lead with the personal hook (painting is hard, wanted to help players), let the planning and architecture emerge as evidence of seriousness. Human and down to earth, not overly technical.

---

## Sequencing

### Step 1 — PaletteForge case study rewrite

**Effort:** 1 session
**Files:** `lib/projects.ts` (update PaletteForge entry)

Replace lorem ipsum with real case study content. Jon provided detailed README notes:

- **Tech stack:** SvelteKit + TypeScript, Tailwind CSS 4.1, Supabase (PostgreSQL), Drizzle ORM, Cloudflare Pages
- **Scope:** 700+ paints from top 3 manufacturers, 30+ curated faction palettes, OAuth (Google/GitHub), custom palette builder, shopping lists, import/export codes
- **Database:** 10+ tables (manufacturers, paint_types, paints, paint_equivalents, factions, palettes, palette_colors, palette_ratings, saved_palettes, shopping_lists, palette_export_codes)
- **Planning:** comprehensive docs created Oct 2025 — implementation plan (6 phases, 140-144 hours), schema design, data sourcing strategy, frontend/backend architecture, integration patterns, business plan
- **Current status:** backend largely complete, frontend design/build is the remaining work

**Tone guidance (from Jon):**

- Painting miniatures can be challenging. The idea was to create an app that helps players pick or create their own color schemes.
- Trying to solve a real problem, grow skills, and maybe make something from it long-term.
- Keep it human and down to earth. Not overly technical — Jon is good at planning and organizing thoughts to maximize potential.
- Frame SvelteKit as stack breadth (different framework from the portfolio's Next.js).

### Step 2 — OG image + SEO meta tags

**Effort:** 1-2 hours
**Files:** `app/layout.tsx` (metadata), OG image (either `public/og.png` static asset or `app/opengraph-image.tsx` dynamic route)

- Design a 1200x630 OG image: dark bg (#050d10), "jonkeen.dev" in Geist font, "Jon Keen / Software Engineer", cyan (#67e8f9) accent line.
- Add `openGraph` and `twitter` metadata to root layout.
- Add per-page `title` and `description` metadata where missing.
- Verify with LinkedIn Post Inspector and Twitter Card Validator after deploy.

### Step 3 — Mobile testing pass

**Effort:** 1-2 hours

- Test on real iOS and Android devices (or BrowserStack/responsive mode).
- Check: touch targets (min 44px), text readability, nav hamburger behavior, card layouts, footer spacing, theme toggle, roadmap filters.
- Fix any issues found.

### Step 4 — Lighthouse audit

**Effort:** 1-2 hours

- Run Lighthouse on all routes: `/`, `/about`, `/projects`, `/projects/jonkeen-dev`, `/projects/paletteforge`, `/roadmap`.
- Target: green scores (90+) across Performance, Accessibility, Best Practices, SEO.
- Common fixes: image optimization, missing alt text, color contrast, font loading, meta tags.

### Step 5 — Retail analytics project (new)

**Effort:** multi-week (scoping below, build in a separate repo)

See "Retail Analytics Project — Scoping Notes" section below.

Once built:

- Add case study entry to `lib/projects.ts`
- Create route at `app/projects/retail-analytics/page.tsx` (or whatever the slug ends up being)
- Add to roadmap items

---

## Retail Analytics Project — Scoping Notes

**Concept:** A backend-heavy analytics tool that ingests retail sales/inventory data and exposes analytical endpoints. Demonstrates SQL depth (window functions, CTEs, time-series aggregations) and API design. Ties directly into Jon's 20-year retail background — this isn't a tutorial project, it's built from real domain knowledge.

**Suggested tech stack:**

- Node.js + TypeScript (or Python/FastAPI — TBD based on preference)
- PostgreSQL (raw SQL queries, not hidden behind an ORM — the SQL IS the portfolio piece)
- Simple REST API (Express/Fastify or FastAPI)
- Optional: lightweight dashboard frontend to visualize query results

**Data model (draft):**

- `stores` — location info, region, type
- `products` — SKU, category, subcategory, unit cost
- `sales_transactions` — store_id, product_id, quantity, revenue, timestamp
- `inventory_levels` — store_id, product_id, quantity_on_hand, snapshot_date

**SQL features to showcase:**

- Window functions: running totals, moving averages, rank by store/category
- CTEs: multi-level category rollups, period-over-period comparisons
- Time-series: daily/weekly/monthly aggregations, seasonal trend detection
- Joins: cross-store comparisons, inventory vs. sales velocity
- Maybe: materialized views for dashboard performance

**Seed data:** generate realistic synthetic data (10 stores, 500 products, 100k+ transactions over 2 years). A seed script is part of the deliverable.

**API endpoints (draft):**

- `GET /sales/trends` — time-series sales by period, filterable by store/category
- `GET /sales/top-products` — ranked by revenue/quantity with window functions
- `GET /inventory/velocity` — days-of-supply calculation per product per store
- `GET /stores/compare` — side-by-side performance metrics
- `GET /reports/seasonal` — year-over-year seasonal patterns

**Portfolio story:** "I spent 18 years watching stores run on spreadsheets and gut feel. This is what I'd build if I could hand a store manager one dashboard."

**Phases:**

1. Schema design + seed data generation
2. Core analytical queries (the SQL portfolio pieces)
3. REST API layer
4. Documentation + case study writeup
5. Optional: simple frontend dashboard

---

## What's NOT in Phase 4

- Page transitions (deferred — nice-to-have, not urgent while site is being shared)
- Typography polish (still Exploring on roadmap — revisit after Lighthouse)
- Contact form / Supabase integration (Phase 5)
- Blog / writing section (not planned)
- Activity feed (not planned)
- Headshot on About (waiting on photo)
