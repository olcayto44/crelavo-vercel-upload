create table if not exists platform_configs (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  description text,
  updated_at timestamptz not null default now()
);

alter table platform_configs enable row level security;

create policy if not exists "Service role manages platform configs"
  on platform_configs
  for all
  using (true)
  with check (true);

insert into platform_configs (key, value, description)
values
  ('sample_videos', '{"videos": []}'::jsonb, 'Public sample video gallery metadata'),
  ('faq_items', '{"faqs": []}'::jsonb, 'Public FAQ section metadata'),
  ('ad_slots', '{"slots": []}'::jsonb, 'Public and dashboard ad slot configuration')
on conflict (key) do nothing;
