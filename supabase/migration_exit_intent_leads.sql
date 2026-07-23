create table if not exists lead_captures (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  source text not null default 'exit_intent',
  offer text not null default 'ecommerce_video_ad_strategy_guide_trial_credits',
  status text not null default 'captured',
  consent boolean not null default false,
  bonus_credits integer not null default 500,
  ip_address text,
  user_agent text,
  landing_url text,
  page_url text,
  referrer text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_term text,
  utm_content text,
  ref text,
  fbclid text,
  gclid text,
  gbraid text,
  wbraid text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (email, source)
);

create index if not exists lead_captures_created_at_idx on lead_captures (created_at desc);
create index if not exists lead_captures_source_idx on lead_captures (source);
create index if not exists lead_captures_email_idx on lead_captures (email);

alter table lead_captures enable row level security;

drop policy if exists "lead captures admin service only" on lead_captures;
create policy "lead captures admin service only" on lead_captures
  for all using (false) with check (false);
