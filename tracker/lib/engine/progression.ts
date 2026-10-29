import { allSetsAtTop } from "./targets";
import type { EngineInput, EngineResult, ExerciseLogInput, ExerciseRef } from "./types";

const SHORTEN = "shorten the range or rest briefly mid-set";

function formatSets(sets: Array<number | null>): string {
  return sets.filter((value): value is number => typeof value === "number").join(", ");
}

function tooHardFor(log: ExerciseLogInput, exercise: ExerciseRef | undefined): EngineResult["tooHard"] {
  const first = log.sets.find((value): value is number => typeof value === "number");
  if (first === undefined || first >= log.targetMin) return null;
  if (!exercise?.regressionId) {
    return { regressionId: null, message: SHORTEN };
  }
  return {
    regressionId: exercise.regressionId,
    message: `try the easier exercise`,
  };
}

function base(partial: Omit<EngineResult, "tooHard"> & { tooHard?: EngineResult["tooHard"] }): EngineResult {
  return { tooHard: null, ...partial };
}

/**
 * Level-up suggestion for one movement.
 * Suggests only — accepting the suggestion is what writes a level_event.
 *
 * R-UP / R-HOLD use the last two logs when they are the same exercise and both
 * have every prescribed set at the top of the range. R-CHANGE restarts the
 * counter when those two logs used different exercises. R-DOWN is independent:
 * the first set of the latest log below the minimum flags the level as too hard.
 */
export function evaluateProgression(input: EngineInput): EngineResult {
  const logs = input.logs;
  if (logs.length === 0) {
    return base({
      status: "NO_DATA",
      sessionsAtTop: 0,
      reason: "No sessions logged yet.",
      nextExerciseId: null,
      noBarExerciseId: null,
      suggestedExerciseId: null,
    });
  }

  const last = logs[logs.length - 1]!;
  const lastExercise = input.exercises.get(last.exerciseId);
  const hard = tooHardFor(last, lastExercise);

  if (logs.length < 2) {
    const atTop = allSetsAtTop(last.sets, last.prescribedSets, last.targetMax) ? 1 : 0;
    return {
      status: "NOT_YET",
      sessionsAtTop: atTop,
      reason:
        atTop === 1
          ? "Keep going (1 of 2 sessions at the top of the range)."
          : "Keep going (0 of 2 sessions at the top of the range).",
      nextExerciseId: null,
      noBarExerciseId: null,
      suggestedExerciseId: null,
      tooHard: hard,
    };
  }

  const previous = logs[logs.length - 2]!;
  const sameExercise = previous.exerciseId === last.exerciseId;
  const previousAtTop = allSetsAtTop(previous.sets, previous.prescribedSets, previous.targetMax);
  const lastAtTop = allSetsAtTop(last.sets, last.prescribedSets, last.targetMax);
  const sessionsAtTop = sameExercise ? Number(previousAtTop) + Number(lastAtTop) : 0;

  if (!sameExercise) {
    return {
      status: "NOT_YET",
      sessionsAtTop: 0,
      reason: "The counter restarts after a change of exercise.",
      nextExerciseId: null,
      noBarExerciseId: null,
      suggestedExerciseId: null,
      tooHard: hard,
    };
  }

  if (!(previousAtTop && lastAtTop)) {
    return {
      status: "NOT_YET",
      sessionsAtTop,
      reason: `Keep going (${sessionsAtTop} of 2 sessions at the top of the range).`,
      nextExerciseId: null,
      noBarExerciseId: null,
      suggestedExerciseId: null,
      tooHard: hard,
    };
  }

  const progressionId = lastExercise?.progressionId ?? null;
  const progression = progressionId ? input.exercises.get(progressionId) : undefined;
  const noBarId = progression?.noBarAlternativeId ?? null;
  const needsBar = progression?.equipment === "bar";
  const suggested = needsBar && !input.hasBar ? noBarId : progressionId;
  const setSummary = `${formatSets(previous.sets)} and ${formatSets(last.sets)}`;

  if (!input.levelUpsAllowed) {
    return {
      status: "HOLD",
      sessionsAtTop: 2,
      reason: `Hold: deload/retest week. ${setSummary} were at the top, and level-ups are paused this week.`,
      nextExerciseId: progressionId,
      noBarExerciseId: noBarId,
      suggestedExerciseId: null,
      tooHard: hard,
    };
  }

  const nextName = progression?.name ?? "the next exercise";
  return {
    status: "READY",
    sessionsAtTop: 2,
    reason: `${setSummary} in your last 2 sessions. Ready for ${nextName}.`,
    nextExerciseId: progressionId,
    noBarExerciseId: noBarId,
    suggestedExerciseId: suggested,
    tooHard: hard,
  };
}
