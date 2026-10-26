import { z } from "zod";

export const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

export const setBody = z.object({
  date: isoDate,
  exerciseId: z.string().min(1).max(40),
  block: z.string().max(20).nullable(),
  order: z.number().int().min(0).max(50),
  setNumber: z.number().int().min(1).max(6),
  value: z.number().int().min(0).max(600),
  rir: z.number().int().min(0).max(5).nullable(),
  prescribedSets: z.number().int().min(1).max(6),
  targetMin: z.number().int().min(0).max(600),
  targetMax: z.number().int().min(0).max(600),
  day: z.string().max(4).nullable(),
  sessionType: z.enum(["workout", "assessment", "retest"]).optional(),
  clientId: z.string().max(80).nullable().optional(),
});

export const priorBody = z.object({
  date: isoDate,
  exerciseId: z.string().min(1).max(40),
  sets: z.array(z.number().int().min(0).max(600)).min(1).max(6),
});

export function isIsoDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const utc = new Date(Date.UTC(year!, month! - 1, day));
  return utc.getUTCFullYear() === year && utc.getUTCMonth() === month! - 1 && utc.getUTCDate() === day;
}
