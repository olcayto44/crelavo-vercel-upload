-- Isolated-only assistant accounting. No policy or wallet is provisioned by migration.
-- No mutations of production credits, Whop records or real provider calls.
begin;
create table public.studio_agent_projects(
 id uuid primary key default gen_random_uuid(),user_id uuid not null references auth.users(id),category_id text not null check(category_id in ('website','saas','mobile_app','admin_project','video','talking_video','documentary','animation','music_video','drama','cinematic_video','video_clipping','video_tools','campaign','ad_score_checker','campaign_calendar','ai_agent','localization','cultural_localization','live_sales_agent','avatar','lip_sync','voice_clone','visual_clone','image','brand_kit','document_pack','anime_short_film','animal_video','nature_video','planet_space_video','drone_video','stickman_animation','studio','crelavo_academy','community_showcase','virtual_model_studio')),title text not null check(length(title) between 1 and 160),production_id uuid references public.production_requests(id),brief jsonb not null default '{}' check(jsonb_typeof(brief)='object' and octet_length(brief::text)<=90000),revision integer not null default 0 check(revision>=0),updated_at timestamptz not null default now(),unique(id,user_id,category_id)
);
create table public.studio_agent_messages(
 id bigint generated always as identity primary key,project_id uuid not null,user_id uuid not null,category_id text not null,role text not null check(role in ('user','assistant')),content text not null check(length(content) between 1 and 6000),foreign key(project_id,user_id,category_id) references public.studio_agent_projects(id,user_id,category_id)
);
create index studio_agent_message_scope on public.studio_agent_messages(project_id,id desc);
create table public.studio_agent_wallets_private(
 user_id uuid primary key references auth.users(id),balance integer not null check(balance>=0),reserved integer not null default 0 check(reserved>=0 and reserved<=balance)
);
create table public.studio_agent_cost_config(
 singleton boolean primary key default true check(singleton),policy jsonb not null check(jsonb_typeof(policy)='object'),tariff_version text not null check(tariff_version ~ '^[A-Za-z0-9._-]{1,64}$'),input_units integer not null check(input_units between 1 and 1000),output_units integer not null check(output_units between 1 and 1000)
);
create table public.studio_agent_requests(
 user_id uuid not null,request_id uuid not null,project_id uuid not null,category_id text not null,base_revision integer not null check(base_revision>=0),payload_hash text not null check(payload_hash ~ '^[a-f0-9]{64}$'),message text not null check(length(message) between 1 and 6000),state text not null check(state in ('reserved','dispatched','uncertain','result_ready','settled','released')),reserve_units integer not null check(reserve_units>0),policy jsonb not null,tariff_version text not null,input_units integer not null,output_units integer not null,input_bound integer not null,output_bound integer not null,maximum_micro_usd integer not null check(maximum_micro_usd>0),actual_micro_usd integer,charged_units integer,provider_request_id text unique,result jsonb,response jsonb,created_at timestamptz not null default clock_timestamp(),primary key(user_id,request_id),foreign key(project_id,user_id,category_id) references public.studio_agent_projects(id,user_id,category_id)
);
create unique index studio_agent_one_open_request on public.studio_agent_requests(project_id) where state in ('reserved','dispatched','uncertain','result_ready');
create index studio_agent_request_rate on public.studio_agent_requests(created_at,user_id);
alter table public.studio_agent_projects enable row level security;
alter table public.studio_agent_messages enable row level security;
alter table public.studio_agent_wallets_private enable row level security;
alter table public.studio_agent_cost_config enable row level security;
alter table public.studio_agent_requests enable row level security;
revoke all on public.studio_agent_projects,public.studio_agent_messages,public.studio_agent_wallets_private,public.studio_agent_cost_config,public.studio_agent_requests from public,anon,authenticated,service_role;
grant select,insert,update on public.studio_agent_projects,public.studio_agent_requests to service_role;
grant select,insert on public.studio_agent_messages to service_role;
grant select,update on public.studio_agent_wallets_private to service_role;
grant select on public.studio_agent_cost_config to service_role;
grant usage,select on sequence public.studio_agent_messages_id_seq to service_role;
create function public.studio_agent_create_project(p_user uuid,p_category text,p_title text,p_production uuid,p_brief jsonb,p_messages jsonb) returns uuid language plpgsql security invoker set search_path='' as $f$
declare project uuid; m jsonb;
begin
 if p_user is null or p_brief is null or p_messages is null or jsonb_typeof(p_messages)<>'array' or jsonb_array_length(p_messages)>30 then raise exception 'invalid_project';end if;
 if p_production is not null and (p_category<>'website' or not exists(select 1 from public.production_requests where id=p_production and user_id=p_user and production_type='website')) then raise exception 'project_not_found';end if;
 insert into public.studio_agent_projects(user_id,category_id,title,production_id,brief) values(p_user,p_category,p_title,p_production,p_brief) returning id into project;
 for m in select value from jsonb_array_elements(p_messages) loop insert into public.studio_agent_messages(project_id,user_id,category_id,role,content) values(project,p_user,p_category,m->>'role',m->>'content');end loop;
 return project;
