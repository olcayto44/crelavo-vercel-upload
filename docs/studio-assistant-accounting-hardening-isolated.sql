begin;
create or replace function public.studio_agent_budget_reserve(p_user uuid,p_project uuid,p_category text,p_request uuid,p_hash text,p_units integer,p_tariff text,p_message text,p_revision integer,p_policy jsonb,p_input integer,p_output integer) returns jsonb language plpgsql security invoker set search_path='' as $f$
declare cfg public.studio_agent_cost_config%rowtype; j public.studio_agent_requests%rowtype; w public.studio_agent_wallets_private%rowtype; pr public.studio_agent_projects%rowtype; cost bigint; spent bigint;
begin
 -- Global serialization covers total provider budget, rate ceilings and wallet holds.
 perform pg_advisory_xact_lock(hashtextextended('studio-agent-accounting-v1',0));
 select * into j from public.studio_agent_requests where user_id=p_user and request_id=p_request;
 if found then
  if j.project_id is distinct from p_project or j.category_id is distinct from p_category or j.payload_hash is distinct from p_hash then raise exception 'request_payload_conflict';end if;
  return jsonb_build_object('state',case when j.state in ('settled','released','result_ready') then j.state else 'pending' end,'response',j.response);
 end if;
 select * into cfg from public.studio_agent_cost_config where singleton;
 if not found or cfg.policy is distinct from p_policy or cfg.tariff_version is distinct from p_tariff then raise exception 'budget_policy_mismatch';end if;
 if p_policy is null or not (p_policy ?& array['version','model','inputLimit','outputLimit','requestMicroUSD','totalMicroUSD','userRPM','systemRPM','inputRate','outputRate']) or p_policy->>'model' is distinct from 'gpt-6.1-terra' or p_input is null or p_output is null or p_input not between 1 and least(16000,(p_policy->>'inputLimit')::int) or p_output not between 1 and least(1200,(p_policy->>'outputLimit')::int) or p_output is distinct from (p_policy->>'outputLimit')::int then raise exception 'budget_policy_mismatch';end if;
 if (p_policy->>'inputRate')::int not between 3000000 and 10000000 or (p_policy->>'outputRate')::int not between 5000000 and 20000000 or (p_policy->>'requestMicroUSD')::int not between 1 and 50000 or (p_policy->>'totalMicroUSD')::int not between 1 and 1000000 or (p_policy->>'userRPM')::int not between 1 and 10 or (p_policy->>'systemRPM')::int not between 1 and 100 then raise exception 'budget_policy_mismatch';end if;
 cost=ceil((p_input::numeric*(p_policy->>'inputRate')::int+p_output::numeric*(p_policy->>'outputRate')::int)/1000000);
 if cost is null or cost<1 or cost>(p_policy->>'requestMicroUSD')::int or p_units is distinct from (ceil(p_input::numeric/1000)*cfg.input_units+ceil(p_output::numeric/1000)*cfg.output_units)::int then raise exception 'budget_policy_mismatch';end if;
 select * into pr from public.studio_agent_projects where id=p_project and user_id=p_user and category_id=p_category for update;
 if not found then raise exception 'project_not_found';end if;
 if pr.revision is distinct from p_revision then raise exception 'project_changed_reload';end if;
 if exists(select 1 from public.studio_agent_requests where project_id=p_project and state in ('reserved','dispatched','uncertain','result_ready')) then raise exception 'project_request_pending';end if;
 select coalesce(sum(case when state='settled' then actual_micro_usd else maximum_micro_usd end),0) into spent from public.studio_agent_requests where state<>'released';
 if spent+cost>(p_policy->>'totalMicroUSD')::int then raise exception 'budget_exhausted';end if;
 if (select count(*) from public.studio_agent_requests where created_at>clock_timestamp()-interval '1 minute')>=(p_policy->>'systemRPM')::int or (select count(*) from public.studio_agent_requests where user_id=p_user and created_at>clock_timestamp()-interval '1 minute')>=(p_policy->>'userRPM')::int then raise exception 'rate_limit';end if;
 select * into w from public.studio_agent_wallets_private where user_id=p_user for update;
 if not found or w.balance-w.reserved<p_units then raise exception 'insufficient_assistant_credits';end if;
 update public.studio_agent_wallets_private set reserved=reserved+p_units where user_id=p_user;
 insert into public.studio_agent_requests(user_id,request_id,project_id,category_id,base_revision,payload_hash,message,state,reserve_units,policy,tariff_version,input_units,output_units,input_bound,output_bound,maximum_micro_usd) values(p_user,p_request,p_project,p_category,p_revision,p_hash,p_message,'reserved',p_units,p_policy,p_tariff,cfg.input_units,cfg.output_units,p_input,p_output,cost);
 return '{"state":"fresh"}'::jsonb;
end $f$;
create or replace function public.studio_agent_budget_record(p_user uuid,p_request uuid,p_result jsonb,p_usage jsonb,p_units integer,p_receipt jsonb) returns void language plpgsql security invoker set search_path='' as $f$
declare j public.studio_agent_requests%rowtype; i integer; o integer; cost integer; pr jsonb;
begin
 select * into j from public.studio_agent_requests where user_id=p_user and request_id=p_request for update;
 if not found then raise exception 'project_not_found';end if;
 if j.state in ('result_ready','settled') and j.result=p_result and j.charged_units=p_units then return;end if;
 if j.state<>'dispatched' then raise exception 'request_not_dispatched';end if;
 i=(p_usage->>'inputTokens')::int;o=(p_usage->>'outputTokens')::int;pr=p_result->'project';
 cost=ceil((i::numeric*(j.policy->>'inputRate')::int+o::numeric*(j.policy->>'outputRate')::int)/1000000);
 if i is null or o is null or i not between 0 and j.input_bound or o not between 0 and j.output_bound or cost is null or cost>j.maximum_micro_usd or p_units is distinct from (ceil(i::numeric/1000)*j.input_units+ceil(o::numeric/1000)*j.output_units)::int or p_units>j.reserve_units or p_receipt->>'model' is distinct from j.policy->>'model' or p_receipt->>'policyVersion' is distinct from j.policy->>'version' or coalesce(p_receipt->>'providerRequestId','') !~ '^chatcmpl-[a-zA-Z0-9_-]{1,180}$' then raise exception 'provider_usage_unverifiable';end if;
 if p_result is null or octet_length(p_result::text)>450000 or pr->>'id' is distinct from j.project_id::text or pr->>'userId' is distinct from p_user::text or pr->>'categoryId' is distinct from j.category_id or pr->'snapshot'->>'categoryId' is distinct from j.category_id or (pr->'snapshot'->>'revision') is null or (pr->'snapshot'->>'revision')::int not between j.base_revision+1 and j.base_revision+2 or pr->'snapshot'->'fields' is null or jsonb_typeof(pr->'snapshot'->'fields')<>'object' or coalesce(length(p_result->>'reply'),0) not between 1 and 6000 or p_result->>'chargedCredits' is distinct from p_units::text or p_result->'usage' is distinct from p_usage then raise exception 'invalid_result';end if;
 update public.studio_agent_requests set state='result_ready',result=p_result,charged_units=p_units,actual_micro_usd=cost,provider_request_id=p_receipt->>'providerRequestId' where user_id=p_user and request_id=p_request;
end $f$;
commit;
