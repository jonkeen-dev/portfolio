import { headers } from "next/headers";

import { Shell } from "@/components/shell";
import { currentProfile, currentSession } from "@/lib/session";

/** App chrome for routes that stay reachable while signed out. */
export async function OptionalShell({ children }: { children: React.ReactNode }) {
  const session = await currentSession();
  const path = (await headers()).get("x-pathname") ?? "";
  const profile = session ? await currentProfile(session.user.id) : null;
  if (session && profile) {
    const prefs = (profile.prefs ?? {}) as { reduceMotion?: boolean };
    return (
      <div data-reduce-motion={prefs.reduceMotion ? "1" : "0"}>
        <Shell path={path} showNav>
          <main id="main" tabIndex={-1} className="page page-with-nav">
            {children}
          </main>
        </Shell>
      </div>
    );
  }
  return (
    <main id="main" tabIndex={-1} className="page">
      {children}
    </main>
  );
}
