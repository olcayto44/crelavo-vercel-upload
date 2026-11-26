-- Isolated Website pilot only. Operator opt-in defaults to off.
-- Estimated usage is not an invoice. Reconciliation must preserve that distinction.
begin;
alter table public.website_ai_activation add column if not exists auto_metered_settlement boolean not null default false;
create or replace function public.website_ai_finalize_metered(p_user uuid,p_production uuid,p_hash text) returns text
language plpgsql security definer set search_path='' as $f$
declare p public.production_requests%rowtype; j public.website_ai_jobs%rowtype; cfg public.website_ai_activation%rowtype; pol jsonb; inp bigint; outp bigint; estimated bigint; evidence jsonb; result jsonb; digest text;
begin
 select * into cfg from public.website_ai_activation where singleton;
 if not found or not cfg.enabled or not cfg.auto_metered_settlement then return 'disabled';end if;
 select * into p from public.production_requests where id=p_production and user_id=p_user and production_type='website' for update;
 if not found then return 'denied';end if;
 select * into j from public.website_ai_jobs where production_id=p_production and user_id=p_user and plan_hash=p_hash for update;
 if not found then return 'denied';end if;
 if j.state='settled' then return 'already_settled';end if;
 if j.state<>'artifact_cost_pending' then return 'denied';end if;
 select policy into pol from public.studio_agent_cost_config where singleton;
 if not found or pol is null or j.policy_version is distinct from cfg.policy_version or j.policy_hash is distinct from cfg.policy_hash or j.maximum_micro_usd is distinct from cfg.maximum_micro_usd then return 'policy_mismatch';end if;
 if pol->>'version' is distinct from cfg.policy_version or pol->>'model' is distinct from 'gpt-6.1-terra' or pol->>'inputRate' is distinct from '3000000' or pol->>'outputRate' is distinct from '5000000' or pol->>'requestMicroUSD' is distinct from cfg.maximum_micro_usd::text or pol->>'totalMicroUSD' is distinct from cfg.total_micro_usd::text or pol->>'userRPM' is distinct from cfg.user_rpm::text or pol->>'systemRPM' is distinct from cfg.system_rpm::text or coalesce(pol->>'inputLimit','') !~ '^[0-9]{1,5}$' or coalesce(pol->>'outputLimit','') !~ '^[0-9]{1,4}$' then return 'policy_mismatch';end if;
 if (pol->>'inputLimit')::int not between 1 and 16000 or (pol->>'outputLimit')::int not between 1 and 1200 then return 'policy_mismatch';end if;
 digest=pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to('['||to_jsonb(pol->>'version')::text||','||to_jsonb(pol->>'model')::text||','||(pol->>'inputLimit')||','||(pol->>'outputLimit')||','||(pol->>'requestMicroUSD')||','||(pol->>'totalMicroUSD')||','||(pol->>'userRPM')||','||(pol->>'systemRPM')||','||(pol->>'inputRate')||','||(pol->>'outputRate')||']','UTF8')),'hex');
 if digest is distinct from cfg.policy_hash then return 'policy_mismatch';end if;
 if p.output_json->'websiteAIApproval' is distinct from jsonb_build_object('planHash',p_hash,'policyVersion',j.policy_version,'policyHash',j.policy_hash,'credits',j.credits,'maximumMicroUSD',j.maximum_micro_usd,'source','persisted_explicit_user_approval') or p.output_json->'websiteAssistant'->>'approvedHash' is distinct from p_hash or p.reserved_credits is distinct from j.credits then return 'denied';end if;
 if j.receipt->>'provider' is distinct from 'openai' or j.receipt->>'model' is distinct from pol->>'model' or j.receipt->>'policyVersion' is distinct from j.policy_version or coalesce(j.receipt->>'requestId','') !~ '^chatcmpl-[A-Za-z0-9_-]{1,180}$' or coalesce(j.receipt->>'copyHash','') !~ '^[a-f0-9]{64}$' or coalesce(j.receipt->>'inputTokens','') !~ '^[0-9]{1,5}$' or coalesce(j.receipt->>'outputTokens','') !~ '^[0-9]{1,4}$' or coalesce(j.receipt->>'estimatedMicroUSD','') !~ '^[0-9]{1,6}$' then return 'cost_evidence_required';end if;
 inp=(j.receipt->>'inputTokens')::bigint; outp=(j.receipt->>'outputTokens')::bigint;
 if inp not between 1 and (pol->>'inputLimit')::int or outp not between 1 and (pol->>'outputLimit')::int then return 'cost_evidence_required';end if;
 estimated=inp*3+outp*5;
 if estimated not between 1 and j.maximum_micro_usd or estimated is distinct from (j.receipt->>'estimatedMicroUSD')::bigint then return 'cost_evidence_required';end if;
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('website-metered-receipt:'||(j.receipt->>'requestId'),0));
 if exists(select 1 from public.website_ai_jobs k where k.production_id<>p_production and k.receipt->>'requestId'=j.receipt->>'requestId') then return 'cost_evidence_required';end if;
 if j.artifact->'editableAcceptance'->'passed' is distinct from 'true'::jsonb or jsonb_typeof(j.artifact->'editableDesign') is distinct from 'object' or j.artifact->'editableDesign'->>'version' is distinct from '2' or coalesce(j.artifact->>'editableDesignHash','') !~ '^[a-f0-9]{64}$' or jsonb_typeof(j.artifact->'files') is distinct from 'array' then return 'artifact_review_required';end if;
 evidence=jsonb_build_object('source','metered_policy_estimate','requestId',j.receipt->>'requestId','estimatedMicroUSD',estimated,'policyVersion',j.policy_version,'policyHash',j.policy_hash,'invoicePending',true,'inputTokens',inp,'outputTokens',outp);
 if not public.website_credit_record(p_user,p_production,p_hash,'ready',j.artifact) then raise exception 'ai_artifact_record_failed';end if;
 result=public.website_credit_finalize(p_user,p_production,p_hash,'ready');
 if result->>'state' is distinct from 'settled' then raise exception 'ai_credit_settlement_failed';end if;
 update public.website_ai_jobs set state='settled',reviewed_cost=evidence,updated_at=now() where production_id=p_production;
 return 'settled';
