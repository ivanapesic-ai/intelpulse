-- Trigger recalculation by updating a regular column (this fires the trigger which updates composite_score)
UPDATE technologies 
SET document_mention_count = COALESCE(document_mention_count, 0)
WHERE TRUE;