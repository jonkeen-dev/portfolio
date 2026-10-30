import { and, asc, desc, eq, isNull, type SQL, sql } from "drizzle-orm";

import { buildDashboard, personalRecords, type Dashboard } from "@/lib/engine/analytics";
import { athleteWeek } from "@/lib/engine/dates";
import { evaluateProgression } from "@/lib/engine/progression";
import type { EngineResult } from "@/lib/engine/types";
import { allSetsAtTop } from "@/lib/engine/targets";
import type { ExerciseLogInput, ExerciseRef } from "@/lib/engine/types";
import { refreshIndexableHandles } from "@/lib/handles";

import type { AppDatabase } from "./index";
import {
  athleteProfiles,
  auditEvents,
  exerciseLogs,
  exercises,
  levelEvents,
  setLogs,
  shares,
  user,
  workoutSessions,
} from "./schema";

const NOT_FOUND = "Not found";

async function rowsOf<T>(db: AppDatabase, query: SQL): Promise<T[]> {
  const result = await db.execute(query);
  if (Array.isArray(result)) return result as T[];
  const wrapped = result as { rows?: T[] };
  return wrapped.rows ?? [];
}

export type PublicSection = "stats_charts" | "level_history" | "set_logs";

export type LevelCard = {
  patternId: string;
  patternName: string;
  exerciseId: string;
  exerciseName: string;
  level: number;
  at: string;
  reason: string;
};

export type PublicLog = {
  date: string;
  exerciseName: string;
  sets: number[];
  rir: number | null;
};

export type PublicProfile =
  | { available: false }
  | {
      available: true;
      handle: string;
      displayName: string | null;
      email: string | null;
      allowIndexing: boolean;
      stats: Dashboard | null;
      levels: LevelCard[] | null;
      logs: PublicLog[] | null;
    };

export type MovementSuggestion = EngineResult & {
  patternId: string;
  exerciseId: string;
  exerciseName: string;
  suggestedName: string | null;
  lastTargetMax: number | null;
  unit: string;
};

function id(): string {
  return crypto.randomUUID();
}

async function exerciseCatalog(db: AppDatabase): Promise<Map<string, ExerciseRef & { patternName?: string }>> {
  const rows = await db.select().from(exercises);
  return new Map(
    rows.map((row) => [
      row.id,
      {
        id: row.id,
        name: row.name,
        patternId: row.patternId,
        level: row.level,
        unit: row.unit,
        equipment: row.equipment,
        progressionId: row.progressionId,
        regressionId: row.regressionId,
        noBarAlternativeId: row.noBarAlternativeId,
      },
    ]),
  );
}

