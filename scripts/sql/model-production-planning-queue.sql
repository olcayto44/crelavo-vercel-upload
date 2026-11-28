-- Isolated model planning queue. No charge, provider call, or executable job state.
begin;
create table public.model_production_jobs (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete restrict,
 request_key uuid not null,
 model_id text not null check (model_id ~ '^[a-z0-9][a-z0-9-]{0,79}$'),
 provider text not null check (provider in ('higgsfield','kie')),
 plan_hash text not null check (plan_hash ~ '^[0-9a-f]{64}$'),
 plan jsonb not null check (jsonb_typeof(plan)='object' and octet_length(plan::text)<=30000),
 state text not null default 'blocked' check (state in ('blocked','cancelled')),
 progress integer not null default 0 check (progress=0),
 estimated_micro_usd bigint check (estimated_micro_usd is null or estimated_micro_usd between 0 and 10000000),
 reserved_credits integer not null default 0 check (reserved_credits=0),
 spent_credits integer not null default 0 check (spent_credits=0),
 actual_micro_usd bigint check (actual_micro_usd is null),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 unique(user_id,request_key)
);
alter table public.model_production_jobs enable row level security;
revoke all on public.model_production_jobs from public,anon,authenticated;
grant select,insert,update on public.model_production_jobs to service_role;
create index model_jobs_owner_created on public.model_production_jobs(user_id,created_at desc);
-- Only the service role can register a plan. Serialize each account's quota and idempotency.
create function public.model_register_blocked_job(p_user uuid,p_key uuid,p_model text,p_provider text,p_hash text,p_plan jsonb,p_estimate bigint)
returns public.model_production_jobs language plpgsql security invoker set search_path='' as $$
declare j public.model_production_jobs;
begin
 perform pg_advisory_xact_lock(hashtextextended('model-plan:'||p_user::text,0));
 select * into j from public.model_production_jobs where user_id=p_user and request_key=p_key;
 if found then
  if j.plan_hash<>p_hash or j.model_id<>p_model or j.provider<>p_provider or j.plan<>p_plan or j.estimated_micro_usd is distinct from p_estimate then raise exception 'request_conflict'; end if;
  return j;
 end if;
 if (select count(*) from public.model_production_jobs where user_id=p_user and created_at>now()-interval '1 day')>=20 then raise exception 'plan_quota'; end if;
 insert into public.model_production_jobs(user_id,request_key,model_id,provider,plan_hash,plan,estimated_micro_usd)
 values(p_user,p_key,p_model,p_provider,p_hash,p_plan,p_estimate) returning * into j;
 return j;
end $$;
revoke all on function public.model_register_blocked_job(uuid,uuid,text,text,text,jsonb,bigint) from public,anon,authenticated;
grant execute on function public.model_register_blocked_job(uuid,uuid,text,text,text,jsonb,bigint) to service_role;
commit;
