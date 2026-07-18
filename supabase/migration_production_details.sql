-- Add full production detail columns to existing Clipora database
-- Run this in Supabase SQL Editor to extend video_requests with all new production fields.

alter table video_requests
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
