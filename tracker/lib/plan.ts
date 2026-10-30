import { addDays, daysBetween, trainingDay, weekdayIndex } from "@/lib/engine/dates";

const WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export function weekdayName(iso: string): string {
  return WEEKDAYS[weekdayIndex(iso)] ?? "Monday";
}

export function shortWeekday(iso: string): string {
  return weekdayName(iso).slice(0, 3);
}

/** Next Mon/Wed/Fri that is still inside the 12 weeks. */
export function nextTrainingIso(date: string, startDate: string): string | null {
  for (let offset = 1; offset <= 14; offset += 1) {
    const candidate = addDays(date, offset);
    if (daysBetween(startDate, candidate) > 83) return null;
    if (trainingDay(candidate, startDate)) return candidate;
  }
  return null;
}

/** Monday, Wednesday, and Friday of an athlete week. Week 1 Monday is the start date. */
export function weekTrainingDates(startDate: string, week: number): string[] {
  const monday = addDays(startDate, (week - 1) * 7);
  return [0, 2, 4].map((offset) => addDays(monday, offset));
}

export function displayTitle(title: string): string {
  if (/full body/i.test(title)) return "Full body";
  if (/retest/i.test(title)) return "Retest";
  if (/baseline|assessment/i.test(title)) return "Baseline";
  return title;
}

export function setGuidance(input: {
  targetMin: number;
  targetMax: number;
  setNumber: number;
  previousSameSet: number | null;
  earlierThisSession: number | null;
  value: number;
}): string {
  const range = `Aim for ${input.targetMin}–${input.targetMax}.`;
  if (input.value > input.targetMax) return "Above the range. Nice. Counts as the top.";
  if (input.setNumber === 1) {
    return input.previousSameSet === null ? range : `${range} Last time you did ${input.previousSameSet}.`;
  }
  if (input.earlierThisSession !== null && input.earlierThisSession >= input.targetMax) {
    return `Hit ${input.targetMax} again and this session counts toward moving up.`;
  }
  if (input.earlierThisSession !== null) return `${range} Set ${input.setNumber - 1} was ${input.earlierThisSession}.`;
  return range;
}

export function savedSetLine(input: {
  setNumber: number;
  value: number;
  unit: string;
  queued: boolean;
  exerciseDone: boolean;
  exerciseName: string;
  loggedValues: number[];
  sessionsToward: number | null;
  nextName: string | null;
}): string {
  if (input.queued) return "Saved on this phone. It'll sync when you're back online.";
  const noun = input.unit.startsWith("seconds") ? "seconds" : "reps";
  if (input.exerciseDone) {
    const values = input.loggedValues.join(" and ");
    const toward =
      input.sessionsToward !== null && input.nextName
        ? ` That's ${input.sessionsToward} of 2 sessions toward ${input.nextName}.`
        : "";
    return `${input.exerciseName} done · ${values}.` + toward;
  }
  return `Set ${input.setNumber} saved · ${input.value} ${noun}.`;
}
