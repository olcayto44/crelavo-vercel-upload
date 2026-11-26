-- Isolated preview routes only. No production credential or paid provider call.
begin;
alter table public.studio_website_image_routes drop constraint studio_website_image_routes_check;
alter table public.studio_website_image_routes add constraint website_image_route_pair_check check(
 (version='website-image-01-pilot-v1' and provider='minimax' and model='image-01')
 or (version='website-openai-flare-pilot-v1' and provider='openai' and model='gpt-image-2.6-flare')
 or (version='website-fal-flux-pilot-v1' and provider='fal' and model='fal-ai/flux/schnell')
 or (version='website-stability-core-pilot-v1' and provider='stability' and model='core')
 or (version='website-replicate-flux-pilot-v1' and provider='replicate' and model='black-forest-labs/flux-schnell'));
insert into public.studio_image_tariffs(version,credits,max_micro_usd,enabled) values
 ('website-fal-flux-pilot-v1',90,10000,true),('website-stability-core-pilot-v1',260,40000,true),('website-replicate-flux-pilot-v1',90,10000,true);
insert into public.studio_website_image_routes values
 ('website-fal-flux-pilot-v1','fal','fal-ai/flux/schnell',true),('website-stability-core-pilot-v1','stability','core',true),('website-replicate-flux-pilot-v1','replicate','black-forest-labs/flux-schnell',true);
alter table public.studio_website_image_estimates drop constraint website_image_estimate_policy_check;
alter table public.studio_website_image_estimates add constraint website_image_estimate_policy_check check(
 (policy_version='website-image-01-pilot-v1' and estimated_micro_usd=3500)
 or (policy_version='website-openai-flare-pilot-v1' and estimated_micro_usd between 1 and 40000)
 or (policy_version in ('website-fal-flux-pilot-v1','website-replicate-flux-pilot-v1') and estimated_micro_usd=3000)
 or (policy_version='website-stability-core-pilot-v1' and estimated_micro_usd=30000));
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
 if coalesce(o.receipt->'usage'->>'textTokens','') !~ '^[0-9]{1,6}$' or coalesce(o.receipt->'usage'->>'outputTokens','') !~ '^[0-9]{1,6}$' then return 'denied';end if;
 cost=(o.receipt->'usage'->>'textTokens')::integer*5+(o.receipt->'usage'->>'outputTokens')::integer*30;
 elsif o.plan->>'provider'='fal' then cost=3000;
 elsif o.plan->>'provider'='stability' then cost=30000;
 elsif o.plan->>'provider'='replicate' then cost=3000;
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
 insert into public.studio_website_image_estimates(request_id,provider_request_id,estimated_micro_usd,policy_version) values(p_request,o.provider_request_id,cost,o.tariff_version);
 update public.credit_balances set reserved=reserved-o.credits,balance=balance-o.credits,rolled_over_credits=rollover,current_subscription_credits=subscription,bonus_credits=bonus,topup_credits=topup,updated_at=now() where user_id=p_user;
 update public.studio_image_operations set state='settled',finalized_at=now(),updated_at=now() where request_id=p_request;
 insert into public.credit_events(user_id,type,amount,note) values(p_user,'spend',o.credits,'studio-image:'||p_request::text);
 return 'settled';
end $f$;



commit;
