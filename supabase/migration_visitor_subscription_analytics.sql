create table if not exists visitor_sessions (
  anonymous_id text primary key check (char_length(anonymous_id) between 1 and 160),
  user_id uuid references profiles(id) on delete set null,
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  current_path text not null default '/' check (char_length(current_path) <= 500),
  current_title text not null default '' check (char_length(current_title) <= 200),
  first_touch_path text check (char_length(first_touch_path) <= 500),
  landing_path text check (char_length(landing_path) <= 500),
  referrer text check (char_length(referrer) <= 500),
  utm_source text check (char_length(utm_source) <= 120),
  utm_medium text check (char_length(utm_medium) <= 120),
  utm_campaign text check (char_length(utm_campaign) <= 180),
  utm_term text check (char_length(utm_term) <= 180),
  utm_content text check (char_length(utm_content) <= 180),
  source text check (char_length(source) <= 120),
  country text check (char_length(country) <= 80),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists analytics_events (
  id uuid primary key default gen_random_uuid(),
  anonymous_id text,
  session_id text,
  user_id uuid references profiles(id) on delete set null,
  event_name text not null check (char_length(event_name) between 1 and 120),
  path text check (char_length(path) <= 500),
  occurred_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb
);

create table if not exists checkout_intents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete set null,
  anonymous_id text,
  email text check (char_length(email) <= 180),
  provider text not null check (char_length(provider) <= 80),
  product_id text check (char_length(product_id) <= 160),
  package_id text check (char_length(package_id) <= 160),
  billing_interval text check (char_length(billing_interval) <= 40),
  status text not null default 'started' check (char_length(status) <= 40),
  checkout_url text check (char_length(checkout_url) <= 1000),
  campaign text check (char_length(campaign) <= 180),
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  provider_reference text check (char_length(provider_reference) <= 240),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete set null,
  provider text not null check (char_length(provider) <= 80),
  membership_id text,
  customer_id text,
  plan_id text,
  product_id text,
  billing_interval text check (char_length(billing_interval) <= 40),
  status text not null check (char_length(status) <= 50),
  trial_started_at timestamptz,
  trial_ends_at timestamptz,
  current_period_start_at timestamptz,
  current_period_end_at timestamptz,
  cancel_at timestamptz,
  canceled_at timestamptz,
  last_payment_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(provider, membership_id)
);

create table if not exists payment_transactions (
  id uuid primary key default gen_random_uuid(),
  provider text not null check (char_length(provider) <= 80),
  event_id text,
  payment_id text,
  customer_id text,
  membership_id text,
  plan_id text,
  product_id text,
  user_id uuid references profiles(id) on delete set null,
  amount numeric(12,2),
  currency text check (char_length(currency) <= 12),
  status text not null check (char_length(status) <= 50),
  billing_reason text check (char_length(billing_reason) <= 80),
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(provider, payment_id),
  unique(provider, event_id)
);

create index if not exists visitor_sessions_last_seen_idx on visitor_sessions(last_seen_at desc);
create index if not exists visitor_sessions_user_idx on visitor_sessions(user_id);
create index if not exists visitor_sessions_source_idx on visitor_sessions(utm_source, source);
create index if not exists analytics_events_name_time_idx on analytics_events(event_name, occurred_at desc);
create index if not exists analytics_events_user_time_idx on analytics_events(user_id, occurred_at desc);
create index if not exists checkout_intents_started_idx on checkout_intents(started_at desc);
create index if not exists checkout_intents_user_idx on checkout_intents(user_id, started_at desc);
create index if not exists subscriptions_status_idx on subscriptions(status, updated_at desc);
create index if not exists subscriptions_user_idx on subscriptions(user_id);
create index if not exists payment_transactions_status_time_idx on payment_transactions(status, occurred_at desc);
create index if not exists payment_transactions_user_idx on payment_transactions(user_id, occurred_at desc);

alter table visitor_sessions enable row level security;
alter table analytics_events enable row level security;
alter table checkout_intents enable row level security;
alter table subscriptions enable row level security;
alter table payment_transactions enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'visitor_sessions' and policyname = 'visitor sessions own read') then create policy "visitor sessions own read" on visitor_sessions for select using (auth.uid() = user_id); end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'analytics_events' and policyname = 'analytics events own read') then create policy "analytics events own read" on analytics_events for select using (auth.uid() = user_id); end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'checkout_intents' and policyname = 'checkout intents own read') then create policy "checkout intents own read" on checkout_intents for select using (auth.uid() = user_id); end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'subscriptions' and policyname = 'subscriptions own read') then create policy "subscriptions own read" on subscriptions for select using (auth.uid() = user_id); end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'payment_transactions' and policyname = 'payment transactions own read') then create policy "payment transactions own read" on payment_transactions for select using (auth.uid() = user_id); end if;
end $$;

grant select on visitor_sessions, analytics_events, checkout_intents, subscriptions, payment_transactions to authenticated;
revoke insert, update, delete on visitor_sessions, analytics_events, checkout_intents, subscriptions, payment_transactions from anon, authenticated;
