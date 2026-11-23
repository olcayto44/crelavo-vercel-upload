create table if not exists public.assistant_media_projects(id uuid primary key,user_id uuid not null references public.profiles(id),created_at timestamptz not null default now());
alter table public.assistant_media_projects enable row level security;
create policy media_project_owner on public.assistant_media_projects for select using(auth.uid()=user_id);
-- Sahne birleştirme kuyruğu (kalıcı). Önce STAGING Supabase projesinde çalıştırın.

create table if not exists public.merge_jobs (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null,
  project_id       uuid not null references public.assistant_media_projects(id),
   lease_token uuid,
   production_id uuid references public.production_requests(id),
  production_ids   uuid[] not null,
  order_hash       text not null,                 -- sha256(user|project|ids sıralı)
  status           text not null default 'queued'
                   check (status in ('queued','processing','done','failed')),
  progress         int  not null default 0 check (progress between 0 and 100),
  attempt          int  not null default 0,
  max_attempts     int  not null default 3,
  run_after        timestamptz not null default now(),   -- yeniden deneme gecikmesi
  lease_owner      text,
  lease_expires_at timestamptz,
  heartbeat_at     timestamptz,
  checkpoint       jsonb not null default '{}'::jsonb,
  output_path      text,                          -- production-assets bucket içindeki yol
  duration_seconds numeric,
  size_bytes       bigint,
  error_code       text,
  error_message    text,
  created_at       timestamptz not null default now(),
  started_at       timestamptz,
  finished_at      timestamptz,
  updated_at       timestamptz not null default now(),
  constraint merge_jobs_clip_count check (cardinality(production_ids) between 2 and 12)
);

-- Aynı kullanıcı + proje + aynı sıralama için aktif/bitmiş tek iş. Failed olanlar dışarıda: tekrar denenebilir.
create unique index if not exists merge_jobs_dedupe
  on public.merge_jobs (user_id, project_id, order_hash)
  where status in ('queued','processing','done');

create index if not exists merge_jobs_claim on public.merge_jobs (status, run_after, created_at);
create index if not exists merge_jobs_user  on public.merge_jobs (user_id, created_at desc);

alter table public.merge_jobs enable row level security;
drop policy if exists merge_jobs_owner_read on public.merge_jobs;
create policy merge_jobs_owner_read on public.merge_jobs for select using (auth.uid() = user_id);
-- Yazma yalnızca service role (API route ve worker) ile yapılır; istemciye insert/update politikası verilmez.

-- İşi atomik sahiplenir. Süresi dolmuş lease'li 'processing' işleri de devralır (deneme hakkı varsa).
create or replace function public.claim_merge_job(p_worker text, p_lease_seconds int default 90)
returns setof public.merge_jobs
language plpgsql security definer set search_path = public as $$
declare v_id uuid;
begin
  update merge_jobs
     set status = 'failed', error_code = 'LEASE_EXPIRED',
         error_message = 'Worker tekrar tekrar yanıt vermedi', finished_at = now(),
         lease_owner = null, lease_expires_at = null, updated_at = now()
   where status = 'processing' and lease_expires_at < now() and attempt >= max_attempts;

  update production_requests r set status='failed',generation_status='failed',updated_at=clock_timestamp() from merge_jobs j where j.production_id=r.id and j.status='failed' and j.error_code='LEASE_EXPIRED' and r.status='in_production';
  select id into v_id from merge_jobs
   where (status = 'queued' and run_after <= now())
      or (status = 'processing' and lease_expires_at < now() and attempt < max_attempts)
   order by created_at
   limit 1
   for update skip locked;

  if v_id is null then return; end if;

  return query
  update merge_jobs
     set status = 'processing', lease_owner = p_worker, lease_token=gen_random_uuid(),
         lease_expires_at = clock_timestamp() + make_interval(secs => greatest(10,least(300,p_lease_seconds))),
         heartbeat_at = now(), attempt = attempt + 1,
         started_at = coalesce(started_at, now()),
         error_code = null, error_message = null, updated_at = now()
   where id = v_id
  returning *;
end $$;

create or replace function public.heartbeat_merge_job(p_job uuid,p_token uuid,p_lease_seconds int default 90) returns boolean
language sql security definer set search_path=public as $$
 with u as(update merge_jobs set heartbeat_at=clock_timestamp(),lease_expires_at=clock_timestamp()+make_interval(secs=>greatest(10,least(300,p_lease_seconds))),updated_at=clock_timestamp()
 where id=p_job and lease_token=p_token and status='processing' and lease_expires_at>clock_timestamp() returning 1)select exists(select 1 from u);
