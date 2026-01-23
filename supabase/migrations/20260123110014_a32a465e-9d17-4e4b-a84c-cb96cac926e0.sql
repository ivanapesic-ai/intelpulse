-- Clean up hq_city values that are stored as JSON objects
-- Extract just the city name from JSON objects like {"id":140500,"name":"Huddersfield",...}
UPDATE dealroom_companies
SET hq_city = (hq_city::jsonb->>'name')
WHERE hq_city IS NOT NULL 
  AND hq_city LIKE '{%'
  AND hq_city LIKE '%"name":%';