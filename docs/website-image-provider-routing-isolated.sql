-- Only isolated Website target routes; unchanged global $0.05 reservation cap.
begin;
create table public.studio_website_image_routes(version text primary key references public.studio_image_tariffs(version),provider text not null,model text not null,enabled boolean not null default false,check((version='website-image-01-pilot-v1' and provider='minimax' and model='image-01') or (version='website-openai-flare-pilot-v1' and provider='openai' and model='gpt-image-2.6-flare')));
alter table public.studio_website_image_routes enable row level security;
revoke all on public.studio_website_image_routes from public,anon,authenticated,service_role;
grant select on public.studio_website_image_routes to service_role;
insert into public.studio_image_tariffs(version,credits,max_micro_usd,enabled) values('website-openai-flare-pilot-v1',260,40000,true);
insert into public.studio_website_image_routes values('website-image-01-pilot-v1','minimax','image-01',true),('website-openai-flare-pilot-v1','openai','gpt-image-2.6-flare',true);
alter table public.studio_website_image_estimates drop constraint studio_website_image_estimates_estimated_micro_usd_check,drop constraint studio_website_image_estimates_policy_version_check;
alter table public.studio_website_image_estimates add constraint website_image_estimate_policy_check check((policy_version='website-image-01-pilot-v1' and estimated_micro_usd=3500) or (policy_version='website-openai-flare-pilot-v1' and estimated_micro_usd between 1 and 40000));
create or replace function public.studio_image_reserve(p_user uuid,p_request uuid,p_hash text,p_plan jsonb) returns text
language plpgsql security invoker set search_path=pg_catalog,public as $$
declare o public.studio_image_operations%rowtype; w public.credit_balances%rowtype; t public.studio_image_tariffs%rowtype;
begin
 select * into o from public.studio_image_operations where request_id=p_request and user_id=p_user for update;
 if not found or o.plan_hash is distinct from p_hash or o.plan is distinct from p_plan then return 'denied'; end if;
 if o.state <> 'approved' then return 'already_reserved_or_finished'; end if;
 if not exists(select 1 from public.production_requests where id=o.project_id and user_id=p_user and production_type='image') then return 'denied'; end if;
 select * into t from public.studio_image_tariffs where version=o.tariff_version for share;
 if not found or not t.enabled or t.credits<>o.credits or t.max_micro_usd<>o.max_micro_usd then return 'denied'; end if;
 if o.plan->>'requestId' is distinct from p_request::text or o.plan->>'userId' is distinct from p_user::text or o.plan->>'projectId' is distinct from o.project_id::text
 or o.plan->>'categoryId' is distinct from 'image' or o.plan->>'operation' is distinct from 'image_generate'
 or not ((o.plan->>'provider'='minimax' and o.plan->>'model'='image-01') or exists(select 1 from public.studio_website_image_routes r join public.studio_website_image_targets t on t.request_id=o.request_id and t.user_id=o.user_id and t.project_id=o.project_id where r.version=o.tariff_version and r.enabled and r.provider=o.plan->>'provider' and r.model=o.plan->>'model'))
 or o.plan->>'tariffVersion' is distinct from o.tariff_version
 or o.plan->>'reservedCredits' is distinct from o.credits::text or o.plan->>'maximumProviderMicroUSD' is distinct from o.max_micro_usd::text then return 'denied'; end if;
 select * into w from public.credit_balances where user_id=p_user for update;
 if not found or w.reserved<0 or w.balance-w.reserved<o.credits or w.balance<>w.current_subscription_credits+w.rolled_over_credits+w.topup_credits+w.bonus_credits then return 'denied'; end if;
 if least(w.current_subscription_credits,w.rolled_over_credits,w.topup_credits,w.bonus_credits)<0 then return 'denied'; end if;
 if (w.billing_cycle_ends_at is not null and w.billing_cycle_ends_at<=now()) or (w.topup_credits>0 and w.topup_expires_at is not null and w.topup_expires_at<=now()) then return 'denied'; end if;
 update public.credit_balances set reserved=reserved+o.credits,updated_at=now() where user_id=p_user;
 update public.studio_image_operations set state='reserved',credit_period=jsonb_build_object('billing',w.billing_cycle_ends_at,'topup',w.topup_expires_at,'rollover',w.last_rollover_at),updated_at=now() where request_id=p_request;
 insert into public.credit_events(user_id,type,amount,note) values(p_user,'reserve',o.credits,'studio-image:'||p_request::text);
 return 'reserved';
