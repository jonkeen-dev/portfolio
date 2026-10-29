import { and, desc, eq, isNull } from "drizzle-orm";

import { PasskeyButton, SignOutButton, ThemeChooser } from "@/components/account-tools";
import { ButtonLink } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { SubmitButton } from "@/components/ui/submit-button";
import { deleteAccount, revokeInvite, saveProfile, saveSharing, sendInvite } from "@/lib/actions";
import { formatCalendarDate, formatInstantDate, formatZonedDateTime } from "@/lib/format";
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
  const deleteError = error && (error.includes("DELETE") || error.toLowerCase().includes("delet")) ? error : null;

  return (
    <>
      <PageHeader title="Settings" />
      {error && !deleteError ? (
        <p className="alert" role="alert">
          {error}
        </p>
      ) : null}
      <section className="card" aria-labelledby="profile-heading">
        <h2 id="profile-heading">Profile</h2>
        <p>Program started {formatCalendarDate(profile.startDate)}. Units are {profile.units}.</p>
        <form className="stack" action={saveProfile}>
          <label htmlFor="displayName">
            Name
            <input id="displayName" name="displayName" autoComplete="name" defaultValue={session.user.name} maxLength={80} />
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
          <SubmitButton variant="secondary">Save profile</SubmitButton>
        </form>
      </section>

      <section className="card" aria-labelledby="share-heading">
        <h2 id="share-heading">Sharing</h2>
        <p>Private is the default. A public page is view only and stays out of search unless you allow indexing.</p>
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
          <SubmitButton>Save sharing</SubmitButton>
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
            <SubmitButton variant="secondary" pendingLabel="Sending…">
              Send invite
            </SubmitButton>
          </form>
          <ul>
            {pending.map((invite) => (
              <li key={invite.id}>
                {invite.email} expires {formatInstantDate(invite.expiresAt, profile.timezone)}
                <form action={revokeInvite}>
                  <input type="hidden" name="inviteId" value={invite.id} />
                  <SubmitButton variant="secondary">Revoke {invite.email}</SubmitButton>
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
              {LABELS[event.type] ?? event.type} · {formatZonedDateTime(event.at, profile.timezone)}
              {event.uaFamily ? ` · ${event.uaFamily}` : ""}
            </li>
          ))}
        </ul>
      </section>

      <section className="card" aria-labelledby="data-heading">
        <h2 id="data-heading">Your data</h2>
        <p className="row">
          <ButtonLink href="/api/export?format=csv">Download CSV</ButtonLink>
          <ButtonLink href="/api/export?format=xlsx">Download spreadsheet</ButtonLink>
        </p>
        <p>
          <a href="/privacy">Privacy notes</a>
        </p>
      </section>

      <section className="card danger-zone" aria-labelledby="delete-heading">
        <h2 id="delete-heading">Delete account</h2>
        <form className="stack" action={deleteAccount}>
          <p>This deletes your training log and signs you out. It can&apos;t be undone. This needs a sign-in from the last 12 hours.</p>
          <label htmlFor="confirm">
            Type DELETE to confirm
            <input id="confirm" name="confirm" autoComplete="off" aria-describedby={deleteError ? "delete-error" : undefined} />
          </label>
          {deleteError ? (
            <p id="delete-error" className="alert" role="alert">
              {deleteError}
            </p>
          ) : null}
          <SubmitButton variant="danger" pendingLabel="Deleting…">
            Delete account
          </SubmitButton>
        </form>
      </section>
    </>
  );
}
