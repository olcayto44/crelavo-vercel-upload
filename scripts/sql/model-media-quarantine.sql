-- Test-only foundation: no user-facing upload, paid dispatch or ledger changes.
-- Review existing storage policies and global upload cap before production rollout.
begin;
create table public.model_media_assets (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete restrict,
 model_id text not null check (model_id ~ '^[a-z0-9][a-z0-9-]{0,79}$'),
 kind text not null check (kind in ('image','video','audio')),
 mime text not null,
 bytes bigint not null check (bytes > 0 and bytes <= 50000000),
 object_key text not null unique check (object_key = user_id::text || '/' || id::text || '/original'),
 state text not null default 'quarantined' check (state in ('quarantined','verified','rejected')),
 sha256 text check (sha256 ~ '^[0-9a-f]{64}$'),
 duration_ms integer check (duration_ms > 0 and duration_ms <= 30000),
 created_at timestamptz not null default now(),
 check ((kind='image' and mime in ('image/jpeg','image/png','image/webp') and bytes < 30000000 and duration_ms is null)
 or (kind='video' and mime in ('video/mp4','video/quicktime'))
 or (kind='audio' and mime in ('audio/mpeg','audio/wav') and bytes < 15000000)),
 check (state <> 'verified' or (sha256 is not null and (kind='image' or (duration_ms is not null and duration_ms between 2000 and 30000))))
);
alter table public.model_media_assets enable row level security;
revoke all on public.model_media_assets from public, anon, authenticated;
grant select,insert,update,delete on public.model_media_assets to service_role;
create index model_media_assets_owner_created on public.model_media_assets(user_id,created_at desc);
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values ('model-original-quarantine','model-original-quarantine',false,50000000,array['image/jpeg','image/png','image/webp','video/mp4','video/quicktime','audio/mpeg','audio/wav']);
commit;
