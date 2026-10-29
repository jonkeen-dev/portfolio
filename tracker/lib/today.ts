import { and, asc, desc, eq, sql } from "drizzle-orm";

import { createDal, type LevelCard, type MovementSuggestion } from "@/lib/db/access";
import { getDatabase } from "@/lib/db";
import {
  assessmentTests,
  athleteProfiles,
  exerciseLogs,
  exercises,
  levelEvents,
  phases,
  prescriptions,
  sessionTemplates,
  setLogs,
  patterns,
  videos,
  weeks,
  workoutSessions,
} from "@/lib/db/schema";
import { athleteWeek, daysBetween, trainingDay } from "@/lib/engine/dates";
import { displayTitle, nextTrainingIso, shortWeekday, weekTrainingDates, weekdayName } from "@/lib/plan";
import { restBounds } from "@/lib/timer";
import { doseFor } from "@/lib/engine/targets";
import type { WeekTargets } from "@/lib/engine/types";

const WORK = new Set(["push", "pull", "squat", "hinge", "core", "lateral_core"]);

export type TodayItem = {
  key: string;
  order: number;
  block: string;
  kind: "work" | "prep";
  exerciseId: string;
  name: string;
  patternId: string;
  unit: string;
  prescribedSets: number;
  targetMin: number;
  targetMax: number;
  restSeconds: number;
  cues: string[];
  logged: Array<number | null>;
  previous: number[];
  exerciseLogId: string | null;
  rir: number | null;
  level: number;
  rungTotal: number;
  patternName: string;
  description: string;
  safetyNote: string | null;
  restLong: number;
  aimRir: number;
  nextName: string | null;
  sessionsAtTop: number;
  video: { youtubeId: string; title: string; watchUrl: string } | null;
};

export type PrepItem = { name: string; detail: string; kind: "warmup" | "cooldown" };

export type WeekDot = { label: string; date: string; done: boolean };

export type NextSession = { date: string; weekday: string; day: string; title: string; minutes: number };

export type TodayTest = {
  id: string;
  name: string;
  patternId: string | null;
  protocol: string;
  unit: string;
};

export type TodayModel = {
  date: string;
  startDate: string;
  week: number;
  phaseName: string;
  day: "A" | "B" | "C" | null;
  title: string;
  focus: string;
  coachNote: string;
  levelUpsAllowed: boolean;
  isDeload: boolean;
  sessionType: "workout" | "assessment" | "retest" | "rest";
  completed: boolean;
  outside: boolean;
  rest: boolean;
  items: TodayItem[];
  prep: PrepItem[];
  tests: TodayTest[];
  estMinutes: number;
  weekDots: WeekDot[];
  nextSession: NextSession | null;
  exerciseChoices: Array<{ id: string; name: string; patternId: string; level: number }>;
  suggestions: MovementSuggestion[];
  levels: LevelCard[];
};

function weekTargets(row: typeof weeks.$inferSelect): WeekTargets {
  return {
    week: row.week,
    setsMain: row.setsMain,
    repMin: row.repMin,
    repMax: row.repMax,
    setsCore: row.setsCore,
    coreRepMin: row.coreRepMin,
    coreRepMax: row.coreRepMax,
    holdMin: row.holdMin,
    holdMax: row.holdMax,
    levelUpsAllowed: row.levelUpsAllowed,
    isDeload: row.isDeload,
    phaseId: row.phaseId,
    focus: row.focus,
    coachNote: row.coachNote,
    tempo: row.tempo,
    restSeconds: row.restSeconds,
    targetRir: row.targetRir,
  };
}

export function restSecondsOf(text: string | null | undefined): number {
  if (!text) return 60;
  const minutes = /(\d+)\s*min/.exec(text);
  if (minutes) return Number(minutes[1]) * 60;
  const seconds = /(\d+)/.exec(text);
  return seconds ? Number(seconds[1]) : 60;
}

export function todayIso(timeZone: string): string {
  try {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date());
  } catch {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: "UTC",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date());
  }
}

export function inProgram(date: string, startDate: string): boolean {
  const delta = daysBetween(startDate, date);
  return delta >= 0 && delta <= 83;
}

