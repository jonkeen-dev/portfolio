import type { WeekTargets } from "./types";

export type Dose = {
  prescribedSets: number;
  targetMin: number;
  targetMax: number;
};

const CORE_PATTERNS = new Set(["core", "lateral_core"]);

/** Prescribed sets and the rep/hold range for one exercise in a given week. */
export function doseFor(week: WeekTargets, patternId: string, unit: string): Dose {
  const prescribedSets = CORE_PATTERNS.has(patternId) ? week.setsCore : week.setsMain;
  if (unit.startsWith("seconds")) {
    return { prescribedSets, targetMin: week.holdMin, targetMax: week.holdMax };
  }
  if (patternId === "core") {
    return { prescribedSets, targetMin: week.coreRepMin, targetMax: week.coreRepMax };
  }
  return { prescribedSets, targetMin: week.repMin, targetMax: week.repMax };
}

/**
 * All sets at top: at least S non-empty sets, and at least S of them ≥ max.
 * Blank slots do not count. Extra sets beyond S are allowed.
 */
export function allSetsAtTop(
  sets: Array<number | null>,
  prescribedSets: number,
  targetMax: number,
): boolean {
  const logged = sets.filter((value): value is number => typeof value === "number");
  if (logged.length < prescribedSets) return false;
  const atTop = logged.filter((value) => value >= targetMax).length;
  return atTop >= prescribedSets;
}

export function parseRange(text: string): { min: number; max: number } | null {
  const match = /(\d+)\s*-\s*(\d+)/.exec(text);
  if (!match) return null;
  return { min: Number(match[1]), max: Number(match[2]) };
}
