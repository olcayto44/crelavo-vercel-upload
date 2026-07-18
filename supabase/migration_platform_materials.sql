create table if not exists platform_materials (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  material_type text not null default 'product',
  category text not null default 'General',
  description text not null default '',
  preview_url text not null default '',
  file_url text not null default '',
  usage_tags text[] not null default '{}',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists platform_materials_active_idx on platform_materials (active, category, material_type);

insert into platform_materials (slug, title, material_type, category, description, preview_url, file_url, usage_tags)
values
  ('clipora-cosmetic-serum', 'Clipora Glow Serum', 'product', 'Beauty / skincare', 'Premium serum product pack for beauty ads, product pages and social visuals.', '/materials/clipora-glow-serum-preview.jpg', '/materials/clipora-glow-serum-pack.zip', array['beauty', 'skincare', 'product_ad', 'ecommerce']),
  ('clipora-coffee-pack', 'Clipora Artisan Coffee', 'product', 'Food / beverage', 'Coffee bag, cup and cafe mood assets for reels, banners and store visuals.', '/materials/clipora-coffee-preview.jpg', '/materials/clipora-coffee-pack.zip', array['coffee', 'restaurant', 'cafe', 'social']),
  ('clipora-saas-dashboard-kit', 'Clipora SaaS Dashboard Kit', 'template', 'SaaS / web', 'Dashboard, pricing, auth and admin panel starter visuals for web/app productions.', '/materials/clipora-saas-dashboard-preview.jpg', '/materials/clipora-saas-dashboard-kit.zip', array['saas', 'website', 'admin', 'source_delivery']),
  ('clipora-luxury-showroom', 'Luxury Showroom Scene', 'scene', 'Scene / environment', 'Premium showroom background direction for product, brand and localization outputs.', '/materials/luxury-showroom-preview.jpg', '/materials/luxury-showroom-scene-pack.zip', array['luxury', 'showroom', 'product', 'brand']),
  ('clipora-social-brand-pack', 'Clipora Social Brand Pack', 'brand_asset', 'Brand / social', 'Reusable social color, layout and CTA assets controlled by Clipora.', '/materials/clipora-social-brand-preview.jpg', '/materials/clipora-social-brand-pack.zip', array['brand', 'social', 'campaign', 'template'])
on conflict (slug) do update set
  title = excluded.title,
  material_type = excluded.material_type,
  category = excluded.category,
  description = excluded.description,
  preview_url = excluded.preview_url,
  file_url = excluded.file_url,
  usage_tags = excluded.usage_tags,
  active = true,
  updated_at = now();
