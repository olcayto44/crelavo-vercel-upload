-- crelavo-test only. Private catalog and test inbox; never expose a public store or visitor endpoint.
create table public.website_cms_catalog (
 id uuid primary key default gen_random_uuid(),
 site_id uuid not null references public.website_cms_sites(id) on delete cascade,
 sku text not null check(sku ~ '^[A-Za-z0-9_-]{1,48}$'),
 name text not null check(length(trim(name)) between 1 and 120),
 description text not null default '' check(length(description)<=2000),
 price_minor integer not null check(price_minor between 0 and 100000000),
 currency text not null check(currency in ('TRY','USD','EUR','GBP')),
 stock integer not null check(stock between 0 and 1000000),
 visible boolean not null default false,
 version integer not null default 1 check(version>0),
 updated_at timestamptz not null default now(),
 unique(site_id,sku)
);
create table public.website_cms_inbox (
 id uuid primary key default gen_random_uuid(),
 site_id uuid not null references public.website_cms_sites(id) on delete cascade,
 request_key uuid not null,
 subject text not null check(length(trim(subject)) between 1 and 120),
 body text not null check(length(trim(body)) between 1 and 2000),
 status text not null default 'new' check(status in ('new','reviewed','closed')),
 version integer not null default 1 check(version>0),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 unique(site_id,request_key)
);
create index website_cms_inbox_site_created on public.website_cms_inbox(site_id,created_at desc);
alter table public.website_cms_catalog enable row level security;
alter table public.website_cms_inbox enable row level security;
revoke all on public.website_cms_catalog,public.website_cms_inbox from public,anon,authenticated;
grant select on public.website_cms_catalog,public.website_cms_inbox to authenticated;
create policy catalog_member_read on public.website_cms_catalog for select to authenticated using(exists(select 1 from public.website_cms_members m where m.site_id=website_cms_catalog.site_id and m.user_id=(select auth.uid())));
create policy inbox_staff_read on public.website_cms_inbox for select to authenticated using(exists(select 1 from public.website_cms_members m where m.site_id=website_cms_inbox.site_id and m.user_id=(select auth.uid()) and m.role in ('owner','editor')));
create function website_cms_private.save_catalog(p_site uuid,p_id uuid,p_version integer,p_sku text,p_name text,p_description text,p_price integer,p_currency text,p_stock integer,p_visible boolean) returns uuid language plpgsql security definer set search_path='' as $f$
declare actor uuid:=auth.uid(); result_id uuid;
begin
 if actor is null or p_version is null then return null;end if;
 perform 1 from public.website_cms_members where site_id=p_site and user_id=actor and role in ('owner','editor') for share;
 if not found then return null;end if;
 if p_id is null and p_version=0 then
 insert into public.website_cms_catalog(site_id,sku,name,description,price_minor,currency,stock,visible) values(p_site,p_sku,p_name,p_description,p_price,p_currency,p_stock,p_visible) returning id into result_id;
 elsif p_id is not null and p_version>0 then
 update public.website_cms_catalog set sku=p_sku,name=p_name,description=p_description,price_minor=p_price,currency=p_currency,stock=p_stock,visible=p_visible,version=version+1,updated_at=now() where site_id=p_site and id=p_id and version=p_version returning id into result_id;
 end if;
 return result_id;
end $f$;
create function website_cms_private.submit_test_inbox(p_site uuid,p_key uuid,p_subject text,p_body text) returns uuid language plpgsql security definer set search_path='' as $f$
declare actor uuid:=auth.uid();result_id uuid;
begin
 if actor is null or p_key is null then return null;end if;
 perform 1 from public.website_cms_members where site_id=p_site and user_id=actor and role in ('owner','editor') for share;
 if not found then return null;end if;
 -- Serialize submissions for a site, bound internal test frequency.
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_site::text,922));
 select id into result_id from public.website_cms_inbox where site_id=p_site and request_key=p_key;
 if found then return result_id;end if;
 if (select count(*) from public.website_cms_inbox where site_id=p_site and created_at>now()-interval '1 minute')>=10 then return null;end if;
 insert into public.website_cms_inbox(site_id,request_key,subject,body) values(p_site,p_key,p_subject,p_body) returning id into result_id;
 return result_id;
end $f$;
create function website_cms_private.update_inbox(p_site uuid,p_id uuid,p_version integer,p_status text) returns integer language plpgsql security definer set search_path='' as $f$
declare actor uuid:=auth.uid();v integer;
begin
 if actor is null or p_version is null or p_version<1 then return null;end if;
 perform 1 from public.website_cms_members where site_id=p_site and user_id=actor and role in ('owner','editor') for share;
 if not found then return null;end if;
 update public.website_cms_inbox set status=p_status,version=version+1,updated_at=now() where site_id=p_site and id=p_id and version=p_version returning version into v;
 return v;
end $f$;
create function public.website_cms_save_catalog(p_site uuid,p_id uuid,p_version integer,p_sku text,p_name text,p_description text,p_price integer,p_currency text,p_stock integer,p_visible boolean) returns uuid language sql security invoker set search_path='' as $w$ select website_cms_private.save_catalog(p_site,p_id,p_version,p_sku,p_name,p_description,p_price,p_currency,p_stock,p_visible) $w$;
create function public.website_cms_submit_test_inbox(p_site uuid,p_key uuid,p_subject text,p_body text) returns uuid language sql security invoker set search_path='' as $w$ select website_cms_private.submit_test_inbox(p_site,p_key,p_subject,p_body) $w$;
create function public.website_cms_update_inbox(p_site uuid,p_id uuid,p_version integer,p_status text) returns integer language sql security invoker set search_path='' as $w$ select website_cms_private.update_inbox(p_site,p_id,p_version,p_status) $w$;
revoke all on function website_cms_private.save_catalog(uuid,uuid,integer,text,text,text,integer,text,integer,boolean),website_cms_private.submit_test_inbox(uuid,uuid,text,text),website_cms_private.update_inbox(uuid,uuid,integer,text),public.website_cms_save_catalog(uuid,uuid,integer,text,text,text,integer,text,integer,boolean),public.website_cms_submit_test_inbox(uuid,uuid,text,text),public.website_cms_update_inbox(uuid,uuid,integer,text) from public,anon,authenticated;
grant execute on function website_cms_private.save_catalog(uuid,uuid,integer,text,text,text,integer,text,integer,boolean),website_cms_private.submit_test_inbox(uuid,uuid,text,text),website_cms_private.update_inbox(uuid,uuid,integer,text),public.website_cms_save_catalog(uuid,uuid,integer,text,text,text,integer,text,integer,boolean),public.website_cms_submit_test_inbox(uuid,uuid,text,text),public.website_cms_update_inbox(uuid,uuid,integer,text) to authenticated;