-- Rename cei_dealroom_mappings to keyword_industry_mappings
ALTER TABLE cei_dealroom_mappings RENAME TO keyword_industry_mappings;

-- Update the foreign key constraint name for clarity
ALTER TABLE keyword_industry_mappings 
  RENAME CONSTRAINT cei_dealroom_mappings_keyword_id_fkey TO keyword_industry_mappings_keyword_id_fkey;