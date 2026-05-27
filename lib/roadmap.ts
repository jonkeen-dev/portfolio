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
    status: "In Progress",
    dateAdded: "2026-05-26",
  },
  {
    title: "UI development",
    summary: "Design and build the user interface.",
    project: "palletforge",
    status: "Exploring",
    dateAdded: "2026-05-23",
  },
  {
    title: "Typography polish",
    summary: "Tighten up font sizing, spacing, and line-height across the site.",
    project: "jonkeen-dev",
    status: "Exploring",
    dateAdded: "2026-05-22",
  },
  {
    title: "Case study content",
    summary: "Replace placeholder copy with the real project write-up.",
    project: "palletforge",
    status: "Planned",
    dateAdded: "2026-05-21",
  },
  {
    title: "Page transitions & hover animations",
    summary: "Add Framer Motion animations to page transitions and project card hovers.",
    project: "jonkeen-dev",
    status: "Planned",
    dateAdded: "2026-05-20",
  },
  {
    title: "Mobile device testing",
    summary: "Test and fix layout issues on real mobile devices.",
    project: "jonkeen-dev",
    status: "Planned",
    dateAdded: "2026-05-19",
  },
  {
    title: "Lighthouse audit",
    summary: "Optimize for green scores across performance, accessibility, and best practices.",
    project: "jonkeen-dev",
    status: "Planned",
    dateAdded: "2026-05-18",
  },
];
