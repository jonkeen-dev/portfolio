export const LIBRARY_FILTERS = [
  { value: "all", label: "All" },
  { value: "push", label: "Push" },
  { value: "pull", label: "Pull" },
  { value: "squat", label: "Squat" },
  { value: "hinge", label: "Hinge" },
  { value: "core", label: "Core" },
  { value: "lateral_core", label: "Side core" },
  { value: "warmup", label: "Warm-up" },
  { value: "cooldown", label: "Cool-down" },
] as const;

export type LibraryQuery = {
  name: string;
  patternId: string;
  patternLabel: string;
  cues: string[];
};

const GROUP_ORDER = LIBRARY_FILTERS.filter((item) => item.value !== "all").map((item) => item.value);

export function libraryGroupOrder(patternId: string): number {
  const index = GROUP_ORDER.indexOf(patternId as (typeof GROUP_ORDER)[number]);
  return index === -1 ? GROUP_ORDER.length : index;
}

export function matchesLibrary(item: LibraryQuery, query: string, filter: string): boolean {
  if (filter !== "all" && item.patternId !== filter) return false;
  const needle = query.trim().toLowerCase();
  if (!needle) return true;
  const haystack = [item.name, item.patternLabel, item.patternId.replaceAll("_", " "), ...item.cues].join(" ").toLowerCase();
  return haystack.includes(needle);
}
