# jonkeen.dev — Project Context & Design Decisions

## Project Overview

Personal portfolio for Jon Keen. The goal is a site that reads as credible to
recruiters and reflects the transition from 20 years of operational/BA work into
software engineering.

## Stack

- Next.js 16 (App Router) with Turbopack
- React 19
- TypeScript
- Tailwind CSS v4
- shadcn/ui
- next-themes
- Framer Motion (installed, used in Phase 4)
- Vercel deployment
- Custom domain via Cloudflare

## Phases

1. Skeleton — live on Vercel, custom domain, dark/light toggle, nav/footer scaffolded
2. Core Content — hero, projects, about, resume, contact _(current)_
3. Writing system — MDX pipeline, `/writing` page
4. Polish — Framer Motion, OG images, SEO, Lighthouse audit, high-contrast mode
5. Production app — Supabase, contact form with DB, admin view

---

## Current State (2026-05-19)

What exists:

- `app/layout.tsx` — root layout, Geist fonts via `next/font/google`, ThemeProvider configured (dark default, no system preference)
- `app/page.tsx` — placeholder ("Coming soon."), hero not built yet
- `app/globals.css` — Tailwind v4 + `@theme inline` mapping CSS vars, light/dark palettes
- `components/layout/nav.tsx` — sticky nav with scroll-triggered glass effect, theme toggle
- `components/layout/footer.tsx` — minimal footer placeholder
- `components/ui/button.tsx` — shadcn button
- `lib/utils.ts` — `cn()` helper

Empty / pending:

- `components/sections/` — directory exists; `hero.tsx`, `featured-projects.tsx` not written
- `lib/projects.ts` — `Project` type defined, `projects: Project[]` array empty pending case study authoring
- `app/about/page.tsx` — stub only ("Coming soon"); sectioned shape planned but not yet written
- `app/projects/page.tsx` — stub reading from `lib/projects.ts`; renders empty-state until data lands
- `app/projects/palletforge/page.tsx` — stub ("Case study coming soon")
- `content/projects/` — empty, MDX migration is Phase 3
- `public/resume.pdf` — not present

---

## Routing Architecture

- Homepage (`/`) is a single-page scroll experience
  - Sections: Hero, Featured Projects, About teaser, Contact
- Project cards and "See all projects" link to `/projects`
- Case studies live at `/projects/[slug]`
- `/about`, `/projects`, `/contact` are real separate pages
- `/writing` is Phase 3 — nav link exists but is visually dimmed

---

## Branding

- Wordmark: `jonkeen.dev`
- Rendered in nav as text in `accent-bright`
- No logo mark

---

## Hero Positioning

Headline (split across lines):

> I spent 20 years translating between business and technical systems.
> Now I'm building them myself.

Final line renders in accent color.

Subtext:

> Software Engineering student. Previously: business analysis, process design,
> and closing the gap between how software works and how people use it.

Hero eyebrow label: `Software Engineer`

CTAs:

- Primary: "View Projects" → `/projects`
- Secondary: "Download Resume" → `/resume.pdf` (new tab)

---

## Color System

### Philosophy

- Dark mode default, light mode via toggle
- Single accent per mode
- No decorative gradients in components; subtle glow reserved for hero

### Dark — "Deep Teal" (default)

```
--background:           #050D10
--background-secondary: #091518
--foreground:           #E0F4F8
--foreground-secondary: #7FB8C8
--foreground-muted:     #4A7A8A
--accent:               #0891B2
--accent-bright:        #22D3EE
--border:               #0891B2
```

### Light — "Off-white Indigo" (toggle)

```
--background:           #F8F7F5
--background-secondary: #EEECEA
--foreground:           #1A1A1A
--foreground-secondary: #3D3D4E
--foreground-muted:     #555564
--accent:               #4F46E5   (indigo-600)
--accent-bright:        #4338CA   (indigo-700 — darkened for contrast)
--border:               #1E1E2E   (near-black — visible at /15 opacity on light bg)
```

### Accessibility (WCAG)

