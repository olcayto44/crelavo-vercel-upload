alter table video_requests
  add column if not exists generation_status text,
  add column if not exists generation_provider text,
  add column if not exists generation_job_id text,
  add column if not exists generation_error text,
  add column if not exists generation_started_at timestamptz,
  add column if not exists generation_completed_at timestamptz;
