import { asc, eq } from "drizzle-orm";

import { auth } from "@/lib/auth";
import { getDatabase } from "@/lib/db";
import { exerciseLogs, exercises, setLogs, workoutSessions } from "@/lib/db/schema";
import { toCsv } from "@/lib/csv";
import { buildXlsx } from "@/lib/xlsx";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const db = getDatabase().db;
  const rows = await db
    .select({
      date: workoutSessions.date,
      exercise: exercises.name,
      setNumber: setLogs.setNumber,
      value: setLogs.value,
      rir: exerciseLogs.rir,
      unit: exercises.unit,
    })
    .from(setLogs)
    .innerJoin(exerciseLogs, eq(setLogs.exerciseLogId, exerciseLogs.id))
    .innerJoin(workoutSessions, eq(exerciseLogs.workoutSessionId, workoutSessions.id))
    .innerJoin(exercises, eq(exerciseLogs.exerciseId, exercises.id))
    .where(eq(exerciseLogs.userId, session.user.id))
    .orderBy(asc(workoutSessions.date), asc(exercises.name), asc(setLogs.setNumber));
  const format = new URL(request.url).searchParams.get("format");
  const table = rows.map((row) => ({
    date: row.date,
    exercise: row.exercise,
    set: String(row.setNumber),
    value: String(row.value),
    unit: row.unit,
    rir: row.rir === null ? "" : String(row.rir),
  }));
  if (format === "xlsx") {
    const body = buildXlsx([
      {
        name: "Sets",
        rows: [
          ["date", "exercise", "set", "value", "unit", "rir"],
          ...table.map((row) => [row.date, row.exercise, row.set, row.value, row.unit, row.rir]),
        ],
      },
    ]);
    return new Response(new Uint8Array(body), {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": "attachment; filename=\"training.xlsx\"",
        "Cache-Control": "no-store",
      },
    });
  }
  return new Response(toCsv(table), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": "attachment; filename=\"training.csv\"",
      "Cache-Control": "no-store",
    },
  });
}
