import { redirect } from "next/navigation";

import { currentProfile, currentSession } from "@/lib/session";

export default async function HomePage() {
  const session = await currentSession();
  if (!session) redirect("/sign-in");
  const profile = await currentProfile(session.user.id);
  redirect(profile ? "/today" : "/setup");
}
