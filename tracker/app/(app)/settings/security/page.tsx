import { desc, eq } from "drizzle-orm";

import { PasskeyButton, SignOutButton } from "@/components/account-tools";
import { PageHeader } from "@/components/ui/page-header";
import { sessionCreatedAtIsFresh } from "@/lib/passkey-errors";
import { PASSKEY_SECURITY_COPY } from "@/lib/passkey-support";
import { getDatabase } from "@/lib/db";
import { auditEvents } from "@/lib/db/schema";
import { formatZonedDateTime } from "@/lib/format";
import { currentProfile, currentSession } from "@/lib/session";

export const metadata = { title: "Security" };

const LABELS: Record<string, string> = {
  sign_in: "Signed in",
  visibility_changed: "Sharing updated",
  invite_sent: "Invite sent",
  level_manual: "Level set manually",
  account_deleted: "Account deleted",
};

export default async function SecurityPage() {
  const session = await currentSession();
  if (!session) return null;
  const profile = await currentProfile(session.user.id);
  if (!profile) return null;
  const audits = await getDatabase()
    .db.select()
    .from(auditEvents)
    .where(eq(auditEvents.userId, session.user.id))
    .orderBy(desc(auditEvents.at))
    .limit(12);
  return (
    <>
      <PageHeader title="Security" />
      <p>{PASSKEY_SECURITY_COPY}</p>
      <PasskeyButton sessionFresh={sessionCreatedAtIsFresh(session.session.createdAt)} />
      <SignOutButton />
      <h2>Recent activity</h2>
      <ul className="plain-list">
        {audits.map((event) => (
          <li key={event.id}>
            {LABELS[event.type] ?? event.type} · {formatZonedDateTime(event.at, profile.timezone)}
            {event.uaFamily ? ` · ${event.uaFamily}` : ""}
          </li>
        ))}
      </ul>
    </>
  );
}
