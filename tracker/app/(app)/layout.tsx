import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { Shell } from "@/components/shell";
import { SessionTimerProvider } from "@/components/session-timer";
import { currentProfile, currentSession } from "@/lib/session";
import { readWorkoutPrefs } from "@/lib/workout-prefs";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await currentSession();
  if (!session) redirect("/sign-in");
  const path = (await headers()).get("x-pathname") ?? "";
  const profile = await currentProfile(session.user.id);
  if (!profile && path !== "/setup") redirect("/setup");
  if (profile && path === "/setup") redirect("/today");
  const prefs = readWorkoutPrefs(profile?.prefs);
  return (
    <SessionTimerProvider prefs={prefs}>
      <div data-reduce-motion={prefs.reduceMotion ? "1" : "0"}>
        <Shell path={path} showNav={Boolean(profile)}>
          <main id="main" tabIndex={-1} className={profile ? "page page-with-nav" : "page"}>
            {children}
          </main>
        </Shell>
      </div>
    </SessionTimerProvider>
  );
}
