create table if not exists growth_intelligence_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  user_email text,
  plan_id text not null default 'growth_intelligence_starter',
  brand_name text not null,
  own_website text not null,
  competitors text not null,
  watched_pages text,
  ad_libraries text,
  review_sources text,
  target_market text,
  report_language text not null default 'English',
  report_frequency text not null default 'Weekly executive PDF',
  alert_channel text not null default 'Email',
  status text not null default 'waiting_entitlement',
  entitlement_status text not null default 'waiting_entitlement',
  estimated_credits integer not null default 0,
  report_file_url text,
  report_file_name text,
  admin_notes text,
  request_payload jsonb not null default '{}'::jsonb,
  delivery_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table growth_intelligence_requests enable row level security;

drop policy if exists "growth intelligence own read" on growth_intelligence_requests;
create policy "growth intelligence own read" on growth_intelligence_requests
  for select using (auth.uid() = user_id);

drop policy if exists "growth intelligence own insert" on growth_intelligence_requests;
create policy "growth intelligence own insert" on growth_intelligence_requests
  for insert with check (auth.uid() = user_id);

create index if not exists growth_intelligence_requests_user_created_idx on growth_intelligence_requests (user_id, created_at desc);
create index if not exists growth_intelligence_requests_status_idx on growth_intelligence_requests (status, created_at desc);
create index if not exists growth_intelligence_requests_entitlement_idx on growth_intelligence_requests (entitlement_status, created_at desc);
