import { OptionalShell } from "@/components/optional-shell";
import { Keep } from "@/components/ui/keep";
import { PageHeader } from "@/components/ui/page-header";

export const metadata = { title: "Privacy" };

export default function PrivacyPage() {
  return (
    <OptionalShell>
      <PageHeader title="Privacy" description="This log is private unless you share it." />
      <ul className="prose-list">
        <li>
          <Keep text="Sign-in uses a passkey or a one-time email link. There is no password." />
        </li>
        <li>Session cookies stay on this site. The address bar host is the only one that can read them.</li>
        <li>Stored network data is a hash of the IP and a browser family, not the full user agent.</li>
        <li>Demo videos load from YouTube only after you press play.</li>
        <li>You can download your sets or delete the account from Settings.</li>
        <li>Search engines are asked to skip your page unless you turn indexing on.</li>
      </ul>
      <p>
        <a href="/sign-in">Sign in</a>
      </p>
    </OptionalShell>
  );
}
