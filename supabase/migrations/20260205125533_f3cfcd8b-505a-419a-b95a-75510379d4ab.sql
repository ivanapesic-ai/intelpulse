-- SDV Ecosystem Keyword-to-Concept Linking
-- Excludes broad logistics, maritime, smart cities, and energy grid terms per user requirements

-- SDV (ID 1) - Software Defined Vehicle core concepts
UPDATE technology_keywords 
SET ontology_concept_id = 1 
WHERE LOWER(display_name) IN (
  'software defined vehicle', 'software-defined vehicle', 'sdv',
  'connected car', 'connected vehicle', 'vehicle software',
  'automotive software', 'car software platform', 'vehicle os',
  'automotive os', 'vehicle operating system'
);

-- Autonomous Vehicle (ID 2)
UPDATE technology_keywords 
SET ontology_concept_id = 2 
WHERE LOWER(display_name) IN (
  'autonomous driving', 'autonomous vehicle', 'self-driving',
  'self-driving car', 'self-driving vehicle', 'driverless',
  'robotaxi', 'robo-taxi', 'autonomous mobility'
);

-- ADAS (ID 3) - Advanced Driver Assistance Systems
UPDATE technology_keywords 
SET ontology_concept_id = 3 
WHERE LOWER(display_name) IN (
  'adas', 'advanced driver assistance', 'driver assistance',
  'lidar', 'radar sensor', 'collision avoidance',
  'lane keeping', 'adaptive cruise control', 'parking assist',
  'blind spot detection', 'emergency braking', 'aeb'
);

-- V2X (ID 4) - Vehicle-to-Everything Communication
UPDATE technology_keywords 
SET ontology_concept_id = 4 
WHERE LOWER(display_name) IN (
  'v2x', 'v2v', 'v2i', 'vehicle to everything',
  'vehicle to vehicle', 'vehicle to infrastructure',
  'c-v2x', 'dsrc', 'connected infrastructure'
);

-- OTA Updates (ID 5)
UPDATE technology_keywords 
SET ontology_concept_id = 5 
WHERE LOWER(display_name) IN (
  'ota', 'ota updates', 'over the air', 'over-the-air',
  'software updates', 'firmware updates', 'remote updates',
  'vehicle updates', 'automotive ota'
);

-- Electric Vehicle (ID 6) - EV and charging
UPDATE technology_keywords 
SET ontology_concept_id = 6 
WHERE LOWER(display_name) IN (
  'electric vehicle', 'ev', 'bev', 'battery electric vehicle',
  'ev charging', 'electric charging', 'charging station',
  'charging infrastructure', 'fast charging', 'dc fast charging',
  'chargepoint', 'evse', 'electric mobility', 'e-mobility'
);

-- Battery Systems (ID 7) - Vehicle battery tech
UPDATE technology_keywords 
SET ontology_concept_id = 7 
WHERE LOWER(display_name) IN (
  'battery management', 'bms', 'battery management system',
  'ev battery', 'vehicle battery', 'traction battery',
  'battery pack', 'battery thermal management', 'battery cell',
  'solid state battery', 'lithium ion battery'
);

-- Digital Twin (ID 8)
UPDATE technology_keywords 
SET ontology_concept_id = 8 
WHERE LOWER(display_name) IN (
  'digital twin', 'vehicle digital twin', 'automotive digital twin',
  'virtual vehicle', 'simulation', 'vehicle simulation'
);

-- Telematics (ID 9)
UPDATE technology_keywords 
SET ontology_concept_id = 9 
WHERE LOWER(display_name) IN (
  'telematics', 'vehicle telematics', 'automotive telematics',
  'fleet telematics', 'gps tracking', 'vehicle tracking',
  'obd', 'obd-ii', 'diagnostic data', 'vehicle diagnostics'
);

-- In-Vehicle Infotainment (ID 10)
UPDATE technology_keywords 
SET ontology_concept_id = 10 
WHERE LOWER(display_name) IN (
  'infotainment', 'ivi', 'in-vehicle infotainment',
  'head unit', 'car display', 'automotive display',
  'hmi', 'human machine interface', 'car hmi',
  'voice assistant', 'in-car entertainment'
);

-- Fleet Management (ID 11) - Vehicle fleet ops only, excludes logistics/supply chain
UPDATE technology_keywords 
SET ontology_concept_id = 11 
WHERE LOWER(display_name) IN (
  'fleet management', 'fleet software', 'fleet operations',
  'fleet tracking', 'vehicle fleet', 'commercial fleet',
  'fleet optimization', 'fleet analytics'
);

-- MaaS (ID 12) - Mobility as a Service, excludes maritime/smart cities
UPDATE technology_keywords 
SET ontology_concept_id = 12 
WHERE LOWER(display_name) IN (
  'maas', 'mobility as a service', 'shared mobility',
  'ride sharing', 'ridesharing', 'ride hailing', 'ridehailing',
  'car sharing', 'carsharing', 'micromobility',
  'e-scooter', 'bike sharing', 'multimodal mobility'
);

-- Cybersecurity (ID 13) - Automotive security
UPDATE technology_keywords 
SET ontology_concept_id = 13 
WHERE LOWER(display_name) IN (
  'automotive cybersecurity', 'vehicle security', 'car security',
  'automotive security', 'vehicle cybersecurity', 'can bus security',
  'ecu security', 'secure boot', 'intrusion detection'
);

-- Edge Computing (ID 14) - Vehicle/mobile edge only, excludes energy grid terms
UPDATE technology_keywords 
SET ontology_concept_id = 14 
WHERE LOWER(display_name) IN (
  'edge computing', 'vehicle edge', 'automotive edge',
  'mobile edge computing', 'mec', 'edge ai',
  'on-device ai', 'embedded ai', 'vehicle compute'
);