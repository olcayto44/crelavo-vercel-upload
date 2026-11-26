-- Isolated image launch authorization. No enabled tariff or budget is seeded.
begin;
create table public.studio_image_activation(
 singleton boolean primary key default true check(singleton),
 tariff_version text not null references public.studio_image_tariffs(version),
 total_micro_usd integer not null check(total_micro_usd between 1 and 1000000),
 user_rpm integer not null check(user_rpm between 1 and 10),
 system_rpm integer not null check(system_rpm between 1 and 100),
 enabled boolean not null default false
);
alter table public.studio_image_activation enable row level security;
revoke all on public.studio_image_activation from public,anon,authenticated,service_role;
grant select on public.studio_image_activation to service_role;
create function public.studio_image_approve_reserve(p_user uuid,p_request uuid,p_hash text,p_plan jsonb) returns text
language plpgsql security definer set search_path='' as $f$
declare cfg public.studio_image_activation%rowtype;t public.studio_image_tariffs%rowtype;o public.studio_image_operations%rowtype;project uuid;spent bigint;outcome text;
begin
 if p_hash is null or p_hash !~ '^[a-f0-9]{64}$' or p_plan is null or jsonb_typeof(p_plan)<>'object' or octet_length(p_plan::text)>12000 then return 'denied';end if;
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('studio-image-approval-budget-v1',0));
 select * into cfg from public.studio_image_activation where singleton;
 if not found or not cfg.enabled then return 'disabled';end if;
 select * into t from public.studio_image_tariffs where version=cfg.tariff_version;
 if not found or not t.enabled then return 'disabled';end if;
 if p_plan->>'requestId' is distinct from p_request::text or p_plan->>'userId' is distinct from p_user::text or p_plan->>'categoryId' is distinct from 'image' or p_plan->>'operation' is distinct from 'image_generate' or p_plan->>'provider' is distinct from 'minimax' or p_plan->>'model' is distinct from 'image-01' or p_plan->>'tariffVersion' is distinct from t.version or p_plan->'reservedCredits' is distinct from to_jsonb(t.credits) or p_plan->'maximumProviderMicroUSD' is distinct from to_jsonb(t.max_micro_usd) then return 'denied';end if;
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
revoke all on function public.studio_image_approve_reserve(uuid,uuid,text,jsonb) from public,anon,authenticated;
grant execute on function public.studio_image_approve_reserve(uuid,uuid,text,jsonb) to service_role;
commit;
