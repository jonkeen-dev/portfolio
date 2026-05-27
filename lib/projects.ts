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

export const projects: Project[] = [
  {
    slug: "jonkeen-dev",
    title: "jonkeen.dev",
    summary:
      "A personal developer portfolio built from scratch with Next.js, React, and a dual-theme system. I wanted something that felt like mine rather than another template.",
    tags: [
      "Next.js 16",
      "React 19",
      "TypeScript",
      "Tailwind CSS v4",
      "next-themes",
      "shadcn/ui",
      "Vercel",
    ],
    problem:
      "After twenty years in retail operations and business analysis, I am transitioning into software engineering and needed a portfolio that actually represented me. Most templates felt either too generic or overly polished in a way that didn’t match how I think and work. I wanted to build something real; something that showed I could ship thoughtful, production-grade work while being honest about where I was coming from. It needed to feel credible to technical people without pretending I had ten years of professional engineering experience under my belt.",
    constraints:
      "Next.js, Tailwind v4, and React were all mostly new to me. The only thing I had really worked with before was Javascript and Typescript during my time working through The Odin Project. I also wanted a toggle to properly switch dark/light theming that wouldn’t cause layout issues, and a clean deployment story with a custom domain through Cloudflare. On top of that, I'm still figuring out my own voice as a developer while building something public.",
    decisions:
      "I went with the App Router via Next.js and leaned heavily on server components, only reaching for client components when interactivity actually required it. For theming, I used next-themes to handle the class toggle, CSS custom properties define the actual values, and Tailwind’s @theme inline directive maps everything at runtime. I chose Geist as the typeface and shadcn/ui for accessible primitives.",
    results:
      "The site is live on Vercel with a custom domain, works cleanly in both dark and light mode, and has accessible navigation with a scroll-aware glass effect. I also built out the case study system you’re reading right now so future projects have a consistent home. Both themes pass WCAG AA, with dark mode hitting AAA on text contrast. Most importantly, I ended up with something that feels like mine instead of something I just customized.",
    learned:
      "The @theme inline directive in Tailwind v4 is doing a lot of heavy lifting. Using the regular @theme directive silently breaks runtime theme switching. ThemeProvider placement matters more than I initially realized, anything rendered outside of it just stays un-themed. Overall, this project reinforced that building something real, even with gaps in my knowledge, teaches you more than trying to make everything look perfect from the start.",
    links: [
      { label: "Live site", href: "https://www.jonkeen.dev" },
      { label: "GitHub", href: "https://github.com/jonkeen-dev/portfolio" },
    ],
  },
  {
    slug: "paletteforge",
    title: "PaletteForge",
    summary:
      "A Warhammer 40k miniature painting webapp that assists with planning and suggesting various colors used during your painting journey.",
    tags: ["React", "TypeScript", "Node.js", "PostgreSQL", "Tailwind CSS"],
    problem:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.",
    constraints:
      "Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.",
    decisions:
      "Ut enim ad minima veniam, quis nostrum exercitationem ullam corporis suscipit laboriosam, nisi ut aliquid ex ea commodi consequatur. Quis autem vel eum iure reprehenderit qui in ea voluptate velit esse quam nihil molestiae consequatur.",
    results:
      "Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt. Neque porro quisquam est, qui dolorem ipsum quia dolor sit amet.",
    learned:
      "At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis praesentium voluptatum deleniti atque corrupti quos dolores et quas molestias excepturi sint occaecati cupiditate non provident.",
    links: [{ label: "GitHub", href: "https://github.com/jonkeen-dev/PaletteForge" }],
  },
];
