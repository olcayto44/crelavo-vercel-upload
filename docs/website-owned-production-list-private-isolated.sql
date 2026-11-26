-- Preserve the existing narrow owner-only list while removing SECURITY DEFINER from the exposed RPC.
begin;
create or replace function website_cms_private.owned_production_list() returns jsonb
language plpgsql stable security definer set search_path='' as $function$
declare actor uuid:=auth.uid();result jsonb;
begin
 if actor is null then return '[]'::jsonb;end if;
 select coalesce(jsonb_agg(q.item order by q.updated_at desc),'[]'::jsonb) into result from (
 select p.updated_at,jsonb_build_object('id',p.id,'title',left(p.title,160),'category',p.production_type,'state',case when p.production_type='website' then coalesce(j.state,p.output_json->'websiteAssistant'->>'phase','unconfirmed') else 'image_project' end) item
 from public.production_requests p left join public.website_ai_jobs j on j.production_id=p.id and j.user_id=p.user_id
 where p.user_id=actor and (p.production_type='image' or (p.production_type='website' and (p.output_json->'websiteAssistant'->>'phase'='approved' or j.production_id is not null)))
 order by p.updated_at desc limit 30
 ) q;return result;
end $function$;
revoke all on function website_cms_private.owned_production_list() from public,anon,authenticated;
grant execute on function website_cms_private.owned_production_list() to authenticated;
create or replace function public.website_test_owned_production_list() returns jsonb
language sql stable security invoker set search_path='' as $w$ select website_cms_private.owned_production_list() $w$;
revoke all on function public.website_test_owned_production_list() from public,anon,authenticated;
grant execute on function public.website_test_owned_production_list() to authenticated;
commit;
