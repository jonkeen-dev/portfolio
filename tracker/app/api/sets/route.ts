import { auth } from "@/lib/auth";
import { createDal } from "@/lib/db/access";
import { getDatabase } from "@/lib/db";
import { sameOrigin } from "@/lib/origin";
import { clientKey, rateLimit } from "@/lib/rate-limit";
import { setBody } from "@/lib/validators";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!sameOrigin(request)) return Response.json({ error: "Forbidden" }, { status: 403 });
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const limit = rateLimit(`sets:${session.user.id}:${clientKey(request.headers, "sets")}`, 120, 60_000);
  if (!limit.ok) return Response.json({ error: "Too many requests" }, { status: 429 });
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }
  const parsed = setBody.safeParse(json);
  if (!parsed.success) return Response.json({ error: "Invalid request" }, { status: 400 });
  const body = parsed.data;
  const result = await createDal(getDatabase().db).saveSet({
    userId: session.user.id,
    date: body.date,
    exerciseId: body.exerciseId,
    block: body.block,
    order: body.order,
    setNumber: body.setNumber,
    value: body.value,
    rir: body.rir,
    prescribedSets: body.prescribedSets,
    targetMin: body.targetMin,
    targetMax: body.targetMax,
    day: body.day,
    sessionType: body.sessionType,
    clientId: body.clientId ?? null,
  });
  if (!result.ok) {
    const status = result.error === "Not found" ? 404 : 400;
    return Response.json({ error: result.error }, { status });
  }
  return Response.json(result);
}
