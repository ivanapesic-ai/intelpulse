-- Function to re-match ALL existing news articles against keywords with smarter matching
CREATE OR REPLACE FUNCTION public.rematch_all_news()
RETURNS TABLE(articles_processed bigint, new_matches_created bigint, keywords_matched bigint)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_articles BIGINT := 0;
  v_matches BIGINT := 0;
  v_keywords BIGINT := 0;
  rec RECORD;
  kw RECORD;
  combined_text TEXT;
  search_term TEXT;
  is_matched BOOLEAN;
  title_matched BOOLEAN;
  conf NUMERIC;
BEGIN
  -- Loop through all news articles
  FOR rec IN SELECT id, lower(title) as title_lower, lower(coalesce(description, '')) as desc_lower FROM news_items
  LOOP
    v_articles := v_articles + 1;
    combined_text := rec.title_lower || ' ' || rec.desc_lower;
    
    FOR kw IN SELECT tk.id, lower(tk.keyword) as kw_lower, lower(tk.display_name) as dn_lower, tk.aliases 
               FROM technology_keywords tk WHERE tk.is_active = true
    LOOP
      is_matched := false;
      title_matched := false;
      
      -- Build search terms: keyword (with underscores→spaces), display_name, aliases
      -- Check each term
      DECLARE
        terms TEXT[];
        term TEXT;
      BEGIN
        terms := ARRAY[
          replace(replace(kw.kw_lower, '_', ' '), '-', ' '),
          kw.dn_lower
        ];
        -- Add aliases
        IF kw.aliases IS NOT NULL THEN
          FOR i IN 1..array_length(kw.aliases, 1) LOOP
            terms := array_append(terms, lower(kw.aliases[i]));
          END LOOP;
        END IF;
        
        FOREACH term IN ARRAY terms LOOP
          -- For short terms (≤4 chars), use word boundary matching
          IF length(term) <= 4 THEN
            IF combined_text ~ ('\m' || regexp_replace(term, '([.*+?^${}()|[\]\\])', '\\\1', 'g') || '\M') THEN
              is_matched := true;
              IF rec.title_lower ~ ('\m' || regexp_replace(term, '([.*+?^${}()|[\]\\])', '\\\1', 'g') || '\M') THEN
                title_matched := true;
              END IF;
            END IF;
          ELSE
            -- For longer terms, check includes + hyphen/space variants
            IF combined_text LIKE '%' || term || '%' 
               OR combined_text LIKE '%' || replace(term, ' ', '-') || '%'
               OR combined_text LIKE '%' || replace(term, '-', ' ') || '%' THEN
              is_matched := true;
              IF rec.title_lower LIKE '%' || term || '%' THEN
                title_matched := true;
              END IF;
            END IF;
          END IF;
          
          EXIT WHEN is_matched;
        END LOOP;
      END;
      
      IF is_matched THEN
        conf := CASE WHEN title_matched THEN 1.0 ELSE 0.7 END;
        
        INSERT INTO news_keyword_matches (news_id, keyword_id, match_confidence, match_source)
        VALUES (rec.id, kw.id, conf, CASE WHEN title_matched THEN 'title_match' ELSE 'description_match' END)
        ON CONFLICT (news_id, keyword_id) DO UPDATE SET 
          match_confidence = GREATEST(news_keyword_matches.match_confidence, EXCLUDED.match_confidence),
          match_source = CASE WHEN EXCLUDED.match_confidence > news_keyword_matches.match_confidence THEN EXCLUDED.match_source ELSE news_keyword_matches.match_source END;
        
        v_matches := v_matches + 1;
      END IF;
    END LOOP;
  END LOOP;
  
  SELECT COUNT(DISTINCT nkm.keyword_id) INTO v_keywords FROM news_keyword_matches nkm;
  
  RETURN QUERY SELECT v_articles, v_matches, v_keywords;
END;
$$;

