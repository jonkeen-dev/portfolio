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
      "A developer portfolio built on Next.js 16 and React 19, with a custom dual-theme system and semantic design tokens.",
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
      "I needed a portfolio that would read as credible to technical recruiters while being honest about my path; 20 years of retail operations and business analysis before making the shift into software engineering. Most portfolio templates either undersell experience or oversell polish. I wanted something that demonstrated real engineering judgment, not just a theme swap on a starter kit.",
    constraints:
      "Next.js 16 shipped with breaking API changes from versions 13–15, and the only reliable documentation lives in node_modules. Tailwind v4 introduced a CSS-first configuration model that replaced the traditional JavaScript config file. The site needed flicker-free dark/light theming with no layout shift on initial load, and had to deploy cleanly on Vercel with a custom domain routed through Cloudflare.",
    decisions:
      "I chose the App Router with server components as the default rendering strategy; client components only where hooks or interactivity require them. The theming system uses a three-layer approach: next-themes manages the class toggle on the HTML element, CSS custom properties define the actual color values per mode, and Tailwind's @theme inline directive maps those properties to utilities at runtime. Semantic token names like foreground-secondary and accent-bright replace scattered dark: variants, so every component themes automatically. Geist is the typeface, and shadcn/ui provides accessible primitives.",
    results:
      "The site is live on Vercel with a custom domain, fully themed dark and light toggle, accessible navigation with scroll-aware glass effect, a themed 404 page, and a contact footer with icon links. The case study infrastructure is in place and rendering real content. Both color palettes pass WCAG AA for all text combinations, with dark mode reaching AAA.",
    learned:
      "The @theme inline directive in Tailwind v4 is load-bearing. Plain @theme freezes variable values at build time, which silently breaks runtime theme switching. Next.js 16 genuinely requires reading the source documentation before writing code; assumptions from earlier versions led to subtle bugs. Semantic color tokens scale much better than sprinkling dark: variants across components. And where you place ThemeProvider in the render tree determines what themes and what doesn't — anything outside it renders un-themed, which caught me on the 404 page until I restructured the layout.",
    links: [
      { label: "Live site", href: "https://jonkeen.dev" },
      { label: "GitHub", href: "https://github.com/0xStatiK/portfolio" },
    ],
  },
];
