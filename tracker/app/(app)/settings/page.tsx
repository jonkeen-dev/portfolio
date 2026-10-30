import Link from "next/link";

import { PageHeader } from "@/components/ui/page-header";
import { currentSession, userRole } from "@/lib/session";

export const metadata = { title: "Settings" };

const LINKS = [
  { href: "/settings/profile", label: "Profile", detail: "Name, start date, units, and bar" },
  { href: "/settings/workout", label: "Workout", detail: "Rest timer, holds, and vibration" },
  { href: "/settings/sharing", label: "Sharing", detail: "Who can see your progress" },
  { href: "/settings/people", label: "People", detail: "Invite one training partner", owner: true },
  { href: "/settings/appearance", label: "Look and accessibility", detail: "Theme and motion" },
  { href: "/settings/security", label: "Security", detail: "Passkey, sign out, and recent activity" },
  { href: "/settings/data", label: "Your data", detail: "Download or delete your account" },
];

export default async function SettingsPage() {
  const session = await currentSession();
  if (!session) return null;
  const owner = userRole(session.user) === "owner";
  return (
    <>
      <PageHeader title="Settings" />
      <ul className="plain-list">
        {LINKS.filter((link) => owner || !link.owner).map((link) => (
          <li key={link.href}>
            <Link className="session-link" href={link.href}>
              <span>
                <span className="row-title">{link.label}</span>
                <span className="meta">{link.detail}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
