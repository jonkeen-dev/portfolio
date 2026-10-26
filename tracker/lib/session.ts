import { headers } from "next/headers";
import { eq } from "drizzle-orm";

import { auth } from "@/lib/auth";
import { getDatabase } from "@/lib/db";
import { athleteProfiles } from "@/lib/db/schema";

export async function currentSession() {
  return auth.api.getSession({ headers: await headers() });
}

export async function currentProfile(userId: string) {
  const [row] = await getDatabase()
    .db.select()
    .from(athleteProfiles)
    .where(eq(athleteProfiles.userId, userId))
    .limit(1);
  return row ?? null;
}

export function userRole(user: { role?: string | null }): "owner" | "member" {
  return user.role === "owner" ? "owner" : "member";
}
