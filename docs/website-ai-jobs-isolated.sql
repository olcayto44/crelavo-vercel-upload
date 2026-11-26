-- Isolated test only; deliberately outside automatic production migrations.
begin;
create table public.website_ai_jobs(
 production_id uuid primary key references public.production_requests(id),
 user_id uuid not null references public.profiles(id),
 plan_hash text not null check(plan_hash ~ '^[a-f0-9]{64}$'),
 policy_version text not null check(policy_version ~ '^[A-Za-z0-9._-]{1,64}$'),
 policy_hash text not null check(policy_hash ~ '^[a-f0-9]{64}$'),
 credits integer not null check(credits between 1 and 100000),
 maximum_micro_usd integer not null check(maximum_micro_usd between 1 and 50000),
 state text not null check(state in ('queued','claimed','artifact_cost_pending','reconcile_required','settled')),
 receipt jsonb, artifact jsonb, reviewed_cost jsonb,
 updated_at timestamptz not null default now()
);
alter table public.website_ai_jobs enable row level security;
revoke all on public.website_ai_jobs from public,anon,authenticated;
grant select on public.website_ai_jobs to service_role;
-- Caller has independently persisted and verified the AI-specific approval. The
-- approval tuple is stored on the project by an isolated fixture, never client data.
create function public.website_ai_enqueue(p_user uuid,p_production uuid,p_hash text,p_policy_version text,p_policy_hash text,p_credits integer,p_maximum integer) returns text
language plpgsql security definer set search_path=public,pg_temp as $$
declare p production_requests%rowtype; j website_ai_jobs%rowtype; reservation jsonb;
begin
 select * into p from production_requests where id=p_production and user_id=p_user and production_type='website' for update;
 if not found then return 'denied'; end if;
 select * into j from website_ai_jobs where production_id=p_production;
 if found then
  if j.user_id=p_user and j.plan_hash=p_hash and j.policy_version=p_policy_version and j.policy_hash=p_policy_hash and j.credits=p_credits and j.maximum_micro_usd=p_maximum then return 'already_enqueued'; end if;
  return 'denied';
 end if;
 if p.output_json->'websiteAIApproval' is distinct from jsonb_build_object('planHash',p_hash,'policyVersion',p_policy_version,'policyHash',p_policy_hash,'credits',p_credits,'maximumMicroUSD',p_maximum,'source','persisted_explicit_user_approval') then return 'denied'; end if;
 reservation=website_credit_reserve(p_user,p_production,p_hash,p_credits);
 if reservation->>'fresh' is distinct from 'true' then return 'denied'; end if;
 insert into website_ai_jobs(production_id,user_id,plan_hash,policy_version,policy_hash,credits,maximum_micro_usd,state) values(p_production,p_user,p_hash,p_policy_version,p_policy_hash,p_credits,p_maximum,'queued');
 return 'queued';
end $$;
-- Queue claim is a separate transaction. No retry after any provider claim.
create index website_ai_jobs_queue on public.website_ai_jobs(updated_at,production_id) where state='queued';
create function public.website_ai_claim(p_user uuid,p_production uuid,p_hash text,p_policy_version text,p_policy_hash text,p_credits integer,p_maximum integer) returns text
language plpgsql security definer set search_path=public,pg_temp as $$
declare p production_requests%rowtype; j website_ai_jobs%rowtype;
begin
 select * into p from production_requests where id=p_production and user_id=p_user and production_type='website' for update;
 if not found then return 'denied'; end if;
 select * into j from website_ai_jobs where production_id=p_production and user_id=p_user for update;
 if not found or j.plan_hash is distinct from p_hash or j.policy_version is distinct from p_policy_version or j.policy_hash is distinct from p_policy_hash or j.credits is distinct from p_credits or j.maximum_micro_usd is distinct from p_maximum then return 'denied'; end if;
 if j.state<>'queued' then return 'already_claimed'; end if;
 if p.output_json->'websiteAIApproval' is distinct from jsonb_build_object('planHash',p_hash,'policyVersion',p_policy_version,'policyHash',p_policy_hash,'credits',p_credits,'maximumMicroUSD',p_maximum,'source','persisted_explicit_user_approval') then return 'denied'; end if;
 if p.output_json->'websiteAssistant'->>'planHash' is distinct from p_hash or p.output_json->'websiteAssistant'->>'approvedHash' is distinct from p_hash then return 'denied'; end if;
 if not website_credit_claim(p_user,p_production,p_hash) then raise exception 'ai_claim_conflict'; end if;
 update website_ai_jobs set state='claimed',updated_at=now() where production_id=p_production;
 return 'claimed';
end $$;
-- A claimed call may already have reached its provider. Expiry means review,
-- never requeue. The owner and reservation stay intact.
create function public.website_ai_mark_stale(p_before timestamptz) returns integer
language plpgsql security definer set search_path=public,pg_temp as $$
declare n integer;
begin
 if p_before is null or p_before>now()-interval '5 minutes' then raise exception 'invalid_stale_cutoff'; end if;
 update website_ai_jobs set state='reconcile_required',updated_at=now() where state='claimed' and updated_at<p_before;
 get diagnostics n=row_count;
 return n;
