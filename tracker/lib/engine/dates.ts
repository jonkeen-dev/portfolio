/** Calendar helpers. Dates are YYYY-MM-DD, compared in UTC so time zones cannot shift the week. */

export function parseIsoDate(iso: string): number {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!match) {
    throw new Error(`Invalid date: ${iso}`);
  }
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  return Date.UTC(year, month - 1, day);
}

export function formatIsoDate(utcMs: number): string {
  const date = new Date(utcMs);
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** Whole days from `start` to `date`. Negative when date is before start. */
export function daysBetween(start: string, date: string): number {
  return Math.round((parseIsoDate(date) - parseIsoDate(start)) / 86_400_000);
}

/**
 * Athlete week = clamp(floor((date − start) / 7) + 1, 1, 12).
 * Dates before the start date clamp to week 1.
 */
export function athleteWeek(date: string, startDate: string): number {
  const delta = daysBetween(startDate, date);
  return Math.min(12, Math.max(1, Math.floor(delta / 7) + 1));
}

export function addDays(iso: string, days: number): string {
  return formatIsoDate(parseIsoDate(iso) + days * 86_400_000);
}

/** 0 = Monday … 6 = Sunday, from a YYYY-MM-DD string. */
export function weekdayIndex(iso: string): number {
  const day = new Date(parseIsoDate(iso)).getUTCDay();
  return day === 0 ? 6 : day - 1;
}

export function isMonday(iso: string): boolean {
  return weekdayIndex(iso) === 0;
}

/** Next Monday on or after `iso`. If `iso` is Monday, returns `iso`. */
export function nextMondayOnOrAfter(iso: string): string {
  const index = weekdayIndex(iso);
  return index === 0 ? iso : addDays(iso, 7 - index);
}

/** Training day A/B/C for Mon/Wed/Fri, or null on a rest day. */
export function trainingDay(iso: string, startDate: string): "A" | "B" | "C" | null {
  if (daysBetween(startDate, iso) < 0) return null;
  const index = weekdayIndex(iso);
  if (index === 0) return "A";
  if (index === 2) return "B";
  if (index === 4) return "C";
  return null;
}

/**
 * Sessions scheduled so far on a Mon/Wed/Fri plan.
 * min(36, 3·floor(Δ/7) + [Δ mod 7 ≥ 0] + [≥ 2] + [≥ 4])
 * Returns 0 before the start date.
 */
export function sessionsScheduled(asOf: string, startDate: string): number {
  const delta = daysBetween(startDate, asOf);
  if (delta < 0) return 0;
  const mod = delta % 7;
  const count = 3 * Math.floor(delta / 7) + (mod >= 0 ? 1 : 0) + (mod >= 2 ? 1 : 0) + (mod >= 4 ? 1 : 0);
  return Math.min(36, count);
}
