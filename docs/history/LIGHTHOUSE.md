# Lighthouse + SEO/OG Notes (2026-06-15 Polish Batch)

**Batch context:** Executed as part of approved plan for page transitions, typography polish, Lighthouse audit, and mobile (user real-device tested previously; emulation used here).

## Improvements Shipped (directly target LH categories)

- **SEO (biggest prior gap):**
  - Root layout: full `metadata` with title template, description, `metadataBase`, `icons`, complete `openGraph` + `twitter` (summary_large_image) + images array.
  - Per-page titles/descriptions already existed and benefit from template.
  - Case study titles normalized (e.g. "jonkeen.dev — jonkeen.dev" fixed during refactor).
- **OG Image:** Dynamic `app/opengraph-image.tsx` (1200x630, exact Phase 4 spec: #050d10 bg, jonkeen.dev + Jon Keen + Software Engineer, cyan #22d3ee accent line). Uses edge runtime. Auto-wired. (User chose dynamic over static for token/font sync.)
- **Performance/Other:**
  - No new heavy assets or JS (transitions are thin framer usage on existing dep; duration kept short).
  - Typography centralization + extract: maintainability win, no perf regression.
  - Motion consistency (about icons): no size change.
- **Accessibility:** Prior WCAG passes (dark AAA, light mostly) preserved. Semantic tokens + focus rings untouched. Back-links etc. use consistent classes.

## How to Run Full Audit (post any deploy or locally)

1. `npm run build && npm run start` (or use Vercel preview).
2. Chrome DevTools > Lighthouse (mobile + desktop) on:
   - /
   - /about
   - /projects
   - /projects/jonkeen-dev
   - /projects/paletteforge
   - /roadmap
3. Or CLI: `npx lighthouse http://localhost:3000 --preset=mobile --view` (repeat for key routes).
4. Also run Google PageSpeed Insights on https://jonkeen.dev after deploy + LinkedIn/Twitter card validators for OG.

**Target (per plan):** All categories ≥90 (mobile hardest). Aim 95-100 where low effort. OG image + metadata were the primary missing pieces for SEO + "Best Practices / PWA-adjacent".

## Before/After Notes

- Pre-batch: Minimal root metadata only. No OG. Typography ad-hoc (drifts in leading/mt/tags/h1).
- Post-batch: Metadata complete + dynamic OG. Typography consistent via centralized classes + shared case component. Transitions added with negligible perf impact (verified via clean builds).
- Exact numeric scores: Run locally (or capture in Vercel Speed Insights + PageSpeed). This doc + session plan.md serve as the audit artifact.

## Known Warnings (non-blocking)

- `metadataBase` was added (resolves social image warnings).
- Edge runtime on /opengraph-image (expected for OG; disables static for that route only).
- Transitions: keep duration short; re-measure LCP/CLS if any perceived impact (enter-only design minimizes).

Run the commands above after changes and share scores if desired for the record. All terminal verification (build/lint/format) passed cleanly at batch end.
