import { parseCsv, readContent, youtubeId } from "@/lib/content";
import type { AppDatabase } from "@/lib/db";
import {
  assessmentTests,
  exercises,
  patterns,
  phases,
  prescriptions,
  programs,
  sessionTemplates,
  videos,
  weeks,
} from "@/lib/db/schema";

function splitList(value: string): string[] {
  return value
    .split("|")
    .map((part) => part.trim())
    .filter((part) => part.length > 0);
}

function range(value: string): { min: number; max: number } {
  const match = /(\d+)\s*-\s*(\d+)/.exec(value);
  if (!match) return { min: 0, max: 0 };
  return { min: Number(match[1]), max: Number(match[2]) };
}

function empty(value: string | undefined): string | null {
  const trimmed = value?.trim() ?? "";
  return trimmed.length === 0 ? null : trimmed;
}

export async function seedReference(db: AppDatabase): Promise<void> {
  const programJson = JSON.parse(readContent("program.json")) as {
    program: { id: string; version: string; title: string };
    phases: Array<{ id: string; name: string; weeks: number[]; goal: string }>;
    patterns: Array<{ id: string; name: string; muscles: string }>;
  };
  const programId = programJson.program.id;

  await db
    .insert(programs)
    .values({
      id: programId,
      version: programJson.program.version,
      title: programJson.program.title,
      meta: programJson,
    })
    .onConflictDoNothing();

  await db
    .insert(phases)
    .values(
      programJson.phases.map((phase) => ({
        id: phase.id,
        programId,
        name: phase.name,
        weeks: phase.weeks,
        goal: phase.goal,
      })),
    )
    .onConflictDoNothing();

  const patternRows = [
    ...programJson.patterns.map((pattern, index) => ({
      id: pattern.id,
      name: pattern.name,
      muscles: pattern.muscles,
      sort: index,
    })),
    { id: "warmup", name: "Warm-up", muscles: "General", sort: 20 },
    { id: "cooldown", name: "Cool-down", muscles: "General", sort: 21 },
    { id: "mobility", name: "Mobility", muscles: "General", sort: 22 },
  ];
  await db.insert(patterns).values(patternRows).onConflictDoNothing();

  const exerciseRows = parseCsv(readContent("exercises.csv")).map((row) => ({
    id: row.id!,
    name: row.name!,
    patternId: row.pattern!,
    level: Number(row.level || 0),
    track: row.track!,
    unit: row.unit!,
    equipment: row.equipment || "none",
    equipmentNotes: empty(row.equipment_notes),
    defaultDose: empty(row.default_dose),
    description: row.description ?? "",
    cues: splitList(row.cues ?? ""),
    mistakes: splitList(row.mistakes ?? ""),
    regressionTip: empty(row.regression_tip),
    regressionId: empty(row.regression_id),
    progressionId: empty(row.progression_id),
    noBarAlternativeId: empty(row.no_bar_alternative_id),
    safetyNote: empty(row.safety_note),
  }));
  await db.insert(exercises).values(exerciseRows).onConflictDoNothing();

  const weekRows = parseCsv(readContent("weeks.csv")).map((row) => {
    const reps = range(row.reps_main ?? "");
    const core = range(row.core_reps_per_side ?? "");
    const hold = range(row.hold_seconds ?? "");
    return {
      programId,
      week: Number(row.week),
      phaseId: row.phase_id!,
      isDeload: row.is_deload === "1",
      isAssessmentWeek: row.is_assessment_week === "1",
      setsMain: Number(row.sets_main),
      repMin: reps.min,
      repMax: reps.max,
      setsCore: Number(row.sets_core),
      coreRepMin: core.min,
      coreRepMax: core.max,
      holdMin: hold.min,
      holdMax: hold.max,
      targetRir: row.target_rir ?? "",
      restSeconds: row.rest_seconds ?? "",
      tempo: row.tempo ?? "",
      levelUpsAllowed: row.level_ups_allowed === "1",
      focus: row.focus ?? "",
      coachNote: row.coach_note ?? "",
    };
  });
  await db.insert(weeks).values(weekRows).onConflictDoNothing();

  const sessions = parseCsv(readContent("sessions.csv")).map((row) => ({
    id: row.session_id!,
    programId,
    week: Number(row.week),
    day: row.day!,
    weekday: row.weekday!,
    phaseId: row.phase_id!,
    type: row.type!,
    title: row.title!,
    estMinutes: Number(row.est_minutes || 0),
    notes: empty(row.notes),
  }));
  await db.insert(sessionTemplates).values(sessions).onConflictDoNothing();

  const tests = parseCsv(readContent("assessment.csv")).map((row) => ({
    id: row.test_id!,
    name: row.name!,
    patternId: empty(row.pattern),
    type: row.type!,
    protocol: row.protocol!,
    record: row.record!,
    unit: row.unit!,
    cap: empty(row.cap),
    sort: Number(row.order || 0),
  }));
  await db.insert(assessmentTests).values(tests).onConflictDoNothing();

  const prescriptionRows = parseCsv(readContent("prescriptions.csv")).map((row) => ({
    id: `${row.session_id}-${row.order}`,
    sessionTemplateId: row.session_id!,
    order: Number(row.order),
    block: row.block!,
    patternId: empty(row.pattern),
    defaultExerciseId: empty(row.exercise_id),
    sets: row.sets ? Number(row.sets) : null,
    repsTarget: empty(row.reps_target),
    holdTarget: empty(row.hold_seconds_target),
    rest: empty(row.rest),
    targetRir: empty(row.target_rir),
    tempo: empty(row.tempo),
    notes: empty(row.notes),
    testId: empty(row.test_id),
  }));
  for (let index = 0; index < prescriptionRows.length; index += 100) {
    await db.insert(prescriptions).values(prescriptionRows.slice(index, index + 100)).onConflictDoNothing();
  }

  const videoRows = parseCsv(readContent("videos.csv")).map((row) => {
    const url = row.url ?? "";
    const yt = youtubeId(url);
    return {
      id: row.video_id!,
      exerciseId: row.exercise_id!,
      role: row.role!,
      title: row.title!,
      channel: row.channel!,
      url,
      youtubeId: yt,
      duration: empty(row.duration),
      licenseNote: empty(row.license_note),
      verifiedDate: empty(row.verified_date),
      status: yt ? "ok" : "unavailable",
    };
  });
  await db.insert(videos).values(videoRows).onConflictDoNothing();
}
