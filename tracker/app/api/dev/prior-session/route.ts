import { and, eq } from "drizzle-orm";

import { auth } from "@/lib/auth";
import { createDal } from "@/lib/db/access";
import { getDatabase } from "@/lib/db";
import { athleteProfiles, exercises, weeks, workoutSessions } from "@/lib/db/schema";
import { athleteWeek, trainingDay } from "@/lib/engine/dates";
import { doseFor } from "@/lib/engine/targets";
import type { WeekTargets } from "@/lib/engine/types";
import { devMailboxEnabled } from "@/lib/env";
import { sameOrigin } from "@/lib/origin";
import { priorBody } from "@/lib/validators";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!devMailboxEnabled()) return new Response("Not found", { status: 404 });
  if (!sameOrigin(request)) return Response.json({ error: "Forbidden" }, { status: 403 });
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = priorBody.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Invalid request" }, { status: 400 });
  const db = getDatabase().db;
  const [profile] = await db
    .select()
    .from(athleteProfiles)
    .where(eq(athleteProfiles.userId, session.user.id))
    .limit(1);
  if (!profile) return Response.json({ error: "Finish setup first." }, { status: 400 });
  const [exercise] = await db.select().from(exercises).where(eq(exercises.id, parsed.data.exerciseId)).limit(1);
  if (!exercise) return Response.json({ error: "Not found" }, { status: 404 });
  const weekNumber = athleteWeek(parsed.data.date, profile.startDate);
  const [week] = await db
    .select()
    .from(weeks)
    .where(and(eq(weeks.programId, profile.programId), eq(weeks.week, weekNumber)))
    .limit(1);
  if (!week) return Response.json({ error: "Not found" }, { status: 404 });
  const targets: WeekTargets = {
    week: week.week,
    setsMain: week.setsMain,
    repMin: week.repMin,
    repMax: week.repMax,
    setsCore: week.setsCore,
    coreRepMin: week.coreRepMin,
    coreRepMax: week.coreRepMax,
    holdMin: week.holdMin,
    holdMax: week.holdMax,
    levelUpsAllowed: week.levelUpsAllowed,
    isDeload: week.isDeload,
    phaseId: week.phaseId,
    focus: week.focus,
    coachNote: week.coachNote,
    tempo: week.tempo,
    restSeconds: week.restSeconds,
    targetRir: week.targetRir,
  };
  const dose = doseFor(targets, exercise.patternId, exercise.unit);
  const dal = createDal(db);
  const day = trainingDay(parsed.data.date, profile.startDate);
  for (let index = 0; index < parsed.data.sets.length; index += 1) {
    const saved = await dal.saveSet({
      userId: session.user.id,
      date: parsed.data.date,
      exerciseId: exercise.id,
      block: "A1",
      order: 1,
      setNumber: index + 1,
      value: parsed.data.sets[index]!,
      rir: null,
      prescribedSets: dose.prescribedSets,
      targetMin: dose.targetMin,
      targetMax: dose.targetMax,
      day,
      sessionType: "workout",
    });
    if (!saved.ok) return Response.json({ error: saved.error }, { status: 400 });
  }
  await db
    .update(workoutSessions)
    .set({ completedAt: new Date() })
    .where(
      and(
        eq(workoutSessions.userId, session.user.id),
        eq(workoutSessions.date, parsed.data.date),
        eq(workoutSessions.type, "workout"),
      ),
    );
  return Response.json({ ok: true });
}
