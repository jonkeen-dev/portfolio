export type SeriesPoint = {
  date: string;
  patternId: string;
  exerciseId: string;
  exerciseName: string;
  level: number;
  unit: string;
  top: number;
  targetMax: number;
};

export type MovementPoint = {
  date: string;
  exerciseId: string;
  exerciseName: string;
  level: number;
  top: number;
  targetMax: number;
  levelChange: boolean;
};

export type MovementSeries = {
  patternId: string;
  unit: string;
  points: MovementPoint[];
};

export function formatHoldClock(totalSeconds: number): string {
  const seconds = Math.max(0, Math.round(totalSeconds));
  const minutes = Math.floor(seconds / 60);
  const rest = String(seconds % 60).padStart(2, "0");
  return `${minutes}:${rest}`;
}

export function formatReps(value: number): string {
  return new Intl.NumberFormat("en-US").format(Math.round(value));
}

export function recentSessionLine(input: {
  when: string;
  day: string | null;
  exercises: number;
  energy: number | null;
}): string {
  const count = input.exercises === 1 ? "1 exercise" : `${input.exercises} exercises`;
  const parts = [input.when];
  if (input.day) parts.push(`Day ${input.day}`);
  parts.push(count);
  if (typeof input.energy === "number") parts.push(`energy ${input.energy}`);
  return parts.join(" · ");
}

/** One top-set point per movement per day. A later point on a new exercise is a level change. */
export function groupMovementSeries(points: SeriesPoint[]): MovementSeries[] {
  const grouped = new Map<string, SeriesPoint[]>();
  for (const point of points) {
    const list = grouped.get(point.patternId) ?? [];
    const sameDay = list.findIndex((item) => item.date === point.date);
    if (sameDay === -1) list.push(point);
    else if (point.top >= list[sameDay]!.top) list[sameDay] = point;
    grouped.set(point.patternId, list);
  }
  return [...grouped.entries()].map(([patternId, list]) => {
    const sorted = [...list].sort((a, b) => a.date.localeCompare(b.date));
    return {
      patternId,
      unit: sorted.at(-1)?.unit ?? "reps",
      points: sorted.map((point, index) => ({
        date: point.date,
        exerciseId: point.exerciseId,
        exerciseName: point.exerciseName,
        level: point.level,
        top: point.top,
        targetMax: point.targetMax,
        levelChange: index > 0 && sorted[index - 1]!.exerciseId !== point.exerciseId,
      })),
    };
  });
}