end $$;

create or replace function public.studio_image_record(p_user uuid,p_request uuid,p_hash text,p_plan jsonb,p_receipt jsonb,p_base64 text) returns boolean
language plpgsql security invoker set search_path=pg_catalog,public as $$
declare o public.studio_image_operations%rowtype; bytes bytea;
begin
 select * into o from public.studio_image_operations where request_id=p_request and user_id=p_user for update;
 if not found or o.state<>'claimed' or o.plan_hash is distinct from p_hash or o.plan is distinct from p_plan then return false; end if;
 if p_base64 is null or length(p_base64)>16777216 or p_receipt is null
 or p_receipt->>'provider' is distinct from o.plan->>'provider' or p_receipt->>'model' is distinct from o.plan->>'model'
 or p_receipt->>'imageCount' is distinct from '1' or p_receipt->>'mime' is distinct from 'image/png'
 or p_receipt->>'costState' is distinct from 'pending_reconciliation'
 or coalesce(p_receipt->>'providerRequestId','') !~ '^[A-Za-z0-9_-]{8,160}$' then return false; end if;
 bytes=decode(p_base64,'base64');
 if octet_length(bytes) not between 16 and 12582912 or substring(bytes from 1 for 8)<>decode('89504e470d0a1a0a','hex') or encode(sha256(bytes),'hex') is distinct from p_receipt->>'sha256' then return false; end if;
 update public.studio_image_operations set state='artifact_cost_pending',provider_request_id=p_receipt->>'providerRequestId',receipt=p_receipt,artifact=bytes,updated_at=now() where request_id=p_request;
 return true;
end $$;

create or replace function public.studio_image_approve_reserve(p_user uuid,p_request uuid,p_hash text,p_plan jsonb) returns text
language plpgsql security definer set search_path='' as $f$
declare cfg public.studio_image_activation%rowtype;t public.studio_image_tariffs%rowtype;o public.studio_image_operations%rowtype;project uuid;spent bigint;outcome text;
begin
 if p_hash is null or p_hash !~ '^[a-f0-9]{64}$' or p_plan is null or jsonb_typeof(p_plan)<>'object' or octet_length(p_plan::text)>12000 then return 'denied';end if;
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('studio-image-approval-budget-v1',0));
 select * into cfg from public.studio_image_activation where singleton;
 if not found or not cfg.enabled then return 'disabled';end if;
 select * into t from public.studio_image_tariffs where version=p_plan->>'tariffVersion';
 if not found or not t.enabled then return 'disabled';end if;
 if p_plan->>'requestId' is distinct from p_request::text or p_plan->>'userId' is distinct from p_user::text or p_plan->>'categoryId' is distinct from 'image' or p_plan->>'operation' is distinct from 'image_generate' or not ((t.version=cfg.tariff_version and p_plan->>'provider'='minimax' and p_plan->>'model'='image-01') or exists(select 1 from public.studio_website_image_routes r join public.studio_website_image_targets w on w.request_id=p_request and w.user_id=p_user and w.project_id=(p_plan->>'projectId')::uuid and w.prompt=p_plan->'request'->>'prompt' where r.version=t.version and r.enabled and r.provider=p_plan->>'provider' and r.model=p_plan->>'model' and p_plan->'request'->>'aspect'='16:9')) or p_plan->>'tariffVersion' is distinct from t.version or p_plan->'reservedCredits' is distinct from to_jsonb(t.credits) or p_plan->'maximumProviderMicroUSD' is distinct from to_jsonb(t.max_micro_usd) then return 'denied';end if;
 select id into project from public.production_requests where id=(p_plan->>'projectId')::uuid and user_id=p_user and production_type='image' for update;
 if not found then return 'denied';end if;
 select * into o from public.studio_image_operations where request_id=p_request;
 if found then
 if o.user_id=p_user and o.project_id=project and o.plan_hash=p_hash and o.plan=p_plan then return 'already_reserved_or_finished';end if;
 return 'denied';
 end if;
 if exists(select 1 from public.studio_image_operations where project_id=project and state in ('approved','reserved','claimed','artifact_cost_pending','reconcile_required')) then return 'project_request_pending';end if;
 select coalesce(sum(max_micro_usd),0) into spent from public.studio_image_operations where state<>'released';
 if spent+t.max_micro_usd>cfg.total_micro_usd then return 'budget_exhausted';end if;
 if (select count(*) from public.studio_image_operations where created_at>clock_timestamp()-interval '1 minute')>=cfg.system_rpm or (select count(*) from public.studio_image_operations where user_id=p_user and created_at>clock_timestamp()-interval '1 minute')>=cfg.user_rpm then return 'rate_limited';end if;
 insert into public.studio_image_operations(request_id,user_id,project_id,plan_hash,plan,tariff_version,credits,max_micro_usd,approved_at) values(p_request,p_user,project,p_hash,p_plan,t.version,t.credits,t.max_micro_usd,now());
 outcome=public.studio_image_reserve(p_user,p_request,p_hash,p_plan);
 if outcome is distinct from 'reserved' then raise exception 'image_reservation_denied';end if;
 return outcome;
