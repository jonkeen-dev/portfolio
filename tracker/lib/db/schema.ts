import { sql } from "drizzle-orm";
import {
  boolean,
  date,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

const ts = (name: string) => timestamp(name, { withTimezone: true, mode: "date" });

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  createdAt: ts("created_at").notNull().defaultNow(),
  updatedAt: ts("updated_at").notNull().defaultNow(),
  role: text("role").notNull().default("member"),
  deactivatedAt: ts("deactivated_at"),
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: ts("expires_at").notNull(),
  token: text("token").notNull().unique(),
  createdAt: ts("created_at").notNull().defaultNow(),
  updatedAt: ts("updated_at").notNull().defaultNow(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: ts("access_token_expires_at"),
  refreshTokenExpiresAt: ts("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: ts("created_at").notNull().defaultNow(),
  updatedAt: ts("updated_at").notNull().defaultNow(),
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: ts("expires_at").notNull(),
  createdAt: ts("created_at").notNull().defaultNow(),
  updatedAt: ts("updated_at").notNull().defaultNow(),
});

export const passkey = pgTable("passkey", {
  id: text("id").primaryKey(),
  name: text("name"),
  publicKey: text("public_key").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  credentialID: text("credential_id").notNull(),
  counter: integer("counter").notNull(),
  deviceType: text("device_type").notNull(),
  backedUp: boolean("backed_up").notNull(),
  transports: text("transports"),
  createdAt: ts("created_at"),
  aaguid: text("aaguid"),
});

export const programs = pgTable("programs", {
  id: text("id").primaryKey(),
  version: text("version").notNull(),
  title: text("title").notNull(),
  meta: jsonb("meta").notNull(),
});

export const phases = pgTable("phases", {
  id: text("id").primaryKey(),
  programId: text("program_id")
    .notNull()
    .references(() => programs.id),
  name: text("name").notNull(),
  weeks: jsonb("weeks").notNull(),
  goal: text("goal").notNull(),
});

export const patterns = pgTable("patterns", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  muscles: text("muscles").notNull(),
  sort: integer("sort").notNull(),
});

export const exercises = pgTable("exercises", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  patternId: text("pattern_id")
    .notNull()
    .references(() => patterns.id),
  level: integer("level").notNull(),
  track: text("track").notNull(),
  unit: text("unit").notNull(),
  equipment: text("equipment").notNull(),
  equipmentNotes: text("equipment_notes"),
  defaultDose: text("default_dose"),
  description: text("description").notNull().default(""),
  cues: text("cues").array().notNull().default(sql`'{}'::text[]`),
  mistakes: text("mistakes").array().notNull().default(sql`'{}'::text[]`),
  regressionTip: text("regression_tip"),
  regressionId: text("regression_id"),
  progressionId: text("progression_id"),
  noBarAlternativeId: text("no_bar_alternative_id"),
  safetyNote: text("safety_note"),
});

export const weeks = pgTable(
  "weeks",
  {
    programId: text("program_id")
      .notNull()
      .references(() => programs.id),
    week: integer("week").notNull(),
    phaseId: text("phase_id")
      .notNull()
      .references(() => phases.id),
    isDeload: boolean("is_deload").notNull(),
    isAssessmentWeek: boolean("is_assessment_week").notNull(),
    setsMain: integer("sets_main").notNull(),
    repMin: integer("rep_min").notNull(),
    repMax: integer("rep_max").notNull(),
    setsCore: integer("sets_core").notNull(),
    coreRepMin: integer("core_rep_min").notNull(),
    coreRepMax: integer("core_rep_max").notNull(),
    holdMin: integer("hold_min").notNull(),
    holdMax: integer("hold_max").notNull(),
    targetRir: text("target_rir").notNull(),
    restSeconds: text("rest_seconds").notNull(),
    tempo: text("tempo").notNull(),
    levelUpsAllowed: boolean("level_ups_allowed").notNull(),
    focus: text("focus").notNull(),
    coachNote: text("coach_note").notNull(),
  },
  (table) => [primaryKey({ columns: [table.programId, table.week] })],
);

export const sessionTemplates = pgTable("session_templates", {
  id: text("id").primaryKey(),
  programId: text("program_id")
    .notNull()
    .references(() => programs.id),
  week: integer("week").notNull(),
  day: text("day").notNull(),
  weekday: text("weekday").notNull(),
  phaseId: text("phase_id").notNull(),
  type: text("type").notNull(),
  title: text("title").notNull(),
  estMinutes: integer("est_minutes").notNull(),
  notes: text("notes"),
});

export const prescriptions = pgTable("prescriptions", {
  id: text("id").primaryKey(),
  sessionTemplateId: text("session_template_id")
    .notNull()
    .references(() => sessionTemplates.id),
  order: integer("order").notNull(),
  block: text("block").notNull(),
  patternId: text("pattern_id"),
  defaultExerciseId: text("default_exercise_id"),
  sets: integer("sets"),
  repsTarget: text("reps_target"),
  holdTarget: text("hold_target"),
  rest: text("rest"),
  targetRir: text("target_rir"),
  tempo: text("tempo"),
  notes: text("notes"),
  testId: text("test_id"),
});

export const assessmentTests = pgTable("assessment_tests", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  patternId: text("pattern_id"),
  type: text("type").notNull(),
  protocol: text("protocol").notNull(),
  record: text("record").notNull(),
  unit: text("unit").notNull(),
  cap: text("cap"),
  sort: integer("sort").notNull(),
});

