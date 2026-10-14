-- Store the published brand mark in the same shared site settings record.
-- Safe to run on projects where this column already exists.
alter table public.site_settings
  add column if not exists logo_url text not null default '';
