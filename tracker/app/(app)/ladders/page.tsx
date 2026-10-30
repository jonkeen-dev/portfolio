import { asc } from "drizzle-orm";

import { LaddersBoard, type LadderCard } from "@/components/ladders-board";
import { PageHeader } from "@/components/ui/page-header";
import { ladderStatusLine, ladderTag } from "@/lib/copy";
import { createDal } from "@/lib/db/access";
import { getDatabase } from "@/lib/db";
import { exercises, patterns } from "@/lib/db/schema";
import { currentProfile, currentSession } from "@/lib/session";
import { todayIso } from "@/lib/today";

export const metadata = { title: "Ladders" };

const ORDER = ["push", "pull", "squat", "hinge", "core", "lateral_core"];

export default async function LaddersPage({ searchParams }: { searchParams: Promise<{ error?: string; saved?: string }> }) {
  const session = await currentSession();
  if (!session) return null;
  const profile = await currentProfile(session.user.id);
  if (!profile) return null;
  const { error, saved } = await searchParams;
  const db = getDatabase().db;
  const dal = createDal(db);
  const asOf = todayIso(profile.timezone);
  const [patternRows, exerciseRows, suggestions, levels] = await Promise.all([
    db.select().from(patterns).orderBy(asc(patterns.sort)),
    db.select().from(exercises).orderBy(asc(exercises.level), asc(exercises.name)),
    dal.movementSuggestions(session.user.id, asOf),
    dal.currentLevels(session.user.id),
  ]);
  const names = new Map(patternRows.map((row) => [row.id, row.name]));
  const byId = new Map(exerciseRows.map((row) => [row.id, row]));

  const cards: LadderCard[] = ORDER.map((patternId) => {
    const ladder = exerciseRows.filter(
      (row) => row.patternId === patternId && row.equipment !== "kettlebell" && (profile.hasBar || row.equipment !== "bar"),
    );
    const suggestion = suggestions.find((item) => item.patternId === patternId);
    const level = levels.find((item) => item.patternId === patternId);
    const currentId = level?.exerciseId ?? suggestion?.exerciseId ?? null;
    const current = currentId ? byId.get(currentId) : undefined;
    const onLadder = current && ladder.some((row) => row.id === current.id) ? current : undefined;
    const rungTotal = ladder.reduce((max, row) => Math.max(max, row.level), 1);
    const nextId = onLadder?.progressionId && ladder.some((row) => row.id === onLadder.progressionId) ? onLadder.progressionId : null;
    const loggedHere = !onLadder || suggestion?.exerciseId === onLadder.id;
    const status = loggedHere ? (suggestion?.status ?? "NO_DATA") : "NOT_YET";
    const sessionsAtTop = loggedHere ? (suggestion?.sessionsAtTop ?? 0) : 0;
    const nextName = (loggedHere ? suggestion?.suggestedName : null) ?? (nextId ? byId.get(nextId)?.name : null);
    const suggested = suggestion?.suggestedExerciseId ? byId.get(suggestion.suggestedExerciseId) : undefined;
    const ready =
      loggedHere &&
      suggestion?.status === "READY" &&
      suggested &&
      ladder.some((row) => row.id === suggested.id) &&
      suggested.id !== onLadder?.id
        ? suggested
        : null;
    return {
      patternId,
      name: names.get(patternId) ?? patternId,
      currentId: onLadder?.id ?? null,
      currentName: onLadder?.name ?? null,
      currentLevel: onLadder?.level ?? 0,
      nextId,
      rungTotal,
      statusLine: ladderStatusLine({
        status,
        sessionsAtTop,
        targetMax: loggedHere ? (suggestion?.lastTargetMax ?? null) : null,
        unit: suggestion?.unit ?? onLadder?.unit ?? "reps",
        nextName: nextName ?? null,
      }),
      tag: ladderTag(status, sessionsAtTop),
      readyId: ready?.id ?? null,
      readyName: ready?.name ?? null,
      asOf,
      rungs: ladder.map((row) => ({
        id: row.id,
        name: row.name,
        level: row.level,
        equipment: row.equipment,
      })),
    };
  });
  const initialOpen = cards.find((card) => card.tag === "Ready")?.patternId ?? "push";

  return (
    <>
      <PageHeader title="Ladders" description="Two sessions at the top of the range moves you up a rung." />
      {saved ? (
        <p role="status" className="toast">
          {saved}
        </p>
      ) : null}
      {error ? (
        <p className="alert" role="alert">
          {error}
        </p>
      ) : null}
      <LaddersBoard cards={cards} initialOpen={initialOpen} />
    </>
  );
}
