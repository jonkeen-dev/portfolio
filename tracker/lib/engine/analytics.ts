import { athleteWeek, sessionsScheduled } from "./dates";

export type VolumeLog = {
  date: string;
  patternId: string;
  unit: string;
  sets: Array<number | null>;
  exerciseId: string;
  exerciseName: string;
  rir: number | null;
};

export type LevelEventInput = {
  patternId: string;
  toExerciseId: string;
  reason: "baseline" | "level_up" | "step_down" | "manual";
  at: string;
};

export type DashboardInput = {
  startDate: string;
  asOf: string;
  /** Distinct workout dates with at least one exercise marked done. */
  completedDates: string[];
  baselineSaved: boolean;
  retestSaved: boolean;
  logs: VolumeLog[];
  levelEvents: LevelEventInput[];
  /** Movements currently READY. */
  levelUpsReady: number;
};

export type WeeklyBucket = {
  week: number;
  sessions: number;
  repsByPattern: Record<string, number>;
  holdSeconds: number;
  meanRir: number | null;
};

export type Dashboard = {
  sessionsCompleted: number;
  sessionsScheduled: number;
  adherence: number;
  currentStreak: number;
  bestStreak: number;
  levelUpsReady: number;
  totalReps: number;
  holdMinutes: number;
  weeks: WeeklyBucket[];
};

function sumSets(sets: Array<number | null>): number {
  return sets.reduce<number>((total, value) => total + (typeof value === "number" ? value : 0), 0);
}

function streakSeries(sessionsByWeek: number[]): number[] {
  const streaks: number[] = [];
  for (let index = 0; index < sessionsByWeek.length; index += 1) {
    const sessions = sessionsByWeek[index] ?? 0;
    const previous = index === 0 ? 0 : (streaks[index - 1] ?? 0);
    streaks.push(sessions >= 3 ? previous + 1 : 0);
  }
  return streaks;
}

/**
 * Dashboard metrics. Streak matches the Excel sheet: a week counts when it has
 * 3 sessions (baseline adds one in week 1, retest adds one in week 12). If the
 * current week is still short of 3, the streak shown is the previous week's,
 * so an in-progress week does not break a streak.
 */
export function buildDashboard(input: DashboardInput): Dashboard {
  const currentWeek = athleteWeek(input.asOf, input.startDate);
  const weeks: WeeklyBucket[] = [];
  for (let week = 1; week <= 12; week += 1) {
    weeks.push({ week, sessions: 0, repsByPattern: {}, holdSeconds: 0, meanRir: null });
  }

  const datesByWeek = new Map<number, Set<string>>();
  for (const date of input.completedDates) {
    const week = athleteWeek(date, input.startDate);
    const bucket = datesByWeek.get(week) ?? new Set<string>();
    bucket.add(date);
    datesByWeek.set(week, bucket);
  }
  for (const [week, dates] of datesByWeek) {
    const row = weeks[week - 1];
    if (row) row.sessions = dates.size;
  }
  if (input.baselineSaved && weeks[0]) weeks[0].sessions += 1;
  if (input.retestSaved && weeks[11]) weeks[11].sessions += 1;

  const rirByWeek = new Map<number, number[]>();
  let totalReps = 0;
  let holdSeconds = 0;
  for (const log of input.logs) {
    const week = athleteWeek(log.date, input.startDate);
    const row = weeks[week - 1];
    const amount = sumSets(log.sets);
    if (log.unit.startsWith("seconds")) {
      holdSeconds += amount;
      if (row) row.holdSeconds += amount;
    } else if (log.unit.startsWith("reps")) {
      totalReps += amount;
      if (row) row.repsByPattern[log.patternId] = (row.repsByPattern[log.patternId] ?? 0) + amount;
    }
    if (typeof log.rir === "number" && row) {
      const list = rirByWeek.get(week) ?? [];
      list.push(log.rir);
      rirByWeek.set(week, list);
    }
  }
  for (const [week, values] of rirByWeek) {
    const row = weeks[week - 1];
    if (!row || values.length === 0) continue;
    row.meanRir = values.reduce((sum, value) => sum + value, 0) / values.length;
  }

  const sessionsByWeek = weeks.map((week) => week.sessions);
  const streaks = streakSeries(sessionsByWeek);
  const bestStreak = streaks.reduce((best, value) => Math.max(best, value), 0);
  const currentSessions = sessionsByWeek[currentWeek - 1] ?? 0;
  const currentStreak =
    currentWeek < 1
      ? 0
      : currentSessions >= 3
        ? (streaks[currentWeek - 1] ?? 0)
        : currentWeek > 1
          ? (streaks[currentWeek - 2] ?? 0)
          : 0;

  const sessionsCompleted =
    new Set(input.completedDates).size + (input.baselineSaved ? 1 : 0) + (input.retestSaved ? 1 : 0);
  const scheduled = sessionsScheduled(input.asOf, input.startDate);
  const adherence = scheduled === 0 ? 0 : Math.min(1, sessionsCompleted / scheduled);

  return {
    sessionsCompleted,
    sessionsScheduled: scheduled,
    adherence,
    currentStreak,
    bestStreak,
    levelUpsReady: input.levelUpsReady,
    totalReps,
    holdMinutes: holdSeconds / 60,
    weeks,
  };
}

