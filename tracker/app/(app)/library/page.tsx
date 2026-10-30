import { asc, eq } from "drizzle-orm";

import { LibraryBrowser, type LibraryEntry } from "@/components/library-browser";
import { PageHeader } from "@/components/ui/page-header";
import { createDal } from "@/lib/db/access";
import { getDatabase } from "@/lib/db";
import { exercises, patterns, videos } from "@/lib/db/schema";
import { currentSession } from "@/lib/session";

export const metadata = { title: "Library" };

const LABELS: Record<string, string> = {
  push: "Push",
  pull: "Pull",
  squat: "Squat",
  hinge: "Hinge",
  core: "Core",
  lateral_core: "Side core",
  warmup: "Warm-up",
  cooldown: "Cool-down",
};

export default async function LibraryPage() {
  const session = await currentSession();
  if (!session) return null;
  const db = getDatabase().db;
  const [exerciseRows, videoRows, patternRows, levels] = await Promise.all([
    db.select().from(exercises).orderBy(asc(exercises.level), asc(exercises.name)),
    db.select().from(videos).where(eq(videos.role, "primary")),
    db.select().from(patterns),
    session ? createDal(db).currentLevels(session.user.id) : Promise.resolve([]),
  ]);
  const names = new Map(patternRows.map((row) => [row.id, row.name]));
  for (const [id, label] of Object.entries(LABELS)) names.set(id, label);
  const primary = new Map(videoRows.map((row) => [row.exerciseId, row]));
  const currentIds = new Set(levels.map((level) => level.exerciseId));
  const items: LibraryEntry[] = exerciseRows
    .filter((row) => row.equipment !== "kettlebell")
    .map((row) => {
      const video = primary.get(row.id);
      return {
        id: row.id,
        name: row.name,
        patternId: row.patternId,
        patternLabel: names.get(row.patternId) ?? row.patternId,
        level: row.level,
        description: row.description,
        cues: row.cues,
        mistakes: row.mistakes,
        safetyNote: row.safetyNote,
        regressionId: row.regressionId,
        progressionId: row.progressionId,
        current: currentIds.has(row.id),
        video:
          video?.youtubeId && video.status === "ok"
            ? { youtubeId: video.youtubeId, title: video.title, watchUrl: video.url, duration: video.duration }
            : null,
      };
    });

  return (
    <>
      <PageHeader title="Library" description="Every exercise in the 12-week program." />
      <LibraryBrowser items={items} />
    </>
  );
}
