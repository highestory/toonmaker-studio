-- Add script_data column to projects table
alter table projects add column script_data jsonb default '{}'::jsonb;