end $f$;

create or replace function public.studio_website_image_finalize_estimate(p_user uuid,p_site uuid,p_request uuid) returns text
language plpgsql security invoker set search_path='' as $f$
declare o public.studio_image_operations%rowtype; t public.studio_website_image_targets%rowtype; w public.credit_balances%rowtype; cfg public.studio_image_activation%rowtype;
 cost integer; remaining integer; rollover integer; subscription integer; bonus integer; topup integer; taken integer;
begin
 select * into t from public.studio_website_image_targets where request_id=p_request and user_id=p_user and site_id=p_site;
 if not found then return 'denied';end if;
 perform 1 from public.website_cms_members where site_id=p_site and user_id=p_user and role in ('owner','editor') for share;
 if not found then return 'denied';end if;
 select * into o from public.studio_image_operations where request_id=p_request and user_id=p_user and project_id=t.project_id for update;
 if not found or not exists(select 1 from public.studio_website_image_routes r join public.studio_image_tariffs a on a.version=r.version where r.version=o.tariff_version and r.enabled and r.provider=o.plan->>'provider' and r.model=o.plan->>'model' and a.credits=o.credits and a.max_micro_usd=o.max_micro_usd) then return 'denied';end if;
 if o.state='settled' then return 'already_settled';end if;
 if o.state<>'artifact_cost_pending' or o.artifact is null or o.actual_micro_usd is not null or o.receipt is null or o.provider_request_id is null
 or o.plan->'request'->>'prompt' is distinct from t.prompt
 or o.plan->'request'->>'aspect' is distinct from '16:9'
 or o.receipt->>'provider' is distinct from o.plan->>'provider' or o.receipt->>'model' is distinct from o.plan->>'model'
 or o.receipt->>'imageCount' is distinct from '1' or o.receipt->>'width' is distinct from '1280' or o.receipt->>'height' is distinct from '720'
 or o.receipt->>'mime' is distinct from 'image/png' or o.receipt->>'costState' is distinct from 'pending_reconciliation'
 or o.receipt->>'providerRequestId' is distinct from o.provider_request_id or encode(sha256(o.artifact),'hex') is distinct from o.receipt->>'sha256' then return 'denied';end if;
 select * into cfg from public.studio_image_activation where singleton and enabled;
 if not found or cfg.total_micro_usd>50000 then return 'disabled';end if;
 -- Independently reviewed cost takes precedence. Never overwrite a provider invoice.
 if exists(select 1 from public.studio_image_cost_evidence where request_id=p_request) then
 return public.studio_image_finalize(p_user,p_request,o.plan_hash,o.plan,'settle');
 end if;
 if o.plan->>'provider'='minimax' then cost=3500;
 elsif o.plan->>'provider'='openai' then
 if coalesce(o.receipt->'usage'->>'textTokens','') !~ '^[0-9]{1,6} where user_id=p_user for update;
 if not found or w.reserved<o.credits or w.balance<w.reserved or w.reserved<0
 or w.balance<>w.current_subscription_credits+w.rolled_over_credits+w.topup_credits+w.bonus_credits
 or least(w.current_subscription_credits,w.rolled_over_credits,w.topup_credits,w.bonus_credits)<0
 or o.credit_period is distinct from jsonb_build_object('billing',w.billing_cycle_ends_at,'topup',w.topup_expires_at,'rollover',w.last_rollover_at)
 or (w.billing_cycle_ends_at is not null and w.billing_cycle_ends_at<=now()) or (w.topup_credits>0 and w.topup_expires_at is not null and w.topup_expires_at<=now()) then
 update public.studio_image_operations set state='reconcile_required',failure_code='wallet_changed',updated_at=now() where request_id=p_request;
 return 'reconcile_required';
 end if;
 remaining=o.credits;rollover=w.rolled_over_credits;subscription=w.current_subscription_credits;bonus=w.bonus_credits;topup=w.topup_credits;
 taken=least(rollover,remaining);rollover=rollover-taken;remaining=remaining-taken;
 taken=least(subscription,remaining);subscription=subscription-taken;remaining=remaining-taken;
 taken=least(bonus,remaining);bonus=bonus-taken;remaining=remaining-taken;
 taken=least(topup,remaining);topup=topup-taken;remaining=remaining-taken;
 if remaining<>0 then raise exception 'image_wallet_bucket_mismatch';end if;
 insert into public.studio_website_image_estimates(request_id,provider_request_id,estimated_micro_usd,policy_version) values(p_request,o.provider_request_id,cost,o.tariff_version);
 update public.credit_balances set reserved=reserved-o.credits,balance=balance-o.credits,rolled_over_credits=rollover,current_subscription_credits=subscription,bonus_credits=bonus,topup_credits=topup,updated_at=now() where user_id=p_user;
 update public.studio_image_operations set state='settled',finalized_at=now(),updated_at=now() where request_id=p_request;
 insert into public.credit_events(user_id,type,amount,note) values(p_user,'spend',o.credits,'studio-image:'||p_request::text);
 return 'settled';
