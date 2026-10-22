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
      "My personal portfolio, built from scratch with Next.js — light and dark themes, short case studies, and a live site I deploy myself.",
    published: true,
    featured: true,
    tags: ["Next.js 16", "React 19", "TypeScript", "Tailwind CSS v4", "Vercel"],
    highlights: ["Works well in light and dark mode", "Live on my own domain"],
    problem:
      "I was moving from retail and business analysis into engineering. I needed a portfolio that felt like me — not a generic template, and not a resume that pretended I had a decade of pro coding behind me.",
    constraints:
      "Next.js, Tailwind, and React were mostly new. I still needed a solid light/dark switch, an accessible layout, and a clean way to ship the site on a custom domain.",
    decisions:
      "I used the App Router and kept most pages as server components. Client code only shows up where the page needs to be interactive. Themes use next-themes with CSS variables so the colors update live. I kept the design simple and readable.",
    results:
      "The site is live with a custom domain. Both themes are easy to read, navigation stays usable, and new projects can follow the same short case-study format. It feels like something I built, not something I only customized.",
    learned:
      "Theme setup is picky — where the theme provider sits, and how Tailwind maps the colors, both matter. More than anything, shipping something real taught me faster than waiting until everything felt perfect.",
    links: [
      { label: "Live site", href: "https://www.jonkeen.dev" },
      { label: "GitHub", href: "https://github.com/jonkeen-dev/portfolio" },
    ],
  },
  {
    slug: "paletteforge",
    title: "PaletteForge",
    summary:
      "A helper for Warhammer 40k painters to plan color schemes and painting steps.",
    published: false,
    featured: false,
    tags: ["React", "TypeScript", "Node.js", "PostgreSQL", "Tailwind CSS"],
    highlights: ["Full-stack practice project", "Built around color theory"],
    problem:
      "Painters often bounce between tutorials and trial-and-error to get colors that work together. General color tools rarely cover hobby needs like layering, highlights, or close paint matches.",
    constraints:
      "It was a solo side project with a short window for a first version. Smooth color picking in the browser mattered more than 3D previews or social features. I also had no budget for paid APIs.",
    decisions:
      "I built a color wheel that suggests related colors using simple rules, not machine learning. Most of the feedback happens right in the browser. A small backend saves schemes when someone wants to keep them. I kept the first version focused on planning palettes.",
    results:
      "The first version can suggest balanced palettes with layering tips and approximate paint matches. I am keeping it off this site until there is a clear demo to show.",
    learned:
      "Color math gets easier with TypeScript watching the details. A tight scope beats a long feature list. Clear trade-offs are more honest than big claims without something people can try.",
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
