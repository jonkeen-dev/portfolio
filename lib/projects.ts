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
      "After twenty years in retail operations and business analysis, I was moving into software engineering. I needed a portfolio that actually felt like me. Most templates looked too generic or too polished. I wanted to build something real that showed I could ship thoughtful work while being honest about my background. It had to feel believable to engineers without pretending I had ten years of professional coding experience.",
    constraints:
      "Next.js, Tailwind v4, and React were mostly new to me. I had only worked with JavaScript and TypeScript through The Odin Project. I also needed a working dark/light toggle that didn’t break layouts, and a simple way to deploy with a custom domain. At the same time I was still finding my voice as a developer.",
    decisions:
      "I chose the App Router and tried to use server components by default. I only made things client-side when I really needed interactivity. For theming I used next-themes with CSS variables and Tailwind’s @theme inline so the switch works at runtime. I picked Geist for the font and shadcn/ui for accessible building blocks.",
    results:
      "The site is live on Vercel with a custom domain. It works well in both light and dark mode and has simple, accessible navigation with a glass effect when you scroll. I also created the case study format you’re reading now so future projects have a consistent home. Both themes meet good contrast standards. Most importantly, it feels like something I actually built instead of just customized.",
    learned:
      "Tailwind v4’s @theme inline does a lot of the work for live theme switching. The regular @theme version breaks it. I also learned that where you place the ThemeProvider really matters — anything outside it won’t react to the toggle. Overall this project showed me that shipping something real, even when you’re still learning, teaches you more than trying to make it perfect from the start.",
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
