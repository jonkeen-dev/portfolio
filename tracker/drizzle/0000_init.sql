create table if not exists schema_migrations (
  id text primary key,
  applied_at timestamptz not null default now()
);
--> statement-breakpoint
create table if not exists "user" (
  id text primary key,
  name text not null,
  email text not null unique,
  email_verified boolean not null default false,
  image text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  role text not null default 'member',
  deactivated_at timestamptz,
  constraint user_role check (role in ('owner', 'member'))
);
--> statement-breakpoint
create table if not exists session (
  id text primary key,
  expires_at timestamptz not null,
  token text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  ip_address text,
  user_agent text,
  user_id text not null references "user" (id) on delete cascade
);
--> statement-breakpoint
create table if not exists account (
  id text primary key,
  account_id text not null,
  provider_id text not null,
  user_id text not null references "user" (id) on delete cascade,
  access_token text,
  refresh_token text,
  id_token text,
  access_token_expires_at timestamptz,
  refresh_token_expires_at timestamptz,
  scope text,
  password text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
--> statement-breakpoint
create table if not exists verification (
  id text primary key,
  identifier text not null,
  value text not null,
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
--> statement-breakpoint
create table if not exists passkey (
  id text primary key,
  name text,
  public_key text not null,
  user_id text not null references "user" (id) on delete cascade,
  credential_id text not null,
  counter integer not null,
  device_type text not null,
  backed_up boolean not null,
  transports text,
  created_at timestamptz,
  aaguid text
);
--> statement-breakpoint
create table if not exists programs (
  id text primary key,
  version text not null,
  title text not null,
  meta jsonb not null
);
--> statement-breakpoint
create table if not exists phases (
  id text primary key,
  program_id text not null references programs (id),
  name text not null,
  weeks jsonb not null,
  goal text not null
);
--> statement-breakpoint
create table if not exists patterns (
  id text primary key,
  name text not null,
  muscles text not null,
  sort integer not null
);
--> statement-breakpoint
create table if not exists exercises (
  id text primary key,
  name text not null,
  pattern_id text not null references patterns (id),
  level integer not null,
  track text not null,
  unit text not null,
  equipment text not null,
  equipment_notes text,
  default_dose text,
  description text not null default '',
  cues text[] not null default '{}',
  mistakes text[] not null default '{}',
  regression_tip text,
  regression_id text,
  progression_id text,
  no_bar_alternative_id text,
  safety_note text,
  constraint exercises_equipment check (equipment in ('none', 'bar', 'kettlebell'))
);
--> statement-breakpoint
create table if not exists weeks (
  program_id text not null references programs (id),
  week integer not null,
  phase_id text not null references phases (id),
  is_deload boolean not null,
  is_assessment_week boolean not null,
  sets_main integer not null,
  rep_min integer not null,
  rep_max integer not null,
  sets_core integer not null,
  core_rep_min integer not null,
  core_rep_max integer not null,
  hold_min integer not null,
  hold_max integer not null,
  target_rir text not null,
  rest_seconds text not null,
  tempo text not null,
  level_ups_allowed boolean not null,
  focus text not null,
  coach_note text not null,
  primary key (program_id, week)
);
--> statement-breakpoint
create table if not exists session_templates (
  id text primary key,
  program_id text not null references programs (id),
  week integer not null,
  day text not null,
  weekday text not null,
  phase_id text not null,
  type text not null,
  title text not null,
  est_minutes integer not null,
  notes text
);
--> statement-breakpoint
create table if not exists assessment_tests (
  id text primary key,
  name text not null,
  pattern_id text,
  type text not null,
  protocol text not null,
  record text not null,
  unit text not null,
  cap text,
  sort integer not null
);
--> statement-breakpoint
create table if not exists prescriptions (
  id text primary key,
  session_template_id text not null references session_templates (id),
  "order" integer not null,
  block text not null,
  pattern_id text,
  default_exercise_id text,
  sets integer,
  reps_target text,
  hold_target text,
  rest text,
  target_rir text,
  tempo text,
  notes text,
  test_id text references assessment_tests (id)
);
--> statement-breakpoint
create table if not exists videos (
  id text primary key,
  exercise_id text not null references exercises (id),
  role text not null,
  title text not null,
  channel text not null,
  url text not null,
  youtube_id text,
  duration text,
  license_note text,
  verified_date date,
  status text not null default 'ok'
);
--> statement-breakpoint
create table if not exists invites (
  id text primary key,
  email text not null,
  invited_by text references "user" (id) on delete set null,
  token_hash text not null,
  expires_at timestamptz not null,
  accepted_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);
--> statement-breakpoint
create table if not exists athlete_profiles (
  user_id text primary key references "user" (id) on delete cascade,
  start_date date not null,
  units text not null default 'lb',
  timezone text not null default 'UTC',
  has_bar boolean not null default false,
  program_id text not null references programs (id),
  program_version text not null,
  visibility text not null default 'private',
  public_handle text,
  visible_sections text[] not null default array['stats_charts', 'level_history']::text[],
  show_name boolean not null default false,
  show_email boolean not null default false,
  allow_indexing boolean not null default false,
  visibility_changed_at timestamptz,
  prefs jsonb not null default '{}'::jsonb,
  constraint athlete_profiles_visibility check (visibility in ('private', 'partner', 'public')),
  constraint athlete_profiles_units check (units in ('lb', 'kg'))
);
--> statement-breakpoint
create unique index if not exists athlete_profiles_handle_lower
  on athlete_profiles (lower(public_handle));
--> statement-breakpoint
create table if not exists workout_sessions (
  id text primary key,
  user_id text not null references "user" (id) on delete cascade,
  date date not null,
  athlete_week integer not null,
  day text,
  type text not null,
  energy integer,
  warmup_done boolean not null default false,
  cooldown_done boolean not null default false,
  completed_at timestamptz,
  notes text,
  client_id text,
  constraint workout_sessions_type check (type in ('workout', 'assessment', 'retest')),
  constraint workout_sessions_energy check (energy is null or energy between 1 and 5)
);
--> statement-breakpoint
create unique index if not exists workout_sessions_user_date_type
  on workout_sessions (user_id, date, type);
--> statement-breakpoint
create unique index if not exists workout_sessions_client
  on workout_sessions (user_id, client_id);
--> statement-breakpoint
create table if not exists exercise_logs (
  id text primary key,
  user_id text not null references "user" (id) on delete cascade,
  workout_session_id text not null references workout_sessions (id) on delete cascade,
  exercise_id text not null references exercises (id),
  block text,
  "order" integer not null default 0,
  rir integer,
  done boolean not null default false,
  notes text,
  prescribed_sets integer not null,
  target_min integer not null,
  target_max integer not null,
  all_sets_at_top boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint exercise_logs_rir check (rir is null or rir between 0 and 5)
);
--> statement-breakpoint
create table if not exists set_logs (
  id text primary key,
  exercise_log_id text not null references exercise_logs (id) on delete cascade,
  set_number integer not null,
  value integer not null,
  constraint set_logs_value check (value between 0 and 600),
  constraint set_logs_number check (set_number between 1 and 6)
);
--> statement-breakpoint
create unique index if not exists set_logs_log_set on set_logs (exercise_log_id, set_number);
--> statement-breakpoint
create table if not exists assessments (
  id text primary key,
  user_id text not null references "user" (id) on delete cascade,
  test_id text not null references assessment_tests (id),
  phase text not null,
  level integer,
  result_value integer,
  result_text text,
  recorded_at timestamptz not null default now(),
  constraint assessments_phase check (phase in ('baseline', 'retest'))
);
--> statement-breakpoint
create unique index if not exists assessments_user_test_phase
  on assessments (user_id, test_id, phase);
--> statement-breakpoint
create table if not exists level_events (
  id text primary key,
  user_id text not null references "user" (id) on delete cascade,
  pattern_id text not null references patterns (id),
  from_exercise_id text,
  to_exercise_id text not null references exercises (id),
  reason text not null,
  evidence jsonb,
  at timestamptz not null default now(),
  constraint level_events_reason check (reason in ('baseline', 'level_up', 'step_down', 'manual'))
);
--> statement-breakpoint
create table if not exists shares (
  id text primary key,
  owner_id text not null references "user" (id) on delete cascade,
  viewer_id text not null references "user" (id) on delete cascade,
  created_at timestamptz not null default now(),
  revoked_at timestamptz
);
--> statement-breakpoint
create table if not exists audit_events (
  id text primary key,
  user_id text references "user" (id) on delete set null,
  type text not null,
  ip_hash text,
  ua_family text,
  at timestamptz not null default now()
);
--> statement-breakpoint
create index if not exists exercise_logs_user_idx on exercise_logs (user_id);
--> statement-breakpoint
create index if not exists level_events_user_pattern_idx on level_events (user_id, pattern_id, at);
--> statement-breakpoint
create index if not exists audit_events_user_idx on audit_events (user_id, at desc);
--> statement-breakpoint
-- Allowlisted public columns only. security_invoker stays off so the view
-- can be read without a session while row policies stay in place for base tables.
create or replace view v_public_profile as
select
  p.public_handle,
  case when p.show_name then u.name else null end as display_name,
  case when p.show_email then u.email else null end as public_email,
  p.visible_sections,
  p.allow_indexing,
  p.program_id
from athlete_profiles p
join "user" u on u.id = p.user_id
where p.visibility = 'public'
  and p.public_handle is not null
  and u.deactivated_at is null;
--> statement-breakpoint
comment on view v_public_profile is
  'Allowlisted public columns only. No user id. Email and name are null unless the athlete opted in.';
--> statement-breakpoint
-- Defense in depth for a non-owner app role. Not forced, so the migration
-- owner (local superuser) is not locked out. See README before production.
alter table workout_sessions enable row level security;
--> statement-breakpoint
alter table exercise_logs enable row level security;
--> statement-breakpoint
alter table assessments enable row level security;
--> statement-breakpoint
alter table level_events enable row level security;
--> statement-breakpoint
drop policy if exists workout_sessions_self on workout_sessions;
--> statement-breakpoint
create policy workout_sessions_self on workout_sessions
  using (user_id = current_setting('app.user_id', true))
  with check (user_id = current_setting('app.user_id', true));
--> statement-breakpoint
drop policy if exists exercise_logs_self on exercise_logs;
--> statement-breakpoint
create policy exercise_logs_self on exercise_logs
  using (user_id = current_setting('app.user_id', true))
  with check (user_id = current_setting('app.user_id', true));
--> statement-breakpoint
drop policy if exists assessments_self on assessments;
--> statement-breakpoint
create policy assessments_self on assessments
  using (user_id = current_setting('app.user_id', true))
  with check (user_id = current_setting('app.user_id', true));
--> statement-breakpoint
drop policy if exists level_events_self on level_events;
--> statement-breakpoint
create policy level_events_self on level_events
  using (user_id = current_setting('app.user_id', true))
  with check (user_id = current_setting('app.user_id', true));
