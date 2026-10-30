import { and, asc, isNull, ne } from "drizzle-orm";

import { PublicProfileView } from "@/components/public-profile-view";
import { PageHeader } from "@/components/ui/page-header";
import { createDal } from "@/lib/db/access";
import { getDatabase } from "@/lib/db";
import { exercises, user } from "@/lib/db/schema";
import { sessionsFromLogs, sharedStats } from "@/lib/shared-view";
import { currentSession, userRole } from "@/lib/session";

export const metadata = { title: "Partner" };

export default async function PartnerPage() {
  const session = await currentSession();
  if (!session) return null;
  const db = getDatabase().db;
  const others = await db
    .select({ id: user.id, name: user.name })
    .from(user)
    .where(and(ne(user.id, session.user.id), isNull(user.deactivatedAt)));
  const owner = userRole(session.user) === "owner";
  if (others.length === 0) {
    return (
      <>
        <PageHeader title="Partner" />
        <p>
          No partner yet.
          {owner ? (
            <>
              {" "}
              <a href="/settings/people">Invite someone from People.</a>
            </>
          ) : null}
        </p>
      </>
    );
  }
  const dal = createDal(db);
  const views = [];
  for (const other of others) {
    const view = await dal.getPartnerView(session.user.id, other.id);
    if (view.available) views.push({ view, name: other.name });
  }
  if (views.length === 0) {
    const name = others[0]?.name?.trim() || "they";
    return (
      <>
        <PageHeader title="Partner" />
        <p>Nothing shared yet. When {name} turns on sharing, their progress shows up here.</p>
      </>
    );
  }
  const exerciseRows = await db.select().from(exercises).orderBy(asc(exercises.level));
  const totals = new Map<string, number>();
  for (const row of exerciseRows) {
    if (row.equipment === "kettlebell") continue;
    totals.set(row.patternId, Math.max(totals.get(row.patternId) ?? 1, row.level));
  }
  return (
    <>
      <PageHeader title="Partner" />
      {views.map(({ view }) =>
        view.available ? (
          <PublicProfileView
            key={view.handle}
            heading="h2"
            title={view.displayName?.trim() || view.handle}
            email={view.email}
            stats={view.stats ? sharedStats(view.stats) : null}
            levels={
              view.levels && view.levels.length > 0
                ? view.levels.map((level) => ({
                    patternId: level.patternId,
                    patternName: level.patternName,
                    exerciseName: level.exerciseName,
                    level: level.level,
                    rungTotal: totals.get(level.patternId) ?? Math.max(level.level, 1),
                  }))
                : null
            }
            sessions={view.logs ? sessionsFromLogs(view.logs) : null}
          />
        ) : null,
      )}
    </>
  );
}
