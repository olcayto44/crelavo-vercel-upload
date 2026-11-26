-- Isolated private editorial and appointment operations. No public writes or personal data.
create table public.website_cms_articles(
 id uuid primary key default gen_random_uuid(),site_id uuid not null references public.website_cms_sites(id) on delete cascade,
 slug text not null check(slug ~ '^[a-z][a-z0-9-]{0,48}$'),title text not null check(length(trim(title)) between 1 and 70),
 description text not null check(length(trim(description)) between 1 and 160),body text not null check(length(trim(body)) between 1 and 12000),
 state text not null default 'draft' check(state in ('draft','reviewed','archived')),version integer not null default 1 check(version>0),
 updated_at timestamptz not null default now(),unique(site_id,slug)
);
create table public.website_cms_article_revisions(
 article_id uuid not null references public.website_cms_articles(id) on delete cascade,site_id uuid not null references public.website_cms_sites(id) on delete cascade,
 version integer not null,content jsonb not null,changed_by uuid not null references auth.users(id),created_at timestamptz not null default now(),primary key(article_id,version)
);
create table public.website_cms_booking_slots(
 id uuid primary key default gen_random_uuid(),site_id uuid not null references public.website_cms_sites(id) on delete cascade,
 resource text not null check(resource ~ '^[a-z0-9][a-z0-9-]{0,47}$'),service text not null check(length(trim(service)) between 1 and 100),
 starts_at timestamptz not null,ends_at timestamptz not null check(ends_at>starts_at and ends_at<=starts_at+interval '8 hours'),
 capacity integer not null check(capacity between 1 and 100),created_at timestamptz not null default now(),unique(site_id,resource,starts_at)
);
create table public.website_cms_test_bookings(
 id uuid primary key default gen_random_uuid(),site_id uuid not null references public.website_cms_sites(id) on delete cascade,
 slot_id uuid not null references public.website_cms_booking_slots(id) on delete cascade,request_key uuid not null,
 seats integer not null check(seats between 1 and 100),state text not null default 'reserved' check(state in ('reserved','cancelled')),
 created_at timestamptz not null default now(),cancelled_at timestamptz,unique(site_id,request_key)
);
create index website_cms_slots_resource on public.website_cms_booking_slots(site_id,resource,starts_at);
create index website_cms_bookings_slot on public.website_cms_test_bookings(site_id,slot_id,state);
alter table public.website_cms_articles enable row level security;
alter table public.website_cms_article_revisions enable row level security;
alter table public.website_cms_booking_slots enable row level security;
alter table public.website_cms_test_bookings enable row level security;
revoke all on public.website_cms_articles,public.website_cms_article_revisions,public.website_cms_booking_slots,public.website_cms_test_bookings from public,anon,authenticated;
grant select on public.website_cms_articles,public.website_cms_article_revisions,public.website_cms_booking_slots,public.website_cms_test_bookings to authenticated;
create policy article_staff_read on public.website_cms_articles for select to authenticated using(exists(select 1 from public.website_cms_members m where m.site_id=website_cms_articles.site_id and m.user_id=(select auth.uid()) and m.role in ('owner','editor')));
create policy article_revision_staff_read on public.website_cms_article_revisions for select to authenticated using(exists(select 1 from public.website_cms_members m where m.site_id=website_cms_article_revisions.site_id and m.user_id=(select auth.uid()) and m.role in ('owner','editor')));
create policy slot_staff_read on public.website_cms_booking_slots for select to authenticated using(exists(select 1 from public.website_cms_members m where m.site_id=website_cms_booking_slots.site_id and m.user_id=(select auth.uid()) and m.role in ('owner','editor')));
create policy booking_staff_read on public.website_cms_test_bookings for select to authenticated using(exists(select 1 from public.website_cms_members m where m.site_id=website_cms_test_bookings.site_id and m.user_id=(select auth.uid()) and m.role in ('owner','editor')));
create function website_cms_private.save_article(p_site uuid,p_id uuid,p_version integer,p_slug text,p_title text,p_description text,p_body text,p_state text) returns uuid language plpgsql security definer set search_path='' as $f$
declare actor uuid:=auth.uid();a public.website_cms_articles%rowtype;
begin
 if actor is null or p_version is null then return null;end if;
 perform 1 from public.website_cms_members where site_id=p_site and user_id=actor and role in ('owner','editor') for share;
 if not found then return null;end if;
 if p_id is null and p_version=0 then
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_site::text,924));
 if (select count(*) from public.website_cms_articles where site_id=p_site)>=100 then return null;end if;
 insert into public.website_cms_articles(site_id,slug,title,description,body,state) values(p_site,p_slug,p_title,p_description,p_body,p_state) returning * into a;
 elsif p_id is not null and p_version>0 then
 update public.website_cms_articles set slug=p_slug,title=p_title,description=p_description,body=p_body,state=p_state,version=version+1,updated_at=now() where site_id=p_site and id=p_id and version=p_version returning * into a;
 else return null;end if;
 if a.id is null then return null;end if;
 insert into public.website_cms_article_revisions(article_id,site_id,version,content,changed_by) values(a.id,p_site,a.version,jsonb_build_object('slug',a.slug,'title',a.title,'description',a.description,'body',a.body,'state',a.state),actor);
 return a.id;
