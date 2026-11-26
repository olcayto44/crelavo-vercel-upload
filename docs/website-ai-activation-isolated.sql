-- Isolated-only operator-controlled budget, and atomic explicit AI production approval.
-- No policy is inserted or enabled here; no credit or provider activity on migration.
begin;
create table public.website_ai_activation(
 singleton boolean primary key default true check(singleton),
 policy_version text not null check(policy_version ~ '^[A-Za-z0-9._-]{1,64}$'),
 policy_hash text not null check(policy_hash ~ '^[a-f0-9]{64}$'),
 maximum_micro_usd integer not null check(maximum_micro_usd between 1 and 50000),
 total_micro_usd integer not null check(total_micro_usd between 1 and 1000000),
 user_rpm integer not null check(user_rpm between 1 and 10),
 system_rpm integer not null check(system_rpm between 1 and 100),
 enabled boolean not null default false
);
alter table public.website_ai_activation enable row level security;
revoke all on public.website_ai_activation from public,anon,authenticated,service_role;
grant select on public.website_ai_activation to service_role;
create function public.website_ai_approve_enqueue(p_user uuid,p_production uuid,p_hash text,p_policy_version text,p_policy_hash text,p_credits integer,p_maximum integer,p_brief jsonb,p_pack text)
returns text language plpgsql security definer set search_path='' as $f$
declare cfg public.website_ai_activation%rowtype; j public.website_ai_jobs%rowtype; p public.production_requests%rowtype; w public.credit_balances%rowtype; a jsonb; spent bigint; queued text;
begin
 if p_hash is null or p_hash !~ '^[a-f0-9]{64}$' or p_brief is null or jsonb_typeof(p_brief)<>'object' or p_pack is null or p_pack not in ('landing_page','business_website') then return 'denied';end if;
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('website-ai-approval-budget-v1',0));
 select * into cfg from public.website_ai_activation where singleton;
 if not found or not cfg.enabled or cfg.policy_version is distinct from p_policy_version or cfg.policy_hash is distinct from p_policy_hash or cfg.maximum_micro_usd is distinct from p_maximum then return 'disabled';end if;
 select * into p from public.production_requests where id=p_production and user_id=p_user and production_type='website' for update;
 if not found then return 'denied';end if;
 select * into j from public.website_ai_jobs where production_id=p_production;
 if found then
 if j.user_id=p_user and j.plan_hash=p_hash and j.policy_hash=p_policy_hash and j.policy_version=p_policy_version and j.credits=p_credits and j.maximum_micro_usd=p_maximum then return 'already_enqueued';end if;
 return 'denied';
 end if;
 a=p.output_json->'websiteAssistant';
 if p.status is distinct from 'pending' or a->>'phase' is distinct from 'approved' or a->>'approvedHash' is distinct from p_hash or a->>'planHash' is distinct from p_hash or a->>'packId' is distinct from p_pack or a->'brief' is distinct from p_brief or a->'credits' is distinct from to_jsonb(p_credits) or p.estimated_credits is distinct from p_credits or p.reserved_credits is distinct from 0 then return 'denied';end if;
 select coalesce(sum(maximum_micro_usd),0) into spent from public.website_ai_jobs;
 if spent+p_maximum>cfg.total_micro_usd then return 'budget_exhausted';end if;
 -- Count all jobs whose last activity is recent, conservatively including unresolved work.
 if (select count(*) from public.website_ai_jobs where updated_at>clock_timestamp()-interval '1 minute')>=cfg.system_rpm or (select count(*) from public.website_ai_jobs where user_id=p_user and updated_at>clock_timestamp()-interval '1 minute')>=cfg.user_rpm then return 'rate_limited';end if;
 select * into w from public.credit_balances where user_id=p_user for update;
 if not found or w.balance-w.reserved<p_credits or w.reserved<0 or (w.billing_cycle_ends_at is not null and w.billing_cycle_ends_at<=now()) or (w.topup_credits>0 and w.topup_expires_at is not null and w.topup_expires_at<=now()) then return 'wallet_unavailable';end if;
 update public.production_requests set output_json=output_json||jsonb_build_object('websiteAIApproval',jsonb_build_object('planHash',p_hash,'policyVersion',p_policy_version,'policyHash',p_policy_hash,'credits',p_credits,'maximumMicroUSD',p_maximum,'source','persisted_explicit_user_approval')) where id=p_production and user_id=p_user;
 queued=public.website_ai_enqueue(p_user,p_production,p_hash,p_policy_version,p_policy_hash,p_credits,p_maximum);
 if queued is distinct from 'queued' then raise exception 'website_ai_enqueue_conflict';end if;
 return queued;
end $f$;
revoke all on function public.website_ai_approve_enqueue(uuid,uuid,text,text,text,integer,integer,jsonb,text) from public,anon,authenticated;
grant execute on function public.website_ai_approve_enqueue(uuid,uuid,text,text,text,integer,integer,jsonb,text) to service_role;
commit;
