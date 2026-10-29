export function clampCount(value: number, min = 0, max = 600): number {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, Math.round(value)));
}

export function seedSetValue(
  existing: number | null | undefined,
  previous: number | null | undefined,
  targetMin: number,
): number {
  if (typeof existing === "number") return clampCount(existing);
  if (typeof previous === "number") return clampCount(previous);
  return clampCount(targetMin);
}
