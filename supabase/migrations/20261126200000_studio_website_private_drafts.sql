-- Production-compatible, additive Website draft storage. No payment or existing row mutations.
begin;
create table public.studio_website_drafts (
 user_id uuid primary key references auth.users(id) on delete cascade,
 design jsonb not null check(coalesce(jsonb_typeof(design)='object' and design->'version'='2'::jsonb and jsonb_typeof(design->'pages')='array',false) and octet_length(design::text)<=48000),
 version integer not null check(version between 1 and 2147483646),
 updated_at timestamptz not null default now()
);
alter table public.studio_website_drafts enable row level security;
revoke all on public.studio_website_drafts from public,anon,authenticated,service_role;
grant select,insert,update on public.studio_website_drafts to service_role;
commit;
