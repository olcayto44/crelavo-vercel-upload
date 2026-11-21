-- B2 DRAFT / OFFLINE ONLY. Do not apply to Production Supabase.
-- No welcome grant, balance reset, Production debit, or payment-provider mutation.
begin;
alter table public.assistant_credit_balances add column if not exists reserved integer not null default 0;
alter table public.assistant_credit_balances add constraint studio_assistant_wallet_valid check (balance >= 0 and reserved >= 0 and reserved <= balance);

create function public.studio_agent_category_supported(value text) returns boolean language sql immutable as $$
 select value = any(array['website','saas','mobile_app','admin_project','video','talking_video','documentary','animation','music_video','drama','cinematic_video','video_clipping','video_tools','campaign','ad_score_checker','campaign_calendar','ai_agent','localization','cultural_localization','live_sales_agent','avatar','lip_sync','voice_clone','visual_clone','image','brand_kit','document_pack','anime_short_film','animal_video','nature_video','planet_space_video','drone_video','stickman_animation','studio','crelavo_academy','community_showcase','virtual_model_studio']);
$$;
create table public.studio_agent_projects (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles(id),
 category_id text not null check(public.studio_agent_category_supported(category_id)), title text not null check(length(title) between 1 and 160),
 production_id uuid references public.production_requests(id), brief jsonb not null default '{}', revision bigint not null default 0 check(revision>=0),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 unique(id,user_id,category_id), unique(user_id,category_id,production_id)
);
create table public.studio_agent_usage_requests (
 user_id uuid not null, request_id uuid not null, project_id uuid not null, category_id text not null,
 payload_hash text not null check(payload_hash ~ '^[a-f0-9]{64}$'), tariff_version text not null,
 reserve_credits integer not null check(reserve_credits>0), charged_credits integer,
 state text not null check(state in ('reserved','dispatched','uncertain','result_ready','settled','released')),
 snapshot_revision bigint not null, user_message text not null check(length(user_message) between 1 and 6000),
 result jsonb, response jsonb, usage jsonb, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 primary key(user_id,request_id), foreign key(project_id,user_id,category_id) references public.studio_agent_projects(id,user_id,category_id),
 check(charged_credits is null or charged_credits between 0 and reserve_credits)
);
create table public.studio_agent_messages (
 id bigint generated always as identity primary key, project_id uuid not null, user_id uuid not null, category_id text not null,
 request_id uuid, role text not null check(role in ('user','assistant')), content text not null check(length(content) between 1 and 6000),
 created_at timestamptz not null default now(),
 foreign key(project_id,user_id,category_id) references public.studio_agent_projects(id,user_id,category_id),
 foreign key(user_id,request_id) references public.studio_agent_usage_requests(user_id,request_id), unique(user_id,request_id,role)
);
create index studio_agent_messages_project on public.studio_agent_messages(project_id,id);
create table public.studio_agent_credit_ledger (
 id bigint generated always as identity primary key, user_id uuid not null, request_id uuid not null,
 account text not null default 'assistant' check(account='assistant'), event text not null check(event in ('reserve','settle','release')),
 units integer not null check(units>=0), balance_after integer not null, reserved_after integer not null,
 created_at timestamptz not null default now(), foreign key(user_id,request_id) references public.studio_agent_usage_requests(user_id,request_id), unique(user_id,request_id,event)
);

create function public.studio_agent_wallets(p_user uuid) returns jsonb language sql security definer set search_path=public,pg_temp as $$
 select jsonb_build_object('assistant', coalesce((select jsonb_build_object('balance',balance,'reserved',reserved,'available',balance-reserved) from assistant_credit_balances where user_id=p_user),'{"balance":0,"reserved":0,"available":0}'::jsonb),
 'production',coalesce((select jsonb_build_object('balance',balance,'reserved',reserved,'available',balance-reserved) from credit_balances where user_id=p_user),'{"balance":0,"reserved":0,"available":0}'::jsonb));
$$;
create function public.studio_agent_create_project(p_user uuid,p_category text,p_title text,p_production uuid,p_brief jsonb,p_messages jsonb) returns uuid language plpgsql security definer set search_path=public,pg_temp as $$
declare project_id uuid; item jsonb;
begin
 if p_production is not null and (p_category<>'website' or not exists(select 1 from production_requests where id=p_production and user_id=p_user and production_type='website')) then raise exception 'project_ownership_required'; end if;
 if jsonb_typeof(p_brief)<>'object' or octet_length(p_brief::text)>60000 or jsonb_typeof(p_messages)<>'array' or jsonb_array_length(p_messages)>30 then raise exception 'invalid_initial_memory'; end if;
 if p_production is not null then select id into project_id from studio_agent_projects where user_id=p_user and category_id=p_category and production_id=p_production; if found then return project_id; end if; end if;
 insert into studio_agent_projects(user_id,category_id,title,production_id,brief) values(p_user,p_category,p_title,p_production,p_brief) on conflict(user_id,category_id,production_id) do nothing returning id into project_id;
 if not found then select id into project_id from studio_agent_projects where user_id=p_user and category_id=p_category and production_id=p_production; return project_id; end if;
 for item in select * from jsonb_array_elements(p_messages) loop
   insert into studio_agent_messages(project_id,user_id,category_id,role,content) values(project_id,p_user,p_category,item->>'role',item->>'content');
 end loop;
 return project_id;
