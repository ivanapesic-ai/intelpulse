import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Complete Dealroom taxonomy based on their official documentation
// Industries: https://dealroom.co/guides
const DEALROOM_INDUSTRIES = [
  "Advertising & marketing", "Aerospace", "Agriculture & food", "Automotive",
  "Biotechnology", "Construction", "Consumer electronics", "Cybersecurity",
  "Data & analytics", "Education", "Energy", "Enterprise software",
  "Entertainment", "Fashion", "Fintech", "Gaming", "Health", "Hospitality",
  "Human resources", "Industrial & manufacturing", "Insurance", "Legal",
  "Logistics", "Media", "Real estate", "Retail", "Robotics", "Security",
  "Semiconductors", "Space", "Sports", "Sustainability", "Telecom", "Transportation",
  "Travel", "Wellness & fitness"
];

// Sub-industries (nested under industries)
const DEALROOM_SUB_INDUSTRIES = [
  // Energy sub-industries (most relevant to CEI)
  { name: "Clean energy", parent: "Energy" },
  { name: "Energy storage", parent: "Energy" },
  { name: "Energy management", parent: "Energy" },
  { name: "Smart grid", parent: "Energy" },
  { name: "Renewable energy", parent: "Energy" },
  { name: "Solar", parent: "Energy" },
  { name: "Wind", parent: "Energy" },
  { name: "Hydrogen", parent: "Energy" },
  { name: "Nuclear", parent: "Energy" },
  { name: "Waste solutions", parent: "Energy" },
  { name: "Carbon capture", parent: "Energy" },
  { name: "EV charging", parent: "Energy" },
  
  // Transportation/Automotive sub-industries
  { name: "Electric vehicles", parent: "Transportation" },
  { name: "Autonomous vehicles", parent: "Transportation" },
  { name: "Micromobility", parent: "Transportation" },
  { name: "Fleet management", parent: "Transportation" },
  { name: "Ride sharing", parent: "Transportation" },
  { name: "Last mile delivery", parent: "Transportation" },
  { name: "Logistics tech", parent: "Logistics" },
  { name: "Supply chain", parent: "Logistics" },
  
  // Tech infrastructure
  { name: "Cloud infrastructure", parent: "Enterprise software" },
  { name: "Edge computing", parent: "Enterprise software" },
  { name: "IoT platforms", parent: "Enterprise software" },
  { name: "API platforms", parent: "Enterprise software" },
  { name: "DevOps", parent: "Enterprise software" },
  { name: "Low-code/no-code", parent: "Enterprise software" },
  { name: "Digital twin", parent: "Enterprise software" },
  
  // AI/ML
  { name: "Artificial intelligence", parent: "Data & analytics" },
  { name: "Machine learning", parent: "Data & analytics" },
  { name: "Computer vision", parent: "Data & analytics" },
  { name: "Natural language processing", parent: "Data & analytics" },
  { name: "Predictive analytics", parent: "Data & analytics" },
  { name: "Business intelligence", parent: "Data & analytics" },
  
  // Sustainability
  { name: "Circular economy", parent: "Sustainability" },
  { name: "Climate tech", parent: "Sustainability" },
  { name: "Green building", parent: "Sustainability" },
  { name: "Sustainable packaging", parent: "Sustainability" },
  { name: "Water tech", parent: "Sustainability" },
  
  // Construction/Real Estate
  { name: "Proptech", parent: "Real estate" },
  { name: "Contech", parent: "Construction" },
  { name: "Smart buildings", parent: "Construction" },
  { name: "Building materials", parent: "Construction" },
  
  // Industrial
  { name: "3D printing", parent: "Industrial & manufacturing" },
  { name: "Advanced materials", parent: "Industrial & manufacturing" },
  { name: "Industrial automation", parent: "Industrial & manufacturing" },
  { name: "Industrial IoT", parent: "Industrial & manufacturing" },
  { name: "Predictive maintenance", parent: "Industrial & manufacturing" },
  
  // Hardware/Semiconductors
  { name: "Batteries", parent: "Semiconductors" },
  { name: "Sensors", parent: "Semiconductors" },
  { name: "Chips", parent: "Semiconductors" },
  { name: "Quantum computing", parent: "Semiconductors" },
  
  // Security
  { name: "Identity & access management", parent: "Cybersecurity" },
  { name: "Network security", parent: "Cybersecurity" },
  { name: "Data security", parent: "Cybersecurity" },
  { name: "Blockchain", parent: "Cybersecurity" },
  
  // Other relevant
  { name: "Smart city", parent: "Real estate" },
  { name: "Drones", parent: "Aerospace" },
  { name: "Satellite", parent: "Space" }
];

