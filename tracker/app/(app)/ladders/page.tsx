import { asc } from "drizzle-orm";

import { setLevelManually } from "@/lib/actions";
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
      <h1>Ladders</h1>
      <p>Move up only after two sessions at the top of the range. You can also set a level yourself.</p>
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
        return (
          <section key={patternId} className="card" aria-labelledby={`ladder-${patternId}`}>
            <h2 id={`ladder-${patternId}`}>{names.get(patternId) ?? patternId}</h2>
            {current ? (
              <p>
                Current: {current.exerciseName} (level {current.level})
              </p>
            ) : (
              <p className="muted">No level chosen yet. The plan starts at the first rung.</p>
            )}
            {suggestion ? (
              <p>
                {suggestion.status === "READY"
                  ? "Ready to level up"
                  : suggestion.status === "HOLD"
                    ? "Hold"
                    : suggestion.status === "NOT_YET"
                      ? "Not yet"
                      : "No sessions yet"}
                . {suggestion.reason}
                {suggestion.suggestedName ? ` Next: ${suggestion.suggestedName}.` : ""}
                {suggestion.tooHard ? ` ${suggestion.tooHard.message}` : ""}
              </p>
            ) : null}
            <ol>
              {ladder.map((row) => (
                <li key={row.id}>
                  Level {row.level}: {row.name}
                  {current?.exerciseId === row.id ? " (current)" : ""}
                  {row.equipment === "bar" ? " — bar" : ""}
                </li>
              ))}
            </ol>
            <form className="stack" action={setLevelManually}>
              <input type="hidden" name="patternId" value={patternId} />
              <label htmlFor={`pick-${patternId}`}>
                Set level manually
                <select id={`pick-${patternId}`} name="exerciseId" defaultValue={current?.exerciseId ?? ladder[0]?.id}>
                  {ladder.map((row) => (
                    <option key={row.id} value={row.id}>
                      {row.name}
                    </option>
                  ))}
                </select>
              </label>
              <button className="tap" type="submit">
                Save {names.get(patternId) ?? "level"}
              </button>
            </form>
          </section>
        );
      })}
    </>
  );
}
