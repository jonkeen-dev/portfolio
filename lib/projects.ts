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
      "Miniature painters in the Warhammer 40k community often struggle to create cohesive color schemes. While general tools exist, none effectively combine an interactive color wheel with hobby-specific guidance for layering, shading, highlighting, and real paint equivalents from Citadel or Army Painter ranges. Hobbyists end up relying on scattered tutorials, forums, or manual trial-and-error, leading to inconsistent results, wasted paint, and schemes that clash under real lighting. PaletteForge addresses this gap by providing a dedicated web app where users start with a base color or faction theme and receive intelligent, harmonious palette suggestions grounded in color theory.",
    constraints:
      "As a solo side project, development time was limited to a few focused weeks to reach a viable MVP without scope creep. I worked with a full-stack setup (React, TypeScript, Node.js, PostgreSQL, Tailwind CSS) but prioritized browser performance for smooth color interactions over advanced features. Additional constraints included no budget for premium APIs, maintaining accessibility and responsiveness across devices, respecting IP by using approximate paint mappings, and ensuring the tool felt intuitive for both beginners and experienced painters.",
    decisions:
      "I built an interactive color wheel using standard harmony rules (complementary, analogous, triadic, etc.) with real-time previews and paint suggestions driven by algorithmic color math rather than heavy ML. The frontend uses React + TypeScript for type-safe calculations and rich interactions, while a Node.js/Express backend with PostgreSQL handles saving schemes and user progress. Key trade-offs included focusing on core planning tools first (palette generation and journey tracking) over 3D model previews or community features, and keeping most logic client-side for instant feedback while using the database for persistence.",
    results:
      "The MVP successfully delivers dynamic, harmonious palettes tailored to Warhammer 40k painting, complete with layering tips and paint approximations. It is performant, responsive, and deployed with solid UX, allowing users to plan full painting journeys from base coat to highlights. This project demonstrated end-to-end ownership—from color theory implementation to full-stack integration—and significantly streamlined my own miniature painting workflow, serving as a strong full-stack example in my portfolio.",
    learned:
      "Implementing color theory algorithms deepened my understanding of HSV/RGB manipulation and performance optimization in interactive UIs. The project reinforced the value of tight scoping in solo work and how TypeScript catches subtle errors in math-heavy domains early. From a product perspective, I learned that hobby tools succeed by reducing friction while preserving depth, and that clear documentation of decisions and trade-offs makes technical work more credible to recruiters. This experience further strengthened my ability to ship reliable systems under real-world constraints.",
    links: [{ label: "GitHub", href: "https://github.com/jonkeen-dev/PaletteForge" }],
  },
];
