import { DeleteAccount } from "@/components/delete-account";
import { ButtonLink } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";

export const metadata = { title: "Your data" };

export default function DataPage() {
  return (
    <>
      <PageHeader title="Your data" />
      <div className="action-row">
        <ButtonLink href="/api/export?format=csv">Download CSV</ButtonLink>
        <ButtonLink href="/api/export?format=xlsx">Download spreadsheet</ButtonLink>
      </div>
      <p>
        <a href="/privacy">Privacy notes</a>
      </p>
      <section className="card danger-zone" aria-labelledby="delete-heading">
        <h2 id="delete-heading">Delete account</h2>
        <p>This deletes your training log and signs you out. It can&apos;t be undone.</p>
        <DeleteAccount />
      </section>
    </>
  );
}
