

## Plan: Strict Keyword Taxonomy & Precise Mapping System

### Goal
Update the keyword system to match the approved taxonomy from the Jan 22 meeting, then implement precise AI mapping that prioritizes Dealroom's actual terminology over semantic associations.

### ✅ Phase 1: Sync Keywords to Approved List (COMPLETED)

**Added missing CEI-SPHERE keywords:**
- E-Vehicle (alias for EV)
- Self-driving vehicles
- Autonomous Vehicle
- SES - Solar Energy System
- SES - Stationary Energy Storage (differentiate from Shared Energy Storage)

**Added missing Dealroom keywords:**
- Teledriving
- Telematics
- Sustainability Measurement

### ✅ Phase 2: Clear Bad Mappings & Improve AI Mapper (COMPLETED)

**Cleared existing polluted mappings:**
```sql
UPDATE technology_keywords 
SET dealroom_tags = '{}', 
    dealroom_industries = '{}', 
    dealroom_sub_industries = '{}';
```

**Rewrote AI mapper with strict rules:**
- CRITICAL MATCHING RULES enforcing exact domain matches
- Programmatic blacklist filter blocking generic terms:
  - artificial intelligence, machine learning, AI/ML
  - software, cloud computing, automation
  - IoT, internet of things
  - robotics (unless keyword is about robots)
  - sustainability, cleantech, climate tech (too broad)
  - automotive, transportation, energy (too broad)

### ✅ Phase 3: Create Semantic Mapping Suggestions (COMPLETED)

Added SUGGESTED_DEALROOM_MAPPINGS constant in KeywordManager:

| CEI Keyword | Suggested Dealroom Terms |
|-------------|--------------------------|
| Autonomous Driving | AV Software, AV Simulation, AV Labeling, LiDAR, AV Camera, AV Radar, Teledriving |
| Battery Electric Vehicle | EV Battery, EV Manufacturing, EV Motor, Electric Mobility, EV Services |
| Vehicle to Grid | Electric Mobility, EV Charging |
| Logistics | Logistics Tech, Logistics Robots, Fleet Management, Supply Chain Management |
| Smart City | Smart Cities |
| Maritime | Maritime |
| EV Charging | EV Charging |
| Supply Chain | Supply Chain Management, Logistics Tech |

### ✅ Phase 4: Update AdminPanel UI (COMPLETED)

Enhanced the Keyword Manager to:
1. Show Dealroom-source keywords as "verified Dealroom terms" with BadgeCheck icon
2. Prioritize suggesting Dealroom-source keywords as mappings
3. Added visual indicator (amber color) for suggested vs. browsed taxonomy mappings
4. Tooltip explaining what suggested terms are

### Files Modified

| File | Change |
|------|--------|
| `supabase/functions/ai-tag-mapper/index.ts` | Rewrote prompts + added blacklist filter |
| `src/components/admin/KeywordManager.tsx` | Added Dealroom-source keyword suggestions UI |
| Migration | Added missing keywords + cleared bad mappings |

### Expected Outcome

**Before:**
```
Autonomous Driving -> ['autonomous driving', 'automotive', 'artificial intelligence']
```

**After:**
```
Autonomous Driving -> 
  industries: []
  sub_industries: ['Autonomous vehicles']
  tags: ['Autonomous driving', 'ADAS', 'LiDAR', 'AV Software', 'AV Simulation']
```

This ensures when you search Dealroom for "Autonomous Driving" companies, you get actual autonomous driving companies - not every AI startup in the world.

### Next Steps

1. **Run Auto-map**: Go to Admin Panel > Keyword Management and click "Auto-map Missing" to re-run AI mapping with strict rules
2. **Review mappings**: Verify the new mappings are domain-specific
3. **Run Dealroom sync**: After mapping, sync with Dealroom to pull company data with the precise tags
