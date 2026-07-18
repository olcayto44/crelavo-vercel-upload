-- Clipora MVP - Drama production detail migration
-- Run this ONCE in Supabase SQL Editor.
-- Safe to run multiple times because every column uses IF NOT EXISTS.

alter table video_requests
  add column if not exists drama_format text,
  add column if not exists drama_episode_duration text,
  add column if not exists drama_genre text,
  add column if not exists drama_tone text,
  add column if not exists drama_voice_mode text,
  add column if not exists drama_language text,
  add column if not exists drama_material_level text,
  add column if not exists drama_environment_level text,
  add column if not exists drama_sound_design_level text,
  add column if not exists drama_production_complexity text,
  add column if not exists drama_character_count text,
  add column if not exists drama_character_type text,
  add column if not exists drama_main_character_profile text,
  add column if not exists drama_setting_type text,
  add column if not exists drama_location_count text,
  add column if not exists drama_prop_level text,
  add column if not exists drama_dialogue_style text,
  add column if not exists drama_voice_count text,
  add column if not exists drama_subtitle_mode text,
  add column if not exists drama_language_count text,
  add column if not exists drama_vehicle_option text,
  add column if not exists drama_luxury_asset text,
  add column if not exists drama_user_actor text,
  add column if not exists drama_wardrobe_level text,
  add column if not exists drama_stunt_level text;
