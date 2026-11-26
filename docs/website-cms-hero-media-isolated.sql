-- Isolated owner-uploaded raster assets, separate from the small structured design JSON.
-- Data is private and never a remote image URL; no AI origin is claimed.
create table public.website_cms_hero_media(
 site_id uuid not null references public.website_cms_sites(id) on delete cascade,
 page_slug text not null check(page_slug ~ '^[a-z][a-z0-9-]{0,48}$'),
 image_data text not null check(length(image_data) between 24 and 180000 and image_data ~ '^[A-Za-z0-9+/]+={0,2}$'),
 alt text not null check(length(trim(alt)) between 1 and 160),
 width integer not null check(width between 1 and 1440),
 height integer not null check(height between 1 and 1440),
 provenance text not null default 'owner_uploaded_rights_attested' check(provenance='owner_uploaded_rights_attested'),
 version integer not null default 1 check(version>0),updated_at timestamptz not null default now(),
 primary key(site_id,page_slug),
 check(substring(decode(image_data,'base64') from 1 for 4)=decode('52494646','hex') and substring(decode(image_data,'base64') from 9 for 4)=decode('57454250','hex'))
);
alter table public.website_cms_hero_media enable row level security;
revoke all on public.website_cms_hero_media from public,anon,authenticated;
grant select on public.website_cms_hero_media to authenticated;
create policy media_member_read on public.website_cms_hero_media for select to authenticated using(exists(select 1 from public.website_cms_members m where m.site_id=website_cms_hero_media.site_id and m.user_id=(select auth.uid())));
create function website_cms_private.save_hero_media(p_site uuid,p_slug text,p_version integer,p_data text,p_alt text,p_width integer,p_height integer,p_rights boolean) returns integer language plpgsql security definer set search_path='' as $f$
declare actor uuid:=auth.uid();v integer;d jsonb;
begin
 if actor is null or p_version is null or p_rights is distinct from true or p_data is null or length(p_data)>180000 then return null;end if;
 perform 1 from public.website_cms_members where site_id=p_site and user_id=actor and role in ('owner','editor') for share;
 if not found then return null;end if;
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_site::text,926));
 select design into d from public.website_cms_design_drafts where site_id=p_site;
 if not found or not exists(select 1 from jsonb_array_elements(d->'pages') p where p->>'slug'=p_slug) then return null;end if;
 if p_version=0 then
 if (select count(*) from public.website_cms_hero_media where site_id=p_site)>=6 then return null;end if;
 insert into public.website_cms_hero_media(site_id,page_slug,image_data,alt,width,height) values(p_site,p_slug,p_data,p_alt,p_width,p_height) on conflict do nothing returning version into v;
 elsif p_version>0 then
 update public.website_cms_hero_media set image_data=p_data,alt=p_alt,width=p_width,height=p_height,version=version+1,updated_at=now() where site_id=p_site and page_slug=p_slug and version=p_version returning version into v;
 end if;
 return v;
end $f$;
create function website_cms_private.remove_hero_media(p_site uuid,p_slug text,p_version integer) returns boolean language plpgsql security definer set search_path='' as $f$
declare actor uuid:=auth.uid();
begin
 if actor is null or p_version is null or p_version<1 then return false;end if;
 perform 1 from public.website_cms_members where site_id=p_site and user_id=actor and role in ('owner','editor') for share;
 if not found then return false;end if;
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_site::text,926));
 delete from public.website_cms_hero_media where site_id=p_site and page_slug=p_slug and version=p_version;
 return found;
end $f$;
create function public.website_cms_save_hero_media(p_site uuid,p_slug text,p_version integer,p_data text,p_alt text,p_width integer,p_height integer,p_rights boolean) returns integer language sql security invoker set search_path='' as $w$ select website_cms_private.save_hero_media(p_site,p_slug,p_version,p_data,p_alt,p_width,p_height,p_rights) $w$;
create function public.website_cms_remove_hero_media(p_site uuid,p_slug text,p_version integer) returns boolean language sql security invoker set search_path='' as $w$ select website_cms_private.remove_hero_media(p_site,p_slug,p_version) $w$;
revoke all on function website_cms_private.save_hero_media(uuid,text,integer,text,text,integer,integer,boolean),website_cms_private.remove_hero_media(uuid,text,integer),public.website_cms_save_hero_media(uuid,text,integer,text,text,integer,integer,boolean),public.website_cms_remove_hero_media(uuid,text,integer) from public,anon,authenticated;
grant execute on function website_cms_private.save_hero_media(uuid,text,integer,text,text,integer,integer,boolean),website_cms_private.remove_hero_media(uuid,text,integer),public.website_cms_save_hero_media(uuid,text,integer,text,text,integer,integer,boolean),public.website_cms_remove_hero_media(uuid,text,integer) to authenticated;
