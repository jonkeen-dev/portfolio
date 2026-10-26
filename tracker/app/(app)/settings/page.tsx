import { and, desc, eq, isNull } from "drizzle-orm";

import { PasskeyButton, SignOutButton, ThemeChooser } from "@/components/account-tools";
import { deleteAccount, revokeInvite, saveProfile, saveSharing, sendInvite } from "@/lib/actions";
import { getDatabase } from "@/lib/db";
import { auditEvents, invites } from "@/lib/db/schema";
import { currentProfile, currentSession, userRole } from "@/lib/session";

export const metadata = { title: "Settings" };

const LABELS: Record<string, string> = {
  sign_in: "Signed in",
  visibility_changed: "Sharing updated",
  invite_sent: "Invite sent",
  level_manual: "Level set manually",
  account_deleted: "Account deleted",
};

export default async function SettingsPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const session = await currentSession();
  if (!session) return null;
  const profile = await currentProfile(session.user.id);
  if (!profile) return null;
  const { error } = await searchParams;
  const db = getDatabase().db;
  const owner = userRole(session.user) === "owner";
  const [pending, audits] = await Promise.all([
    owner
      ? db
          .select()
          .from(invites)
          .where(and(eq(invites.invitedBy, session.user.id), isNull(invites.acceptedAt), isNull(invites.revokedAt)))
          .orderBy(desc(invites.createdAt))
      : Promise.resolve([]),
    db.select().from(auditEvents).where(eq(auditEvents.userId, session.user.id)).orderBy(desc(auditEvents.at)).limit(12),
  ]);
  const prefs = (profile.prefs ?? {}) as { reduceMotion?: boolean };
  const sections = new Set(profile.visibleSections);

  return (
    <>
      <h1>Settings</h1>
      {error ? (
        <p className="alert" role="alert">
          {error}
        </p>
      ) : null}
      <section className="card" aria-labelledby="profile-heading">
        <h2 id="profile-heading">Profile</h2>
        <p>Program started {profile.startDate}. Units are {profile.units}.</p>
        <form className="stack" action={saveProfile}>
          <label htmlFor="displayName">
            Name
            <input id="displayName" name="displayName" defaultValue={session.user.name} maxLength={80} />
          </label>
          <fieldset>
            <legend>Units</legend>
            <label className="choice">
              <input type="radio" name="units" value="lb" defaultChecked={profile.units !== "kg"} /> Pounds (lb)
            </label>
            <label className="choice">
              <input type="radio" name="units" value="kg" defaultChecked={profile.units === "kg"} /> Kilograms (kg)
            </label>
          </fieldset>
          <label className="choice">
            <input type="checkbox" name="hasBar" defaultChecked={profile.hasBar} /> Do you have a pull-up bar?
          </label>
          <label className="choice">
            <input type="checkbox" name="reduceMotion" defaultChecked={Boolean(prefs.reduceMotion)} /> Reduce motion
          </label>
          <button className="tap" type="submit">
            Save profile
          </button>
        </form>
      </section>

      <section className="card" aria-labelledby="share-heading">
        <h2 id="share-heading">Sharing</h2>
        <p>Private is the default. A public page is read-only and stays out of search unless you allow indexing.</p>
        <form className="stack" action={saveSharing}>
          <fieldset>
            <legend>Who can look</legend>
            <label className="choice">
              <input type="radio" name="visibility" value="private" defaultChecked={profile.visibility === "private"} />{" "}
              Private
            </label>
            <label className="choice">
              <input type="radio" name="visibility" value="partner" defaultChecked={profile.visibility === "partner"} />{" "}
              Shared with partner
            </label>
            <label className="choice">
              <input type="radio" name="visibility" value="public" defaultChecked={profile.visibility === "public"} />{" "}
              Public
            </label>
          </fieldset>
          <fieldset>
            <legend>Sections</legend>
            <label className="choice">
              <input type="checkbox" name="stats_charts" defaultChecked={sections.has("stats_charts")} /> Stats and charts
            </label>
            <label className="choice">
              <input type="checkbox" name="level_history" defaultChecked={sections.has("level_history")} /> Level history
            </label>
            <label className="choice">
              <input type="checkbox" name="set_logs" defaultChecked={sections.has("set_logs")} /> Set logs
            </label>
          </fieldset>
          <label htmlFor="handle">
            Handle
            <input id="handle" name="handle" defaultValue={profile.publicHandle ?? ""} minLength={3} maxLength={30} />
          </label>
          <label className="choice">
            <input type="checkbox" name="showName" defaultChecked={profile.showName} /> Show name
          </label>
          <label className="choice">
            <input type="checkbox" name="showEmail" defaultChecked={profile.showEmail} /> Show email
          </label>
          <label className="choice">
            <input type="checkbox" name="allowIndexing" defaultChecked={profile.allowIndexing} /> Allow search indexing
          </label>
          <button className="tap primary" type="submit">
            Save sharing
          </button>
        </form>
        <p>
          <a href="/partner">View what a partner shared with you</a>
        </p>
      </section>

      {owner ? (
        <section className="card" aria-labelledby="people-heading">
          <h2 id="people-heading">People</h2>
          <form className="stack" action={sendInvite}>
            <label htmlFor="invite-email">
              Invite email
              <input id="invite-email" name="email" type="email" autoComplete="email" required />
            </label>
            <button className="tap" type="submit">
              Send invite
            </button>
          </form>
          <ul>
            {pending.map((invite) => (
              <li key={invite.id}>
                {invite.email} expires {invite.expiresAt.toISOString().slice(0, 10)}
                <form action={revokeInvite}>
                  <input type="hidden" name="inviteId" value={invite.id} />
                  <button className="tap" type="submit">
                    Revoke {invite.email}
                  </button>
                </form>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="card" aria-labelledby="access-heading">
        <h2 id="access-heading">Accessibility and security</h2>
        <ThemeChooser />
        <PasskeyButton />
        <SignOutButton />
        <h3>Recent activity</h3>
        <ul>
          {audits.map((event) => (
            <li key={event.id}>
              {LABELS[event.type] ?? event.type} · {event.at.toISOString().slice(0, 16).replace("T", " ")}
              {event.uaFamily ? ` · ${event.uaFamily}` : ""}
            </li>
          ))}
        </ul>
      </section>

      <section className="card" aria-labelledby="data-heading">
        <h2 id="data-heading">Your data</h2>
        <p className="row">
          <a className="tap" href="/api/export?format=csv">
            Download CSV
          </a>
          <a className="tap" href="/api/export?format=xlsx">
            Download spreadsheet
          </a>
        </p>
        <form className="stack" action={deleteAccount}>
          <p>Deleting removes your training and signs you out. This needs a session from the last 12 hours.</p>
          <label htmlFor="confirm">
            Type DELETE
            <input id="confirm" name="confirm" autoComplete="off" />
          </label>
          <button className="tap" type="submit">
            Delete account
          </button>
        </form>
        <p>
          <a href="/privacy">Privacy notes</a>
        </p>
      </section>
    </>
  );
}
