import { asc } from "drizzle-orm";

import { CopyLink, SharePreview } from "@/components/copy-link";
import { PageHeader } from "@/components/ui/page-header";
import { SubmitButton } from "@/components/ui/submit-button";
import { saveSharing } from "@/lib/actions";
import { createDal } from "@/lib/db/access";
import { getDatabase } from "@/lib/db";
import { exercises } from "@/lib/db/schema";
import { appOrigin } from "@/lib/env";
import { publicProfileUrl } from "@/lib/invite-link";
import { sessionsFromLogs, sharedStats } from "@/lib/shared-view";
import { currentProfile, currentSession } from "@/lib/session";

export const metadata = { title: "Sharing" };

export default async function SharingPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; saved?: string }>;
}) {
  const session = await currentSession();
  if (!session) return null;
  const profile = await currentProfile(session.user.id);
  if (!profile) return null;
  const { error, saved } = await searchParams;
  const sections = new Set(profile.visibleSections);
  const handle = profile.publicHandle ?? "";
  const host = appOrigin().replace(/^https?:\/\//, "");
  const live = profile.visibility === "public" && handle ? publicProfileUrl(handle) : null;
  const db = getDatabase().db;
  const published = live ? await createDal(db).getPublicProfile(handle) : null;
  const exerciseRows = published?.available && published.levels ? await db.select().from(exercises).orderBy(asc(exercises.level)) : [];
  const totals = new Map<string, number>();
  for (const row of exerciseRows) {
    if (row.equipment === "kettlebell") continue;
    totals.set(row.patternId, Math.max(totals.get(row.patternId) ?? 1, row.level));
  }
  return (
    <>
      <PageHeader title="Sharing" description="Private is the default. A public page stays out of search unless you allow it." />
      {saved ? (
        <p className="toast" role="status">
          {saved}
        </p>
      ) : null}
      {error ? (
        <p className="alert" role="alert">
          {error}
        </p>
      ) : null}
      <form className="stack" action={saveSharing}>
        <fieldset className="choice-stack">
          <legend>Who can see your progress</legend>
          <label className="choice-card">
            <input type="radio" name="visibility" value="private" defaultChecked={profile.visibility === "private"} />
            <span>Just me</span>
          </label>
          <label className="choice-card">
            <input type="radio" name="visibility" value="partner" defaultChecked={profile.visibility === "partner"} />
            <span>My partner</span>
          </label>
          <label className="choice-card">
            <input type="radio" name="visibility" value="public" defaultChecked={profile.visibility === "public"} />
            <span>Anyone with the link</span>
          </label>
        </fieldset>
        <fieldset>
          <legend>Sections</legend>
          <label className="choice">
            <input type="checkbox" name="stats_charts" defaultChecked={sections.has("stats_charts")} /> Stats and charts
          </label>
          <label className="choice">
            <input type="checkbox" name="level_history" defaultChecked={sections.has("level_history")} /> Ladder levels
          </label>
          <label className="choice">
            <input type="checkbox" name="set_logs" defaultChecked={sections.has("set_logs")} /> Every set
          </label>
        </fieldset>
        <label htmlFor="handle">
          Handle
          <input id="handle" name="handle" defaultValue={handle} minLength={3} maxLength={30} />
        </label>
        <p className="meta">Used in your link: {host}/u/{handle || "your-name"}</p>
        <label className="choice">
          <input type="checkbox" name="showName" defaultChecked={profile.showName} /> Show name
        </label>
        <label className="choice">
          <input type="checkbox" name="showEmail" defaultChecked={profile.showEmail} /> Show email
        </label>
        <label className="choice">
          <input type="checkbox" name="allowIndexing" defaultChecked={profile.allowIndexing} /> Allow search engines
        </label>
        <p className="meta">Search engines only apply when anyone with the link can look.</p>
        <SubmitButton>Save sharing</SubmitButton>
      </form>
      {live && published?.available ? (
        <section className="card stack" aria-labelledby="link-card">
          <h2 id="link-card">Your link</h2>
          <div className="stack">
            <CopyLink url={live} />
            <SharePreview
              title={published.displayName?.trim() || published.handle}
              email={published.email}
              stats={published.stats ? sharedStats(published.stats) : null}
              levels={
                published.levels?.map((level) => ({
                  patternId: level.patternId,
                  patternName: level.patternName,
                  exerciseName: level.exerciseName,
                  level: level.level,
                  rungTotal: totals.get(level.patternId) ?? Math.max(level.level, 1),
                })) ?? null
              }
              sessions={published.logs ? sessionsFromLogs(published.logs) : null}
            />
          </div>
        </section>
      ) : null}
      <p>
        <a href="/partner">Your partner</a>
      </p>
    </>
  );
}
