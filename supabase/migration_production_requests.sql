create table if not exists production_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  production_type text not null,
  package_id text,
  title text not null,
  prompt text not null,
  status text not null default 'in_production',
  generation_status text default 'queued',
  estimated_credits integer not null default 0,
  reserved_credits integer not null default 0,
  input_json jsonb not null default '{}'::jsonb,
  output_json jsonb not null default '{}'::jsonb,
  preview_url text,
  delivery_zip_url text,
  source_files_url text,
  readme_url text,
  admin_notes text,
  cancellation_fee_credits integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table production_requests enable row level security;

drop policy if exists "production requests own read" on production_requests;
create policy "production requests own read" on production_requests
  for select using (auth.uid() = user_id);

drop policy if exists "production requests own insert" on production_requests;
create policy "production requests own insert" on production_requests
  for insert with check (auth.uid() = user_id);

alter table production_requests add column if not exists request_metadata jsonb not null default '{}'::jsonb;
alter table production_requests add column if not exists materials_json jsonb not null default '[]'::jsonb;
alter table production_requests add column if not exists automation_status text not null default 'queued';
alter table production_requests add column if not exists automation_steps jsonb not null default '[]'::jsonb;
alter table production_requests add column if not exists automation_job_id text;
alter table production_requests add column if not exists delivery_link text;
alter table production_requests add column if not exists error_message text;
alter table production_requests add column if not exists started_at timestamptz;
alter table production_requests add column if not exists completed_at timestamptz;
alter table production_requests add column if not exists approval_question text;
alter table production_requests add column if not exists approval_options jsonb not null default '[]'::jsonb;
alter table production_requests add column if not exists approval_status text not null default 'none';
alter table production_requests add column if not exists approval_answer jsonb;
alter table production_requests add column if not exists extra_credit_required integer not null default 0;
alter table production_requests add column if not exists legal_acceptance_id uuid;
alter table production_requests add column if not exists legal_acceptance_snapshot jsonb not null default '{}'::jsonb;

create index if not exists production_requests_user_created_idx on production_requests (user_id, created_at desc);
create index if not exists production_requests_type_status_idx on production_requests (production_type, status);
create index if not exists production_requests_automation_status_idx on production_requests (automation_status, created_at desc);

create table if not exists legal_acceptances (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  production_id uuid references production_requests(id) on delete set null,
  acceptance_type text not null default 'production_liability',
  version text not null default 'v1.0',
  accepted boolean not null default true,
  accepted_at timestamptz not null default now(),
  ip_address text,
  user_agent text,
  production_type text,
  package_id text,
  title text,
  responsibility_text text not null,
  rights_warranty_text text not null,
  metadata jsonb not null default '{}'::jsonb
);

create index if not exists legal_acceptances_user_created_idx on legal_acceptances (user_id, accepted_at desc);
create index if not exists legal_acceptances_production_idx on legal_acceptances (production_id);

create table if not exists connected_ad_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  platform text not null,
  account_name text not null default 'Ad account',
  external_account_id text not null,
  access_token_encrypted text,
  refresh_token_encrypted text,
  status text not null default 'connected',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists connected_ad_accounts_user_platform_idx on connected_ad_accounts (user_id, platform, status);

create table if not exists connected_commerce_stores (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  platform text not null,
  store_name text not null default 'Connected store',
  store_url text not null,
  external_store_id text not null,
  access_token_encrypted text,
  refresh_token_encrypted text,
  status text not null default 'connected',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, platform, external_store_id)
);

create index if not exists connected_commerce_stores_user_platform_idx on connected_commerce_stores (user_id, platform, status);

create table if not exists ad_campaign_jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  production_id uuid references production_requests(id) on delete set null,
  platform text not null,
  campaign_name text not null,
  daily_budget numeric not null default 0,
  audience_mode text not null default 'broad',
  status text not null default 'queued',
  launch_payload jsonb not null default '{}'::jsonb,
  metrics_json jsonb not null default '{}'::jsonb,
  ai_recommendation jsonb not null default '{}'::jsonb,
  external_ids jsonb not null default '{}'::jsonb,
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists ad_campaign_jobs_user_status_idx on ad_campaign_jobs (user_id, status, created_at desc);

create table if not exists lip_sync_jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  production_id uuid references production_requests(id) on delete set null,
  provider text not null,
  source_video_url text not null,
  source_language text not null,
  target_language text not null,
  status text not null default 'queued',
  provider_job_id text,
  output_video_url text,
  error_message text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists lip_sync_jobs_user_status_idx on lip_sync_jobs (user_id, status, created_at desc);

create table if not exists brand_kits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  logo_url text,
  primary_color text,
  secondary_color text,
  subtitle_color text,
  font_url text,
  font_name text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id)
);

create table if not exists bulk_generation_batches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  title text not null default 'Bulk generation',
  status text not null default 'queued',
  total_count integer not null default 0,
  valid_count integer not null default 0,
  failed_count integer not null default 0,
  completed_count integer not null default 0,
  concurrency integer not null default 5,
  default_format text not null default '720p vertical TikTok video',
  source_filename text,
  notify_email text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz
);

create index if not exists bulk_generation_batches_user_status_idx on bulk_generation_batches (user_id, status, created_at desc);

create table if not exists bulk_generation_items (
  id uuid primary key default gen_random_uuid(),
  batch_id uuid not null references bulk_generation_batches(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  row_index integer not null,
  product_url text not null,
  title text,
  price text,
  video_format text not null default '720p vertical TikTok video',
  status text not null default 'queued',
  production_id uuid references production_requests(id) on delete set null,
  output_url text,
  error_message text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists bulk_generation_items_batch_status_idx on bulk_generation_items (batch_id, status, row_index);
