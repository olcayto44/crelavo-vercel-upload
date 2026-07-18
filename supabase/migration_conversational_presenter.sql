-- Add AI Conversational Presenter detail fields to existing Clipora database
-- Run this once in Supabase SQL Editor if your database was created before these fields existed.

alter table video_requests
  add column if not exists conversational_mode text,
  add column if not exists conversational_language text,
  add column if not exists conversational_voice text,
  add column if not exists extra_language_count integer not null default 0;
