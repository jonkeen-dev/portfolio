import { describe, expect, it } from "vitest";

import { adherencePercent, buildDashboard } from "../lib/engine/analytics";
import { athleteWeek, sessionsScheduled } from "../lib/engine/dates";
import { evaluateProgression } from "../lib/engine/progression";
import { allSetsAtTop, doseFor } from "../lib/engine/targets";
import type { ExerciseLogInput, ExerciseRef, WeekTargets } from "../lib/engine/types";
import {
  exerciseMap,
  loadExercises,
  loadSampleLog,
  loadWeeks,
  type SampleRow,
} from "../lib/content";

const STARTS: Record<number, string> = { 1: "2026-10-05", 2: "2026-10-12" };
const AS_OF = "2026-10-25";

const exercises = loadExercises();
const byId = exerciseMap(exercises);
const weeks = loadWeeks();
const sample = loadSampleLog();

function weekRow(week: number): WeekTargets {
  const row = weeks.find((item) => item.week === week);
  if (!row) throw new Error(`missing week ${week}`);
  return row;
}

function logsFor(slot: number, patternId: string, asOf: string): ExerciseLogInput[] {
  const start = STARTS[slot]!;
  return sample
    .filter((row) => row.athleteSlot === slot && row.date <= asOf && row.done)
    .filter((row) => byId.get(row.exerciseId)?.patternId === patternId)
    .map((row) => toLog(row, start));
}

function toLog(row: SampleRow, start: string): ExerciseLogInput {
  const exercise = byId.get(row.exerciseId);
  if (!exercise) throw new Error(row.exerciseId);
  const week = weekRow(athleteWeek(row.date, start));
  const dose = doseFor(week, exercise.patternId, exercise.unit);
  return {
    date: row.date,
    exerciseId: row.exerciseId,
    sets: row.sets,
    prescribedSets: dose.prescribedSets,
    targetMin: dose.targetMin,
    targetMax: dose.targetMax,
  };
}

function evaluate(slot: number, patternId: string, asOf: string, hasBar = false) {
  const start = STARTS[slot]!;
  return evaluateProgression({
    logs: logsFor(slot, patternId, asOf),
    levelUpsAllowed: weekRow(athleteWeek(asOf, start)).levelUpsAllowed,
    exercises: byId,
    hasBar,
  });
}

describe("week maths", () => {
  it("clamps athlete week and counts Mon/Wed/Fri sessions", () => {
    expect(athleteWeek("2026-10-05", "2026-10-05")).toBe(1);
    expect(athleteWeek("2026-10-25", "2026-10-05")).toBe(3);
    expect(athleteWeek("2026-10-25", "2026-10-12")).toBe(2);
    expect(athleteWeek("2027-02-01", "2026-10-05")).toBe(12);
    expect(sessionsScheduled("2026-10-25", "2026-10-05")).toBe(9);
    expect(sessionsScheduled("2026-10-25", "2026-10-12")).toBe(6);
    expect(sessionsScheduled("2026-10-04", "2026-10-05")).toBe(0);
  });
});

