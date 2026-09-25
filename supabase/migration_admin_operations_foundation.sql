-- Crelavo admin operations foundation for Supabase.
-- Safe to run after schema.sql; all objects are additive and idempotent.

create table if not exists public.user_ips (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  ip text not null,
  user_agent text,
  seen_at timestamptz not null default now()
);
create index if not exists user_ips_user_seen_idx on public.user_ips(user_id, seen_at desc);

create table if not exists public.presence (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  guest_id text,
  path text not null,
  ip text,
  country text,
  device text,
  seen_at timestamptz not null default now()
);
create index if not exists presence_seen_idx on public.presence(seen_at desc);
create index if not exists presence_user_seen_idx on public.presence(user_id, seen_at desc);

create table if not exists public.credit_ledger (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  delta integer not null,
  reason text not null,
  whop_payment_id text,
  job_id uuid,
  note text,
  created_at timestamptz not null default now()
);
create index if not exists credit_ledger_user_created_idx on public.credit_ledger(user_id, created_at desc);
create unique index if not exists credit_ledger_purchase_once_idx on public.credit_ledger(whop_payment_id) where whop_payment_id is not null and reason = 'purchase';

create table if not exists public.payment_fulfillments (
  id uuid primary key default gen_random_uuid(),
  whop_payment_id text not null unique,
  user_id uuid references public.profiles(id) on delete set null,
  plan_id text not null,
  product_title text not null,
  amount_usd numeric(12,2) not null default 0,
  credits integer not null default 0,
  kind text not null default 'credits',
  status text not null default 'pending_user',
  billing_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists payment_fulfillments_status_idx on public.payment_fulfillments(status, created_at desc);
create index if not exists payment_fulfillments_email_user_idx on public.payment_fulfillments(user_id, created_at desc);

create table if not exists public.email_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  to_email text not null,
  template text not null,
  subject text not null,
  status text not null,
  error text,
  created_at timestamptz not null default now()
);
create index if not exists email_logs_created_idx on public.email_logs(created_at desc);
create index if not exists email_logs_user_idx on public.email_logs(user_id, created_at desc);

create table if not exists public.credit_product_map (
  plan_id text primary key,
  product_title text not null,
  credits integer not null default 0,
  kind text not null check (kind in ('credits', 'pro_flag', 'service')),
  skip_preview boolean not null default true,
  updated_at timestamptz not null default now()
);

create table if not exists public.site_blocks (
  key text not null,
  locale text not null default 'en',
  json jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (key, locale)
);

create table if not exists public.production_jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  production_id uuid references public.production_requests(id) on delete set null,
  type text not null,
  status text not null default 'queued',
  fail_code text,
  fail_message text,
  credits_cost integer not null default 0,
  provider text,
  heartbeat_at timestamptz,
  started_at timestamptz,
  finished_at timestamptz,
  brief_summary text,
  created_at timestamptz not null default now()
);
create index if not exists production_jobs_status_idx on public.production_jobs(status, created_at desc);
create index if not exists production_jobs_user_idx on public.production_jobs(user_id, created_at desc);

alter table public.user_ips enable row level security;
alter table public.presence enable row level security;
alter table public.credit_ledger enable row level security;
alter table public.payment_fulfillments enable row level security;
alter table public.email_logs enable row level security;
alter table public.credit_product_map enable row level security;
alter table public.site_blocks enable row level security;
alter table public.production_jobs enable row level security;

insert into public.credit_product_map (plan_id, product_title, credits, kind, skip_preview) values
  ('plan_kmGVCrQu90NBV', 'Starter Credit Pack', 800, 'credits', false),
  ('plan_Q0fJdHNnKGPd6', 'Creator Credit Pack', 2500, 'credits', false),
  ('plan_kkn9PeDilHc1q', 'Business Credit Pack', 7000, 'credits', false),
  ('plan_Sm0chNhnmVKBG', 'Drone Location Video', 2600, 'credits', false),
  ('plan_ENiXR71BMaqB2', 'Satellite + Drone Story', 6800, 'credits', false),
  ('plan_ECfkkMySZHtIZ', 'Pro Credits monthly', 2500, 'credits', true),
  ('plan_A9zegHpbjxAfO', 'Pro Credits yearly', 2500, 'credits', true),
  ('plan_DTxjYMeiRPBWz', 'Business Credits monthly', 9000, 'credits', true),
  ('plan_R3OSfDLVHI9zi', 'Business Credits yearly', 9000, 'credits', true),
  ('plan_rkeOQU3gjmujh', 'Team Credits monthly', 12000, 'credits', true),
  ('plan_jSBaM1LgMuaNL', 'Team Credits yearly', 12000, 'credits', true),
  ('plan_UtIprGEXNEooK', 'Ultra Credits monthly', 25000, 'credits', true),
  ('plan_apVKry7XkvOky', 'Ultra Credits yearly', 25000, 'credits', true),
  ('plan_ujLQgM3kEg0dg', 'Crelavo Pro', 0, 'pro_flag', true),
  ('plan_fiabRYr6uWY43', 'Crelavo Pro Annual', 0, 'pro_flag', true)
on conflict (plan_id) do update set
  product_title = excluded.product_title,
  credits = excluded.credits,
  kind = excluded.kind,
  skip_preview = excluded.skip_preview,
  updated_at = now();
