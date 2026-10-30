import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { asc } from "drizzle-orm";

import { PublicProfileView } from "@/components/public-profile-view";
import { createDal } from "@/lib/db/access";
import { getDatabase } from "@/lib/db";
import { exercises } from "@/lib/db/schema";
import { sessionsFromLogs, sharedStats } from "@/lib/shared-view";

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
  const db = getDatabase().db;
  const profile = await createDal(db).getPublicProfile(handle);
  if (!profile.available) notFound();
  const exerciseRows = profile.levels ? await db.select().from(exercises).orderBy(asc(exercises.level)) : [];
  const totals = new Map<string, number>();
  for (const row of exerciseRows) {
    if (row.equipment === "kettlebell") continue;
    totals.set(row.patternId, Math.max(totals.get(row.patternId) ?? 1, row.level));
  }
  const name = profile.displayName?.trim() ? profile.displayName : profile.handle;
  return (
    <main id="main" tabIndex={-1} className="page">
      <PublicProfileView
        title={name}
        email={profile.email}
        stats={profile.stats ? sharedStats(profile.stats) : null}
        levels={
          profile.levels && profile.levels.length > 0
            ? profile.levels.map((level) => ({
                patternId: level.patternId,
                patternName: level.patternName,
                exerciseName: level.exerciseName,
                level: level.level,
                rungTotal: totals.get(level.patternId) ?? Math.max(level.level, 1),
              }))
            : null
        }
        sessions={profile.logs ? sessionsFromLogs(profile.logs) : null}
      />
      <p>Calisthenics Tracker</p>
    </main>
  );
}
