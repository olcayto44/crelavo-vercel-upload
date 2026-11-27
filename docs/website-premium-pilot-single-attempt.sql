-- One real premium acceptance attempt, only in the isolated test database.
-- Never remove this fence to retry an uncertain provider request.
begin;
create unique index if not exists website_premium_pilot_single_attempt
 on public.production_requests ((request_metadata->>'source'))
 where production_type='website' and request_metadata->>'source'='studio_premium_pilot_v1';
create or replace function public.website_premium_pilot_ready() returns boolean
language sql stable security invoker set search_path='' as $$
 select to_regclass('public.website_premium_pilot_single_attempt') is not null
 and to_regprocedure('public.website_media_journal_v1(uuid,uuid,text,text,text,jsonb)') is not null
 and exists(select 1 from pg_catalog.pg_trigger where tgrelid='public.production_requests'::regclass and tgname='website_media_delivery_guard_v1' and tgenabled='O')
$$;
revoke all on function public.website_premium_pilot_ready() from public,anon,authenticated;
grant execute on function public.website_premium_pilot_ready() to service_role;
commit;
