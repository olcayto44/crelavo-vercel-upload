-- Studio V2 P0: persistent, owner-scoped MP4 render job queue.
-- An actual FFmpeg worker and verified idempotent billing are separate release gates.
create unique index if not exists studio_timeline_versions_render_fk_idx
  on public.studio_timeline_versions (id, project_id, user_id);

create table if not exists public.studio_render_jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  project_id uuid not null,
  timeline_version_id uuid not null,
  request_id uuid not null,
  format text not null default 'mp4' check (format = 'mp4'),
  status text not null default 'queued'
    check (status in ('queued','processing','ready','failed','cancelled')),
  attempt_count integer not null default 0 check (attempt_count >= 0 and attempt_count <= 5),
  max_attempts integer not null default 3 check (max_attempts between 1 and 5),
  output_bucket text check (output_bucket is null or output_bucket = 'studio-private'),
  output_path text,
  error_code text,
  worker_id text,
  lease_expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  started_at timestamptz,
  finished_at timestamptz,
  constraint studio_render_jobs_project_owner_fkey
    foreign key (project_id, user_id)
    references public.studio_projects(id, user_id) on delete cascade,
  constraint studio_render_jobs_timeline_owner_fkey
    foreign key (timeline_version_id, project_id, user_id)
    references public.studio_timeline_versions(id, project_id, user_id) on delete cascade,
  constraint studio_render_jobs_idempotency_key unique (user_id, request_id),
  constraint studio_render_jobs_delivery_shape check (
    (status = 'ready' and output_bucket = 'studio-private' and output_path is not null)
    or (status <> 'ready' and output_path is null)
  )
);

create index if not exists studio_render_jobs_owner_created_idx
 on public.studio_render_jobs (user_id, created_at desc);
create index if not exists studio_render_jobs_worker_queue_idx
 on public.studio_render_jobs (status, created_at)
 where status in ('queued','processing');

alter table public.studio_render_jobs enable row level security;
drop policy if exists studio_render_jobs_owner_read on public.studio_render_jobs;
create policy studio_render_jobs_owner_read
 on public.studio_render_jobs for select to authenticated
 using ((select auth.uid()) = user_id);

revoke all on public.studio_render_jobs from anon, authenticated;
grant select on public.studio_render_jobs to authenticated;
-- Only privileged server/worker code can create or change jobs. Browser RLS
-- intentionally permits no INSERT/UPDATE/DELETE and no direct paid render.