export async function loadToday(userId: string, date: string): Promise<TodayModel | null> {
  const db = getDatabase().db;
  const [profile] = await db.select().from(athleteProfiles).where(eq(athleteProfiles.userId, userId)).limit(1);
  if (!profile) return null;

  const weekNumber = athleteWeek(date, profile.startDate);
  const day = trainingDay(date, profile.startDate);
  const [weekRow] = await db
    .select()
    .from(weeks)
    .where(and(eq(weeks.programId, profile.programId), eq(weeks.week, weekNumber)))
    .limit(1);
  const [phase] = weekRow
    ? await db.select().from(phases).where(eq(phases.id, weekRow.phaseId)).limit(1)
    : [];
  const targets = weekRow ? weekTargets(weekRow) : null;
  const dal = createDal(db);
  const [suggestions, levels, patternRows] = await Promise.all([
    dal.movementSuggestions(userId, date),
    dal.currentLevels(userId),
    db.select({ id: patterns.id, name: patterns.name }).from(patterns),
  ]);
  const patternNames = new Map(patternRows.map((row) => [row.id, row.name]));
  const [weekDots, nextSession] = await Promise.all([
    loadWeekDots(db, userId, profile.startDate, weekNumber),
    loadNextSession(db, profile.startDate, date),
  ]);

  const catalog = await db.select().from(exercises).orderBy(asc(exercises.patternId), asc(exercises.level));
  const byId = new Map(catalog.map((row) => [row.id, row]));
  const choices = catalog
    .filter((row) => WORK.has(row.patternId) && row.equipment !== "kettlebell" && (profile.hasBar || row.equipment !== "bar"))
    .map((row) => ({ id: row.id, name: row.name, patternId: row.patternId, level: row.level }));

  const base: TodayModel = {
    date,
    startDate: profile.startDate,
    week: weekNumber,
    phaseName: phase?.name ?? "",
    day,
    title: "Rest day",
    focus: targets?.focus ?? "",
    coachNote: targets?.coachNote ?? "",
    levelUpsAllowed: targets?.levelUpsAllowed ?? false,
    isDeload: targets?.isDeload ?? false,
    sessionType: "rest",
    completed: false,
    outside: !inProgram(date, profile.startDate),
    rest: !day || !inProgram(date, profile.startDate),
    items: [],
    prep: [],
    tests: [],
    exerciseChoices: choices,
    suggestions,
    levels,
    estMinutes: 0,
    weekDots,
    nextSession,
  };
  if (!day || !targets || base.outside) return base;

  const templateId = `W${String(weekNumber).padStart(2, "0")}-${day}`;
  const [template] = await db.select().from(sessionTemplates).where(eq(sessionTemplates.id, templateId)).limit(1);
  if (!template) return { ...base, rest: true };

  const sessionType = template.type === "assessment" || template.type === "retest" ? template.type : "workout";
  const rows = await db
    .select()
    .from(prescriptions)
    .where(eq(prescriptions.sessionTemplateId, template.id))
    .orderBy(asc(prescriptions.order));

  const latestLevel = new Map<string, string>();
  const events = await db
    .select()
    .from(levelEvents)
    .where(eq(levelEvents.userId, userId))
    .orderBy(desc(levelEvents.at));
  for (const event of events) {
    if (!latestLevel.has(event.patternId)) latestLevel.set(event.patternId, event.toExerciseId);
  }

  const [session] = await db
    .select()
    .from(workoutSessions)
    .where(and(eq(workoutSessions.userId, userId), eq(workoutSessions.date, date), eq(workoutSessions.type, sessionType)))
    .limit(1);
  const logs = session
    ? await db.select().from(exerciseLogs).where(eq(exerciseLogs.workoutSessionId, session.id))
    : [];
  const logIds = logs.map((log) => log.id);
  const sets = logIds.length
    ? await db
        .select()
        .from(setLogs)
        .where(sql`${setLogs.exerciseLogId} in (${sql.join(logIds.map((id) => sql`${id}`), sql`, `)})`)
        .orderBy(asc(setLogs.setNumber))
    : [];
  const setsByLog = new Map<string, Array<{ setNumber: number; value: number }>>();
  for (const set of sets) {
    const list = setsByLog.get(set.exerciseLogId) ?? [];
    list.push(set);
    setsByLog.set(set.exerciseLogId, list);
  }

  const prior = await db
    .select({
      exerciseId: exerciseLogs.exerciseId,
      date: workoutSessions.date,
      setNumber: setLogs.setNumber,
      value: setLogs.value,
    })
    .from(setLogs)
    .innerJoin(exerciseLogs, eq(setLogs.exerciseLogId, exerciseLogs.id))
    .innerJoin(workoutSessions, eq(exerciseLogs.workoutSessionId, workoutSessions.id))
    .where(and(eq(exerciseLogs.userId, userId), sql`${workoutSessions.date} < ${date}`))
    .orderBy(desc(workoutSessions.date), asc(setLogs.setNumber));
  const previous = new Map<string, { date: string; values: number[] }>();
  for (const row of prior) {
    const bucket = previous.get(row.exerciseId);
    if (!bucket) {
      previous.set(row.exerciseId, { date: row.date, values: [] });
    }
    const current = previous.get(row.exerciseId)!;
    if (current.date !== row.date) continue;
    current.values[row.setNumber - 1] = row.value;
  }

  const items: TodayItem[] = [];
  const prep: PrepItem[] = [];
  const videoRows = await db.select().from(videos).where(eq(videos.role, "primary"));
  const videoByExercise = new Map(videoRows.map((row) => [row.exerciseId, row]));
  const aim = aimRir(targets.targetRir);
  for (const row of rows) {
    const patternId = row.patternId ?? "";
    const override = WORK.has(patternId) ? latestLevel.get(patternId) : undefined;
    const exerciseId = override || row.defaultExerciseId;
    const exercise = exerciseId ? byId.get(exerciseId) : undefined;
    if (!exercise) continue;
    if (!WORK.has(exercise.patternId) || row.block === "test") {
      const detail = [row.repsTarget, row.holdTarget, row.notes].filter(Boolean).join(" · ");
      prep.push({ name: exercise.name, detail, kind: row.block === "cooldown" ? "cooldown" : "warmup" });
      continue;
    }
    const dose = doseFor(targets, exercise.patternId, exercise.unit);
    const bounds = restBounds(row.rest || targets.restSeconds);
    const ladder = catalog.filter(
      (choice) =>
        choice.patternId === exercise.patternId &&
        choice.equipment !== "kettlebell" &&
        (profile.hasBar || choice.equipment !== "bar"),
    );
    const log = logs.find((entry) => entry.exerciseId === exercise.id) ?? null;
    const logged: Array<number | null> = Array.from({ length: dose.prescribedSets }, () => null);
    for (const set of setsByLog.get(log?.id ?? "") ?? []) {
      if (set.setNumber >= 1 && set.setNumber <= logged.length) logged[set.setNumber - 1] = set.value;
    }
    const video = videoByExercise.get(exercise.id);
    const next = exercise.progressionId ? byId.get(exercise.progressionId) : undefined;
    const suggestion = suggestions.find((entry) => entry.patternId === exercise.patternId);
    items.push({
      key: row.id,
      order: row.order,
      block: row.block,
      kind: "work",
      exerciseId: exercise.id,
      name: exercise.name,
      patternId: exercise.patternId,
      unit: exercise.unit,
      prescribedSets: dose.prescribedSets,
      targetMin: dose.targetMin,
      targetMax: dose.targetMax,
      restSeconds: bounds.short,
      restLong: bounds.long,
      aimRir: aim,
      cues: exercise.cues,
      description: exercise.description,
      safetyNote: exercise.safetyNote,
      nextName: next?.name ?? null,
      sessionsAtTop: suggestion?.sessionsAtTop ?? 0,
      video:
        video?.youtubeId && video.status === "ok"
          ? { youtubeId: video.youtubeId, title: video.title, watchUrl: video.url }
          : null,
      logged,
      previous: (previous.get(exercise.id)?.values ?? []).filter((value) => typeof value === "number"),
      exerciseLogId: log?.id ?? null,
      rir: log?.rir ?? null,
      level: exercise.level,
      rungTotal: ladder.reduce((max, choice) => Math.max(max, choice.level), 1),
      patternName: patternNames.get(exercise.patternId) ?? exercise.patternId,
    });
  }

  let tests: TodayTest[] = [];
  if (sessionType !== "workout") {
    const allTests = await db.select().from(assessmentTests).orderBy(asc(assessmentTests.sort));
    tests = allTests.map((test) => ({
      id: test.id,
      name: test.name,
      patternId: test.patternId,
      protocol: test.protocol,
      unit: test.unit,
    }));
  }

  return {
    ...base,
    title: template.title,
    sessionType,
    completed: Boolean(session?.completedAt),
    rest: false,
    items,
    prep,
    tests,
    estMinutes: template.estMinutes,
  };
}