export function createDal(db: AppDatabase) {
  async function ownedSession(userId: string, sessionId: string) {
    const [row] = await db
      .select()
      .from(workoutSessions)
      .where(and(eq(workoutSessions.id, sessionId), eq(workoutSessions.userId, userId)))
      .limit(1);
    return row ?? null;
  }

  async function ownedLog(userId: string, logId: string) {
    const [row] = await db
      .select()
      .from(exerciseLogs)
      .where(and(eq(exerciseLogs.id, logId), eq(exerciseLogs.userId, userId)))
      .limit(1);
    return row ?? null;
  }

  return {
    ownedSession,
    ownedLog,

    async listSessions(userId: string) {
      return db
        .select()
        .from(workoutSessions)
        .where(eq(workoutSessions.userId, userId))
        .orderBy(asc(workoutSessions.date));
    },

    async saveSet(input: {
      userId: string;
      date: string;
      exerciseId: string;
      block: string | null;
      order: number;
      setNumber: number;
      value: number;
      rir: number | null;
      prescribedSets: number;
      targetMin: number;
      targetMax: number;
      sessionType?: "workout" | "assessment" | "retest";
      day?: string | null;
      clientId?: string | null;
      exerciseLogId?: string | null;
    }): Promise<{ ok: true; exerciseLogId: string; sessionId: string } | { ok: false; error: string }> {
      if (input.value < 0 || input.value > 600 || input.setNumber < 1 || input.setNumber > 6) {
        return { ok: false, error: "That set is outside the allowed range." };
      }
      const profile = await db
        .select()
        .from(athleteProfiles)
        .where(eq(athleteProfiles.userId, input.userId))
        .limit(1)
        .then((rows) => rows[0]);
      if (!profile) return { ok: false, error: "Finish setup first." };

      let logId = input.exerciseLogId ?? null;
      let sessionId: string;
      if (logId) {
        const log = await ownedLog(input.userId, logId);
        if (!log) return { ok: false, error: NOT_FOUND };
        sessionId = log.workoutSessionId;
      } else {
        const type = input.sessionType ?? "workout";
        const existing = await db
          .select()
          .from(workoutSessions)
          .where(
            and(
              eq(workoutSessions.userId, input.userId),
              eq(workoutSessions.date, input.date),
              eq(workoutSessions.type, type),
            ),
          )
          .limit(1)
          .then((rows) => rows[0]);
        sessionId =
          existing?.id ??
          id();
        if (!existing) {
          await db.insert(workoutSessions).values({
            id: sessionId,
            userId: input.userId,
            date: input.date,
            athleteWeek: athleteWeek(input.date, profile.startDate),
            day: input.day ?? null,
            type,
            clientId: input.clientId ?? null,
          });
        }
        const current = await db
          .select()
          .from(exerciseLogs)
          .where(
            and(
              eq(exerciseLogs.userId, input.userId),
              eq(exerciseLogs.workoutSessionId, sessionId),
              eq(exerciseLogs.exerciseId, input.exerciseId),
            ),
          )
          .limit(1)
          .then((rows) => rows[0]);
        if (current) {
          logId = current.id;
        } else {
          logId = id();
          await db.insert(exerciseLogs).values({
            id: logId,
            userId: input.userId,
            workoutSessionId: sessionId,
            exerciseId: input.exerciseId,
            block: input.block,
            order: input.order,
            prescribedSets: input.prescribedSets,
            targetMin: input.targetMin,
            targetMax: input.targetMax,
          });
        }
      }

      const setId = id();
      await db
        .insert(setLogs)
        .values({ id: setId, exerciseLogId: logId!, setNumber: input.setNumber, value: input.value })
        .onConflictDoUpdate({
          target: [setLogs.exerciseLogId, setLogs.setNumber],
          set: { value: input.value },
        });

      const sets = await db
        .select()
        .from(setLogs)
        .where(eq(setLogs.exerciseLogId, logId!))
        .orderBy(asc(setLogs.setNumber));
      const log = await ownedLog(input.userId, logId!);
      if (!log) return { ok: false, error: NOT_FOUND };
      const values = sets.map((set) => set.value);
      const padded: Array<number | null> = [...values];
      await db
        .update(exerciseLogs)
        .set({
          rir: input.rir ?? log.rir,
          done: true,
          allSetsAtTop: allSetsAtTop(padded, log.prescribedSets, log.targetMax),
          updatedAt: new Date(),
        })
        .where(and(eq(exerciseLogs.id, logId!), eq(exerciseLogs.userId, input.userId)));

      return { ok: true, exerciseLogId: logId!, sessionId };
    },

    async listSets(userId: string, exerciseLogId: string) {
      const log = await ownedLog(userId, exerciseLogId);
      if (!log) return null;
      return db
        .select()
        .from(setLogs)
        .where(eq(setLogs.exerciseLogId, exerciseLogId))
        .orderBy(asc(setLogs.setNumber));
    },

    async movementSuggestions(userId: string, asOf: string): Promise<MovementSuggestion[]> {
      const profile = await db
        .select()
        .from(athleteProfiles)
        .where(eq(athleteProfiles.userId, userId))
        .limit(1)
        .then((rows) => rows[0]);
      if (!profile) return [];
      const catalog = await exerciseCatalog(db);
      const rows = await db
        .select({
          date: workoutSessions.date,
          exerciseId: exerciseLogs.exerciseId,
          prescribedSets: exerciseLogs.prescribedSets,
          targetMin: exerciseLogs.targetMin,
          targetMax: exerciseLogs.targetMax,
          createdAt: exerciseLogs.createdAt,
          logId: exerciseLogs.id,
        })
        .from(exerciseLogs)
        .innerJoin(workoutSessions, eq(workoutSessions.id, exerciseLogs.workoutSessionId))
        .where(and(eq(exerciseLogs.userId, userId), sql`${workoutSessions.date} <= ${asOf}`))
        .orderBy(asc(workoutSessions.date), asc(exerciseLogs.createdAt));

      const setRows = rows.length
        ? await db
            .select()
            .from(setLogs)
            .where(sql`${setLogs.exerciseLogId} in (${sql.join(rows.map((row) => sql`${row.logId}`), sql`, `)})`)
        : [];
      const setsByLog = new Map<string, number[]>();
      for (const set of setRows) {
        const list = setsByLog.get(set.exerciseLogId) ?? [];
        list[set.setNumber - 1] = set.value;
        setsByLog.set(set.exerciseLogId, list);
      }

      const byPattern = new Map<string, ExerciseLogInput[]>();
      const lastExercise = new Map<string, string>();
      const lastMeta = new Map<string, { targetMax: number; unit: string }>();
      for (const row of rows) {
        const exercise = catalog.get(row.exerciseId);
        if (!exercise) continue;
        const pattern = exercise.patternId;
        const sets = (setsByLog.get(row.logId) ?? []).map((value) => value ?? null);
        const list = byPattern.get(pattern) ?? [];
        list.push({
          date: row.date,
          exerciseId: row.exerciseId,
          sets,
          prescribedSets: row.prescribedSets,
          targetMin: row.targetMin,
          targetMax: row.targetMax,
        });
        byPattern.set(pattern, list);
        lastExercise.set(pattern, row.exerciseId);
        lastMeta.set(pattern, { targetMax: row.targetMax, unit: exercise.unit });
      }

      const weekAllowed = await rowsOf<{ level_ups_allowed: boolean }>(db, sql`
        select level_ups_allowed from weeks
        where program_id = ${profile.programId}
          and week = ${athleteWeek(asOf, profile.startDate)}
        limit 1
      `);
      const allowed = Boolean(weekAllowed[0]?.level_ups_allowed);

      const suggestions: MovementSuggestion[] = [];
      for (const [patternId, logs] of byPattern) {
        const result = evaluateProgression({
          logs,
          levelUpsAllowed: allowed,
          exercises: catalog,
          hasBar: profile.hasBar,
        });
        const exerciseId = lastExercise.get(patternId)!;
        const exercise = catalog.get(exerciseId);
        const suggested = result.suggestedExerciseId ? catalog.get(result.suggestedExerciseId) : undefined;
        const meta = lastMeta.get(patternId);
        suggestions.push({
          ...result,
          patternId,
          exerciseId,
          exerciseName: exercise?.name ?? exerciseId,
          suggestedName: suggested?.name ?? null,
          lastTargetMax: meta?.targetMax ?? null,
          unit: meta?.unit ?? exercise?.unit ?? "reps",
        });
      }
      return suggestions;
    },

    async acceptLevelUp(userId: string, patternId: string, toExerciseId: string, asOf: string) {
      const suggestions = await this.movementSuggestions(userId, asOf);
      const match = suggestions.find((item) => item.patternId === patternId && item.status === "READY");
      if (!match || match.suggestedExerciseId !== toExerciseId) {
        return { ok: false as const, error: "That level-up is no longer available." };
      }
      await db.insert(levelEvents).values({
        id: id(),
        userId,
        patternId,
        fromExerciseId: match.exerciseId,
        toExerciseId,
        reason: "level_up",
        evidence: { reason: match.reason },
        at: new Date(),
      });
      return { ok: true as const };
    },

    async trainingDashboard(userId: string, asOf: string): Promise<Dashboard | null> {
      const profile = await db
        .select()
        .from(athleteProfiles)
        .where(eq(athleteProfiles.userId, userId))
        .limit(1)
        .then((rows) => rows[0]);
      if (!profile) return null;
      const data = await loadVolume(db, userId, asOf);
      const suggestions = await this.movementSuggestions(userId, asOf);
      return buildDashboard({
        startDate: profile.startDate,
        asOf,
        completedDates: data.dates,
        baselineSaved: data.baselineSaved,
        retestSaved: data.retestSaved,
        logs: data.logs,
        levelEvents: [],
        levelUpsReady: suggestions.filter((item) => item.status === "READY").length,
      });
    },

    async records(userId: string, asOf: string) {
      const data = await loadVolume(db, userId, asOf);
      return personalRecords(data.logs);
    },

    async trainingSeries(userId: string, asOf: string) {
      return rowsOf<{
        date: string;
        pattern_id: string;
        exercise_id: string;
        exercise_name: string;
        level: number;
        unit: string;
        target_max: number;
        top: number;
      }>(db, sql`
        select ws.date::text as date, e.pattern_id, e.id as exercise_id, e.name as exercise_name,
               e.level, e.unit, el.target_max, sl.value as top
        from set_logs sl
        join exercise_logs el on el.id = sl.exercise_log_id
        join workout_sessions ws on ws.id = el.workout_session_id
        join exercises e on e.id = el.exercise_id
        where el.user_id = ${userId} and el.done = true and ws.date <= ${asOf} and ws.type = 'workout'
        order by ws.date, e.pattern_id
      `);
    },

    async finishedSessions(userId: string, asOf: string) {
      const rows = await rowsOf<{
        date: string;
        day: string | null;
        energy: number | null;
        exercises: number;
      }>(db, sql`
        select ws.date::text as date, ws.day, ws.energy, count(el.id)::int as exercises
        from workout_sessions ws
        left join exercise_logs el on el.workout_session_id = ws.id and el.done = true
        where ws.user_id = ${userId} and ws.completed_at is not null and ws.date <= ${asOf}
        group by ws.id, ws.date, ws.day, ws.energy
        order by ws.date desc
      `);
      return rows.map((row) => ({
        date: row.date,
        day: row.day,
        energy: row.energy === null ? null : Number(row.energy),
        exercises: Number(row.exercises),
      }));
    },

    async currentLevels(userId: string): Promise<LevelCard[]> {
      return loadCurrentLevels(db, userId);
    },

    async getPublicProfile(handle: string): Promise<PublicProfile> {
      const normalized = handle.trim().toLowerCase();
      const header = await rowsOf<{
        public_handle: string;
        display_name: string | null;
        public_email: string | null;
        visible_sections: string[] | null;
        allow_indexing: boolean;
      }>(db, sql`
        select public_handle, display_name, public_email, visible_sections, allow_indexing
        from v_public_profile
        where lower(public_handle) = ${normalized}
        limit 1
      `);
      const row = header[0];
      if (!row) return { available: false };
      const sections = new Set(row.visible_sections ?? []);
      const owner = await rowsOf<{ user_id: string; start_date: string }>(db, sql`
        select user_id, start_date::text as start_date
        from athlete_profiles
        where lower(public_handle) = ${normalized} and visibility = 'public'
        limit 1
      `);
      const ownerRow = owner[0];
      if (!ownerRow) return { available: false };
      const asOf = new Date().toISOString().slice(0, 10);
      const filled = await fillSections(db, ownerRow.user_id, ownerRow.start_date, sections, asOf);
      return {
        available: true,
        handle: row.public_handle,
        displayName: row.display_name,
        email: row.public_email,
        allowIndexing: row.allow_indexing,
        ...filled,
      };
    },

    async getPartnerView(viewerId: string, ownerId: string): Promise<PublicProfile> {
      if (viewerId === ownerId) return { available: false };
      const [viewer] = await db
        .select()
        .from(user)
        .where(and(eq(user.id, viewerId), isNull(user.deactivatedAt)))
        .limit(1);
      if (!viewer) return { available: false };
      const [profile] = await db
        .select()
        .from(athleteProfiles)
        .where(eq(athleteProfiles.userId, ownerId))
        .limit(1);
      if (!profile || (profile.visibility !== "partner" && profile.visibility !== "public")) {
        return { available: false };
      }
      const [owner] = await db
        .select()
        .from(user)
        .where(and(eq(user.id, ownerId), isNull(user.deactivatedAt)))
        .limit(1);
      if (!owner) return { available: false };
      const sections = new Set(profile.visibleSections);
      const asOf = new Date().toISOString().slice(0, 10);
      const filled = await fillSections(db, ownerId, profile.startDate, sections, asOf);
      return {
        available: true,
        handle: profile.publicHandle ?? "partner",
        displayName: profile.showName ? (owner?.name ?? null) : null,
        email: profile.showEmail ? (owner?.email ?? null) : null,
        allowIndexing: false,
        ...filled,
      };
    },

    async setSharing(input: {
      userId: string;
      visibility: "private" | "partner" | "public";
      sections: PublicSection[];
      handle: string | null;
      showName: boolean;
      showEmail: boolean;
      allowIndexing: boolean;
    }) {
      const handle = input.handle?.trim().toLowerCase() || null;
      if (input.visibility === "public" && !handle) {
        return { ok: false as const, error: "A public profile needs a handle." };
      }
      if (handle) {
        const taken = await rowsOf<{ user_id: string }>(db, sql`
          select user_id from athlete_profiles
          where lower(public_handle) = ${handle} and user_id <> ${input.userId}
          limit 1
        `);
        if (taken[0]) return { ok: false as const, error: "That handle is taken." };
      }
      await db
        .update(athleteProfiles)
        .set({
          visibility: input.visibility,
          visibleSections: input.sections,
          publicHandle: handle,
          showName: input.showName,
          showEmail: input.showEmail,
          allowIndexing: input.visibility === "public" ? input.allowIndexing : false,
          visibilityChangedAt: new Date(),
        })
        .where(eq(athleteProfiles.userId, input.userId));

      await db
        .update(shares)
        .set({ revokedAt: new Date() })
        .where(and(eq(shares.ownerId, input.userId), isNull(shares.revokedAt)));

      if (input.visibility !== "private") {
        const others = await db
          .select({ id: user.id })
          .from(user)
          .where(and(sql`${user.id} <> ${input.userId}`, isNull(user.deactivatedAt)));
        for (const other of others) {
          await db.insert(shares).values({
            id: id(),
            ownerId: input.userId,
            viewerId: other.id,
            revokedAt: null,
          });
        }
      }
      await refreshIndexableHandles(db);
      await db.insert(auditEvents).values({
        id: id(),
        userId: input.userId,
        type: "visibility_changed",
        at: new Date(),
      });
      return { ok: true as const };
    },

    async audit(userId: string | null, type: string, meta?: { ipHash?: string; uaFamily?: string }) {
      await db.insert(auditEvents).values({
        id: id(),
        userId,
        type,
        ipHash: meta?.ipHash,
        uaFamily: meta?.uaFamily,
        at: new Date(),
      });
    },

    async recentAudits(userId: string) {
      return db
        .select()
        .from(auditEvents)
        .where(eq(auditEvents.userId, userId))
        .orderBy(desc(auditEvents.at))
        .limit(20);
    },
  };
}

