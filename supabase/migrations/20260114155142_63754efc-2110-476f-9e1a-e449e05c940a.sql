-- Add dealroom_tags column to technology_keywords table
ALTER TABLE technology_keywords 
ADD COLUMN dealroom_tags TEXT[] DEFAULT '{}';

-- Populate initial Dealroom tag mappings for existing keywords
UPDATE technology_keywords SET dealroom_tags = ARRAY['electric mobility', 'automotive', 'software'] 
WHERE keyword = 'sdv';

UPDATE technology_keywords SET dealroom_tags = ARRAY['electric mobility', 'electric vehicle', 'battery'] 
WHERE keyword = 'bev';

UPDATE technology_keywords SET dealroom_tags = ARRAY['electric mobility', 'ev charging', 'energy'] 
WHERE keyword = 'ev_charging';

UPDATE technology_keywords SET dealroom_tags = ARRAY['energy', 'smart grid', 'cleantech'] 
WHERE keyword = 'smart_grid';

UPDATE technology_keywords SET dealroom_tags = ARRAY['autonomous driving', 'automotive', 'artificial intelligence'] 
WHERE keyword = 'autonomous_driving';

UPDATE technology_keywords SET dealroom_tags = ARRAY['iot', 'edge computing', 'cloud'] 
WHERE keyword = 'edge_computing';

UPDATE technology_keywords SET dealroom_tags = ARRAY['cloud', 'saas', 'enterprise software'] 
WHERE keyword = 'cloud_computing';

UPDATE technology_keywords SET dealroom_tags = ARRAY['iot', 'hardware', 'connectivity'] 
WHERE keyword = 'iot';

UPDATE technology_keywords SET dealroom_tags = ARRAY['artificial intelligence', 'machine learning', 'deep learning'] 
WHERE keyword = 'ai_ml';

UPDATE technology_keywords SET dealroom_tags = ARRAY['cybersecurity', 'security', 'enterprise software'] 
WHERE keyword = 'cybersecurity';