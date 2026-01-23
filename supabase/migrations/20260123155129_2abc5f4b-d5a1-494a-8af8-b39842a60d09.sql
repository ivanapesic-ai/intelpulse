-- Add structured mapping columns for Dealroom taxonomy types
ALTER TABLE technology_keywords 
ADD COLUMN IF NOT EXISTS dealroom_industries TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS dealroom_sub_industries TEXT[] DEFAULT '{}';