end $f$;
create function public.studio_agent_wallets(p_user uuid) returns jsonb language sql stable security invoker set search_path='' as $f$
 select jsonb_build_object('assistant',jsonb_build_object('balance',coalesce(a.balance,0),'reserved',coalesce(a.reserved,0),'available',coalesce(a.balance-a.reserved,0)),'production',jsonb_build_object('balance',coalesce(p.balance,0),'reserved',coalesce(p.reserved,0),'available',greatest(0,coalesce(p.balance-p.reserved,0)))) from (select p_user as id) u left join public.studio_agent_wallets_private a on a.user_id=u.id left join public.credit_balances p on p.user_id=u.id
$f$;
create function public.studio_agent_readiness() returns jsonb language sql stable security invoker set search_path='' as $f$
 select jsonb_build_object('version','b3-isolated-cost','database',true,'accounting',exists(select 1 from public.studio_agent_cost_config where singleton))
$f$;
create function public.studio_agent_budget_reserve(p_user uuid,p_project uuid,p_category text,p_request uuid,p_hash text,p_units integer,p_tariff text,p_message text,p_revision integer,p_policy jsonb,p_input integer,p_output integer) returns jsonb language plpgsql security invoker set search_path='' as $f$
declare cfg public.studio_agent_cost_config%rowtype; j public.studio_agent_requests%rowtype; w public.studio_agent_wallets_private%rowtype; pr public.studio_agent_projects%rowtype; cost bigint; spent bigint;
begin
 -- Global serialization covers total provider budget, rate ceilings and wallet holds.
 perform pg_advisory_xact_lock(hashtextextended('studio-agent-accounting-v1',0));
 select * into j from public.studio_agent_requests where user_id=p_user and request_id=p_request;
 if found then
  if j.project_id is distinct from p_project or j.category_id is distinct from p_category or j.payload_hash is distinct from p_hash then raise exception 'request_payload_conflict';end if;
  return jsonb_build_object('state',case when j.state in ('settled','released','result_ready') then j.state else 'pending' end,'response',j.response);
 end if;
 select * into cfg from public.studio_agent_cost_config where singleton for share;
 if not found or cfg.policy is distinct from p_policy or cfg.tariff_version is distinct from p_tariff then raise exception 'budget_policy_mismatch';end if;
 if p_policy->>'model' is distinct from 'gpt-6.1-terra' or p_input is null or p_output is null or p_input not between 1 and least(16000,(p_policy->>'inputLimit')::int) or p_output not between 1 and least(1200,(p_policy->>'outputLimit')::int) or p_output is distinct from (p_policy->>'outputLimit')::int then raise exception 'budget_policy_mismatch';end if;
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
create function public.studio_agent_budget_claim(p_user uuid,p_request uuid) returns boolean language plpgsql security invoker set search_path='' as $f$
begin update public.studio_agent_requests set state='dispatched' where user_id=p_user and request_id=p_request and state='reserved';return found;end $f$;
create function public.studio_agent_budget_record(p_user uuid,p_request uuid,p_result jsonb,p_usage jsonb,p_units integer,p_receipt jsonb) returns void language plpgsql security invoker set search_path='' as $f$
declare j public.studio_agent_requests%rowtype; i integer; o integer; cost integer; pr jsonb;
begin
 select * into j from public.studio_agent_requests where user_id=p_user and request_id=p_request for update;
 if not found then raise exception 'project_not_found';end if;
 if j.state in ('result_ready','settled') and j.result=p_result and j.charged_units=p_units then return;end if;
 if j.state<>'dispatched' then raise exception 'request_not_dispatched';end if;
 i=(p_usage->>'inputTokens')::int;o=(p_usage->>'outputTokens')::int;pr=p_result->'project';
 cost=ceil((i::numeric*(j.policy->>'inputRate')::int+o::numeric*(j.policy->>'outputRate')::int)/1000000);
 if i is null or o is null or i not between 0 and j.input_bound or o not between 0 and j.output_bound or cost is null or cost>j.maximum_micro_usd or p_units is distinct from (ceil(i::numeric/1000)*j.input_units+ceil(o::numeric/1000)*j.output_units)::int or p_units>j.reserve_units or p_receipt->>'model' is distinct from j.policy->>'model' or p_receipt->>'policyVersion' is distinct from j.policy->>'version' or coalesce(p_receipt->>'providerRequestId','') !~ '^chatcmpl-[a-zA-Z0-9_-]{1,180}$' then raise exception 'provider_usage_unverifiable';end if;
 if p_result is null or octet_length(p_result::text)>450000 or pr->>'id' is distinct from j.project_id::text or pr->>'userId' is distinct from p_user::text or pr->>'categoryId' is distinct from j.category_id or pr->'snapshot'->>'categoryId' is distinct from j.category_id or (pr->'snapshot'->>'revision')::int not between j.base_revision+1 and j.base_revision+2 or pr->'snapshot'->'fields' is null or jsonb_typeof(pr->'snapshot'->'fields')<>'object' or coalesce(length(p_result->>'reply'),0) not between 1 and 6000 then raise exception 'invalid_result';end if;
 update public.studio_agent_requests set state='result_ready',result=p_result,charged_units=p_units,actual_micro_usd=cost,provider_request_id=p_receipt->>'providerRequestId' where user_id=p_user and request_id=p_request;
