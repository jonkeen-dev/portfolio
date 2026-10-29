import { and, isNull, ne } from "drizzle-orm";

import { PageHeader } from "@/components/ui/page-header";
import { createDal } from "@/lib/db/access";
import { getDatabase } from "@/lib/db";
import { user } from "@/lib/db/schema";
import { currentSession } from "@/lib/session";

export const metadata = { title: "Partner" };

export default async function PartnerPage() {
  const session = await currentSession();
  if (!session) return null;
  const db = getDatabase().db;
  const others = await db
    .select({ id: user.id })
    .from(user)
    .where(and(ne(user.id, session.user.id), isNull(user.deactivatedAt)));
  const dal = createDal(db);
  const views = [];
  for (const other of others) {
    const view = await dal.getPartnerView(session.user.id, other.id);
    if (view.available) views.push(view);
  }

  return (
    <>
      <PageHeader title="Partner" />
      {views.length === 0 ? <p>Nothing has been shared with you.</p> : null}
      {views.map((view) => (
        <article key={view.handle} className="card">
          <h2 className="row-title">{view.displayName ?? view.handle}</h2>
          <p>
            <span className="tag">View only</span>
          </p>
          {view.email ? <p>{view.email}</p> : null}
          {view.stats ? (
            <p>
              {view.stats.sessionsCompleted} sessions, {view.stats.totalReps} reps.
            </p>
          ) : null}
          {view.levels ? (
            <ul>
              {view.levels.map((level) => (
                <li key={level.patternId}>
                  {level.patternName}: {level.exerciseName}
                </li>
              ))}
            </ul>
          ) : null}
        </article>
      ))}
    </>
  );
}
