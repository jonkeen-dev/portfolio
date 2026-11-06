create table if not exists suggestions (
  id text primary key,
  user_id text not null references "user" (id) on delete cascade,
  type text not null,
  message text not null,
  created_at timestamptz not null default now(),
  status text not null default 'new',
  constraint suggestions_type check (type in ('feedback', 'idea', 'improvement')),
  constraint suggestions_status check (status in ('new', 'done')),
  constraint suggestions_message_len check (char_length(message) between 1 and 2000)
);
--> statement-breakpoint
create index if not exists suggestions_created_at on suggestions (created_at desc);