describe("progression engine TC1–TC11", () => {
  it("TC1 Jonathan squat is ready for the bodyweight squat", () => {
    const result = evaluate(1, "squat", AS_OF);
    expect(result.status).toBe("READY");
    expect(result.suggestedExerciseId).toBe("SQ2");
    expect(byId.get("SQ2")?.name).toBe("Bodyweight Squat");
  });

  it("TC2 Jonathan pull is not yet, because the previous session missed the top", () => {
    const result = evaluate(1, "pull", AS_OF);
    expect(result.status).toBe("NOT_YET");
    expect(result.sessionsAtTop).toBe(1);
    expect(result.suggestedExerciseId).toBeNull();
  });

  it("TC3 Jonathan push on 16 Oct is ready for the low incline push-up", () => {
    const result = evaluate(1, "push", "2026-10-16");
    expect(result.status).toBe("READY");
    expect(result.suggestedExerciseId).toBe("PU3");
    expect(byId.get("PU3")?.name).toBe("Low Incline Push-Up");
  });

  it("TC4 Jonathan push on 25 Oct is not yet", () => {
    expect(evaluate(1, "push", AS_OF).status).toBe("NOT_YET");
  });

  it("TC5 Jonathan hinge on 25 Oct is not yet", () => {
    expect(evaluate(1, "hinge", AS_OF).status).toBe("NOT_YET");
  });

  it("TC6 partner push restarts after an exercise change", () => {
    const result = evaluate(2, "push", "2026-10-19");
    expect(result.status).toBe("NOT_YET");
    expect(result.reason).toMatch(/restarts/i);
    expect(result.sessionsAtTop).toBe(0);
  });

  it("TC7 partner side core is not yet and too hard, with no regression", () => {
    const result = evaluate(2, "lateral_core", AS_OF);
    expect(result.status).toBe("NOT_YET");
    expect(result.tooHard).not.toBeNull();
    expect(result.tooHard?.regressionId).toBeNull();
    expect(result.tooHard?.message).toMatch(/shorten the range/i);
  });

  it("TC8 partner hinge is not yet", () => {
    expect(evaluate(2, "hinge", AS_OF).status).toBe("NOT_YET");
  });

  it("TC9 holds the level-up in a deload week even when both sessions are at the top", () => {
    const week = weekRow(4);
    const exercise = byId.get("SQ1")!;
    const dose = doseFor(week, exercise.patternId, exercise.unit);
    const log = (date: string): ExerciseLogInput => ({
      date,
      exerciseId: "SQ1",
      sets: [12, 12],
      prescribedSets: dose.prescribedSets,
      targetMin: dose.targetMin,
      targetMax: dose.targetMax,
    });
    expect(dose.prescribedSets).toBe(2);
    const result = evaluateProgression({
      logs: [log("2026-10-26"), log("2026-10-28")],
      levelUpsAllowed: week.levelUpsAllowed,
      exercises: byId,
      hasBar: false,
    });
    expect(week.levelUpsAllowed).toBe(false);
    expect(allSetsAtTop([12, 12], 2, dose.targetMax)).toBe(true);
    expect(result.status).toBe("HOLD");
    expect(result.suggestedExerciseId).toBeNull();
  });

  it("TC10 treats a short log as not at the top", () => {
    const week = weekRow(3);
    const dose = doseFor(week, "squat", "reps");
    expect(dose.prescribedSets).toBe(3);
    const result = evaluateProgression({
      logs: [
        {
          date: "2026-10-21",
          exerciseId: "SQ1",
          sets: [12, 12, null],
          prescribedSets: 3,
          targetMin: dose.targetMin,
          targetMax: dose.targetMax,
        },
        {
          date: "2026-10-23",
          exerciseId: "SQ1",
          sets: [12, 12, 12],
          prescribedSets: 3,
          targetMin: dose.targetMin,
          targetMax: dose.targetMax,
        },
      ],
      levelUpsAllowed: true,
      exercises: byId,
      hasBar: false,
    });
    expect(result.status).toBe("NOT_YET");
    expect(result.sessionsAtTop).toBe(1);
  });

  it("TC11 offers the no-bar option first when the next exercise needs a bar", () => {
    const week = weekRow(3);
    const exercise = byId.get("PL3")!;
    const dose = doseFor(week, exercise.patternId, exercise.unit);
    const log = (date: string): ExerciseLogInput => ({
      date,
      exerciseId: "PL3",
      sets: [12, 12, 12],
      prescribedSets: dose.prescribedSets,
      targetMin: dose.targetMin,
      targetMax: dose.targetMax,
    });
    const withoutBar = evaluateProgression({
      logs: [log("2026-10-21"), log("2026-10-23")],
      levelUpsAllowed: true,
      exercises: byId,
      hasBar: false,
    });
    expect(withoutBar.status).toBe("READY");
    expect(withoutBar.nextExerciseId).toBe("PL4");
    expect(byId.get("PL4")?.name).toBe("Scapular Pull-Up");
    expect(withoutBar.noBarExerciseId).toBe("PL4N");
    expect(withoutBar.suggestedExerciseId).toBe("PL4N");
    expect(byId.get("PL4N")?.name).toBe("Feet-Elevated Table Row");

    const withBar = evaluateProgression({
      logs: [log("2026-10-21"), log("2026-10-23")],
      levelUpsAllowed: true,
      exercises: byId,
      hasBar: true,
    });
    expect(withBar.suggestedExerciseId).toBe("PL4");
  });
});

describe("dashboard fixtures as of 2026-10-25", () => {
  function fixture(slot: number) {
    const start = STARTS[slot]!;
    const rows = sample.filter((row) => row.athleteSlot === slot && row.done && row.date <= AS_OF);
    const dates = [...new Set(rows.map((row) => row.date))];
    const logs = rows.map((row) => {
      const exercise = byId.get(row.exerciseId)!;
      return {
        date: row.date,
        patternId: exercise.patternId,
        unit: exercise.unit,
        sets: row.sets,
        exerciseId: exercise.id,
        exerciseName: exercise.name,
        rir: row.rir,
      };
    });
    const ready =
      slot === 1
        ? [
            evaluate(1, "squat", AS_OF),
            evaluate(1, "push", AS_OF),
            evaluate(1, "pull", AS_OF),
            evaluate(1, "hinge", AS_OF),
          ].filter((result) => result.status === "READY").length
        : 0;
    return buildDashboard({
      startDate: start,
      asOf: AS_OF,
      completedDates: dates,
      baselineSaved: true,
      retestSaved: false,
      logs,
      levelEvents: [],
      levelUpsReady: ready,
    });
  }

  it("matches Jonathan's dashboard row", () => {
    const dash = fixture(1);
    expect(dash.sessionsCompleted).toBe(9);
    expect(dash.sessionsScheduled).toBe(9);
    expect(adherencePercent(dash.adherence)).toBe(100);
    expect(dash.currentStreak).toBe(3);
    expect(dash.bestStreak).toBe(3);
    expect(dash.levelUpsReady).toBe(1);
    expect(dash.totalReps).toBe(917);
    expect(dash.holdMinutes).toBeCloseTo(2.8, 1);
  });

  it("matches the partner's dashboard row", () => {
    const dash = fixture(2);
    expect(dash.sessionsCompleted).toBe(5);
    expect(dash.sessionsScheduled).toBe(6);
    expect(adherencePercent(dash.adherence)).toBe(83);
    expect(dash.currentStreak).toBe(1);
    expect(dash.bestStreak).toBe(1);
    expect(dash.levelUpsReady).toBe(0);
    expect(dash.totalReps).toBe(336);
    expect(dash.holdMinutes).toBeCloseTo(1.1, 1);
  });
});

describe("exercise references used by the rules", () => {
  it("knows bar equipment and the side-core regression gap", () => {
    const side = byId.get("LC1") as ExerciseRef;
    expect(side.regressionId).toBeNull();
    expect(side.unit.startsWith("seconds")).toBe(true);
    expect(byId.get("PL4")?.equipment).toBe("bar");
    expect(byId.get("PL4")?.noBarAlternativeId).toBe("PL4N");
  });
});
