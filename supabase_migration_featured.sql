-- Add is_featured flag to episodes table
ALTER TABLE episodes ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false;

-- Add ai_special_episode_id to projects table
ALTER TABLE projects ADD COLUMN IF NOT EXISTS ai_special_episode_id UUID REFERENCES episodes(id);
