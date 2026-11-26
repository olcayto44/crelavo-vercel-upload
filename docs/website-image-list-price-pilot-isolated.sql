-- Isolated Website canary only. Published price is NOT provider invoice evidence.
-- https://platform.minimax.io/docs/guides/pricing-paygo (checked 2026-11-26)
begin;
create table public.studio_website_image_estimates(
 request_id uuid primary key references public.studio_image_operations(request_id),
 provider_request_id text not null unique,
 estimated_micro_usd integer not null check(estimated_micro_usd=3500),
 policy_version text not null check(policy_version='website-image-01-pilot-v1'),
 invoice_pending boolean not null default true check(invoice_pending),
 created_at timestamptz not null default now()
);
alter table public.studio_website_image_estimates enable row level security;
revoke all on public.studio_website_image_estimates from public,anon,authenticated,service_role;
grant select,insert on public.studio_website_image_estimates to service_role;
create function public.studio_website_image_finalize_estimate(p_user uuid,p_site uuid,p_request uuid) returns text
language plpgsql security invoker set search_path='' as $f$
declare o public.studio_image_operations%rowtype; t public.studio_website_image_targets%rowtype; w public.credit_balances%rowtype; cfg public.studio_image_activation%rowtype;
 remaining integer; rollover integer; subscription integer; bonus integer; topup integer; taken integer;
begin
 select * into t from public.studio_website_image_targets where request_id=p_request and user_id=p_user and site_id=p_site;
 if not found then return 'denied';end if;
 perform 1 from public.website_cms_members where site_id=p_site and user_id=p_user and role in ('owner','editor') for share;
 if not found then return 'denied';end if;
 select * into o from public.studio_image_operations where request_id=p_request and user_id=p_user and project_id=t.project_id for update;
 if not found or o.tariff_version<>'website-image-01-pilot-v1' or o.credits<>90 or o.max_micro_usd<>10000 then return 'denied';end if;
 if o.state='settled' then return 'already_settled';end if;
 if o.state<>'artifact_cost_pending' or o.artifact is null or o.actual_micro_usd is not null or o.receipt is null or o.provider_request_id is null
 or o.plan->>'provider' is distinct from 'minimax' or o.plan->>'model' is distinct from 'image-01' or o.plan->'request'->>'prompt' is distinct from t.prompt
 or o.plan->'request'->>'aspect' is distinct from '16:9'
 or o.receipt->>'provider' is distinct from 'minimax' or o.receipt->>'model' is distinct from 'image-01'
 or o.receipt->>'imageCount' is distinct from '1' or o.receipt->>'width' is distinct from '1280' or o.receipt->>'height' is distinct from '720'
 or o.receipt->>'mime' is distinct from 'image/png' or o.receipt->>'costState' is distinct from 'pending_reconciliation'
 or o.receipt->>'providerRequestId' is distinct from o.provider_request_id or encode(sha256(o.artifact),'hex') is distinct from o.receipt->>'sha256' then return 'denied';end if;
 select * into cfg from public.studio_image_activation where singleton and enabled and tariff_version=o.tariff_version;
 if not found or cfg.total_micro_usd>50000 then return 'disabled';end if;
 -- Independently reviewed cost takes precedence. Never overwrite a provider invoice.
 if exists(select 1 from public.studio_image_cost_evidence where request_id=p_request) then
 return public.studio_image_finalize(p_user,p_request,o.plan_hash,o.plan,'settle');
 end if;
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
revoke all on function public.studio_website_image_finalize_estimate(uuid,uuid,uuid) from public,anon,authenticated;
grant execute on function public.studio_website_image_finalize_estimate(uuid,uuid,uuid) to service_role;
create or replace function public.studio_website_image_place(p_user uuid,p_site uuid,p_version integer,p_slug text,p_request uuid,p_source_sha text,p_data text,p_alt text,p_width integer,p_height integer,p_rights boolean) returns integer
language plpgsql security invoker set search_path='' as $f$
declare t public.studio_website_image_targets%rowtype; d jsonb; v integer;
begin
 if p_rights is distinct from true or p_data is null or length(p_data)>180000 or p_source_sha!~'^[a-f0-9]{64}$' then return null;end if;
 perform 1 from public.website_cms_members where site_id=p_site and user_id=p_user and role in ('owner','editor') for share;
 if not found then return null;end if;
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_site::text,926));
 select design into d from public.website_cms_design_drafts where site_id=p_site and version=p_version for share;
 if not found or not exists(select 1 from jsonb_array_elements(d->'pages') p where p->>'slug'=p_slug) then return null;end if;
 select * into t from public.studio_website_image_targets where user_id=p_user and site_id=p_site and design_version=p_version and page_slug=p_slug and request_id=p_request for update;
 if not found then return null;end if;
 perform 1 from public.studio_image_operations where user_id=p_user and request_id=p_request and project_id=t.project_id and state='settled' and (actual_micro_usd between 0 and max_micro_usd or (actual_micro_usd is null and exists(select 1 from public.studio_website_image_estimates e where e.request_id=p_request and e.provider_request_id=studio_image_operations.provider_request_id and e.estimated_micro_usd between 0 and studio_image_operations.max_micro_usd))) and receipt->>'sha256'=p_source_sha;
 if not found then return null;end if;
 if t.placed_media_version is not null then
 select version into v from public.website_cms_hero_media where site_id=p_site and page_slug=p_slug and version=t.placed_media_version and image_data=p_data and alt=p_alt;
 return v;
 end if;
 if t.expected_media_version=0 then
 if (select count(*) from public.website_cms_hero_media where site_id=p_site)>=6 then return null;end if;
 insert into public.website_cms_hero_media(site_id,page_slug,image_data,alt,width,height) values(p_site,p_slug,p_data,p_alt,p_width,p_height) on conflict do nothing returning version into v;
 else
 update public.website_cms_hero_media set image_data=p_data,alt=p_alt,width=p_width,height=p_height,version=version+1,updated_at=now() where site_id=p_site and page_slug=p_slug and version=t.expected_media_version returning version into v;
 end if;
 if v is null then return null;end if;
 update public.studio_website_image_targets set placed_media_version=v,source_sha256=p_source_sha where request_id=p_request;
 return v;
end $f$;

-- Seed an isolated, capped Website-only pilot. Other image routes retain separate disabled flags.
insert into public.studio_image_tariffs(version,credits,max_micro_usd,enabled) values('website-image-01-pilot-v1',90,10000,true);
insert into public.studio_image_activation(singleton,tariff_version,total_micro_usd,user_rpm,system_rpm,enabled) values(true,'website-image-01-pilot-v1',50000,1,1,true);
commit;
