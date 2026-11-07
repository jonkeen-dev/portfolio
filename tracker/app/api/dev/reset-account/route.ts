import { eq } from "drizzle-orm";

import { auth } from "@/lib/auth";
import { getDatabase } from "@/lib/db";
import { user } from "@/lib/db/schema";
import { devMailboxEnabled } from "@/lib/env";
import { sameOrigin } from "@/lib/origin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** Dev-only: remove the signed-in account so a later test can sign up cleanly. */
export async function POST(request: Request) {
  if (!devMailboxEnabled()) return new Response("Not found", { status: 404 });
  if (!sameOrigin(request)) return Response.json({ error: "Forbidden" }, { status: 403 });
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });
  await getDatabase().db.delete(user).where(eq(user.id, session.user.id));
  return Response.json({ ok: true });
}