end $f$;
create function public.studio_agent_budget_settle(p_user uuid,p_request uuid,p_mode text) returns jsonb language plpgsql security invoker set search_path='' as $f$
declare j public.studio_agent_requests%rowtype; pr public.studio_agent_projects%rowtype; reply text; result jsonb; output jsonb;
begin
 if p_mode is distinct from 'real' then raise exception 'invalid_mode';end if;
 perform pg_advisory_xact_lock(hashtextextended('studio-agent-accounting-v1',0));
 select * into j from public.studio_agent_requests where user_id=p_user and request_id=p_request for update;
 if not found then raise exception 'project_not_found';end if;
 if j.state='settled' then return j.response;end if;
 if j.state<>'result_ready' then raise exception 'request_not_ready';end if;
 select * into pr from public.studio_agent_projects where id=j.project_id and user_id=p_user and category_id=j.category_id for update;
 if not found or pr.revision<>j.base_revision then raise exception 'project_changed_reload';end if;
 result=j.result;reply=result->>'reply';
 update public.studio_agent_wallets_private set reserved=reserved-j.reserve_units,balance=balance-j.charged_units where user_id=p_user and reserved>=j.reserve_units and balance>=j.charged_units;
 if not found then raise exception 'wallet_changed';end if;
 update public.studio_agent_projects set brief=result->'project'->'snapshot'->'fields',revision=(result->'project'->'snapshot'->>'revision')::int,updated_at=now() where id=j.project_id;
 insert into public.studio_agent_messages(project_id,user_id,category_id,role,content) values(j.project_id,p_user,j.category_id,'user',j.message),(j.project_id,p_user,j.category_id,'assistant',reply);
 output=jsonb_build_object('ok',true,'mode','real','project',result->'project','reply',reply,'requestId',p_request,'chargedCredits',j.charged_units,'chargedAccount','assistant','wallets',public.studio_agent_wallets(p_user),'blockedTools',coalesce(result->'blockedTools','[]'::jsonb),'executionReady',false,'nextQuestion',result->'nextQuestion');
 if result ? 'websiteRevisionProposal' then output=output||jsonb_build_object('websiteRevisionProposal',result->'websiteRevisionProposal');end if;
 update public.studio_agent_requests set state='settled',response=output where user_id=p_user and request_id=p_request;
 return output;
end $f$;
create function public.studio_agent_budget_release(p_user uuid,p_request uuid) returns void language plpgsql security invoker set search_path='' as $f$
declare j public.studio_agent_requests%rowtype;
begin
 perform pg_advisory_xact_lock(hashtextextended('studio-agent-accounting-v1',0));
 select * into j from public.studio_agent_requests where user_id=p_user and request_id=p_request for update;
 if not found then raise exception 'project_not_found';end if;
 if j.state='released' then return;end if;
 if j.state not in ('reserved','dispatched') then raise exception 'uncertain_cannot_release';end if;
 update public.studio_agent_wallets_private set reserved=reserved-j.reserve_units where user_id=p_user and reserved>=j.reserve_units;
 if not found then raise exception 'wallet_changed';end if;
 update public.studio_agent_requests set state='released' where user_id=p_user and request_id=p_request;
end $f$;
create function public.studio_agent_uncertain(p_user uuid,p_request uuid) returns void language sql security invoker set search_path='' as $f$
 update public.studio_agent_requests set state='uncertain' where user_id=p_user and request_id=p_request and state='dispatched'
$f$;
revoke all on function public.studio_agent_create_project(uuid,text,text,uuid,jsonb,jsonb),public.studio_agent_wallets(uuid),public.studio_agent_readiness(),public.studio_agent_budget_reserve(uuid,uuid,text,uuid,text,integer,text,text,integer,jsonb,integer,integer),public.studio_agent_budget_claim(uuid,uuid),public.studio_agent_budget_record(uuid,uuid,jsonb,jsonb,integer,jsonb),public.studio_agent_budget_settle(uuid,uuid,text),public.studio_agent_budget_release(uuid,uuid),public.studio_agent_uncertain(uuid,uuid) from public,anon,authenticated;
grant execute on function public.studio_agent_create_project(uuid,text,text,uuid,jsonb,jsonb),public.studio_agent_wallets(uuid),public.studio_agent_readiness(),public.studio_agent_budget_reserve(uuid,uuid,text,uuid,text,integer,text,text,integer,jsonb,integer,integer),public.studio_agent_budget_claim(uuid,uuid),public.studio_agent_budget_record(uuid,uuid,jsonb,jsonb,integer,jsonb),public.studio_agent_budget_settle(uuid,uuid,text),public.studio_agent_budget_release(uuid,uuid),public.studio_agent_uncertain(uuid,uuid) to service_role;
commit;