async function loadCurrentLevels(db: AppDatabase, userId: string): Promise<LevelCard[]> {
  const rows = await rowsOf<{
    pattern_id: string;
    pattern_name: string;
    exercise_id: string;
    exercise_name: string;
    level: number;
    at: Date | string;
    reason: string;
  }>(db, sql`
    select distinct on (le.pattern_id)
      le.pattern_id,
      pa.name as pattern_name,
      le.to_exercise_id as exercise_id,
      ex.name as exercise_name,
      ex.level,
      le.at,
      le.reason
    from level_events le
    join patterns pa on pa.id = le.pattern_id
    join exercises ex on ex.id = le.to_exercise_id
    where le.user_id = ${userId}
    order by le.pattern_id, le.at desc
  `);
  return rows.map((row) => ({
    patternId: row.pattern_id,
    patternName: row.pattern_name,
    exerciseId: row.exercise_id,
    exerciseName: row.exercise_name,
    level: Number(row.level),
    at: typeof row.at === "string" ? row.at.slice(0, 10) : row.at.toISOString().slice(0, 10),
    reason: row.reason,
  }));
}

async function fillSections(
  db: AppDatabase,
  userId: string,
  startDate: string,
  sections: Set<string>,
  asOf: string,
): Promise<{ stats: Dashboard | null; levels: LevelCard[] | null; logs: PublicLog[] | null }> {
  let stats: Dashboard | null = null;
  let levels: LevelCard[] | null = null;
  let logs: PublicLog[] | null = null;
  if (sections.has("stats_charts")) {
    const data = await loadVolume(db, userId, asOf);
    stats = buildDashboard({
      startDate,
      asOf,
      completedDates: data.dates,
      baselineSaved: data.baselineSaved,
      retestSaved: data.retestSaved,
      logs: data.logs,
      levelEvents: [],
      levelUpsReady: 0,
    });
  }
  if (sections.has("level_history")) levels = await loadCurrentLevels(db, userId);
  if (sections.has("set_logs")) logs = await publicLogs(db, userId);
  return { stats, levels, logs };
}

