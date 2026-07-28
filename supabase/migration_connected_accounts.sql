create table if not exists connected_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  provider text not null check (provider in ('tiktok', 'youtube', 'instagram', 'meta', 'shopify', 'woocommerce')),
  account_type text not null check (account_type in ('social', 'commerce')),
  display_name text not null default 'Connected account',
  external_account_id text not null default '',
  store_url text,
  status text not null default 'not_connected' check (status in ('not_connected', 'oauth_ready', 'connected', 'permission_limited', 'expired', 'error')),
  access_token_encrypted text,
  refresh_token_encrypted text,
  token_expires_at timestamptz,
  scopes text[] not null default '{}',
  last_verified_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists connected_accounts_unique_target_idx on connected_accounts (user_id, provider, external_account_id);
create index if not exists connected_accounts_user_provider_idx on connected_accounts (user_id, provider, status);
create index if not exists connected_accounts_type_status_idx on connected_accounts (account_type, status);

create table if not exists connected_account_jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  connected_account_id uuid references connected_accounts(id) on delete set null,
  production_id uuid references production_requests(id) on delete set null,
  provider text not null,
  job_type text not null check (job_type in ('export_ready', 'draft_upload', 'one_click_publish', 'store_upload')),
  status text not null default 'draft' check (status in ('draft', 'approval_required', 'queued', 'blocked', 'completed', 'failed')),
  approval_required boolean not null default true,
  payload jsonb not null default '{}'::jsonb,
  result jsonb not null default '{}'::jsonb,
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists connected_account_jobs_user_status_idx on connected_account_jobs (user_id, status, created_at desc);
create index if not exists connected_account_jobs_account_idx on connected_account_jobs (connected_account_id, job_type, status);
