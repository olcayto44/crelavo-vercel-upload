begin;
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
 or not coalesce(((o.plan->>'provider'='minimax' and o.plan->>'model'='image-01') or exists(select 1 from public.studio_website_image_routes r join public.studio_website_image_targets target on target.request_id=o.request_id and target.user_id=o.user_id and target.project_id=o.project_id where r.version=o.tariff_version and r.enabled and r.provider=o.plan->>'provider' and r.model=o.plan->>'model')),false)
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


commit;
