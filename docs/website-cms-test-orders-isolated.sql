-- Isolated internal test orders, with actual stock accounting. No payments, PII,
-- public checkout or fulfillment. All writes are owner/editor fenced and atomic.
create table public.website_cms_test_orders(
 id uuid primary key default gen_random_uuid(),
 site_id uuid not null references public.website_cms_sites(id) on delete cascade,
 request_key uuid not null,
 product_id uuid not null references public.website_cms_catalog(id),
 sku text not null,
 product_name text not null,
 quantity integer not null check(quantity between 1 and 1000),
 unit_price_minor integer not null check(unit_price_minor>=0),
 currency text not null check(currency in ('TRY','USD','EUR','GBP')),
 total_minor bigint generated always as (unit_price_minor::bigint*quantity) stored,
 state text not null default 'reserved' check(state in ('reserved','cancelled')),
 created_at timestamptz not null default now(),
 cancelled_at timestamptz,
 unique(site_id,request_key)
);
create index website_cms_test_orders_site on public.website_cms_test_orders(site_id,created_at desc);
alter table public.website_cms_test_orders enable row level security;
revoke all on public.website_cms_test_orders from public,anon,authenticated;
grant select on public.website_cms_test_orders to authenticated;
create policy test_order_staff_read on public.website_cms_test_orders for select to authenticated using(exists(select 1 from public.website_cms_members m where m.site_id=website_cms_test_orders.site_id and m.user_id=(select auth.uid()) and m.role in ('owner','editor')));
create function website_cms_private.reserve_test_order(p_site uuid,p_key uuid,p_product uuid,p_version integer,p_quantity integer) returns uuid language plpgsql security definer set search_path='' as $f$
declare actor uuid:=auth.uid(); existing public.website_cms_test_orders%rowtype; item public.website_cms_catalog%rowtype; result_id uuid;
begin
 if actor is null or p_key is null or p_quantity is null or p_quantity not between 1 and 1000 or p_version is null or p_version<1 then return null;end if;
 perform 1 from public.website_cms_members where site_id=p_site and user_id=actor and role in ('owner','editor') for share;
 if not found then return null;end if;
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_site::text,923));
 select * into existing from public.website_cms_test_orders where site_id=p_site and request_key=p_key;
 if found then if existing.product_id=p_product and existing.quantity=p_quantity then return existing.id;else return null;end if;end if;
 if (select count(*) from public.website_cms_test_orders where site_id=p_site and created_at>now()-interval '1 minute')>=20 then return null;end if;
 select * into item from public.website_cms_catalog where id=p_product and site_id=p_site and visible and version=p_version for update;
 if not found or item.stock<p_quantity then return null;end if;
 update public.website_cms_catalog set stock=stock-p_quantity,version=version+1,updated_at=now() where id=item.id and site_id=p_site;
 insert into public.website_cms_test_orders(site_id,request_key,product_id,sku,product_name,quantity,unit_price_minor,currency) values(p_site,p_key,item.id,item.sku,item.name,p_quantity,item.price_minor,item.currency) returning id into result_id;
 return result_id;
end $f$;
create function website_cms_private.cancel_test_order(p_site uuid,p_order uuid) returns boolean language plpgsql security definer set search_path='' as $f$
declare actor uuid:=auth.uid(); o public.website_cms_test_orders%rowtype;
begin
 if actor is null then return false;end if;
 perform 1 from public.website_cms_members where site_id=p_site and user_id=actor and role in ('owner','editor') for share;
 if not found then return false;end if;
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_site::text,923));
 select * into o from public.website_cms_test_orders where id=p_order and site_id=p_site for update;
 if not found then return false;end if;
 if o.state='cancelled' then return true;end if;
 update public.website_cms_catalog set stock=stock+o.quantity,version=version+1,updated_at=now() where id=o.product_id and site_id=p_site and stock<=1000000-o.quantity;
 if not found then return false;end if;
 update public.website_cms_test_orders set state='cancelled',cancelled_at=now() where id=o.id and site_id=p_site;
 return true;
end $f$;
create function public.website_cms_reserve_test_order(p_site uuid,p_key uuid,p_product uuid,p_version integer,p_quantity integer) returns uuid language sql security invoker set search_path='' as $w$ select website_cms_private.reserve_test_order(p_site,p_key,p_product,p_version,p_quantity) $w$;
create function public.website_cms_cancel_test_order(p_site uuid,p_order uuid) returns boolean language sql security invoker set search_path='' as $w$ select website_cms_private.cancel_test_order(p_site,p_order) $w$;
revoke all on function website_cms_private.reserve_test_order(uuid,uuid,uuid,integer,integer),website_cms_private.cancel_test_order(uuid,uuid),public.website_cms_reserve_test_order(uuid,uuid,uuid,integer,integer),public.website_cms_cancel_test_order(uuid,uuid) from public,anon,authenticated;
grant execute on function website_cms_private.reserve_test_order(uuid,uuid,uuid,integer,integer),website_cms_private.cancel_test_order(uuid,uuid),public.website_cms_reserve_test_order(uuid,uuid,uuid,integer,integer),public.website_cms_cancel_test_order(uuid,uuid) to authenticated;
