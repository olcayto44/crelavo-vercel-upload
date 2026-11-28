-- Isolated, explicitly synthetic rehearsal; never touches credit_balances or credit_events.
begin;
create table public.model_rehearsal_wallets(
 user_id uuid primary key references auth.users(id) on delete restrict,
 balance integer not null default 100 check(balance between 0 and 100),
 reserved integer not null default 0 check(reserved between 0 and balance)
);
create table public.model_rehearsal_runs(
 job_id uuid primary key references public.model_production_jobs(id) on delete restrict,
 user_id uuid not null references auth.users(id) on delete restrict,
 state text not null default 'queued' check(state in ('queued','running','ready','failed','reconcile_required')),
 progress integer not null default 0 check(progress in (0,25,100)),
 test_credits integer not null default 10 check(test_credits=10),
 reservation_state text not null default 'reserved' check(reservation_state in ('reserved','settled','released')),
 actual_micro_usd bigint check(actual_micro_usd is null),
 delivery_key text check(delivery_key=user_id::text||'/'||job_id::text||'/rehearsal.mp4'),
 delivery_sha256 text check(delivery_sha256 ~ '^[0-9a-f]{64}$'),
 delivery_bytes integer check(delivery_bytes between 1 and 3000000),
 created_at timestamptz not null default now(),updated_at timestamptz not null default now(),
 check((state='ready' and progress=100 and reservation_state='settled' and delivery_key is not null and delivery_sha256 is not null and delivery_bytes is not null) or (state<>'ready' and delivery_key is null and delivery_sha256 is null and delivery_bytes is null)),
 check((state in ('queued','running','reconcile_required') and reservation_state='reserved') or (state='ready' and reservation_state='settled') or (state='failed' and reservation_state='released'))
);
alter table public.model_rehearsal_wallets enable row level security;
alter table public.model_rehearsal_runs enable row level security;
revoke all on public.model_rehearsal_wallets,public.model_rehearsal_runs from public,anon,authenticated;
grant select,insert,update on public.model_rehearsal_wallets,public.model_rehearsal_runs to service_role;
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('model-rehearsal-delivery','model-rehearsal-delivery',false,3000000,array['video/mp4']);
create function public.model_rehearsal_reserve(p_user uuid,p_job uuid) returns public.model_rehearsal_runs language plpgsql security invoker set search_path='' as $$
declare r public.model_rehearsal_runs; w public.model_rehearsal_wallets;
begin
 perform pg_advisory_xact_lock(hashtextextended('model-rehearsal:'||p_user::text,0));
 if not exists(select 1 from public.model_production_jobs where id=p_job and user_id=p_user and state='blocked' and model_id='magi-2') then raise exception 'invalid_plan'; end if;
 select * into r from public.model_rehearsal_runs where job_id=p_job and user_id=p_user;
 if found then return r; end if;
 insert into public.model_rehearsal_wallets(user_id) values(p_user) on conflict do nothing;
 select * into w from public.model_rehearsal_wallets where user_id=p_user for update;
 if w.balance-w.reserved<10 then raise exception 'insufficient_test_credits'; end if;
 update public.model_rehearsal_wallets set reserved=reserved+10 where user_id=p_user;
 insert into public.model_rehearsal_runs(job_id,user_id) values(p_job,p_user) returning * into r;
 return r;
end $$;
create function public.model_rehearsal_claim(p_user uuid) returns public.model_rehearsal_runs language plpgsql security invoker set search_path='' as $$
declare r public.model_rehearsal_runs;
begin
 select * into r from public.model_rehearsal_runs where user_id=p_user and state='queued' order by created_at,job_id for update skip locked limit 1;
 if not found then return null; end if;
 update public.model_rehearsal_runs set state='running',progress=25,updated_at=now() where job_id=r.job_id returning * into r;
 return r;
end $$;
create function public.model_rehearsal_finalize(p_user uuid,p_job uuid,p_outcome text,p_key text,p_sha text,p_bytes integer) returns public.model_rehearsal_runs language plpgsql security invoker set search_path='' as $$
declare r public.model_rehearsal_runs;
begin
 if p_outcome is null or p_outcome not in ('ready','failed','reconcile_required') then raise exception 'invalid_outcome'; end if;
 perform pg_advisory_xact_lock(hashtextextended('model-rehearsal:'||p_user::text,0));
 select * into r from public.model_rehearsal_runs where user_id=p_user and job_id=p_job for update;
 if not found then raise exception 'missing_run'; end if;
 if r.state=p_outcome then
  if p_outcome='ready' and (r.delivery_key is distinct from p_key or r.delivery_sha256 is distinct from p_sha or r.delivery_bytes is distinct from p_bytes) then raise exception 'delivery_conflict'; end if;
  return r;
 end if;
 if r.state<>'running' then raise exception 'invalid_state'; end if;
 if p_outcome='ready' then
  if p_key is null or p_key<>p_user::text||'/'||p_job::text||'/rehearsal.mp4' or p_sha is null or p_sha !~ '^[0-9a-f]{64}$' or p_bytes is null or p_bytes not between 1 and 3000000 then raise exception 'invalid_delivery'; end if;
  if not exists(select 1 from storage.objects where bucket_id='model-rehearsal-delivery' and name=p_key) then raise exception 'missing_delivery'; end if;
 elsif p_key is not null or p_sha is not null or p_bytes is not null then raise exception 'unexpected_delivery'; end if;
 if p_outcome<>'reconcile_required' then
  update public.model_rehearsal_wallets set reserved=reserved-10,balance=balance-case when p_outcome='ready' then 10 else 0 end where user_id=p_user and reserved>=10;
  if not found then raise exception 'test_wallet_mismatch'; end if;
 end if;
 update public.model_rehearsal_runs set state=p_outcome,progress=case when p_outcome='ready' then 100 else 25 end,reservation_state=case when p_outcome='ready' then 'settled' when p_outcome='failed' then 'released' else 'reserved' end,delivery_key=p_key,delivery_sha256=p_sha,delivery_bytes=p_bytes,updated_at=now() where job_id=p_job returning * into r;
 return r;
end $$;
revoke all on function public.model_rehearsal_reserve(uuid,uuid),public.model_rehearsal_claim(uuid),public.model_rehearsal_finalize(uuid,uuid,text,text,text,integer) from public,anon,authenticated;
grant execute on function public.model_rehearsal_reserve(uuid,uuid),public.model_rehearsal_claim(uuid),public.model_rehearsal_finalize(uuid,uuid,text,text,text,integer) to service_role;
commit;
