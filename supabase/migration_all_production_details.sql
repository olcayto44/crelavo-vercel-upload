-- Clipora MVP - Full production detail migration
-- Run this ONCE in Supabase SQL Editor.
-- Safe to run multiple times because every column uses IF NOT EXISTS.

alter table video_requests
  add column if not exists conversational_mode text,
  add column if not exists conversational_language text,
  add column if not exists conversational_voice text,
  add column if not exists extra_language_count integer not null default 0,
  add column if not exists voice_tone text,
  add column if not exists voice_pace text,
  add column if not exists voice_accent text,
  add column if not exists voice_age_range text,
  add column if not exists voice_emotion text,
  add column if not exists camera_framing text,
  add column if not exists camera_movement text,
  add column if not exists lighting_style text,
  add column if not exists background_environment text,
  add column if not exists presenter_appearance text,
  add column if not exists color_palette text,
  add column if not exists font_choice text,
  add column if not exists logo_placement text,
  add column if not exists branding_intensity text,
  add column if not exists transition_style text,
  add column if not exists motion_intensity text,
  add column if not exists caption_style text,
  add column if not exists bgm_mood text,
  add column if not exists sfx_intensity text,
  add column if not exists aspect_output text,
  add column if not exists frame_rate text;

-- Quick verification query:
-- After running the migration, run this to verify the new columns exist:
-- select column_name, data_type
-- from information_schema.columns
-- where table_name = 'video_requests'
--   and column_name in (
--     'conversational_mode', 'conversational_language', 'conversational_voice',
--     'extra_language_count', 'voice_tone', 'voice_pace', 'voice_accent',
--     'voice_age_range', 'voice_emotion', 'camera_framing', 'camera_movement',
--     'lighting_style', 'background_environment', 'presenter_appearance',
--     'color_palette', 'font_choice', 'logo_placement', 'branding_intensity',
--     'transition_style', 'motion_intensity', 'caption_style', 'bgm_mood',
--     'sfx_intensity', 'aspect_output', 'frame_rate'
--   )
-- order by column_name;
