-- Stage-based production: additive schema. Existing Whop and Website ledger are untouched.
-- Service role only. Each provider call is fenced by a durable, owner-scoped claim.
create table if not exists public.studio_stage_jobs (
 id uuid primary key, user_id uuid not null references auth.users(id), category text not null,
 title text not null check(length(title) between 1 and 160),
 plan_hash text not null check(plan_hash ~ '^[a-f0-9]{64}$'), tariff_version text not null,
 state text not null default 'queued' check(state in ('queued','running','paused_credits','ready','reconcile_required','cancelled')),
 total_credits integer not null check(total_credits between 1 and 100000),
 spent_credits integer not null default 0 check(spent_credits>=0 and spent_credits<=total_credits),
 auto_resume boolean not null default true, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.studio_stage_steps (
 job_id uuid not null references public.studio_stage_jobs(id) on delete restrict, ordinal integer not null check(ordinal between 0 and 99),
 operation text not null, input jsonb not null, credits integer not null check(credits between 1 and 100000),
 state text not null default 'pending' check(state in ('pending','claimed','ready','reconcile_required','cancelled')),
 claim_token uuid, credit_period jsonb, receipt jsonb, artifact_base64 text, error_code text, claimed_at timestamptz, completed_at timestamptz,
 primary key(job_id,ordinal), check(artifact_base64 is null or length(artifact_base64)<=2800000)
);
create index if not exists studio_stage_jobs_owner_idx on public.studio_stage_jobs(user_id,created_at desc);
create index if not exists studio_stage_jobs_queue_idx on public.studio_stage_jobs(state,updated_at) where state in ('queued','paused_credits');
alter table public.studio_stage_jobs enable row level security;
alter table public.studio_stage_steps enable row level security;
revoke all on public.studio_stage_jobs,public.studio_stage_steps from public,anon,authenticated;
grant select,insert,update on public.studio_stage_jobs,public.studio_stage_steps to service_role;
create or replace function public.studio_stage_create(p_user uuid,p_job uuid,p_category text,p_title text,p_hash text,p_tariff text,p_steps jsonb,p_auto boolean)
returns jsonb language plpgsql security invoker set search_path=public,pg_temp as $$
declare j studio_stage_jobs%rowtype; item jsonb; total integer:=0; i integer:=0;
begin
 if p_user is null or p_job is null or p_category !~ '^[a-z_]{1,50}$' or p_hash !~ '^[a-f0-9]{64}$' or length(p_tariff)>64 or p_auto is null or jsonb_typeof(p_steps)<>'array' or jsonb_array_length(p_steps) not between 1 and 100 or octet_length(p_steps::text)>200000 then raise exception 'stage_plan_invalid';end if;
 -- Per-category adapter allowlist is additionally enforced by the server. No arbitrary operation dispatch.
 for item in select value from jsonb_array_elements(p_steps) loop
  if jsonb_typeof(item->'input')<>'object' or item->>'operation' !~ '^[a-z_]{1,60}$' or (item->>'credits')::int not between 1 and 100000 then raise exception 'stage_step_invalid';end if;
  total:=total+(item->>'credits')::int;
 end loop;
 insert into studio_stage_jobs(id,user_id,category,title,plan_hash,tariff_version,total_credits,auto_resume)
 values(p_job,p_user,p_category,p_title,p_hash,p_tariff,total,p_auto) on conflict(id) do nothing;
 select * into j from studio_stage_jobs where id=p_job for update;
 if j.user_id<>p_user or j.plan_hash<>p_hash or j.category<>p_category or j.total_credits<>total or j.tariff_version<>p_tariff then raise exception 'stage_job_conflict';end if;
 if exists(select 1 from studio_stage_steps where job_id=p_job) then return jsonb_build_object('id',j.id,'state',j.state,'idempotent',true);end if;
 for item in select value from jsonb_array_elements(p_steps) loop
  insert into studio_stage_steps(job_id,ordinal,operation,input,credits) values(p_job,i,item->>'operation',item->'input',(item->>'credits')::int);
  i:=i+1;
 end loop;
 return jsonb_build_object('id',j.id,'state',j.state);
end $$;
create or replace function public.studio_stage_claim(p_user uuid,p_job uuid,p_hash text)
returns jsonb language plpgsql security invoker set search_path=public,pg_temp as $$
declare j studio_stage_jobs%rowtype;s studio_stage_steps%rowtype;w credit_balances%rowtype;available integer;token uuid:=gen_random_uuid();period jsonb;
begin
 select * into j from studio_stage_jobs where id=p_job and user_id=p_user for update;
 if not found or j.plan_hash is distinct from p_hash then raise exception 'stage_job_not_found';end if;
 if j.state not in ('queued','paused_credits') then return jsonb_build_object('state',j.state,'claimed',false);end if;
 select * into s from studio_stage_steps where job_id=p_job and state='pending' order by ordinal limit 1 for update;
 if not found then raise exception 'stage_pending_step_missing';end if;
 select * into w from credit_balances where user_id=p_user for update;
 available:=case when found then greatest(0,w.balance-w.reserved) else 0 end;
 if available<s.credits then
  update studio_stage_jobs set state='paused_credits',updated_at=now() where id=p_job;
  return jsonb_build_object('state','paused_credits','claimed',false,'available',available,'required',s.credits,'shortfall',s.credits-available,'remaining',j.total_credits-j.spent_credits);
 end if;
 if w.balance<>w.rolled_over_credits+w.current_subscription_credits+w.bonus_credits+w.topup_credits then
  update studio_stage_jobs set state='reconcile_required',updated_at=now() where id=p_job;
  return jsonb_build_object('state','reconcile_required','claimed',false,'code','wallet_bucket_mismatch');
 end if;
 period:=jsonb_build_object('billing',w.billing_cycle_ends_at,'topup',w.topup_expires_at,'rollover',w.last_rollover_at);
 update credit_balances set reserved=reserved+s.credits,updated_at=now() where user_id=p_user;
 update studio_stage_steps set state='claimed',claim_token=token,credit_period=period,claimed_at=now() where job_id=p_job and ordinal=s.ordinal;
 update studio_stage_jobs set state='running',updated_at=now() where id=p_job;
 return jsonb_build_object('state','running','claimed',true,'ordinal',s.ordinal,'token',token,'operation',s.operation,'input',s.input,'credits',s.credits,'available',available-s.credits);
end $$;
create or replace function public.studio_stage_finish(p_user uuid,p_job uuid,p_ordinal integer,p_token uuid,p_outcome text,p_receipt jsonb,p_artifact text,p_code text)
returns jsonb language plpgsql security invoker set search_path=public,pg_temp as $$
declare j studio_stage_jobs%rowtype;s studio_stage_steps%rowtype;w credit_balances%rowtype;leftover integer;r integer;c integer;b integer;t integer;take integer;next_cost integer;available integer;next_state text;
begin
 select * into j from studio_stage_jobs where id=p_job and user_id=p_user for update;
 if not found then raise exception 'stage_job_not_found';end if;
 select * into s from studio_stage_steps where job_id=p_job and ordinal=p_ordinal for update;
 if not found or s.claim_token is distinct from p_token or p_token is null then raise exception 'stage_claim_mismatch';end if;
 if s.state='ready' then return jsonb_build_object('state',j.state,'idempotent',true);end if;
 if s.state<>'claimed' or j.state<>'running' then return jsonb_build_object('state',j.state,'idempotent',true);end if;
 if p_outcome not in ('ready','uncertain','not_dispatched') then raise exception 'stage_outcome_invalid';end if;
 if p_outcome='uncertain' then
  update studio_stage_steps set state='reconcile_required',error_code=left(coalesce(p_code,'provider_outcome_unconfirmed'),100) where job_id=p_job and ordinal=p_ordinal;
  update studio_stage_jobs set state='reconcile_required',updated_at=now() where id=p_job;
  return jsonb_build_object('state','reconcile_required');
 end if;
 select * into w from credit_balances where user_id=p_user for update;
 if not found or w.reserved<s.credits or w.balance<s.credits or s.credit_period is distinct from jsonb_build_object('billing',w.billing_cycle_ends_at,'topup',w.topup_expires_at,'rollover',w.last_rollover_at) then
  update studio_stage_steps set state='reconcile_required',error_code='wallet_or_credit_period_changed',receipt=p_receipt,artifact_base64=p_artifact where job_id=p_job and ordinal=p_ordinal;
  update studio_stage_jobs set state='reconcile_required',updated_at=now() where id=p_job;
  return jsonb_build_object('state','reconcile_required');
 end if;
 if p_outcome='not_dispatched' then
  update credit_balances set reserved=reserved-s.credits,updated_at=now() where user_id=p_user;
  update studio_stage_steps set state='pending',claim_token=null,credit_period=null,claimed_at=null,error_code=left(coalesce(p_code,'not_dispatched'),100) where job_id=p_job and ordinal=p_ordinal;
  update studio_stage_jobs set state='queued',auto_resume=false,updated_at=now() where id=p_job;
  return jsonb_build_object('state','queued','released',s.credits);
 end if;
 -- Durable receipt + verified artifact are mandatory; API checks bytes with sharp and hash.
 if p_receipt is null or jsonb_typeof(p_receipt)<>'object' or coalesce(p_receipt->>'sha256','') !~ '^[a-f0-9]{64}$' or coalesce(p_receipt->>'providerRequestId','') !~ '^[A-Za-z0-9_-]{8,160}$' or p_artifact is null or length(p_artifact) not between 16 and 2800000 then raise exception 'stage_verified_artifact_required';end if;
 leftover:=s.credits;r:=w.rolled_over_credits;c:=w.current_subscription_credits;b:=w.bonus_credits;t:=w.topup_credits;
 take:=least(r,leftover);r:=r-take;leftover:=leftover-take;
 take:=least(c,leftover);c:=c-take;leftover:=leftover-take;
 take:=least(b,leftover);b:=b-take;leftover:=leftover-take;
 take:=least(t,leftover);t:=t-take;leftover:=leftover-take;
 if leftover<>0 or least(r,c,b,t)<0 then raise exception 'stage_wallet_bucket_mismatch';end if;
 update credit_balances set balance=balance-s.credits,reserved=reserved-s.credits,rolled_over_credits=r,current_subscription_credits=c,bonus_credits=b,topup_credits=t,updated_at=now() where user_id=p_user;
 update studio_stage_steps set state='ready',receipt=p_receipt,artifact_base64=p_artifact,completed_at=now(),error_code=null where job_id=p_job and ordinal=p_ordinal;
 insert into credit_events(user_id,type,amount,note) values(p_user,'spend',s.credits,'studio-stage:'||p_job::text||':'||p_ordinal::text);
 select credits into next_cost from studio_stage_steps where job_id=p_job and state='pending' order by ordinal limit 1;
 available:=w.balance-w.reserved;
 next_state:=case when next_cost is null then 'ready' when available<next_cost then 'paused_credits' else 'queued' end;
 update studio_stage_jobs set state=next_state,spent_credits=spent_credits+s.credits,updated_at=now() where id=p_job;
 return jsonb_build_object('state',next_state,'available',available,'required',coalesce(next_cost,0),'spent',j.spent_credits+s.credits,'remaining',j.total_credits-j.spent_credits-s.credits);
end $$;
revoke all on function public.studio_stage_create(uuid,uuid,text,text,text,text,jsonb,boolean),public.studio_stage_claim(uuid,uuid,text),public.studio_stage_finish(uuid,uuid,integer,uuid,text,jsonb,text,text) from public,anon,authenticated;
grant execute on function public.studio_stage_create(uuid,uuid,text,text,text,text,jsonb,boolean),public.studio_stage_claim(uuid,uuid,text),public.studio_stage_finish(uuid,uuid,integer,uuid,text,jsonb,text,text) to service_role;
