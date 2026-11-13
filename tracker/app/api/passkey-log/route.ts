import { z } from "zod";

import { auth } from "@/lib/auth";
import { logPasskeyFailure } from "@/lib/passkey-errors";
import { sameOrigin } from "@/lib/origin";
import { rateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const bodySchema = z.object({
  stage: z.literal("ceremony"),
  status: z.number().int().min(0).max(599),
  code: z.string().max(80),
});

/** Record a browser ceremony failure. The body may only carry a stage, status, and code. */
export async function POST(request: Request) {
  if (!sameOrigin(request)) return Response.json({ ok: false }, { status: 403 });
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) return Response.json({ ok: false }, { status: 401 });
  const limit = rateLimit(`passkey-log:${session.user.id}`, 30, 60 * 1000);
  if (!limit.ok) return new Response(null, { status: 429 });
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return new Response(null, { status: 400 });
  logPasskeyFailure(parsed.data);
  return new Response(null, { status: 204 });
}
