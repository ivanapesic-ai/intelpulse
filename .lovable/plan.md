

## Plan: Strict Keyword Taxonomy & Precise Mapping System

### Goal
Update the keyword system to match the approved taxonomy from the Jan 22 meeting, then implement precise AI mapping that prioritizes Dealroom's actual terminology over semantic associations.

### Phase 1: Sync Keywords to Approved List

**Add missing CEI-SPHERE keywords:**
- E-Vehicle (alias for EV)
- Self-driving vehicles
- Autonomous Vehicle
- SES - Solar Energy System
- SES - Stationary Energy Storage (differentiate from Shared Energy Storage)

**Add missing Dealroom keywords:**
- Teledriving
- Telematics
- Sustainability Measurement
- (Verify AV Labeling isn't duplicated)

### Phase 2: Clear Bad Mappings & Improve AI Mapper

**Clear existing polluted mappings:**
```sql
UPDATE technology_keywords 
SET dealroom_tags = '{}', 
    dealroom_industries = '{}', 
    dealroom_sub_industries = '{}';
```

**Rewrite AI mapper with strict rules:**

```
CRITICAL MATCHING RULES:
1. For CEI keywords -> Map to Dealroom terms that describe the EXACT SAME technology/domain
2. NEVER suggest generic enabling technologies (AI, ML, IoT, software, cloud, robotics)
   - WRONG: "Autonomous Driving" -> "artificial intelligence" 
   - RIGHT: "Autonomous Driving" -> "Autonomous driving", "ADAS", "LiDAR"
3. Prefer Dealroom-source keywords as mapping targets (they are verified Dealroom terms)
4. Test: "Would searching this tag find ONLY companies in this domain?"
   - If too broad, don't include

EXAMPLES:
"Autonomous Driving" should map to:
  - sub_industries: ["Autonomous vehicles"]
  - tags: ["Autonomous driving", "ADAS", "LiDAR", "AV Software"]
  - NOT: "artificial intelligence", "machine learning", "computer vision"

"Battery Electric Vehicle" should map to:
  - sub_industries: ["Electric vehicles"]
  - tags: ["EV", "Electric mobility", "Battery technology"]
  - NOT: "automotive" (too broad), "sustainability" (too vague)

"Vehicle to Grid" should map to:
  - tags: ["Vehicle-to-grid", "V2X", "Bidirectional charging"]
  - NOT: "energy", "smart grid" (too broad)
```

**Add programmatic blacklist filter:**
Block these terms unless the CEI keyword explicitly matches:
- artificial intelligence, machine learning, AI/ML
- software, cloud computing, automation
- IoT, internet of things
- robotics (unless keyword is about robots)
- sustainability, cleantech, climate tech (too broad)

### Phase 3: Create Semantic Mapping Suggestions

Since the Dealroom-source keywords ARE valid Dealroom terms, the system should:
1. Auto-suggest Dealroom-source keywords as mappings for related CEI keywords
2. Group CEI and Dealroom keywords by domain for easier manual review

**Suggested CEI -> Dealroom keyword relationships:**

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
| Autonomous Driving | Autonomous Mobile Robots, Telematics |
| Battery Systems | Battery Management Systems |

### Phase 4: Update AdminPanel UI

Enhance the Keyword Manager to:
1. Show Dealroom-source keywords as "verified Dealroom terms"
2. Prioritize suggesting Dealroom-source keywords as mappings
3. Add visual indicator for exact-match vs AI-suggested mappings

### Files to Modify

| File | Change |
|------|--------|
| `supabase/functions/ai-tag-mapper/index.ts` | Rewrite prompts + add blacklist |
| `src/components/admin/KeywordManager.tsx` | Add Dealroom-source keyword suggestions |
| Migration | Add missing keywords + clear bad mappings |
| `supabase/functions/dealroom-taxonomy/index.ts` | Add any missing Dealroom terms from approved list |

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

