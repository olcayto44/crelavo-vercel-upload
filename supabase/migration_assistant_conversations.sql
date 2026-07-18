create table if not exists assistant_conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  user_email text,
  title text not null default 'Assistant conversation',
  channel text not null default 'assistant_workspace',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists assistant_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references assistant_conversations(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  role text not null check (role in ('user', 'assistant', 'system')),
  content text not null,
  mode text,
  language text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table assistant_conversations enable row level security;
alter table assistant_messages enable row level security;

drop policy if exists "assistant conversations own read" on assistant_conversations;
create policy "assistant conversations own read" on assistant_conversations
  for select using (auth.uid() = user_id);

drop policy if exists "assistant conversations own insert" on assistant_conversations;
create policy "assistant conversations own insert" on assistant_conversations
  for insert with check (auth.uid() = user_id);

drop policy if exists "assistant messages own read" on assistant_messages;
create policy "assistant messages own read" on assistant_messages
  for select using (auth.uid() = user_id);

drop policy if exists "assistant messages own insert" on assistant_messages;
create policy "assistant messages own insert" on assistant_messages
  for insert with check (auth.uid() = user_id);

create index if not exists assistant_conversations_user_updated_idx on assistant_conversations (user_id, updated_at desc);
create index if not exists assistant_messages_conversation_created_idx on assistant_messages (conversation_id, created_at asc);
create index if not exists assistant_messages_user_created_idx on assistant_messages (user_id, created_at desc);
