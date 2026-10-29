import { redirect } from "next/navigation";

import { PageHeader } from "@/components/ui/page-header";
import { currentSession } from "@/lib/session";

import { SignInForm } from "./sign-in-form";

export const metadata = { title: "Sign in" };

const EXPIRED = "That link has expired or was already used. Send yourself a new one.";

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await currentSession();
  if (session) redirect("/today");
  const { error } = await searchParams;
  return (
    <main id="main" tabIndex={-1} className="page">
      <PageHeader title="Calisthenics Tracker" description="Your 12-week bodyweight program and training log." />
      {error ? (
        <p className="alert" role="alert">
          {EXPIRED}
        </p>
      ) : null}
      <SignInForm />
    </main>
  );
}
