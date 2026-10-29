/** Pure progression types. No I/O. Mirrors the Excel Level Tracker rules. */

export type PatternId = "push" | "pull" | "squat" | "hinge" | "core" | "lateral_core";

export type WeekTargets = {
  week: number;
  setsMain: number;
  repMin: number;
  repMax: number;
  setsCore: number;
  coreRepMin: number;
  coreRepMax: number;
  holdMin: number;
  holdMax: number;
  levelUpsAllowed: boolean;
  isDeload: boolean;
  phaseId: string;
  focus: string;
  coachNote: string;
  tempo: string;
  restSeconds: string;
  targetRir: string;
};

export type ExerciseRef = {
  id: string;
  name: string;
  patternId: PatternId | string;
  level: number;
  unit: string;
  equipment: "none" | "bar" | "kettlebell" | string;
  progressionId: string | null;
  regressionId: string | null;
  noBarAlternativeId: string | null;
};

/** One exercise log, already ordered. Sets may include blanks for unlogged slots. */
export type ExerciseLogInput = {
  date: string;
  exerciseId: string;
  sets: Array<number | null>;
  prescribedSets: number;
  targetMin: number;
  targetMax: number;
};

export type EngineStatus = "NO_DATA" | "NOT_YET" | "READY" | "HOLD";

export type TooHard = {
  regressionId: string | null;
  message: string;
};

export type EngineResult = {
  status: EngineStatus;
  /** How many of the last two same-exercise logs were all sets at the top. */
  sessionsAtTop: number;
  reason: string;
  nextExerciseId: string | null;
  noBarExerciseId: string | null;
  /** Exercise to offer first. No-bar alternative wins when the athlete has no bar. */
  suggestedExerciseId: string | null;
  tooHard: TooHard | null;
};

export type EngineInput = {
  logs: ExerciseLogInput[];
  levelUpsAllowed: boolean;
  exercises: Map<string, ExerciseRef>;
  hasBar: boolean;
};
