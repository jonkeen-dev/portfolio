# jonkeen.dev

My personal portfolio site — a place to share projects and what I'm learning along the way.

## Design philosophy

Minimal and beautiful.

## Stack

- **Framework:** Next.js 16 (App Router) · React 19 · TypeScript
- **Styling:** Tailwind CSS v4 · `next-themes`
- **Motion:** Framer Motion
- **Tooling:** ESLint · Prettier
- **Hosting:** Vercel · Cloudflare DNS

## Structure

```text
portfolio/
├── app/              # Pages, layout, and metadata
├── components/
│   ├── layout/       # Nav, footer
│   ├── sections/     # Case study and page sections
│   └── motion/       # Shared motion wrappers
├── lib/              # Project and roadmap data helpers
└── public/           # Static assets (resume, etc.)
```

## Status

Active early-stage build. Work lands on `dev` first, then `main` for production.

## Credits

Built by Jon Keen.
