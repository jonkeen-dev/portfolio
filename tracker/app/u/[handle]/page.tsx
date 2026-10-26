import type { Metadata } from "next";

import { adherencePercent } from "@/lib/engine/analytics";
import { createDal } from "@/lib/db/access";
import { getDatabase } from "@/lib/db";

type Params = { handle: string };

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { handle } = await params;
  const profile = await createDal(getDatabase().db).getPublicProfile(handle);
  if (!profile.available || !profile.allowIndexing) {
    return { title: "Profile", robots: { index: false, follow: false } };
  }
  return {
    title: profile.displayName?.trim() || profile.handle,
    robots: { index: true, follow: true },
  };
}

export default async function PublicProfilePage({ params }: { params: Promise<Params> }) {
  const { handle } = await params;
  const profile = await createDal(getDatabase().db).getPublicProfile(handle);
  if (!profile.available) {
    return (
      <main id="main" tabIndex={-1} className="page">
        <h1>Profile</h1>
        <p>This profile is not available.</p>
        <p>
          <a href="/sign-in">Sign in</a>
        </p>
      </main>
    );
  }
  const name = profile.displayName?.trim() ? profile.displayName : profile.handle;
  return (
    <main id="main" tabIndex={-1} className="page">
      <h1>{name}</h1>
      <p>Read-only</p>
      {profile.email ? <p>{profile.email}</p> : null}
      {profile.stats ? (
        <section className="card" aria-labelledby="stats">
          <h2 id="stats">Stats</h2>
          <p>
            {profile.stats.sessionsCompleted} of {profile.stats.sessionsScheduled} sessions (
            {adherencePercent(profile.stats.adherence)}%). {profile.stats.totalReps} reps.{" "}
            {profile.stats.holdMinutes.toFixed(1)} minutes held. Streak {profile.stats.currentStreak}.
          </p>
        </section>
      ) : null}
      {profile.levels ? (
        <section aria-labelledby="levels">
          <h2 id="levels">Levels</h2>
          <ul>
            {profile.levels.map((level) => (
              <li key={level.patternId}>
                {level.patternName}: {level.exerciseName}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
      {profile.logs ? (
        <section aria-labelledby="logs">
          <h2 id="logs">Set log</h2>
          <table>
            <caption>Shared set log</caption>
            <thead>
              <tr>
                <th scope="col">Date</th>
                <th scope="col">Exercise</th>
                <th scope="col">Sets</th>
              </tr>
            </thead>
            <tbody>
              {profile.logs.map((log) => (
                <tr key={`${log.date}-${log.exerciseName}`}>
                  <td>{log.date}</td>
                  <td>{log.exerciseName}</td>
                  <td>{log.sets.join(", ")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ) : null}
      <p>
        <a href="/sign-in">Sign in</a>
      </p>
    </main>
  );
}
