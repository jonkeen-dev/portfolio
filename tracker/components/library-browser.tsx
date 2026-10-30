"use client";

import { useMemo, useState, useSyncExternalStore } from "react";

import { ExerciseDetail, type ExerciseDetailModel } from "@/components/exercise-detail";
import { Button } from "@/components/ui/button";
import { Keep } from "@/components/ui/keep";
import { ChipGroup } from "@/components/ui/chip";
import { LIBRARY_FILTERS, libraryGroupOrder, matchesLibrary } from "@/lib/library";

export type LibraryEntry = ExerciseDetailModel & {
  name: string;
  patternId: string;
  patternLabel: string;
  level: number;
  current: boolean;
};

function locationHash(): string {
  return window.location.hash.replace("#", "");
}

export function LibraryBrowser({ items }: { items: LibraryEntry[] }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [picked, setPicked] = useState<string | false | null>(null);
  const hash = useSyncExternalStore(
    (onStoreChange) => {
      window.addEventListener("hashchange", onStoreChange);
      return () => window.removeEventListener("hashchange", onStoreChange);
    },
    locationHash,
    () => "",
  );
  const names = useMemo(() => Object.fromEntries(items.map((item) => [item.id, item.name])), [items]);
  const fromHash = items.some((item) => item.id === hash) ? hash : null;
  const open = picked === null ? fromHash : picked === false ? null : picked;

  const shown = items.filter((item) => matchesLibrary(item, query, filter));
  const groups = new Map<string, LibraryEntry[]>();
  for (const item of shown) {
    const list = groups.get(item.patternId) ?? [];
    list.push(item);
    groups.set(item.patternId, list);
  }
  const ordered = [...groups.entries()].sort((a, b) => libraryGroupOrder(a[0]) - libraryGroupOrder(b[0]) || a[0].localeCompare(b[0]));

  function reveal(id: string) {
    setFilter("all");
    setQuery("");
    setPicked(id);
    window.history.replaceState(null, "", `#${id}`);
    window.requestAnimationFrame(() => document.getElementById(id)?.scrollIntoView({ block: "nearest" }));
  }

  return (
    <div className="stack">
      <div className="search-field">
        <label htmlFor="library-search">
          Search exercises
          <input
            id="library-search"
            type="search"
            value={query}
            placeholder="Search by name"
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
        {query ? (
          <Button type="button" variant="secondary" aria-label="Clear search" onClick={() => setQuery("")}>
            ✕
          </Button>
        ) : null}
      </div>
      <div className="chip-scroll" tabIndex={0} role="region" aria-label="Exercise groups">
        <ChipGroup
          label="Exercise groups"
          value={filter}
          onChange={setFilter}
          options={LIBRARY_FILTERS.map((item) => ({ value: item.value, label: item.label }))}
        />
      </div>
      {shown.length === 0 ? <p>Nothing matches that search.</p> : null}
      {ordered.map(([patternId, rows]) => {
        const label = rows[0]?.patternLabel ?? patternId;
        const leveled = rows.some((row) => row.level > 0);
        const sorted = [...rows].sort((a, b) => a.level - b.level || a.name.localeCompare(b.name));
        return (
          <section key={patternId} className="stack" aria-labelledby={`group-${patternId}`}>
            <h2 id={`group-${patternId}`}>{label}</h2>
            {sorted.map((row) => {
              const expanded = open === row.id;
              return (
                <article key={row.id} id={row.id} className="card">
                  <button
                    type="button"
                    className="row-toggle"
                    aria-expanded={expanded}
                    onClick={() => setPicked(expanded ? false : row.id)}
                  >
                    <span>
                      <span className="row-title">
                        <Keep text={row.name} />
                      </span>
                      <span className="meta">
                        <Keep text={leveled && row.level > 0 ? `${label} · level ${row.level}` : label} />
                      </span>
                    </span>
                    <span className="tag-cluster">
                      {row.video ? <span className="tag">Demo</span> : null}
                      {row.current ? <span className="tag tag-now">Current</span> : null}
                    </span>
                  </button>
                  {expanded ? <ExerciseDetail item={row} names={names} mode="full" onJump={reveal} /> : null}
                </article>
              );
            })}
          </section>
        );
      })}
    </div>
  );
}