// Technology tags (granular tech keywords)
const DEALROOM_TECHNOLOGY_TAGS = [
  // Mobility & EV
  "Electric mobility", "EV", "EV charging infrastructure", "Battery technology",
  "Vehicle-to-grid", "V2X", "Connected car", "ADAS", "LiDAR", "Autonomous driving",
  "Electric buses", "Electric trucks", "E-bikes", "E-scooters", "Charging networks",
  "Battery management system", "Battery recycling", "Solid-state batteries",
  
  // Energy & Grid
  "Smart grid", "Microgrid", "Virtual power plant", "Demand response",
  "Grid balancing", "Energy trading", "Power electronics", "Inverters",
  "Energy monitoring", "Smart meters", "Load management", "Peak shaving",
  "Behind-the-meter", "Distributed energy", "Energy as a service",
  
  // Storage
  "Energy storage", "Battery storage", "Grid storage", "Stationary storage",
  "Flow batteries", "Thermal storage", "Compressed air storage", "Flywheel storage",
  "Second-life batteries", "Battery analytics",
  
  // Renewables
  "Solar PV", "Solar thermal", "Wind power", "Offshore wind", "Onshore wind",
  "Hydropower", "Geothermal", "Biomass", "Biogas", "Green hydrogen",
  "Blue hydrogen", "Electrolysis", "Fuel cells", "Power-to-X", "P2G",
  
  // Cloud & Edge
  "Cloud computing", "Edge computing", "Fog computing", "Hybrid cloud",
  "Multi-cloud", "Serverless", "Containerization", "Kubernetes", "Microservices",
  "Cloud-native", "Infrastructure as code",
  
  // IoT & Connectivity
  "Internet of things", "IoT", "Industrial IoT", "IIoT", "Sensors",
  "Smart sensors", "LPWAN", "LoRaWAN", "NB-IoT", "5G", "Private 5G",
  "Edge devices", "Embedded systems", "M2M", "Telematics",
  
  // AI & Data
  "Artificial intelligence", "Machine learning", "Deep learning", "AI/ML",
  "Neural networks", "Reinforcement learning", "Federated learning",
  "MLOps", "AutoML", "AI chips", "Edge AI", "Computer vision", "NLP",
  "Generative AI", "LLM", "Predictive analytics", "Real-time analytics",
  
  // Automation & Robotics
  "Robotics", "Industrial robots", "Collaborative robots", "Cobots",
  "RPA", "Process automation", "Warehouse automation", "AMR", "AGV",
  "Drone delivery", "Autonomous systems",
  
  // Digital Infrastructure
  "Digital twin", "BIM", "GIS", "SCADA", "PLC", "HMI", "DCS",
  "OT security", "Cybersecurity", "Zero trust", "API", "API management",
  "Integration platform", "iPaaS", "Data platform", "Data lake",
  
  // Smart Buildings & Cities
  "Smart building", "Building automation", "BMS", "HVAC optimization",
  "Smart city", "Smart lighting", "Smart parking", "Traffic management",
  "Urban mobility", "Shared mobility", "MaaS", "Mobility as a service",
  
  // Sustainability & Circular
  "Sustainability", "ESG", "Carbon footprint", "Carbon accounting",
  "Carbon offset", "Carbon credits", "Circular economy", "Recycling",
  "Waste management", "Resource efficiency", "Life cycle assessment",
  
  // Fintech for Energy
  "Energy trading platform", "Carbon trading", "Green bonds", "ESG investing",
  "Climate fintech", "Cleantech investing",
  
  // Hardware
  "Power electronics", "Semiconductors", "Silicon carbide", "GaN",
  "Wide bandgap", "Battery cells", "Battery packs", "Charging hardware",
  "Smart hardware", "Connected devices"
];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { action = 'sync' } = await req.json().catch(() => ({}));

    if (action === 'sync') {
      const insertData: Array<{
        taxonomy_type: string;
        name: string;
        slug: string;
        parent_name?: string;
        is_active: boolean;
        last_synced_at: string;
      }> = [];

      // Add industries
      for (const industry of DEALROOM_INDUSTRIES) {
        insertData.push({
          taxonomy_type: 'industry',
          name: industry,
          slug: industry.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          is_active: true,
          last_synced_at: new Date().toISOString()
        });
      }

      // Add sub-industries with parent reference
      for (const sub of DEALROOM_SUB_INDUSTRIES) {
        insertData.push({
          taxonomy_type: 'sub_industry',
          name: sub.name,
          slug: sub.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          parent_name: sub.parent,
          is_active: true,
          last_synced_at: new Date().toISOString()
        });
      }

      // Add technology tags
      for (const tag of DEALROOM_TECHNOLOGY_TAGS) {
        insertData.push({
          taxonomy_type: 'technology',
          name: tag,
          slug: tag.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          is_active: true,
          last_synced_at: new Date().toISOString()
        });
      }

      // Use upsert to handle existing records
      const { error: upsertError } = await supabase
        .from('dealroom_taxonomy')
        .upsert(insertData, { 
          onConflict: 'taxonomy_type,name',
          ignoreDuplicates: false
        });

      if (upsertError) {
        throw upsertError;
      }

      return new Response(JSON.stringify({
        success: true,
        message: 'Dealroom taxonomy synced successfully',
        counts: {
          industries: DEALROOM_INDUSTRIES.length,
          sub_industries: DEALROOM_SUB_INDUSTRIES.length,
          technology_tags: DEALROOM_TECHNOLOGY_TAGS.length,
          total: insertData.length
        }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (action === 'list') {
      const { data, error } = await supabase
        .from('dealroom_taxonomy')
        .select('*')
        .order('taxonomy_type', { ascending: true })
        .order('name', { ascending: true });

      if (error) throw error;

      const grouped = {
        industries: data?.filter(d => d.taxonomy_type === 'industry') || [],
        sub_industries: data?.filter(d => d.taxonomy_type === 'sub_industry') || [],
        technology: data?.filter(d => d.taxonomy_type === 'technology') || []
      };

      return new Response(JSON.stringify({
        success: true,
        data: grouped,
        counts: {
          industries: grouped.industries.length,
          sub_industries: grouped.sub_industries.length,
          technology: grouped.technology.length,
          total: data?.length || 0
        }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({
      error: 'Unknown action. Use "sync" or "list".'
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({
      success: false,
      error: errorMessage
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
