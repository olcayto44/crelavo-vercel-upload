-- Isolated Website page image targets. No tariff, key or paid activation seeded.
begin;
create table public.studio_website_image_targets(
 request_id uuid primary key,
 project_id uuid not null unique references public.production_requests(id),
 user_id uuid not null references public.profiles(id),
 site_id uuid not null references public.website_cms_sites(id) on delete cascade,
 design_version integer not null check(design_version>0),
 page_slug text not null check(page_slug~'^[a-z][a-z0-9-]{0,48}$'),
 prompt text not null check(length(prompt) between 1 and 1500),
 expected_media_version integer not null check(expected_media_version>=0),
 placed_media_version integer check(placed_media_version>0),
 source_sha256 text check(source_sha256~'^[a-f0-9]{64}$'),
 created_at timestamptz not null default now(),
 unique(site_id,design_version,page_slug),
 check((placed_media_version is null)=(source_sha256 is null))
);
alter table public.studio_website_image_targets enable row level security;
revoke all on public.studio_website_image_targets from public,anon,authenticated,service_role;
grant select,insert,update on public.studio_website_image_targets to service_role;
create function public.studio_website_image_prepare(p_user uuid,p_site uuid,p_version integer,p_slug text,p_prompt text) returns jsonb
language plpgsql security invoker set search_path='' as $f$
declare t public.studio_website_image_targets%rowtype; d jsonb; pid uuid; rid uuid; mv integer;
begin
 if p_version<1 or p_slug!~'^[a-z][a-z0-9-]{0,48}$' or p_prompt is null or length(p_prompt) not between 1 and 1500 then return null;end if;
 perform 1 from public.website_cms_members where site_id=p_site and user_id=p_user and role in ('owner','editor') for share;
 if not found then return null;end if;
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_site::text,926));
 select design into d from public.website_cms_design_drafts where site_id=p_site and version=p_version for share;
 if not found or not exists(select 1 from jsonb_array_elements(d->'pages') p where p->>'slug'=p_slug) then return null;end if;
 select * into t from public.studio_website_image_targets where site_id=p_site and design_version=p_version and page_slug=p_slug;
 if found then
 if t.user_id<>p_user or t.prompt<>p_prompt then return null;end if;
 return jsonb_build_object('requestId',t.request_id,'projectId',t.project_id);
 end if;
 if (select count(*) from public.studio_website_image_targets where site_id=p_site and design_version=p_version)>=6 then return null;end if;
 select version into mv from public.website_cms_hero_media where site_id=p_site and page_slug=p_slug;
 mv=coalesce(mv,0);
 if mv=0 and (select count(*) from public.website_cms_hero_media where site_id=p_site)>=6 then return null;end if;
 pid=gen_random_uuid();rid=gen_random_uuid();
 insert into public.production_requests(id,user_id,production_type,title,prompt,status,generation_status,automation_status,request_metadata)
 values(pid,p_user,'image','Website concept image · '||p_slug,p_prompt,'pending','awaiting_approval','paused',jsonb_build_object('websiteImageIsolated',true,'siteId',p_site,'pageSlug',p_slug,'designVersion',p_version));
 insert into public.studio_website_image_targets(request_id,project_id,user_id,site_id,design_version,page_slug,prompt,expected_media_version)
 values(rid,pid,p_user,p_site,p_version,p_slug,p_prompt,mv);
 return jsonb_build_object('requestId',rid,'projectId',pid);
end $f$;
create function public.studio_website_image_place(p_user uuid,p_site uuid,p_version integer,p_slug text,p_request uuid,p_source_sha text,p_data text,p_alt text,p_width integer,p_height integer,p_rights boolean) returns integer
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
 perform 1 from public.studio_image_operations where user_id=p_user and request_id=p_request and project_id=t.project_id and state='settled' and actual_micro_usd between 0 and max_micro_usd and receipt->>'sha256'=p_source_sha;
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
revoke all on function public.studio_website_image_prepare(uuid,uuid,integer,text,text),public.studio_website_image_place(uuid,uuid,integer,text,uuid,text,text,text,integer,integer,boolean) from public,anon,authenticated;
grant execute on function public.studio_website_image_prepare(uuid,uuid,integer,text,text),public.studio_website_image_place(uuid,uuid,integer,text,uuid,text,text,text,integer,integer,boolean) to service_role;
commit;