end $$;
create function public.studio_agent_reserve(p_user uuid,p_project uuid,p_category text,p_request uuid,p_hash text,p_units integer,p_tariff text,p_message text,p_revision bigint) returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare project studio_agent_projects%rowtype; req studio_agent_usage_requests%rowtype; wallet assistant_credit_balances%rowtype;
begin
 select * into project from studio_agent_projects where id=p_project and user_id=p_user and category_id=p_category for update;
 if not found then raise exception 'project_not_found'; end if;
 select * into req from studio_agent_usage_requests where user_id=p_user and request_id=p_request;
 if found then
   if req.payload_hash<>p_hash or req.project_id<>p_project or req.category_id<>p_category then raise exception 'request_payload_conflict'; end if;
   return jsonb_build_object('state',case when req.state='reserved' or req.state='dispatched' or req.state='uncertain' then 'pending' else req.state end,'response',req.response);
 end if;
 if project.revision<>p_revision then raise exception 'project_changed_reload'; end if;
 if exists(select 1 from studio_agent_usage_requests where project_id=p_project and state in('reserved','dispatched','uncertain','result_ready')) then raise exception 'project_request_pending'; end if;
 select * into wallet from assistant_credit_balances where user_id=p_user for update;
 if not found or p_units<=0 or wallet.balance-wallet.reserved<p_units then raise exception 'insufficient_assistant_credits'; end if;
 insert into studio_agent_usage_requests(user_id,request_id,project_id,category_id,payload_hash,tariff_version,reserve_credits,state,snapshot_revision,user_message)
 values(p_user,p_request,p_project,p_category,p_hash,p_tariff,p_units,'reserved',p_revision,p_message);
 update assistant_credit_balances set reserved=reserved+p_units,updated_at=now() where user_id=p_user returning * into wallet;
 insert into studio_agent_credit_ledger(user_id,request_id,event,units,balance_after,reserved_after) values(p_user,p_request,'reserve',p_units,wallet.balance,wallet.reserved);
 return '{"state":"fresh"}'::jsonb;
end $$;
create function public.studio_agent_claim(p_user uuid,p_request uuid) returns boolean language plpgsql security definer set search_path=public,pg_temp as $$
begin
 update studio_agent_usage_requests set state='dispatched',updated_at=now() where user_id=p_user and request_id=p_request and state='reserved';
 return found;
end $$;
create function public.studio_agent_record(p_user uuid,p_request uuid,p_result jsonb,p_usage jsonb,p_units integer) returns void language plpgsql security definer set search_path=public,pg_temp as $$
declare req studio_agent_usage_requests%rowtype;
begin
 select * into req from studio_agent_usage_requests where user_id=p_user and request_id=p_request for update;
 if not found or req.state not in('dispatched','uncertain') then raise exception 'request_not_dispatched'; end if;
 if p_units is null or p_units<0 or p_units>req.reserve_credits or p_result is null or octet_length(p_result::text)>120000 or jsonb_typeof(p_result)<>'object'
   or (p_result->'project'->>'id') is distinct from req.project_id::text or (p_result->'project'->>'userId') is distinct from p_user::text or (p_result->'project'->>'categoryId') is distinct from req.category_id then raise exception 'invalid_provider_result'; end if;
 update studio_agent_usage_requests set state='result_ready',result=p_result,usage=p_usage,charged_credits=p_units,updated_at=now() where user_id=p_user and request_id=p_request;