async function loadVolume(db: AppDatabase, userId: string, asOf: string) {
  const rows = await rowsOf<{
    date: string;
    pattern_id: string;
    unit: string;
    exercise_id: string;
    exercise_name: string;
    rir: number | null;
    log_id: string;
    session_type: string;
  }>(db, sql`
    select ws.date::text as date, e.pattern_id, e.unit, e.id as exercise_id, e.name as exercise_name,
           el.rir, el.id as log_id, ws.type as session_type
    from exercise_logs el
    join workout_sessions ws on ws.id = el.workout_session_id
    join exercises e on e.id = el.exercise_id
    where el.user_id = ${userId} and el.done = true and ws.date <= ${asOf}
  `);
  const logIds = rows.map((row) => row.log_id);
  const sets = logIds.length
    ? await db
        .select()
        .from(setLogs)
        .where(sql`${setLogs.exerciseLogId} in (${sql.join(logIds.map((logId) => sql`${logId}`), sql`, `)})`)
    : [];
  const byLog = new Map<string, Array<number | null>>();
  for (const set of sets) {
    const list = byLog.get(set.exerciseLogId) ?? [];
    list[set.setNumber - 1] = set.value;
    byLog.set(set.exerciseLogId, list);
  }
  const dates = [...new Set(rows.filter((row) => row.session_type === "workout").map((row) => row.date))];
  const baseline = await rowsOf<{ n: number }>(db, sql`
    select count(*)::int as n from assessments
    where user_id = ${userId} and phase = 'baseline' and (result_value is not null or result_text is not null or level is not null)
  `);
  const retest = await rowsOf<{ n: number }>(db, sql`
    select count(*)::int as n from assessments
    where user_id = ${userId} and phase = 'retest' and (result_value is not null or result_text is not null or level is not null)
  `);
  return {
    dates,
    baselineSaved: Number(baseline[0]?.n ?? 0) > 0,
    retestSaved: Number(retest[0]?.n ?? 0) > 0,
    logs: rows.map((row) => ({
      date: row.date,
      patternId: row.pattern_id,
      unit: row.unit,
      sets: byLog.get(row.log_id) ?? [],
      exerciseId: row.exercise_id,
      exerciseName: row.exercise_name,
      rir: row.rir,
    })),
  };
}

async function publicLogs(db: AppDatabase, userId: string): Promise<PublicLog[]> {
  const data = await loadVolume(db, userId, "9999-12-31");
  return data.logs.map((log) => ({
    date: log.date,
    exerciseName: log.exerciseName,
    sets: log.sets.filter((value): value is number => typeof value === "number"),
    rir: log.rir,
  }));
}

export type Dal = ReturnType<typeof createDal>;
