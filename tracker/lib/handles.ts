import { eq } from "drizzle-orm";

import type { AppDatabase } from "./db";
import { athleteProfiles } from "./db/schema";

import { writeIndexableFile } from "./indexable-file";

const HANDLE = /^[a-z0-9][a-z0-9-]{1,28}[a-z0-9]$/;

export function normalizeHandle(value: string): string {
  return value.trim().toLowerCase();
}

export function validHandle(value: string): boolean {
  return HANDLE.test(normalizeHandle(value));
}

/** Mirrors public handles for the edge header. Page content still comes from Postgres. */
export async function refreshIndexableHandles(db: AppDatabase): Promise<void> {
  const rows = await db
    .select({
      handle: athleteProfiles.publicHandle,
      allow: athleteProfiles.allowIndexing,
    })
    .from(athleteProfiles)
    .where(eq(athleteProfiles.visibility, "public"));
  const handles = rows.filter((row) => row.handle).map((row) => row.handle!.toLowerCase());
  const indexable = rows
    .filter((row) => row.allow && row.handle)
    .map((row) => row.handle!.toLowerCase());
  writeIndexableFile({ handles, indexable });
}
