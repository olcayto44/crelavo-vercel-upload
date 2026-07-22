-- Clipora MVP database schema
-- Run this in Supabase SQL editor after creating the project.

create type request_status as enum ('pending', 'in_production', 'ready', 'failed', 'cancelled');
create type credit_event_type as enum ('purchase', 'reserve', 'spend', 'refund', 'adjustment');

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  role text not null default 'user' check (role in ('user', 'admin')),
  created_at timestamptz not null default now()
);

create table credit_balances (
  user_id uuid primary key references profiles(id) on delete cascade,
  balance integer not null default 0,
  reserved integer not null default 0,
  current_subscription_credits integer not null default 0,
  rolled_over_credits integer not null default 0,
  topup_credits integer not null default 0,
  bonus_credits integer not null default 0,
  rollover_cap integer not null default 0,
  subscription_status text not null default 'inactive',
  billing_cycle_ends_at timestamptz,
  active_subscription_package text,
  active_subscription_billing text,
  last_rollover_at timestamptz,
  topup_expires_at timestamptz,
  updated_at timestamptz not null default now()
);

create table credit_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  type credit_event_type not null,
  amount integer not null,
  note text,
  stripe_session_id text,
  created_at timestamptz not null default now()
);

create table assistant_credit_balances (
  user_id uuid primary key references profiles(id) on delete cascade,
  balance integer not null default 0,
  updated_at timestamptz not null default now()
);

create table welcome_credit_claims (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  email text not null,
  ip_address text not null,
  credits_granted integer not null default 250,
  created_at timestamptz not null default now(),
  unique (user_id),
  unique (email),
  unique (ip_address)
);

create table video_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  title text not null,
  video_type text not null,
  target_platform text not null,
  style text not null,
  prompt text not null,
  language_notes text,
  conversational_mode text,
  conversational_language text,
  conversational_voice text,
  extra_language_count integer not null default 0,
  voice_tone text,
  voice_pace text,
  voice_accent text,
  voice_age_range text,
  voice_emotion text,
  camera_framing text,
  camera_movement text,
  lighting_style text,
  background_environment text,
  presenter_appearance text,
  color_palette text,
  font_choice text,
  logo_placement text,
  branding_intensity text,
  transition_style text,
  motion_intensity text,
  caption_style text,
  bgm_mood text,
  sfx_intensity text,
  aspect_output text,
  frame_rate text,
  drama_format text,
  drama_episode_duration text,
  drama_genre text,
  drama_tone text,
  drama_voice_mode text,
  drama_language text,
  drama_material_level text,
  drama_environment_level text,
  drama_sound_design_level text,
  drama_production_complexity text,
  drama_character_count text,
  drama_character_type text,
  drama_main_character_profile text,
  drama_setting_type text,
  drama_location_count text,
  drama_prop_level text,
  drama_dialogue_style text,
  drama_voice_count text,
  drama_subtitle_mode text,
  drama_language_count text,
  drama_vehicle_option text,
  drama_luxury_asset text,
  drama_user_actor text,
  drama_wardrobe_level text,
  drama_stunt_level text,
  premium_material_type text,
  premium_material_option text,
  preview_status text,
  preview_image_url text,
  preview_prompt text,
  preview_approved boolean not null default false,
  preview_revision_count integer not null default 0,
  generation_status text,
  generation_provider text,
  generation_job_id text,
  generation_error text,
  generation_started_at timestamptz,
  generation_completed_at timestamptz,
  duration text,
  extra_notes text,
  estimated_credits integer not null default 0,
  reserved_credits integer not null default 0,
  status request_status not null default 'pending',
  admin_notes text,
  final_video_url text,
  caption text,
  hashtags text,
  actual_cost_usd numeric(10,2),
  production_tool_used text,
  production_cost_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table production_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  production_type text not null,
  package_id text,
  title text not null,
  prompt text not null,
  status text not null default 'in_production',
  generation_status text default 'queued',
  estimated_credits integer not null default 0,
  reserved_credits integer not null default 0,
  input_json jsonb not null default '{}'::jsonb,
  output_json jsonb not null default '{}'::jsonb,
  preview_url text,
  delivery_zip_url text,
  source_files_url text,
  readme_url text,
  admin_notes text,
  cancellation_fee_credits integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table packages (
  id text primary key,
  name text not null,
  stripe_price_id text,
  credits integer not null,
  price_usd integer not null,
  active boolean not null default true
);

insert into packages (id, name, credits, price_usd) values
  ('starter', 'Starter', 200, 19),
  ('creator', 'Creator', 650, 49),
  ('business', 'Business', 2200, 149)
on conflict (id) do nothing;

alter table profiles enable row level security;
alter table credit_balances enable row level security;
alter table credit_events enable row level security;
alter table assistant_credit_balances enable row level security;
alter table welcome_credit_claims enable row level security;
alter table video_requests enable row level security;
alter table production_requests enable row level security;
alter table packages enable row level security;

create policy "profiles own read" on profiles for select using (auth.uid() = id);
create policy "requests own read" on video_requests for select using (auth.uid() = user_id);
create policy "requests own insert" on video_requests for insert with check (auth.uid() = user_id);
create policy "production requests own read" on production_requests for select using (auth.uid() = user_id);
create policy "production requests own insert" on production_requests for insert with check (auth.uid() = user_id);
create policy "credits own read" on credit_balances for select using (auth.uid() = user_id);
create policy "credit events own read" on credit_events for select using (auth.uid() = user_id);
create policy "assistant credits own read" on assistant_credit_balances for select using (auth.uid() = user_id);
create policy "welcome claims own read" on welcome_credit_claims for select using (auth.uid() = user_id);
create policy "packages public read" on packages for select using (active = true);