end $f$;
create function website_cms_private.create_slot(p_site uuid,p_resource text,p_service text,p_start timestamptz,p_end timestamptz,p_capacity integer) returns uuid language plpgsql security definer set search_path='' as $f$
declare actor uuid:=auth.uid();v uuid;
begin
 if actor is null or p_start is null or p_end is null or p_start<=now() or p_start>now()+interval '365 days' or p_end<=p_start or p_end>p_start+interval '8 hours' then return null;end if;
 perform 1 from public.website_cms_members where site_id=p_site and user_id=actor and role in ('owner','editor') for share;
 if not found then return null;end if;
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_site::text,925));
 if exists(select 1 from public.website_cms_booking_slots where site_id=p_site and resource=p_resource and starts_at<p_end and ends_at>p_start) then return null;end if;
 if (select count(*) from public.website_cms_booking_slots where site_id=p_site and ends_at>now())>=500 then return null;end if;
 insert into public.website_cms_booking_slots(site_id,resource,service,starts_at,ends_at,capacity) values(p_site,p_resource,p_service,p_start,p_end,p_capacity) returning id into v;return v;
end $f$;
create function website_cms_private.reserve_slot(p_site uuid,p_slot uuid,p_key uuid,p_seats integer) returns uuid language plpgsql security definer set search_path='' as $f$
declare actor uuid:=auth.uid();s public.website_cms_booking_slots%rowtype;b public.website_cms_test_bookings%rowtype;v uuid;
begin
 if actor is null or p_key is null or p_seats is null or p_seats not between 1 and 100 then return null;end if;
 perform 1 from public.website_cms_members where site_id=p_site and user_id=actor and role in ('owner','editor') for share;
 if not found then return null;end if;
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_site::text,925));
 select * into b from public.website_cms_test_bookings where site_id=p_site and request_key=p_key;
 if found then if b.slot_id=p_slot and b.seats=p_seats then return b.id;else return null;end if;end if;
 select * into s from public.website_cms_booking_slots where site_id=p_site and id=p_slot and starts_at>now() for update;
 if not found or coalesce((select sum(seats) from public.website_cms_test_bookings where site_id=p_site and slot_id=p_slot and state='reserved'),0)+p_seats>s.capacity then return null;end if;
 if (select count(*) from public.website_cms_test_bookings where site_id=p_site and created_at>now()-interval '1 minute')>=30 then return null;end if;
 insert into public.website_cms_test_bookings(site_id,slot_id,request_key,seats) values(p_site,p_slot,p_key,p_seats) returning id into v;return v;
end $f$;
create function website_cms_private.cancel_booking(p_site uuid,p_booking uuid) returns boolean language plpgsql security definer set search_path='' as $f$
declare actor uuid:=auth.uid();
begin
 if actor is null then return false;end if;
 perform 1 from public.website_cms_members where site_id=p_site and user_id=actor and role in ('owner','editor') for share;
 if not found then return false;end if;
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_site::text,925));
 update public.website_cms_test_bookings set state='cancelled',cancelled_at=coalesce(cancelled_at,now()) where site_id=p_site and id=p_booking;return found;
end $f$;
create function public.website_cms_save_article(p_site uuid,p_id uuid,p_version integer,p_slug text,p_title text,p_description text,p_body text,p_state text) returns uuid language sql security invoker set search_path='' as $w$ select website_cms_private.save_article(p_site,p_id,p_version,p_slug,p_title,p_description,p_body,p_state) $w$;
create function public.website_cms_create_slot(p_site uuid,p_resource text,p_service text,p_start timestamptz,p_end timestamptz,p_capacity integer) returns uuid language sql security invoker set search_path='' as $w$ select website_cms_private.create_slot(p_site,p_resource,p_service,p_start,p_end,p_capacity) $w$;
create function public.website_cms_reserve_slot(p_site uuid,p_slot uuid,p_key uuid,p_seats integer) returns uuid language sql security invoker set search_path='' as $w$ select website_cms_private.reserve_slot(p_site,p_slot,p_key,p_seats) $w$;
create function public.website_cms_cancel_booking(p_site uuid,p_booking uuid) returns boolean language sql security invoker set search_path='' as $w$ select website_cms_private.cancel_booking(p_site,p_booking) $w$;
revoke all on function website_cms_private.save_article(uuid,uuid,integer,text,text,text,text,text),website_cms_private.create_slot(uuid,text,text,timestamptz,timestamptz,integer),website_cms_private.reserve_slot(uuid,uuid,uuid,integer),website_cms_private.cancel_booking(uuid,uuid),public.website_cms_save_article(uuid,uuid,integer,text,text,text,text,text),public.website_cms_create_slot(uuid,text,text,timestamptz,timestamptz,integer),public.website_cms_reserve_slot(uuid,uuid,uuid,integer),public.website_cms_cancel_booking(uuid,uuid) from public,anon,authenticated;
grant execute on function website_cms_private.save_article(uuid,uuid,integer,text,text,text,text,text),website_cms_private.create_slot(uuid,text,text,timestamptz,timestamptz,integer),website_cms_private.reserve_slot(uuid,uuid,uuid,integer),website_cms_private.cancel_booking(uuid,uuid),public.website_cms_save_article(uuid,uuid,integer,text,text,text,text,text),public.website_cms_create_slot(uuid,text,text,timestamptz,timestamptz,integer),public.website_cms_reserve_slot(uuid,uuid,uuid,integer),public.website_cms_cancel_booking(uuid,uuid) to authenticated;
