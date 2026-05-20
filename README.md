# jonkeen.dev

My personal portfolio and writing site to document my projects and learnings as I weave through this incredible maze.

## Design philosophy

Minimal, content-first, quietly considered. Type and whitespace do the work; motion and color are accents, not decoration. The site should load instantly, read cleanly in either theme, and stay out of the way of the work it presents.

## Stack

- **Framework:** Next.js 16 (App Router) · React 19 · TypeScript
- **Styling:** Tailwind CSS v4 · shadcn/ui · `next-themes`
- **Motion:** Framer Motion
- **Tooling:** ESLint · Prettier
- **Hosting:** Vercel · Cloudflare DNS

## Structure

```
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

Built by Jon Keen. Planning and pair-programming assistance from Claude; ideas, decisions, and writing are original.
