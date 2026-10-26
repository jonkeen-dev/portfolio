import { redirect } from "next/navigation";

import { currentSession } from "@/lib/session";

import { SignInForm } from "./sign-in-form";

export const metadata = { title: "Sign in" };

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
      <h1>Sign in</h1>
      <p>Use a passkey, or ask for a one-time email link. Links expire in 10 minutes.</p>
      {error ? (
        <p className="alert" role="alert">
          That link is no longer valid. Request a new one.
        </p>
      ) : null}
      <SignInForm />
    </main>
  );
}