end $$;
create function public.studio_agent_settle(p_user uuid,p_request uuid,p_mode text) returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare req studio_agent_usage_requests%rowtype; wallet assistant_credit_balances%rowtype; project studio_agent_projects%rowtype; result jsonb; v_response jsonb;
begin
 -- Consistent project -> request -> wallet lock order.
 select * into req from studio_agent_usage_requests where user_id=p_user and request_id=p_request;
 if not found then raise exception 'request_not_found'; end if;
 select * into project from studio_agent_projects where id=req.project_id and user_id=p_user for update;
 select * into req from studio_agent_usage_requests where user_id=p_user and request_id=p_request for update;
 if req.state='settled' then return req.response; end if;
 if req.state<>'result_ready' or project.revision<>req.snapshot_revision then raise exception 'settlement_not_ready'; end if;
 select * into wallet from assistant_credit_balances where user_id=p_user for update;
 if wallet.reserved<req.reserve_credits or wallet.balance<req.charged_credits then raise exception 'wallet_reconciliation_required'; end if;
 if p_mode is distinct from 'real' then raise exception 'real_accounting_mode_required'; end if;
 result=req.result;
 update assistant_credit_balances set balance=balance-req.charged_credits,reserved=reserved-req.reserve_credits,updated_at=now() where user_id=p_user returning * into wallet;
 update studio_agent_projects set brief=result->'project'->'snapshot'->'fields',revision=(result->'project'->'snapshot'->>'revision')::bigint,updated_at=now() where id=project.id;
 insert into studio_agent_messages(project_id,user_id,category_id,request_id,role,content) values(project.id,p_user,req.category_id,p_request,'user',req.user_message),(project.id,p_user,req.category_id,p_request,'assistant',result->>'reply');
 insert into studio_agent_credit_ledger(user_id,request_id,event,units,balance_after,reserved_after) values(p_user,p_request,'settle',req.charged_credits,wallet.balance,wallet.reserved);
 v_response=jsonb_build_object('ok',true,'mode',p_mode,'project',result->'project','reply',result->>'reply','requestId',p_request,'chargedCredits',req.charged_credits,'chargedAccount','assistant','wallets',studio_agent_wallets(p_user),'blockedTools',result->'blockedTools','executionReady',false,'nextQuestion',result->'nextQuestion');
 update studio_agent_usage_requests set state='settled',response=v_response,updated_at=now() where user_id=p_user and request_id=p_request;
 return v_response;
end $$;
create function public.studio_agent_release(p_user uuid,p_request uuid) returns void language plpgsql security definer set search_path=public,pg_temp as $$
declare req studio_agent_usage_requests%rowtype; wallet assistant_credit_balances%rowtype;
begin
 select * into req from studio_agent_usage_requests where user_id=p_user and request_id=p_request for update;
 if not found then raise exception 'request_not_found'; end if;
 if req.state='released' then return; end if;
 if req.state not in ('reserved','dispatched') then raise exception 'uncertain_request_cannot_release'; end if;
 -- Caller may use this only for confirmed provider rejection or confirmed no-dispatch. Never an automatic timeout refund.
 update assistant_credit_balances set reserved=reserved-req.reserve_credits,updated_at=now() where user_id=p_user and reserved>=req.reserve_credits returning * into wallet;
 if not found then raise exception 'wallet_reconciliation_required'; end if;
 insert into studio_agent_credit_ledger(user_id,request_id,event,units,balance_after,reserved_after) values(p_user,p_request,'release',req.reserve_credits,wallet.balance,wallet.reserved);
 update studio_agent_usage_requests set state='released',updated_at=now() where user_id=p_user and request_id=p_request;
end $$;
create function public.studio_agent_uncertain(p_user uuid,p_request uuid) returns void language sql security definer set search_path=public,pg_temp as $$
 update studio_agent_usage_requests set state='uncertain',updated_at=now() where user_id=p_user and request_id=p_request and state='dispatched';
$$;

alter table studio_agent_projects enable row level security;
alter table studio_agent_messages enable row level security;
alter table studio_agent_usage_requests enable row level security;
alter table studio_agent_credit_ledger enable row level security;
create policy studio_agent_project_read on studio_agent_projects for select to authenticated using(auth.uid()=user_id);
create policy studio_agent_message_read on studio_agent_messages for select to authenticated using(auth.uid()=user_id);
create policy studio_agent_request_read on studio_agent_usage_requests for select to authenticated using(auth.uid()=user_id);
create policy studio_agent_ledger_read on studio_agent_credit_ledger for select to authenticated using(auth.uid()=user_id);
grant select on studio_agent_projects,studio_agent_messages,studio_agent_usage_requests,studio_agent_credit_ledger to authenticated;
grant all on studio_agent_projects,studio_agent_messages,studio_agent_usage_requests,studio_agent_credit_ledger to service_role;
grant usage,select on sequence studio_agent_messages_id_seq,studio_agent_credit_ledger_id_seq to service_role;
-- Explicit service-only mutations. No authenticated/anon RPC execution.
do $$ declare f record; begin
 for f in select p.oid::regprocedure as signature from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname like 'studio_agent_%' and p.proname<>'studio_agent_category_supported' loop
   execute format('revoke all on function %s from public,anon,authenticated',f.signature);
   execute format('grant execute on function %s to service_role',f.signature);
 end loop;
end $$;

commit;