end $$;
create function public.website_ai_record(p_user uuid,p_production uuid,p_hash text,p_receipt jsonb,p_artifact jsonb) returns boolean
language plpgsql security definer set search_path=public,pg_temp as $$
declare p production_requests%rowtype; j website_ai_jobs%rowtype;
begin
 select * into p from production_requests where id=p_production and user_id=p_user and production_type='website' for update;
 if not found then return false; end if;
 select * into j from website_ai_jobs where production_id=p_production and user_id=p_user and plan_hash=p_hash for update;
 if not found or j.state<>'claimed' or p.output_json->'websiteAssistant'->>'phase' is distinct from 'generating' then return false; end if;
 if p_receipt->>'provider' is distinct from 'openai' or p_receipt->>'policyVersion' is distinct from j.policy_version or p_receipt->>'model' is distinct from 'gpt-6.1-terra'
 or coalesce(p_receipt->>'requestId','') !~ '^chatcmpl-[A-Za-z0-9_-]{1,180}$'
 or coalesce(p_receipt->>'copyHash','') !~ '^[a-f0-9]{64}$'
 or coalesce(p_receipt->>'estimatedMicroUSD','') !~ '^[0-9]{1,6}$'
 or (p_receipt->>'estimatedMicroUSD')::integer not between 1 and j.maximum_micro_usd
 or coalesce(jsonb_typeof(p_artifact->'files'),'')<>'array'
 or octet_length(p_artifact::text)>8000000 then return false; end if;
 update website_ai_jobs set state='artifact_cost_pending',receipt=p_receipt,artifact=p_artifact,updated_at=now() where production_id=p_production;
 return true;
end $$;
create function public.website_ai_uncertain(p_user uuid,p_production uuid,p_hash text) returns boolean
language plpgsql security definer set search_path=public,pg_temp as $$
begin
 update website_ai_jobs set state='reconcile_required',updated_at=now() where production_id=p_production and user_id=p_user and plan_hash=p_hash and state='claimed';
 return found;
end $$;
-- The supplied cost evidence must be independently reviewed before invoking this
-- internal RPC. No automated invoice verification or browser endpoint exists.
create function public.website_ai_finalize(p_user uuid,p_production uuid,p_hash text,p_evidence jsonb) returns text
language plpgsql security definer set search_path=public,pg_temp as $$
declare p production_requests%rowtype; j website_ai_jobs%rowtype; settled jsonb;
begin
 select * into p from production_requests where id=p_production and user_id=p_user and production_type='website' for update;
 if not found then return 'denied'; end if;
 select * into j from website_ai_jobs where production_id=p_production and user_id=p_user and plan_hash=p_hash for update;
 if not found then return 'denied'; end if;
 if j.state='settled' then return 'already_settled'; end if;
 if j.state<>'artifact_cost_pending' then return 'denied'; end if;
 if p_evidence->>'source' is distinct from 'reviewed_provider_usage'
 or p_evidence->>'requestId' is distinct from j.receipt->>'requestId'
 or coalesce(p_evidence->>'actualMicroUSD','') !~ '^[0-9]{1,6}$'
 or (p_evidence->>'actualMicroUSD')::integer not between 1 and j.maximum_micro_usd then return 'cost_evidence_required'; end if;
 if not website_credit_record(p_user,p_production,p_hash,'ready',j.artifact) then raise exception 'ai_artifact_record_failed'; end if;
 settled=website_credit_finalize(p_user,p_production,p_hash,'ready');
 if settled->>'state' is distinct from 'settled' then
  update website_ai_jobs set state='reconcile_required',reviewed_cost=p_evidence,updated_at=now() where production_id=p_production;
  return 'reconcile_required';
 end if;
 update website_ai_jobs set state='settled',reviewed_cost=p_evidence,updated_at=now() where production_id=p_production;
 return 'settled';
end $$;
revoke all on function public.website_ai_enqueue(uuid,uuid,text,text,text,integer,integer),public.website_ai_mark_stale(timestamptz),public.website_ai_claim(uuid,uuid,text,text,text,integer,integer),public.website_ai_record(uuid,uuid,text,jsonb,jsonb),public.website_ai_uncertain(uuid,uuid,text),public.website_ai_finalize(uuid,uuid,text,jsonb) from public,anon,authenticated;
grant execute on function public.website_ai_enqueue(uuid,uuid,text,text,text,integer,integer),public.website_ai_mark_stale(timestamptz),public.website_ai_claim(uuid,uuid,text,text,text,integer,integer),public.website_ai_record(uuid,uuid,text,jsonb,jsonb),public.website_ai_uncertain(uuid,uuid,text),public.website_ai_finalize(uuid,uuid,text,jsonb) to service_role;
commit;
