"use client";

import { useMemo, useState } from "react";

const STATUSES = ["Exploring", "Planned", "In Progress", "Done"] as const;

type RoadmapStatus = (typeof STATUSES)[number];

const statusColors: Record<RoadmapStatus, string> = {
  Exploring: "bg-status-exploring",
  Planned: "bg-status-planned",
  "In Progress": "bg-status-in-progress",
  Done: "bg-status-done",
};

export type RoadmapProjectOption = {
  slug: string;
  title: string;
};

export type RoadmapCard = {
  title: string;
  summary: string;
  project: string;
  status: RoadmapStatus;
  dateAdded: string;
};

type RoadmapClientProps = {
  projects: RoadmapProjectOption[];
  items: RoadmapCard[];
};

export default function RoadmapClient({ projects, items }: RoadmapClientProps) {
  const projectMap = useMemo(
    () => new Map(projects.map((project) => [project.slug, project.title])),
    [projects],
  );
  const [activeStatuses, setActiveStatuses] = useState<Set<RoadmapStatus>>(
    () => new Set(["Exploring", "Planned", "In Progress"]),
  );
  const [activeProjects, setActiveProjects] = useState<Set<string>>(
    () => new Set(projects.map((project) => project.slug)),
  );
  const [sortDirection, setSortDirection] = useState<"newest" | "oldest">("newest");

  const filteredItems = useMemo(() => {
    const next = items.filter(
      (item) => activeStatuses.has(item.status) && activeProjects.has(item.project),
    );
    next.sort((a, b) => {
      const cmp = a.dateAdded.localeCompare(b.dateAdded);
      return sortDirection === "newest" ? -cmp : cmp;
    });
    return next;
  }, [items, activeStatuses, activeProjects, sortDirection]);

  function toggleStatus(status: RoadmapStatus) {
    setActiveStatuses((prev) => {
      const next = new Set(prev);
      if (next.has(status)) {
        next.delete(status);
      } else {
        next.add(status);
      }
      return next;
    });
  }

  function toggleProject(slug: string) {
    setActiveProjects((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) {
        next.delete(slug);
      } else {
        next.add(slug);
      }
      return next;
    });
  }

  return (
    <div className="mt-10">
      {/* Filters */}
      <div className="flex flex-col gap-4">
        {/* Status filters */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-foreground-muted text-xs tracking-wide uppercase">Status</span>
          {STATUSES.map((status) => {
            const active = activeStatuses.has(status);
            return (
              <button
                key={status}
                onClick={() => toggleStatus(status)}
                aria-pressed={active}
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs transition-colors ${
                  active
                    ? "bg-accent/15 text-foreground border-accent/30"
                    : "border-border/30 text-foreground-muted hover:border-border/50"
                }`}
              >
                <span className={`inline-block h-2 w-2 rounded-full ${statusColors[status]}`} />
                {status}
              </button>
            );
          })}
        </div>

        {/* Project filters */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-foreground-muted text-xs tracking-wide uppercase">Project</span>
          {projects.map((project) => {
            const active = activeProjects.has(project.slug);
            return (
              <button
                key={project.slug}
                onClick={() => toggleProject(project.slug)}
                aria-pressed={active}
                className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                  active
                    ? "bg-accent/15 text-foreground border-accent/30"
                    : "border-border/30 text-foreground-muted hover:border-border/50"
                }`}
              >
                {projectMap.get(project.slug)}
              </button>
            );
          })}
        </div>

        {/* Sort */}
        <div className="flex items-center gap-2">
          <span className="text-foreground-muted text-xs tracking-wide uppercase">Sort</span>
          <button
            onClick={() => setSortDirection((d) => (d === "newest" ? "oldest" : "newest"))}
            className="border-border/30 text-foreground-muted hover:border-border/50 rounded-full border px-3 py-1 text-xs transition-colors"
          >
            {sortDirection === "newest" ? "Newest first" : "Oldest first"}
          </button>
        </div>
      </div>

      {/* Cards */}
      {filteredItems.length === 0 ? (
        <p className="text-foreground-muted mt-12 text-sm">
          Nothing matches these filters. Try turning a few back on.
        </p>
      ) : (
        <ul className="mt-8 grid gap-4 sm:grid-cols-2">
          {filteredItems.map((item) => (
            <li
              key={`${item.project}-${item.title}`}
              className="border-accent/75 bg-background-secondary hover:border-accent rounded-lg border p-6 transition-colors"
            >
              <div className="flex items-center gap-2">
                <span
                  className={`inline-block h-2 w-2 rounded-full ${statusColors[item.status]}`}
                />
                <span className="text-foreground-muted text-xs">{item.status}</span>
              </div>
              <h3 className="card-title mt-3">{item.title}</h3>
              <p className="text-foreground-muted mt-1 text-xs">{projectMap.get(item.project)}</p>
              <p className="text-foreground-secondary mt-2 text-sm">{item.summary}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
