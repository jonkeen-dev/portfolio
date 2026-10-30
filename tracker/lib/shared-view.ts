import type { Dashboard } from "@/lib/engine/analytics";
import { formatWeekdayDate } from "@/lib/format";
import { formatHoldClock, formatReps } from "@/lib/progress";

import type { PublicLog } from "./db/access";
import type { SharedStats } from "@/components/public-profile-view";

export function sharedStats(stats: Dashboard): SharedStats {
  return {
    sessions: String(stats.sessionsCompleted),
    sessionsAside: `of ${stats.sessionsScheduled}`,
    streak: String(stats.currentStreak),
    streakAside: `(best ${stats.bestStreak})`,
    reps: formatReps(stats.totalReps),
    holds: formatHoldClock(stats.holdMinutes * 60),
  };
}

export function sessionsFromLogs(logs: PublicLog[]): { key: string; line: string }[] {
  const counts = new Map<string, number>();
  for (const log of logs) counts.set(log.date, (counts.get(log.date) ?? 0) + 1);
  return [...counts.entries()]
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([date, exercises]) => ({
      key: date,
      line: `${formatWeekdayDate(date)} · ${exercises === 1 ? "1 exercise" : `${exercises} exercises`}`,
    }));
}
