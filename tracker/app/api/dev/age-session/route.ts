import { eq } from "drizzle-orm";

import { auth } from "@/lib/auth";
import { getDatabase } from "@/lib/db";
import { session as sessionTable } from "@/lib/db/schema";
import { devMailboxEnabled } from "@/lib/env";
import { sameOrigin } from "@/lib/origin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** Dev-only: backdate the current session so passkey registration is no longer fresh. */
export async function POST(request: Request) {
  if (!devMailboxEnabled()) return new Response("Not found", { status: 404 });
  if (!sameOrigin(request)) return Response.json({ error: "Forbidden" }, { status: 403 });
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const createdAt = new Date(Date.now() - 25 * 60 * 60 * 1000);
  await getDatabase()
    .db.update(sessionTable)
    .set({ createdAt })
    .where(eq(sessionTable.id, session.session.id));
  return Response.json({ ok: true });
}
