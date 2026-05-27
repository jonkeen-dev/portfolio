# jonkeen.dev

My personal portfolio and writing site to document my projects and learnings as I navigate things.

## Design philosophy

Minimal and beautiful.

## Stack

- **Framework:** Next.js 16 (App Router) · React 19 · TypeScript
- **Styling:** Tailwind CSS v4 · shadcn/ui · `next-themes`
- **Motion:** Framer Motion
- **Tooling:** ESLint · Prettier
- **Hosting:** Vercel · Cloudflare DNS

## Structure

```text
portfolio/
├── app/              # Next.js App Router (pages, layout, not-found)
├── components/
│   ├── layout/       # Nav, footer, shell pieces
│   ├── sections/     # Page-level composed sections
│   └── ui/           # shadcn/ui primitives
├── content/
│   └── projects/     # Project case studies
├── lib/              # Utilities, data helpers
├── public/           # Static assets
└── docs/             # Working notes (gitignored)
```

## Status

Active early-stage build.

## Credits

Built by Jon Keen. Planning and pair-programming assistance from Claude.
