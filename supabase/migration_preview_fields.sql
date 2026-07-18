alter table video_requests
  add column if not exists preview_status text,
  add column if not exists preview_image_url text,
  add column if not exists preview_prompt text,
  add column if not exists preview_approved boolean not null default false,
  add column if not exists preview_revision_count integer not null default 0;