end $f$;
 or coalesce(o.receipt->'usage'->>'outputTokens','') !~ '^[0-9]{1,6} where user_id=p_user for update;
 if not found or w.reserved<o.credits or w.balance<w.reserved or w.reserved<0
 or w.balance<>w.current_subscription_credits+w.rolled_over_credits+w.topup_credits+w.bonus_credits
 or least(w.current_subscription_credits,w.rolled_over_credits,w.topup_credits,w.bonus_credits)<0
 or o.credit_period is distinct from jsonb_build_object('billing',w.billing_cycle_ends_at,'topup',w.topup_expires_at,'rollover',w.last_rollover_at)
 or (w.billing_cycle_ends_at is not null and w.billing_cycle_ends_at<=now()) or (w.topup_credits>0 and w.topup_expires_at is not null and w.topup_expires_at<=now()) then
 update public.studio_image_operations set state='reconcile_required',failure_code='wallet_changed',updated_at=now() where request_id=p_request;
 return 'reconcile_required';
 end if;
 remaining=o.credits;rollover=w.rolled_over_credits;subscription=w.current_subscription_credits;bonus=w.bonus_credits;topup=w.topup_credits;
 taken=least(rollover,remaining);rollover=rollover-taken;remaining=remaining-taken;
 taken=least(subscription,remaining);subscription=subscription-taken;remaining=remaining-taken;
 taken=least(bonus,remaining);bonus=bonus-taken;remaining=remaining-taken;
 taken=least(topup,remaining);topup=topup-taken;remaining=remaining-taken;
 if remaining<>0 then raise exception 'image_wallet_bucket_mismatch';end if;
 insert into public.studio_website_image_estimates(request_id,provider_request_id,estimated_micro_usd,policy_version) values(p_request,o.provider_request_id,3500,o.tariff_version);
 update public.credit_balances set reserved=reserved-o.credits,balance=balance-o.credits,rolled_over_credits=rollover,current_subscription_credits=subscription,bonus_credits=bonus,topup_credits=topup,updated_at=now() where user_id=p_user;
 update public.studio_image_operations set state='settled',finalized_at=now(),updated_at=now() where request_id=p_request;
 insert into public.credit_events(user_id,type,amount,note) values(p_user,'spend',o.credits,'studio-image:'||p_request::text);
 return 'settled';