end $f$;
revoke all on function public.website_ai_finalize_metered(uuid,uuid,text) from public,anon,authenticated;
grant execute on function public.website_ai_finalize_metered(uuid,uuid,text) to service_role;
-- Isolated test only. A settled AI artifact is read-only and can be reviewed by
-- its purchaser in a site that they own. This never charges, creates or publishes a site.
create or replace function website_cms_private.read_settled_designs(p_site uuid,p_production uuid) returns jsonb
language plpgsql stable security definer set search_path='' as $f$
declare actor uuid:=auth.uid(); result jsonb;
begin
 if actor is null or not exists(select 1 from public.website_cms_members m where m.site_id=p_site and m.user_id=actor and m.role='owner') then return null;end if;
 select coalesce(jsonb_agg(q.item order by q.updated_at desc),'[]'::jsonb) into result
 from (
 select j.updated_at,jsonb_build_object('productionId',j.production_id,'updatedAt',j.updated_at,'brand',j.artifact->'editableDesign'->>'brand','designHash',j.artifact->>'editableDesignHash')
 ||case when p_production is not null then jsonb_build_object('design',j.artifact->'editableDesign') else '{}'::jsonb end as item
 from public.website_ai_jobs j
 join public.production_requests p on p.id=j.production_id and p.user_id=j.user_id
 join public.website_credit_reservations r on r.production_id=j.production_id and r.user_id=j.user_id and r.plan_hash=j.plan_hash
 where j.user_id=actor and j.state='settled' and r.state='settled' and r.credits=j.credits and j.credits>0
 and p.production_type='website' and p.status='ready' and p.reserved_credits=0
 and p.output_json->>'websiteBillingMode'='atomic_v1' and p.output_json->'websiteBillingPending'='false'::jsonb
 and p.output_json->'charged'=to_jsonb(r.credits)
 and p.output_json->'websiteAssistant'->>'approvedHash'=j.plan_hash
 and (j.reviewed_cost->>'source'='reviewed_provider_usage' or (j.reviewed_cost->>'source'='metered_policy_estimate' and j.reviewed_cost->'invoicePending'='true'::jsonb and j.reviewed_cost->'estimatedMicroUSD'=j.receipt->'estimatedMicroUSD'))
 and j.reviewed_cost->>'requestId'=j.receipt->>'requestId'
 and jsonb_typeof(j.artifact->'editableDesign')='object'
 and j.artifact->'editableDesign'->>'version'='2'
 and coalesce(j.artifact->>'editableDesignHash','') ~ '^[a-f0-9]{64}$'
 and octet_length((j.artifact->'editableDesign')::text)<=45000
 and (p_production is null or j.production_id=p_production)
 order by j.updated_at desc limit 20
 ) q;
 return result;
end $f$;

commit;
