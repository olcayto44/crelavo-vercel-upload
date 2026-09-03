insert into platform_configs (key, value, description)
values ('showcase_videos', '{"videos": []}'::jsonb, 'Public showcase video detail pages and SEO metadata')
on conflict (key) do nothing;