function aimRir(text: string): number {
  const match = /(\d+)/.exec(text);
  return match ? Number(match[1]) : 3;
}

async function loadWeekDots(
  db: ReturnType<typeof getDatabase>["db"],
  userId: string,
  startDate: string,
  week: number,
): Promise<WeekDot[]> {
  if (week < 1 || week > 12) return [];
  const dates = weekTrainingDates(startDate, week);
  const rows = await db
    .select({ date: workoutSessions.date, completedAt: workoutSessions.completedAt })
    .from(workoutSessions)
    .where(and(eq(workoutSessions.userId, userId), sql`${workoutSessions.date} in (${sql.join(dates.map((item) => sql`${item}`), sql`, `)})`));
  const done = new Set(rows.filter((row) => row.completedAt).map((row) => row.date));
  return dates.map((item) => ({ label: shortWeekday(item), date: item, done: done.has(item) }));
}

async function loadNextSession(
  db: ReturnType<typeof getDatabase>["db"],
  startDate: string,
  date: string,
): Promise<NextSession | null> {
  const next = nextTrainingIso(date, startDate);
  if (!next) return null;
  const week = athleteWeek(next, startDate);
  const day = trainingDay(next, startDate);
  if (!day) return null;
  const id = `W${String(week).padStart(2, "0")}-${day}`;
  const [template] = await db.select().from(sessionTemplates).where(eq(sessionTemplates.id, id)).limit(1);
  return {
    date: next,
    weekday: weekdayName(next),
    day,
    title: displayTitle(template?.title ?? "Full body"),
    minutes: template?.estMinutes ?? 25,
  };
}
