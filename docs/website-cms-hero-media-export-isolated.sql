alter table public.website_cms_hero_media add constraint website_cms_media_alt_plain check(alt !~ '[<>[:cntrl:]]');
-- Isolated content export only, not a database backup or an automatic restore.
create or replace function public.website_cms_export_content(p_site uuid) returns jsonb
language sql stable security invoker set search_path='' as $f$
select jsonb_build_object(
 'format','crelavo-private-content-snapshot-v1',
 'exportedAt',statement_timestamp(),
 'site',to_jsonb(s),
 'pages',coalesce((select jsonb_agg(to_jsonb(p) order by p.slug) from public.website_cms_pages p where p.site_id=s.id),'[]'::jsonb),
 'design',(select to_jsonb(d) from public.website_cms_design_drafts d where d.site_id=s.id),
 'industryPlan',(select to_jsonb(i) from public.website_cms_industry_plans i where i.site_id=s.id),
 'catalog',coalesce((select jsonb_agg(to_jsonb(c) order by c.sku) from public.website_cms_catalog c where c.site_id=s.id),'[]'::jsonb),
 'articles',coalesce((select jsonb_agg(to_jsonb(a) order by a.slug) from public.website_cms_articles a where a.site_id=s.id),'[]'::jsonb),
 'heroMedia',coalesce((select jsonb_agg(jsonb_build_object('page_slug',m.page_slug,'image_data',m.image_data,'alt',m.alt,'width',m.width,'height',m.height,'provenance',m.provenance,'version',m.version) order by m.page_slug) from public.website_cms_hero_media m where m.site_id=s.id),'[]'::jsonb)
)
from public.website_cms_sites s
where s.id=p_site and exists(select 1 from public.website_cms_members m where m.site_id=s.id and m.user_id=(select auth.uid()) and m.role='owner')
$f$;
revoke all on function public.website_cms_export_content(uuid) from public,anon,authenticated;
grant execute on function public.website_cms_export_content(uuid) to authenticated;