-- Improve aliases for under-matched keywords
UPDATE technology_keywords SET aliases = array_cat(COALESCE(aliases, '{}'), ARRAY['software defined vehicle', 'software-defined vehicle', 'vehicle software platform', 'vehicle OS']) WHERE keyword = 'sdv' AND NOT ('software defined vehicle' = ANY(COALESCE(aliases, '{}')));
UPDATE technology_keywords SET aliases = array_cat(COALESCE(aliases, '{}'), ARRAY['smart grid', 'smart power grid', 'grid modernization', 'intelligent grid']) WHERE keyword = 'smart_grid' AND NOT ('smart power grid' = ANY(COALESCE(aliases, '{}')));
UPDATE technology_keywords SET aliases = array_cat(COALESCE(aliases, '{}'), ARRAY['fleet management system', 'fleet tracking', 'fleet optimization', 'vehicle fleet']) WHERE keyword = 'fleet_management' AND NOT ('fleet tracking' = ANY(COALESCE(aliases, '{}')));
UPDATE technology_keywords SET aliases = array_cat(COALESCE(aliases, '{}'), ARRAY['vehicle-to-everything', 'vehicle to everything', 'V2I', 'V2V', 'vehicle-to-vehicle', 'vehicle-to-infrastructure', 'C-V2X']) WHERE keyword = 'v2x' AND NOT ('vehicle-to-everything' = ANY(COALESCE(aliases, '{}')));
UPDATE technology_keywords SET aliases = array_cat(COALESCE(aliases, '{}'), ARRAY['LiDAR sensor', 'lidar technology', 'light detection and ranging', 'laser radar']) WHERE keyword = 'lidar' AND NOT ('lidar technology' = ANY(COALESCE(aliases, '{}')));
UPDATE technology_keywords SET aliases = array_cat(COALESCE(aliases, '{}'), ARRAY['battery energy storage', 'stationary battery', 'energy storage system', 'grid storage']) WHERE keyword = 'sbs' AND NOT ('battery energy storage' = ANY(COALESCE(aliases, '{}')));
UPDATE technology_keywords SET aliases = array_cat(COALESCE(aliases, '{}'), ARRAY['vehicle telematics', 'telematics system', 'automotive telematics', 'connected vehicle data']) WHERE keyword = 'telematics' AND NOT ('vehicle telematics' = ANY(COALESCE(aliases, '{}')));
UPDATE technology_keywords SET aliases = array_cat(COALESCE(aliases, '{}'), ARRAY['electric motor', 'EV drivetrain', 'electric drivetrain', 'electric powertrain motor']) WHERE keyword = 'ev_motor' AND NOT ('electric motor' = ANY(COALESCE(aliases, '{}')));
UPDATE technology_keywords SET aliases = array_cat(COALESCE(aliases, '{}'), ARRAY['smart city', 'intelligent city', 'urban technology', 'smart urban']) WHERE keyword = 'smart_cities' AND NOT ('intelligent city' = ANY(COALESCE(aliases, '{}')));
UPDATE technology_keywords SET aliases = array_cat(COALESCE(aliases, '{}'), ARRAY['supply chain tech', 'supply chain technology', 'logistics management', 'supply chain optimization']) WHERE keyword = 'supply_chain_management' AND NOT ('supply chain tech' = ANY(COALESCE(aliases, '{}')));
UPDATE technology_keywords SET aliases = array_cat(COALESCE(aliases, '{}'), ARRAY['autonomous vehicle simulation', 'self-driving simulation', 'AV testing', 'virtual driving test']) WHERE keyword = 'av_simulation' AND NOT ('autonomous vehicle simulation' = ANY(COALESCE(aliases, '{}')));
UPDATE technology_keywords SET aliases = array_cat(COALESCE(aliases, '{}'), ARRAY['smart logistics', 'intelligent logistics', 'logistics automation', 'automated logistics']) WHERE keyword = 'smart_logistics' AND NOT ('intelligent logistics' = ANY(COALESCE(aliases, '{}')));
UPDATE technology_keywords SET aliases = array_cat(COALESCE(aliases, '{}'), ARRAY['battery management', 'BMS', 'battery monitoring', 'battery control system']) WHERE keyword = 'battery_management' AND NOT ('battery monitoring' = ANY(COALESCE(aliases, '{}')));
UPDATE technology_keywords SET aliases = array_cat(COALESCE(aliases, '{}'), ARRAY['EV battery', 'electric vehicle battery', 'lithium battery', 'battery cell', 'battery pack', 'solid state battery', 'solid-state battery']) WHERE keyword = 'ev_battery' AND NOT ('battery cell' = ANY(COALESCE(aliases, '{}')));
UPDATE technology_keywords SET aliases = array_cat(COALESCE(aliases, '{}'), ARRAY['remote driving', 'tele-driving', 'tele-operation', 'remote vehicle operation']) WHERE keyword = 'teledriving' AND NOT ('remote driving' = ANY(COALESCE(aliases, '{}')));