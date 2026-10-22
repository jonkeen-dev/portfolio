export type ProjectLink = {
  label: string;
  href: string;
};

export type Project = {
  slug: string;
  title: string;
  summary: string;
  /** When false, omitted from home, projects index, sitemap, and public routes. */
  published: boolean;
  /** Prefer on the homepage featured strip when published. */
  featured?: boolean;
  tags: string[];
  /** Optional scannable chips under the summary. */
  highlights?: string[];
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
      "Personal portfolio built from scratch with Next.js — dual themes, case studies, and a deployment story I own end to end.",
    published: true,
    featured: true,
    tags: ["Next.js 16", "React 19", "TypeScript", "Tailwind CSS v4", "Vercel"],
    highlights: ["Dark AAA / light AA contrast", "Shipped on custom domain"],
    problem:
      "Moving from retail ops and business analysis into engineering, I needed a portfolio that felt like me — not a template, and not a bluff about ten years of pro coding.",
    constraints:
      "Next.js, Tailwind v4, and React were mostly new. I needed a reliable dark/light toggle, accessible UI, and a clean deploy with a custom domain while still finding my voice.",
    decisions:
      "App Router with server components by default; client only where interactivity required. next-themes + CSS variables + Tailwind `@theme inline` for runtime theming. Geist + lean primitives for accessibility.",
    results:
      "Live on Vercel with a custom domain, solid contrast in both themes, and a case-study format future projects can reuse. The site feels authored, not customized.",
    learned:
      "`@theme inline` is required for live theme switching in Tailwind v4; ThemeProvider placement matters. Shipping imperfect, real work taught more than waiting to feel ready.",
    links: [
      { label: "Live site", href: "https://www.jonkeen.dev" },
      { label: "GitHub", href: "https://github.com/jonkeen-dev/portfolio" },
    ],
  },
  {
    slug: "paletteforge",
    title: "PaletteForge",
    summary:
      "Warhammer 40k painting companion for planning harmonious palettes and paint journeys.",
    published: false,
    featured: false,
    tags: ["React", "TypeScript", "Node.js", "PostgreSQL", "Tailwind CSS"],
    highlights: ["Full-stack MVP", "Color-theory driven"],
    problem:
      "Painters juggle tutorials and trial-and-error to get cohesive schemes. General color tools miss hobby-specific layering, highlighting, and approximate paint matches.",
    constraints:
      "Solo side project with a tight MVP window. Browser performance for color interactions mattered more than 3D previews or community features. No premium APIs; stay accessible and IP-respectful with approximate paint mappings.",
    decisions:
      "Harmony-based color wheel with algorithmic suggestions (not ML). React + TypeScript on the client for instant feedback; Node/Express + PostgreSQL for saved schemes. Scope locked to palette planning first.",
    results:
      "MVP generates harmonious palettes with layering tips and paint approximations. Proof of end-to-end ownership — kept unpublished on this site until demo-ready.",
    learned:
      "HSV/RGB math and TypeScript pay off in interactive UIs. Tight scope beats feature sprawl. Clear trade-offs read better to recruiters than long claims without a live demo.",
    links: [{ label: "GitHub", href: "https://github.com/jonkeen-dev/PaletteForge" }],
  },
];

export function getPublishedProjects(): Project[] {
  return projects.filter((p) => p.published);
}

export function getFeaturedProjects(): Project[] {
  return getPublishedProjects().filter((p) => p.featured);
}

export function getProjectBySlug(slug: string): Project | undefined {
  return projects.find((p) => p.slug === slug);
}

export function getPublishedProjectBySlug(slug: string): Project | undefined {
  const project = getProjectBySlug(slug);
  return project?.published ? project : undefined;
}
