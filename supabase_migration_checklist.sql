-- Add checklist_data column to projects table
ALTER TABLE projects ADD COLUMN IF NOT EXISTS checklist_data JSONB DEFAULT '[]'::jsonb;

-- Example structure:
-- [
--   { "id": "mon-1", "section": "월요일", "text": "월요일 원픽 선정 완료", "checked": false, "input": "" },
--   { "id": "mon-2", "section": "월요일", "text": "화요일 원픽 선정 완료", "checked": false, "input": "" },
--   ...
-- ]
