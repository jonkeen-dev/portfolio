export const STATUSES = ["Exploring", "Planned", "In Progress", "Done"] as const;

export type RoadmapStatus = (typeof STATUSES)[number];

export type RoadmapItem = {
  title: string;
  summary: string;
  project: string;
  status: RoadmapStatus;
  dateAdded: string;
};

export const roadmap: RoadmapItem[] = [
  {
    title: "Roadmap page",
    summary: "Public feature tracker with filterable status cards.",
    project: "jonkeen-dev",
    status: "Done",
    dateAdded: "2026-05-26",
  },
  {
    title: "UI development",
    summary: "Design and build the user interface.",
    project: "paletteforge",
    status: "Exploring",
    dateAdded: "2026-05-23",
  },
  {
    title: "Typography polish",
    summary:
      "Tighten up font sizing, spacing, and line-height across the site. (Standardized + centralized in globals.css and case study dupe extracted.)",
    project: "jonkeen-dev",
    status: "Done",
    dateAdded: "2026-05-22",
  },
  {
    title: "Case study content",
    summary: "Replace placeholder copy with the real project write-up.",
    project: "paletteforge",
    status: "Done",
    dateAdded: "2026-05-21",
  },
  {
    title: "Hover animations",
    summary:
      "Subtle spring-physics hover feedback on cards, nav links, and footer icons via Framer Motion.",
    project: "jonkeen-dev",
    status: "Done",
    dateAdded: "2026-05-20",
  },
  {
    title: "Page transitions",
    summary: "Add Framer Motion page transition animations between routes.",
    project: "jonkeen-dev",
    status: "Done",
    dateAdded: "2026-05-20",
  },
  {
    title: "Mobile device testing",
    summary:
      "Test and fix layout issues on mobile devices. (Emulation + prior real iOS/Android testing.)",
    project: "jonkeen-dev",
    status: "Done",
    dateAdded: "2026-05-19",
  },
  {
    title: "Lighthouse audit",
    summary:
      "Optimize for green scores across performance, accessibility, and best practices. (Includes OG/SEO metadata + dynamic opengraph-image.tsx. Full meta, title templates, and metadataBase added.)",
    project: "jonkeen-dev",
    status: "Done",
    dateAdded: "2026-05-18",
  },
  {
    title: "Hero glow",
    summary:
      "Add the subtle hero glow explicitly allowed in the design language (only decorative element permitted). Use existing accent tokens at low opacity, scoped to home hero only.",
    project: "jonkeen-dev",
    status: "Exploring",
    dateAdded: "2026-06-16",
  },
  {
    title: "Quantified impact & metrics layer",
    summary:
      "Light layer of scannable stats/impact highlights on cards and in case studies (WCAG, Lighthouse, workflow improvements, etc.). Enrich project data and rendering.",
    project: "jonkeen-dev",
    status: "Exploring",
    dateAdded: "2026-06-16",
  },
  {
    title: "About expansions + narrative sync",
    summary:
      "Add compact journey milestones, sync Currently learning section, align resume project descriptions with lib/projects.ts.",
    project: "jonkeen-dev",
    status: "Exploring",
    dateAdded: "2026-06-16",
  },
];
