alter table video_requests
  add column if not exists premium_material_type text,
  add column if not exists premium_material_option text;
