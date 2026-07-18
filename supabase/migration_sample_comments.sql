create table if not exists public.sample_comments (
  id uuid primary key default gen_random_uuid(),
  sample_id text not null,
  parent_comment_id uuid references public.sample_comments(id) on delete cascade,
  user_id uuid,
  author_name text not null default 'Guest',
  author_role text not null default 'user' check (author_role in ('user', 'admin')),
  text text not null,
  like_count integer not null default 0,
  status text not null default 'visible' check (status in ('visible', 'hidden', 'deleted')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists sample_comments_sample_id_idx on public.sample_comments(sample_id);
create index if not exists sample_comments_parent_idx on public.sample_comments(parent_comment_id);
create index if not exists sample_comments_created_idx on public.sample_comments(created_at desc);

create table if not exists public.sample_likes (
  id uuid primary key default gen_random_uuid(),
  sample_id text not null,
  user_id uuid,
  visitor_key text,
  created_at timestamptz not null default now(),
  constraint sample_likes_unique_actor unique(sample_id, user_id, visitor_key)
);

create table if not exists public.sample_comment_likes (
  id uuid primary key default gen_random_uuid(),
  comment_id uuid not null references public.sample_comments(id) on delete cascade,
  user_id uuid,
  visitor_key text,
  created_at timestamptz not null default now(),
  constraint sample_comment_likes_unique_actor unique(comment_id, user_id, visitor_key)
);
