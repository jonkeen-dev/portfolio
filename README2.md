# portfolio

Claude is assisting with planning, ideas are original to me.

Folder/File Structure

jonkeen.dev/
├── app/ # Next.js App Router pages
│ ├── page.tsx # Home
│ ├── projects/
│ ├── writing/
│ ├── about/
│ └── layout.tsx
├── components/
│ ├── ui/ # shadcn/ui components live here
│ └── [custom]/ # Your own components
├── content/
│ ├── projects/ # MDX files — one per project case study
│ └── writing/ # MDX files — your technical posts
├── lib/ # Utility functions, MDX helpers
├── public/ # Static assets, resume PDF
├── styles/
└── README.md # Don't neglect this — it's part of the portfolio

Refined Phase Plan
Your original phases were solid. Here's a version with tighter scope so each phase has a clear "done" state:
Phase 1 — Skeleton (Do this first, deploy immediately)
Goal: Live site on Vercel before any real content exists.

Next.js + TS + Tailwind + shadcn/ui initialized
Nav, footer, placeholder pages
Dark/light mode toggle working
Pushed to GitHub → auto-deployed to Vercel
Custom domain connected via Cloudflare

Phase 2 — Core Content
Goal: A recruiter or curious person can get the full picture.

Hero section with positioning statement
2–3 project case studies (use the full structure: problem → constraints → decisions → results → learned)
About page
Resume as downloadable PDF
Contact (simple mailto: link is fine to start)

Phase 3 — Writing System
Goal: First technical post is live.

MDX pipeline set up
/writing page with post listing
Tags working
Syntax highlighting
First post published (suggestion: "Moving From Process Analysis to Software Development" — that's your story, write it first)

Phase 4 — Polish
Goal: The site feels as good as it looks.

Framer Motion on page transitions and card hovers
Typography tightened up
OG images for social sharing
SEO meta tags
Lighthouse audit — aim for green across the board
Mobile tested on real device

Phase 5 — Production App (Future, No Deadline)
Goal: The portfolio becomes something you could demo as a project itself.

Supabase integration
Contact form with DB storage
Admin view (private) — see who's visiting what
Possibly: project view counter, newsletter, or CMS for writing