export type RecordRow = {
  exerciseId: string;
  exerciseName: string;
  bestSet: number;
  bestSetDate: string;
  bestSession: number;
  bestSessionDate: string;
};

export function personalRecords(logs: VolumeLog[]): RecordRow[] {
  const byExercise = new Map<string, RecordRow>();
  for (const log of logs) {
    const values = log.sets.filter((value): value is number => typeof value === "number");
    if (values.length === 0) continue;
    const best = Math.max(...values);
    const total = values.reduce((sum, value) => sum + value, 0);
    const existing = byExercise.get(log.exerciseId);
    if (!existing) {
      byExercise.set(log.exerciseId, {
        exerciseId: log.exerciseId,
        exerciseName: log.exerciseName,
        bestSet: best,
        bestSetDate: log.date,
        bestSession: total,
        bestSessionDate: log.date,
      });
      continue;
    }
    if (best > existing.bestSet) {
      existing.bestSet = best;
      existing.bestSetDate = log.date;
    }
    if (total > existing.bestSession) {
      existing.bestSession = total;
      existing.bestSessionDate = log.date;
    }
  }
  return [...byExercise.values()].sort((a, b) => a.exerciseName.localeCompare(b.exerciseName));
}

export type Insight = { id: string; text: string };

export function insights(input: {
  readyNames: string[];
  recentTotals: Array<{ patternName: string; totals: number[]; bests: number[] }>;
  adherenceLastTwoWeeks: { completed: number; scheduled: number } | null;
  newRecords: string[];
}): Insight[] {
  const found: Insight[] = [];
  for (const name of input.readyNames) {
    found.push({ id: `ready-${name}`, text: `You've earned ${name}.` });
  }
  for (const record of input.newRecords) {
    found.push({ id: `pr-${record}`, text: `New best: ${record}.` });
  }
  for (const pattern of input.recentTotals) {
    if (pattern.totals.length < 3) continue;
    const last = pattern.totals.slice(-3);
    const lastBests = pattern.bests.slice(-3);
    const flatTotal = last[1]! <= last[0]! && last[2]! <= last[1]!;
    const flatBest = lastBests[1]! <= lastBests[0]! && lastBests[2]! <= lastBests[1]!;
    if (flatTotal && flatBest) {
      found.push({
        id: `stall-${pattern.patternName}`,
        text: `${pattern.patternName} has stalled for 3 sessions: try the easier variation for a week, check sleep and recovery, or hold the top position longer.`,
      });
    }
  }
  if (
    input.adherenceLastTwoWeeks &&
    input.adherenceLastTwoWeeks.scheduled > 0 &&
    input.adherenceLastTwoWeeks.completed / input.adherenceLastTwoWeeks.scheduled < 0.67
  ) {
    const { completed, scheduled } = input.adherenceLastTwoWeeks;
    found.push({
      id: "adherence",
      text: `You've done ${completed} of ${scheduled} sessions: shorter sessions still count.`,
    });
  }
  return found;
}

export function adherencePercent(value: number): number {
  return Math.round(value * 100);
}