export const videos = pgTable("videos", {
  id: text("id").primaryKey(),
  exerciseId: text("exercise_id")
    .notNull()
    .references(() => exercises.id),
  role: text("role").notNull(),
  title: text("title").notNull(),
  channel: text("channel").notNull(),
  url: text("url").notNull(),
  youtubeId: text("youtube_id"),
  duration: text("duration"),
  licenseNote: text("license_note"),
  verifiedDate: date("verified_date"),
  status: text("status").notNull().default("ok"),
});

export const invites = pgTable("invites", {
  id: text("id").primaryKey(),
  email: text("email").notNull(),
  invitedBy: text("invited_by").references(() => user.id, { onDelete: "set null" }),
  tokenHash: text("token_hash").notNull(),
  expiresAt: ts("expires_at").notNull(),
  acceptedAt: ts("accepted_at"),
  revokedAt: ts("revoked_at"),
  createdAt: ts("created_at").notNull().defaultNow(),
});

export const athleteProfiles = pgTable(
  "athlete_profiles",
  {
    userId: text("user_id")
      .primaryKey()
      .references(() => user.id, { onDelete: "cascade" }),
    startDate: date("start_date").notNull(),
    units: text("units").notNull().default("lb"),
    timezone: text("timezone").notNull().default("UTC"),
    hasBar: boolean("has_bar").notNull().default(false),
    programId: text("program_id")
      .notNull()
      .references(() => programs.id),
    programVersion: text("program_version").notNull(),
    visibility: text("visibility").notNull().default("private"),
    publicHandle: text("public_handle"),
    visibleSections: text("visible_sections")
      .array()
      .notNull()
      .default(sql`ARRAY['stats_charts','level_history']::text[]`),
    showName: boolean("show_name").notNull().default(false),
    showEmail: boolean("show_email").notNull().default(false),
    allowIndexing: boolean("allow_indexing").notNull().default(false),
    visibilityChangedAt: ts("visibility_changed_at"),
    prefs: jsonb("prefs").notNull().default(sql`'{}'::jsonb`),
  },
);

export const workoutSessions = pgTable(
  "workout_sessions",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    date: date("date").notNull(),
    athleteWeek: integer("athlete_week").notNull(),
    day: text("day"),
    type: text("type").notNull(),
    energy: integer("energy"),
    warmupDone: boolean("warmup_done").notNull().default(false),
    cooldownDone: boolean("cooldown_done").notNull().default(false),
    completedAt: ts("completed_at"),
    notes: text("notes"),
    clientId: text("client_id"),
  },
  (table) => [
    uniqueIndex("workout_sessions_user_date_type").on(table.userId, table.date, table.type),
    uniqueIndex("workout_sessions_client").on(table.userId, table.clientId),
  ],
);

export const exerciseLogs = pgTable("exercise_logs", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  workoutSessionId: text("workout_session_id")
    .notNull()
    .references(() => workoutSessions.id, { onDelete: "cascade" }),
  exerciseId: text("exercise_id")
    .notNull()
    .references(() => exercises.id),
  block: text("block"),
  order: integer("order").notNull().default(0),
  rir: integer("rir"),
  done: boolean("done").notNull().default(false),
  notes: text("notes"),
  prescribedSets: integer("prescribed_sets").notNull(),
  targetMin: integer("target_min").notNull(),
  targetMax: integer("target_max").notNull(),
  allSetsAtTop: boolean("all_sets_at_top").notNull().default(false),
  createdAt: ts("created_at").notNull().defaultNow(),
  updatedAt: ts("updated_at").notNull().defaultNow(),
});

export const setLogs = pgTable(
  "set_logs",
  {
    id: text("id").primaryKey(),
    exerciseLogId: text("exercise_log_id")
      .notNull()
      .references(() => exerciseLogs.id, { onDelete: "cascade" }),
    setNumber: integer("set_number").notNull(),
    value: integer("value").notNull(),
  },
  (table) => [uniqueIndex("set_logs_log_set").on(table.exerciseLogId, table.setNumber)],
);

export const assessments = pgTable(
  "assessments",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    testId: text("test_id")
      .notNull()
      .references(() => assessmentTests.id),
    phase: text("phase").notNull(),
    level: integer("level"),
    resultValue: integer("result_value"),
    resultText: text("result_text"),
    recordedAt: ts("recorded_at").notNull().defaultNow(),
  },
  (table) => [uniqueIndex("assessments_user_test_phase").on(table.userId, table.testId, table.phase)],
);

export const levelEvents = pgTable("level_events", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  patternId: text("pattern_id")
    .notNull()
    .references(() => patterns.id),
  fromExerciseId: text("from_exercise_id"),
  toExerciseId: text("to_exercise_id")
    .notNull()
    .references(() => exercises.id),
  reason: text("reason").notNull(),
  evidence: jsonb("evidence"),
  at: ts("at").notNull().defaultNow(),
});

export const shares = pgTable("shares", {
  id: text("id").primaryKey(),
  ownerId: text("owner_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  viewerId: text("viewer_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  createdAt: ts("created_at").notNull().defaultNow(),
  revokedAt: ts("revoked_at"),
});

export const auditEvents = pgTable("audit_events", {
  id: text("id").primaryKey(),
  userId: text("user_id").references(() => user.id, { onDelete: "set null" }),
  type: text("type").notNull(),
  ipHash: text("ip_hash"),
  uaFamily: text("ua_family"),
  at: ts("at").notNull().defaultNow(),
});

export const schemaMigrations = pgTable("schema_migrations", {
  id: text("id").primaryKey(),
  appliedAt: ts("applied_at").notNull().defaultNow(),
});

export const authSchema = { user, session, account, verification, passkey };
