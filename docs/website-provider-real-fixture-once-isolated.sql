-- One-time operator-approved synthetic provider smoke; isolated database only.
-- No customer identity, credit debit, public RPC or production access.
begin;
create table public.studio_website_provider_fixture_once(
 id text primary key check(id in ('website-fixture-20261126-revision','website-fixture-20261126-image')),
 state text not null default 'pending' check(state in ('pending','claimed','passed','failed','uncertain')),
 maximum_micro_usd integer not null check(maximum_micro_usd between 1 and 50000),
 evidence jsonb not null default '{}'::jsonb check(octet_length(evidence::text)<=4000),
 updated_at timestamptz not null default now()
);
alter table public.studio_website_provider_fixture_once enable row level security;
revoke all on public.studio_website_provider_fixture_once from public,anon,authenticated,service_role;
grant select on public.studio_website_provider_fixture_once to service_role;
grant update(state,evidence,updated_at) on public.studio_website_provider_fixture_once to service_role;
insert into public.studio_website_provider_fixture_once(id,maximum_micro_usd) values
 ('website-fixture-20261126-revision',50000),('website-fixture-20261126-image',40000);
commit;