end $f$;
 then return 'denied';end if;
 cost=(o.receipt->'usage'->>'textTokens')::integer*5+(o.receipt->'usage'->>'outputTokens')::integer*30;
 else return 'denied';end if;
 if cost<=0 or cost>o.max_micro_usd then update public.studio_image_operations set state='reconcile_required',failure_code='provider_cost_over_budget',updated_at=now() where request_id=p_request;return 'reconcile_required';end if;
 select * into w from public.credit_balances where user_id=p_user for update;
 if not found or w.reserved<o.credits or w.balance<w.reserved or w.reserved<0
 or w.balance<>w.current_subscription_credits+w.rolled_over_credits+w.topup_credits+w.bonus_credits
 or least(w.current_subscription_credits,w.rolled_over_credits,w.topup_credits,w.bonus_credits)<0
 or o.credit_period is distinct from jsonb_build_object('billing',w.billing_cycle_ends_at,'topup',w.topup_expires_at,'rollover',w.last_rollover_at)
 or (w.billing_cycle_ends_at is not null and w.billing_cycle_ends_at<=now()) or (w.topup_credits>0 and w.topup_expires_at is not null and w.topup_expires_at<=now()) then
 update public.studio_image_operations set state='reconcile_required',failure_code='wallet_changed',updated_at=now() where request_id=p_request;
 return 'reconcile_required';
 end if;
 remaining=o.credits;rollover=w.rolled_over_credits;subscription=w.current_subscription_credits;bonus=w.bonus_credits;topup=w.topup_credits;
 taken=least(rollover,remaining);rollover=rollover-taken;remaining=remaining-taken;
 taken=least(subscription,remaining);subscription=subscription-taken;remaining=remaining-taken;
 taken=least(bonus,remaining);bonus=bonus-taken;remaining=remaining-taken;
 taken=least(topup,remaining);topup=topup-taken;remaining=remaining-taken;
 if remaining<>0 then raise exception 'image_wallet_bucket_mismatch';end if;
 insert into public.studio_website_image_estimates(request_id,provider_request_id,estimated_micro_usd,policy_version) values(p_request,o.provider_request_id,3500,o.tariff_version);
 update public.credit_balances set reserved=reserved-o.credits,balance=balance-o.credits,rolled_over_credits=rollover,current_subscription_credits=subscription,bonus_credits=bonus,topup_credits=topup,updated_at=now() where user_id=p_user;
 update public.studio_image_operations set state='settled',finalized_at=now(),updated_at=now() where request_id=p_request;
 insert into public.credit_events(user_id,type,amount,note) values(p_user,'spend',o.credits,'studio-image:'||p_request::text);
 return 'settled';
end $f$;

commit;
