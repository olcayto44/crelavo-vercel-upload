create table if not exists live_sales_agents (
  agent_id text primary key,
  user_id uuid not null references profiles(id) on delete cascade,
  status text not null default 'draft',
  plan_id text,
  platform text not null default 'Own website',
  industry text not null default 'E-commerce / Retail',
  avatar_source text not null default 'Ready avatar',
  avatar_role text not null default 'All-in-one host',
  language text not null default 'English',
  voice text not null default 'Natural Female',
  tone text not null default 'Warm',
  product_info text,
  shipping_info text,
  order_info text,
  availability text not null default 'Always active',
  custom_schedule text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists live_sales_agents_user_updated_idx on live_sales_agents (user_id, updated_at desc);

alter table live_sales_agents enable row level security;

drop policy if exists "live sales agents own read" on live_sales_agents;
create policy "live sales agents own read" on live_sales_agents
  for select using (auth.uid() = user_id);

drop policy if exists "live sales agents own insert" on live_sales_agents;
create policy "live sales agents own insert" on live_sales_agents
  for insert with check (auth.uid() = user_id);

drop policy if exists "live sales agents own update" on live_sales_agents;
create policy "live sales agents own update" on live_sales_agents
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
