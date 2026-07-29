-- Run once in Supabase SQL editor to align live production_requests lifecycle schema.
-- Safe to re-run: every column/index uses IF NOT EXISTS.

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