$$;
-- All worker writes are fenced in database time, with a new token on EVERY claim.
create or replace function public.update_merge_job(p_job uuid,p_token uuid,p_patch jsonb) returns boolean
language plpgsql security definer set search_path=public as $$
declare j merge_jobs; pid uuid; output jsonb; n int;
begin
 select * into j from merge_jobs where id=p_job for update;
 if not found or j.status<>'processing' or j.lease_token is distinct from p_token or j.lease_expires_at<=clock_timestamp() then return false; end if;
 if p_patch->>'status'='done' then
   if p_patch->>'output_path' is distinct from 'merges/'||j.user_id||'/'||j.project_id||'/'||j.id||'/'||p_token||'.mp4'
    or coalesce((p_patch->>'duration_seconds')::numeric,0)<=0 or coalesce((p_patch->>'size_bytes')::bigint,0)<=0 then raise exception 'invalid_merge_output'; end if;
   output=jsonb_build_object('assistant',true,'mergeJobId',j.id,'media',jsonb_build_object('kind','video','url','/api/productions/'||j.production_id||'/delivery?file=merge','storagePath',p_patch->>'output_path'),'files','[]'::jsonb);
   -- Stable authenticated delivery route, not an expiring signed URL.
   update production_requests set status='ready',generation_status='ready',automation_status='completed',output_json=output,preview_url='/api/productions/'||j.production_id||'/delivery?file=merge',delivery_link='/api/productions/'||j.production_id||'/delivery?file=merge',completed_at=clock_timestamp(),updated_at=clock_timestamp()
    where id=j.production_id and user_id=j.user_id and input_json->>'mergeJobId'=j.id::text and status='in_production';
   get diagnostics n=row_count; if n<>1 then raise exception 'merge_production_fenced'; end if;
   if j.lease_expires_at<=clock_timestamp() then raise exception 'merge_lease_expired'; end if;
   update merge_jobs set status='done',progress=100,output_path=p_patch->>'output_path',duration_seconds=(p_patch->>'duration_seconds')::numeric,size_bytes=(p_patch->>'size_bytes')::bigint,finished_at=clock_timestamp(),lease_owner=null,lease_token=null,lease_expires_at=null,updated_at=clock_timestamp() where id=j.id and lease_expires_at>clock_timestamp();
   get diagnostics n=row_count; if n<>1 then raise exception 'merge_lease_expired'; end if;
   return true;
 end if;
 if coalesce(p_patch->>'status','processing') not in ('processing','queued','failed') then raise exception 'invalid_merge_transition'; end if;
 update merge_jobs set progress=coalesce((p_patch->>'progress')::int,progress),checkpoint=coalesce(p_patch->'checkpoint',checkpoint),status=coalesce(p_patch->>'status',status),
 run_after=coalesce((p_patch->>'run_after')::timestamptz,run_after),attempt=case when p_patch->>'status'='queued' then greatest(j.attempt-1,least(j.attempt,coalesce((p_patch->>'attempt')::int,j.attempt))) else j.attempt end,
 error_code=p_patch->>'error_code',error_message=left(p_patch->>'error_message',500),
 finished_at=case when p_patch->>'status'='failed' then clock_timestamp() else finished_at end,
 lease_owner=case when p_patch->>'status' in ('queued','failed') then null else lease_owner end,
 lease_token=case when p_patch->>'status' in ('queued','failed') then null else lease_token end,
 lease_expires_at=case when p_patch->>'status' in ('queued','failed') then null else lease_expires_at end,updated_at=clock_timestamp() where id=j.id;
 if p_patch->>'status'='failed' then update production_requests set status='failed',generation_status='failed',updated_at=clock_timestamp() where id=j.production_id and user_id=j.user_id; end if;
 return true;
end $$;
-- Revalidate source ownership/project/readiness at enqueue, atomically with delivery row creation.
create or replace function public.enqueue_merge_job(p_user uuid,p_project uuid,p_ids uuid[],p_hash text) returns public.merge_jobs
language plpgsql security definer set search_path=public as $$
declare j merge_jobs; pid uuid;begin
 perform 1 from assistant_media_projects where id=p_project and user_id=p_user for update;
 if not found then raise exception 'project_not_owned'; end if;
 if cardinality(p_ids) not between 2 and 12 then raise exception 'invalid_clip_count'; end if;
 if exists(select 1 from unnest(p_ids) x where not exists(select 1 from production_requests r where r.id=x and r.user_id=p_user and r.input_json->>'projectId'=p_project::text and r.status='ready' and r.output_json->'media'->>'kind'='video' and (coalesce(r.output_json->'media'->>'url','')<>'' or coalesce(r.output_json->'media'->>'storagePath','')<>''))) then raise exception 'invalid_sources'; end if;
 select * into j from merge_jobs where user_id=p_user and project_id=p_project and order_hash=p_hash and status in ('queued','processing','done');
 if found then return j; end if;
 perform 1 from profiles where id=p_user for update;
 if (select count(*) from merge_jobs where user_id=p_user and status in ('queued','processing'))>=2 then raise exception 'merge_limit'; end if;
 insert into merge_jobs(user_id,project_id,production_ids,order_hash) values(p_user,p_project,p_ids,p_hash) returning * into j;
 insert into production_requests(user_id,production_type,title,prompt,status,generation_status,automation_status,input_json,output_json,request_metadata)
 values(p_user,'video','Merged scenes','Ordered scene merge','in_production','queued','assistant_managed',jsonb_build_object('projectId',p_project,'productionIds',p_ids,'mergeJobId',j.id),jsonb_build_object('mergeJobId',j.id),jsonb_build_object('source','scene_merge')) returning id into pid;
 update merge_jobs set production_id=pid where id=j.id returning * into j; return j;
end $$;
revoke all on function public.claim_merge_job(text,int),public.heartbeat_merge_job(uuid,uuid,int),public.update_merge_job(uuid,uuid,jsonb),public.enqueue_merge_job(uuid,uuid,uuid[],text) from public,anon,authenticated;
grant execute on function public.claim_merge_job(text,int),public.heartbeat_merge_job(uuid,uuid,int),public.update_merge_job(uuid,uuid,jsonb),public.enqueue_merge_job(uuid,uuid,uuid[],text) to service_role;
