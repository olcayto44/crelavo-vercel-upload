-- Isolated test only. A settled AI artifact is read-only and can be reviewed by
-- its purchaser in a site that they own. This never charges, creates or publishes a site.
create function website_cms_private.read_settled_designs(p_site uuid,p_production uuid) returns jsonb
language plpgsql stable security definer set search_path='' as $f$
declare actor uuid:=auth.uid(); result jsonb;
begin
 if actor is null or not exists(select 1 from public.website_cms_members m where m.site_id=p_site and m.user_id=actor and m.role='owner') then return null;end if;
 select coalesce(jsonb_agg(q.item order by q.updated_at desc),'[]'::jsonb) into result
 from (
 select j.updated_at,jsonb_build_object('productionId',j.production_id,'updatedAt',j.updated_at,'brand',j.artifact->'editableDesign'->>'brand','designHash',j.artifact->>'editableDesignHash')
 ||case when p_production is not null then jsonb_build_object('design',j.artifact->'editableDesign') else '{}'::jsonb end as item
 from public.website_ai_jobs j
 join public.production_requests p on p.id=j.production_id and p.user_id=j.user_id
 join public.website_credit_reservations r on r.production_id=j.production_id and r.user_id=j.user_id and r.plan_hash=j.plan_hash
 where j.user_id=actor and j.state='settled' and r.state='settled' and r.credits=j.credits and j.credits>0
 and p.production_type='website' and p.status='ready' and p.reserved_credits=0
 and p.output_json->>'websiteBillingMode'='atomic_v1' and p.output_json->'websiteBillingPending'='false'::jsonb
 and p.output_json->'charged'=to_jsonb(r.credits)
 and p.output_json->'websiteAssistant'->>'approvedHash'=j.plan_hash
 and j.reviewed_cost->>'source'='reviewed_provider_usage'
 and j.reviewed_cost->>'requestId'=j.receipt->>'requestId'
 and jsonb_typeof(j.artifact->'editableDesign')='object'
 and j.artifact->'editableDesign'->>'version'='2'
 and coalesce(j.artifact->>'editableDesignHash','') ~ '^[a-f0-9]{64}$'
 and octet_length((j.artifact->'editableDesign')::text)<=45000
 and (p_production is null or j.production_id=p_production)
 order by j.updated_at desc limit 20
 ) q;
 return result;
end $f$;
create function public.website_cms_read_settled_designs(p_site uuid,p_production uuid default null) returns jsonb
language sql stable security invoker set search_path='' as $w$ select website_cms_private.read_settled_designs(p_site,p_production) $w$;
revoke all on function website_cms_private.read_settled_designs(uuid,uuid),public.website_cms_read_settled_designs(uuid,uuid) from public,anon,authenticated;
grant execute on function website_cms_private.read_settled_designs(uuid,uuid),public.website_cms_read_settled_designs(uuid,uuid) to authenticated;