- Dark mode: all combinations pass AAA (>= 7:1)
- Light mode primary text (#1A1A1A): passes AAA
- Light mode secondary text (#3D3D4E): ~8:1, passes AAA
- Light mode muted text (#555564): ~7:1, passes AA
- Light mode accent-bright (#4338CA) as text: ~8:1, passes AAA
- Palette safe for deuteranopia/protanopia
- High-contrast mode planned for Phase 4

---

## Typography

- Sans: Geist, loaded via `next/font/google`
- Mono: Geist Mono, same source
- CSS variables: `--font-geist-sans`, `--font-geist-mono`

(Earlier plan called for `next/font/local`; current implementation uses the
Google subset.)

---

## globals.css Structure (Tailwind v4)

```css
@import "tailwindcss";
@import "tw-animate-css";
@import "shadcn/tailwind.css";

@custom-variant dark (&:where(.dark, .dark *));

@theme inline {
  --color-background: var(--background);
  --color-background-secondary: var(--background-secondary);
  --color-foreground: var(--foreground);
  --color-foreground-secondary: var(--foreground-secondary);
  --color-foreground-muted: var(--foreground-muted);
  --color-accent: var(--accent);
  --color-accent-bright: var(--accent-bright);
  --color-border: var(--border);
  --font-sans: var(--font-geist-sans), system-ui, sans-serif;
  --font-mono: var(--font-geist-mono), monospace;
}

:root {
  /* light values */
}
.dark {
  /* dark values  */
}
```

`@theme inline` (not plain `@theme`) is required so Tailwind resolves the
variable references at runtime instead of freezing them at build time. Without
`inline`, toggling the theme class has no effect on utilities.

---

## Nav Component

- Fixed, full-width, content capped at `max-w-6xl mx-auto`
- Layout: wordmark (left), links (center), Resume + theme toggle (right)
- Glass effect: `backdrop-blur-md bg-background/75 border-b border-border/15`
- Glass only after `scrollY > 20`; transparent at top
- "Writing" link is dimmed (`text-foreground-muted`), Phase 3
- Theme toggle: pill with sliding dot
- `mounted` guard via `suppressHydrationWarning` to prevent next-themes mismatch

### Nav links

```
Projects  -> /projects
About     -> /about
Writing   -> dimmed, no href yet
Resume    -> /resume.pdf (target="_blank")
[toggle]
```

---

## ThemeProvider Setup (next-themes)

```tsx
<ThemeProvider
  attribute="class"
  defaultTheme="dark"
  enableSystem={false}
  disableTransitionOnChange
>
```

- `attribute="class"` adds `.dark` or `.light` to `<html>`
- `defaultTheme="dark"` is the initial state
- `enableSystem={false}` ignores OS preference
- `<html>` needs `suppressHydrationWarning`

---

## Component File Structure

```
app/
  layout.tsx              (root layout, ThemeProvider)
  page.tsx                (homepage)
  globals.css
  about/                  (empty - page.tsx pending)
  projects/
    page.tsx              (pending)
    palletforge/page.tsx  (pending)

components/
  layout/
    nav.tsx               ("use client")
    footer.tsx
  sections/               (empty - hero, featured-projects pending)
  ui/
    button.tsx

lib/
  projects.ts             (empty - data not authored)
  utils.ts

content/
  projects/               (Phase 3 MDX)
```

---

## Project Data Shape (lib/projects.ts)

Static TypeScript objects for Phase 2. MDX migration in Phase 3.

```ts
export type ProjectLink = {
  label: string;
  href: string;
};

export type Project = {
  slug: string;
  title: string;
  summary: string;
  tags: string[];
  problem: string;
  constraints: string;
  decisions: string;
  results: string;
  learned: string;
  links: ProjectLink[];
};
```

Case study order per project: Problem, Constraints, Decisions, Results, Learned.

Design note (2026-05-19): `image`, `date`, and `featured` were considered and deferred. Add them when there's an actual rendering need (homepage "Featured Projects" section, OG image generation, or chronological ordering).

---

## Design Language

Reference: Linear, Vercel, Stripe.

- Whitespace-heavy
- Muted base with a single accent
- No decorative elements except a subtle hero glow
- Restrained motion: nothing animates without a reason
- Clean, dashboard-inspired, not flashy

---

## About Page Shape

Decision (2026-05-19): sectioned layout (not long-form narrative).

Sections, in order:

1. **Now** — what you're currently doing (studying, building, learning).
2. **Background** — the 20-year translator-to-builder arc, condensed.
3. **Skills** — stack and tools you reach for.
4. **Contact** — how to get in touch.

Stub page currently renders "Coming soon" only. Real copy and section headings to be written in a later session.

---

## Open Items

- Build hero section in `app/page.tsx`
- Author `lib/projects.ts` with the first PalletForge case study (second project TBD)
- Write real About copy across the four sections
- Drop `resume.pdf` into `public/`
- Resolve duplicate readme files (`README.md` vs `README2.md`)
