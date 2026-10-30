import { and, desc, eq, isNull } from "drizzle-orm";
import { redirect } from "next/navigation";

import { CopyLink } from "@/components/copy-link";
import { PageHeader } from "@/components/ui/page-header";
import { SubmitButton } from "@/components/ui/submit-button";
import { copyInviteLink, revokeInvite, sendInvite } from "@/lib/actions";
import { getDatabase } from "@/lib/db";
import { invites } from "@/lib/db/schema";
import { formatInstantDate } from "@/lib/format";
import { currentProfile, currentSession, userRole } from "@/lib/session";

export const metadata = { title: "People" };

export default async function PeoplePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; sent?: string; link?: string }>;
}) {
  const session = await currentSession();
  if (!session) return null;
  if (userRole(session.user) !== "owner") redirect("/settings");
  const profile = await currentProfile(session.user.id);
  if (!profile) return null;
  const { error, sent, link } = await searchParams;
  const pending = await getDatabase()
    .db.select()
    .from(invites)
    .where(and(eq(invites.invitedBy, session.user.id), isNull(invites.acceptedAt), isNull(invites.revokedAt)))
    .orderBy(desc(invites.createdAt));
  return (
    <>
      <PageHeader title="People" description="Invite one training partner. They'll get an email with a sign-in link." />
      {error ? (
        <p className="alert" role="alert">
          {error}
        </p>
      ) : null}
      {sent ? (
        <p className="toast" role="status">
          Invite sent to {sent}. It works for 72 hours.
        </p>
      ) : null}
      {link ? <CopyLink url={link} label="Copy invite link" /> : null}
      <form className="stack" action={sendInvite}>
        <label htmlFor="invite-email">
          Email
          <input id="invite-email" name="email" type="email" autoComplete="email" required />
        </label>
        <SubmitButton variant="secondary" pendingLabel="Sending…">
          Send invite
        </SubmitButton>
      </form>
      <ul className="plain-list">
        {pending.map((invite) => (
          <li key={invite.id} className="card stack">
            <p>
              {invite.email} · expires {formatInstantDate(invite.expiresAt, profile.timezone)}
            </p>
            <div className="action-row">
              <form action={copyInviteLink}>
                <input type="hidden" name="email" value={invite.email} />
                <SubmitButton variant="secondary" pendingLabel="Copying…">
                  Copy invite link
                </SubmitButton>
              </form>
              <form action={revokeInvite}>
                <input type="hidden" name="inviteId" value={invite.id} />
                <SubmitButton variant="ghost" pendingLabel="Canceling…">
                  Cancel invite
                </SubmitButton>
              </form>
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}
