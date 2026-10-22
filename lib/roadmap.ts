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
    summary: "A public page that shows what I'm working on, with simple status filters.",
    project: "jonkeen-dev",
    status: "Done",
    dateAdded: "2026-05-26",
  },
  {
    title: "UI development",
    summary: "Design and build the main screens for the app.",
    project: "paletteforge",
    status: "Exploring",
    dateAdded: "2026-05-23",
  },
  {
    title: "Typography polish",
    summary: "Tighten font size, spacing, and line height so the site is easier to read.",
    project: "jonkeen-dev",
    status: "Done",
    dateAdded: "2026-05-22",
  },
  {
    title: "Case study content",
    summary: "Replace placeholder text with a real project write-up.",
    project: "paletteforge",
    status: "Done",
    dateAdded: "2026-05-21",
  },
  {
    title: "Hover animations",
    summary: "Add light hover motion on cards, nav links, and footer icons.",
    project: "jonkeen-dev",
    status: "Done",
    dateAdded: "2026-05-20",
  },
  {
    title: "Page transitions",
    summary: "Add a short fade when moving between pages.",
    project: "jonkeen-dev",
    status: "Done",
    dateAdded: "2026-05-20",
  },
  {
    title: "Mobile device testing",
    summary: "Check the layout on phones and fix anything that feels cramped or broken.",
    project: "jonkeen-dev",
    status: "Done",
    dateAdded: "2026-05-19",
  },
  {
    title: "Lighthouse audit",
    summary: "Improve performance, accessibility, and SEO so the basics score well.",
    project: "jonkeen-dev",
    status: "Done",
    dateAdded: "2026-05-18",
  },
  {
    title: "Hero glow",
    summary: "Add a soft glow behind the homepage name and intro line — no box, no border.",
    project: "jonkeen-dev",
    status: "Done",
    dateAdded: "2026-06-16",
  },
  {
    title: "Quick impact highlights",
    summary: "Add a few short, scannable highlights on project cards and case studies.",
    project: "jonkeen-dev",
    status: "Exploring",
    dateAdded: "2026-06-16",
  },
  {
    title: "About page polish",
    summary: "Keep the About story clear and in sync with the resume and project write-ups.",
    project: "jonkeen-dev",
    status: "Exploring",
    dateAdded: "2026-06-16",
  },
  {
    title: "Copy and language pass",
    summary: "Make every page easier to read — friendly, clear, and free of jargon where it helps.",
    project: "jonkeen-dev",
    status: "Done",
    dateAdded: "2026-10-22",
  },
];
