-- Clipora MVP - Admin cost and profit tracking migration
-- Run this ONCE in Supabase SQL Editor.
-- Safe to run multiple times because every column uses IF NOT EXISTS.
-- Legacy video_requests use explicit cost fields.
-- New production_requests store per-job revenue/API/profit breakdown in request_metadata->outputPlan->profitEstimate.

alter table video_requests
  add column if not exists actual_cost_usd numeric(10,2),
  add column if not exists production_tool_used text,
  add column if not exists production_cost_notes text;

comment on column production_requests.request_metadata is 'Includes outputPlan.profitEstimate for admin revenue, provider/API cost, gross profit, margin and provider cost lines.';
