import { readFileSync } from "node:fs";
import path from "node:path";

import type { ExerciseRef, PatternId, WeekTargets } from "./engine/types";

export type CsvRow = Record<string, string>;

/** Minimal RFC-style CSV reader. Handles quotes, commas, and escaped quotes. */
export function parseCsv(text: string): CsvRow[] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  const source = text.replace(/^\uFEFF/, "");
  for (let index = 0; index < source.length; index += 1) {
    const char = source[index]!;
    if (inQuotes) {
      if (char === '"') {
        if (source[index + 1] === '"') {
          field += '"';
          index += 1;
        } else {
          inQuotes = false;
        }
      } else {
        field += char;
      }
      continue;
    }
    if (char === '"') {
      inQuotes = true;
      continue;
    }
    if (char === ",") {
      row.push(field);
      field = "";
      continue;
    }
    if (char === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
      continue;
    }
    if (char === "\r") continue;
    field += char;
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  const [header, ...body] = rows.filter((cells) => cells.some((cell) => cell.length > 0));
  if (!header) return [];
  return body.map((cells) => {
    const record: CsvRow = {};
    header.forEach((key, cellIndex) => {
      record[key] = cells[cellIndex] ?? "";
    });
    return record;
  });
}

export function contentDir(): string {
  return path.join(process.cwd(), "content");
}

export function readContent(name: string): string {
  return readFileSync(path.join(contentDir(), name), "utf8");
}

function emptyToNull(value: string): string | null {
  const trimmed = value.trim();
  return trimmed.length === 0 ? null : trimmed;
}

function range(value: string): { min: number; max: number } {
  const match = /(\d+)\s*-\s*(\d+)/.exec(value);
  if (!match) return { min: 0, max: 0 };
  return { min: Number(match[1]), max: Number(match[2]) };
}

export function loadWeeks(csv = readContent("weeks.csv")): WeekTargets[] {
  return parseCsv(csv).map((row) => {
    const reps = range(row.reps_main ?? "");
    const core = range(row.core_reps_per_side ?? "");
    const hold = range(row.hold_seconds ?? "");
    return {
      week: Number(row.week),
      setsMain: Number(row.sets_main),
      repMin: reps.min,
      repMax: reps.max,
      setsCore: Number(row.sets_core),
      coreRepMin: core.min,
      coreRepMax: core.max,
      holdMin: hold.min,
      holdMax: hold.max,
      levelUpsAllowed: row.level_ups_allowed === "1",
      isDeload: row.is_deload === "1",
      phaseId: row.phase_id ?? "",
      focus: row.focus ?? "",
      coachNote: row.coach_note ?? "",
      tempo: row.tempo ?? "",
      restSeconds: row.rest_seconds ?? "",
      targetRir: row.target_rir ?? "",
    };
  });
}

export function loadExercises(csv = readContent("exercises.csv")): ExerciseRef[] {
  return parseCsv(csv).map((row) => ({
    id: row.id ?? "",
    name: row.name ?? "",
    patternId: (row.pattern ?? "") as PatternId,
    level: Number(row.level || 0),
    unit: row.unit ?? "",
    equipment: row.equipment ?? "none",
    progressionId: emptyToNull(row.progression_id ?? ""),
    regressionId: emptyToNull(row.regression_id ?? ""),
    noBarAlternativeId: emptyToNull(row.no_bar_alternative_id ?? ""),
  }));
}

export type SampleRow = {
  date: string;
  athleteSlot: number;
  day: string;
  exerciseId: string;
  sets: Array<number | null>;
  rir: number | null;
  done: boolean;
  notes: string;
};

export function loadSampleLog(csv = readContent("sample_log.csv")): SampleRow[] {
  return parseCsv(csv).map((row) => ({
    date: row.date ?? "",
    athleteSlot: Number(row.athlete_slot),
    day: row.day ?? "",
    exerciseId: row.exercise_id ?? "",
    sets: ["set1", "set2", "set3", "set4"].map((key) => {
      const raw = row[key] ?? "";
      return raw === "" ? null : Number(raw);
    }),
    rir: row.rir === "" ? null : Number(row.rir),
    done: row.done === "✓" || row.done === "v" || row.done?.toLowerCase() === "yes",
    notes: row.notes ?? "",
  }));
}

export function exerciseMap(exercises: ExerciseRef[]): Map<string, ExerciseRef> {
  return new Map(exercises.map((exercise) => [exercise.id, exercise]));
}

export function youtubeId(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (parsed.hostname === "youtu.be") {
      return parsed.pathname.split("/").filter(Boolean)[0] ?? null;
    }
    const value = parsed.searchParams.get("v");
    return value && value.length > 0 ? value : null;
  } catch {
    return null;
  }
}
