import { asc } from "drizzle-orm";

import { SubmitButton } from "@/components/ui/submit-button";
import { MiniLadder } from "@/components/ui/mini-ladder";
import { PageHeader } from "@/components/ui/page-header";
import { setLevelManually } from "@/lib/actions";
import { movementStatusLine } from "@/lib/copy";
import { createDal } from "@/lib/db/access";
import { getDatabase } from "@/lib/db";
import { exercises, patterns } from "@/lib/db/schema";
import { currentProfile, currentSession } from "@/lib/session";
import { todayIso } from "@/lib/today";

export const metadata = { title: "Ladders" };

const ORDER = ["push", "pull", "squat", "hinge", "core", "lateral_core"];

export default async function LaddersPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const session = await currentSession();
  if (!session) return null;
  const profile = await currentProfile(session.user.id);
  if (!profile) return null;
  const { error } = await searchParams;
  const db = getDatabase().db;
  const dal = createDal(db);
  const asOf = todayIso(profile.timezone);
  const [patternRows, exerciseRows, suggestions, levels] = await Promise.all([
    db.select().from(patterns).orderBy(asc(patterns.sort)),
    db.select().from(exercises).orderBy(asc(exercises.level)),
    dal.movementSuggestions(session.user.id, asOf),
    dal.currentLevels(session.user.id),
  ]);
  const names = new Map(patternRows.map((row) => [row.id, row.name]));

  return (
    <>
      <PageHeader
        title="Ladders"
        description="Two sessions at the top of the range moves you up a rung. You can also choose a level yourself."
      />
      {error ? (
        <p className="alert" role="alert">
          {error}
        </p>
      ) : null}
      {ORDER.map((patternId) => {
        const suggestion = suggestions.find((item) => item.patternId === patternId);
        const current = levels.find((level) => level.patternId === patternId);
        const ladder = exerciseRows.filter(
          (row) =>
            row.patternId === patternId &&
            row.equipment !== "kettlebell" &&
            (profile.hasBar || row.equipment !== "bar"),
        );
        const rungTotal = ladder.reduce((max, row) => Math.max(max, row.level), 1);
        return (
          <section key={patternId} className="card" aria-labelledby={`ladder-${patternId}`}>
            <div className="exercise-head">
              <MiniLadder level={current?.level ?? 0} total={rungTotal} />
              <h2 className="row-title" id={`ladder-${patternId}`}>
                {names.get(patternId) ?? patternId}
              </h2>
            </div>
            {current ? (
              <p>
                Current: {current.exerciseName} (level {current.level} of {rungTotal})
              </p>
            ) : (
              <p className="muted">No level chosen yet. The plan starts at the first rung.</p>
            )}
            {suggestion ? (
              <p>
                {movementStatusLine({
                  status: suggestion.status,
                  reason: suggestion.reason,
                  suggestedName: suggestion.suggestedName,
                  tooHardMessage: suggestion.tooHard?.message,
                })}
              </p>
            ) : null}
            <ol>
              {ladder.map((row) => (
                <li key={row.id}>
                  Level {row.level}: {row.name}
                  {current?.exerciseId === row.id ? " (current)" : ""}
                  {row.equipment === "bar" ? " · needs a bar" : ""}
                </li>
              ))}
            </ol>
            <form className="stack" action={setLevelManually}>
              <input type="hidden" name="patternId" value={patternId} />
              <label htmlFor={`pick-${patternId}`}>
                Choose a level myself
                <select id={`pick-${patternId}`} name="exerciseId" defaultValue={current?.exerciseId ?? ladder[0]?.id}>
                  {ladder.map((row) => (
                    <option key={row.id} value={row.id}>
                      {row.name}
                    </option>
                  ))}
                </select>
              </label>
              <SubmitButton variant="secondary">Save {names.get(patternId) ?? "level"}</SubmitButton>
            </form>
          </section>
        );
      })}
    </>
  );
}
