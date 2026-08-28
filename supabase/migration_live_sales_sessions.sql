create table if not exists live_sales_sessions (
  id uuid primary key default gen_random_uuid(),
  agent_id text not null references live_sales_agents(agent_id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  status text not null default 'created' check (status in ('created','starting','live','stopped','provider_required','unsupported','failed')),
  provider text,
  provider_session_id text,
  stream_url text,
  started_at timestamptz,
  stopped_at timestamptz,
  summary jsonb not null default '{}'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists live_sales_sessions_user_created_idx on live_sales_sessions(user_id, created_at desc);
create index if not exists live_sales_sessions_agent_status_idx on live_sales_sessions(agent_id, status);
alter table live_sales_sessions enable row level security;
drop policy if exists "live sales sessions own read" on live_sales_sessions;
create policy "live sales sessions own read" on live_sales_sessions for select using (auth.uid() = user_id);
drop policy if exists "live sales sessions own insert" on live_sales_sessions;
create policy "live sales sessions own insert" on live_sales_sessions for insert with check (auth.uid() = user_id);
drop policy if exists "live sales sessions own update" on live_sales_sessions;
create policy "live sales sessions own update" on live_sales_sessions for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table if not exists live_sales_session_messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references live_sales_sessions(id) on delete cascade,
  role text not null check (role in ('user','assistant','system')),
  content text not null,
  actions jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists live_sales_session_messages_session_idx on live_sales_session_messages(session_id, created_at);
alter table live_sales_session_messages enable row level security;
drop policy if exists "live sales messages own access" on live_sales_session_messages;
create policy "live sales messages own access" on live_sales_session_messages for all using (exists (select 1 from live_sales_sessions s where s.id = session_id and auth.uid() = s.user_id)) with check (exists (select 1 from live_sales_sessions s where s.id = session_id and auth.uid() = s.user_id));

alter table live_sales_agents add column if not exists catalog_snapshot jsonb not null default '[]'::jsonb;
