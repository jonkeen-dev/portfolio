import { ButtonLink } from "@/components/ui/button";
import { OptionalShell } from "@/components/optional-shell";
import { PageHeader } from "@/components/ui/page-header";
import { currentSession } from "@/lib/session";

export default async function NotFound() {
  const session = await currentSession();
  return (
    <OptionalShell>
      <PageHeader title="That page doesn't exist." />
      <ButtonLink href={session ? "/today" : "/sign-in"} variant="primary">
        {session ? "Go to Today" : "Sign in"}
      </ButtonLink>
    </OptionalShell>
  );
}
