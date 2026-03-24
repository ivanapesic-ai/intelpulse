

## Plan: Consolidate to ~12 Core Technologies

### Current State: 18 visible → Target: ~12

### Consolidation Groups

**1. Sensor Fusion** (canonical: AV Radar, renamed)
- AV Radar (€45B, 110 companies) → rename to "Sensor Fusion"
- LiDAR (€42B, 44 companies) → hide, add as alias
- AV Camera (€27B, 67 companies) → hide, add as alias

**2. AV Software Stack** (canonical: AV Software, renamed)
- AV Software (€2.7B, 52 companies) → rename to "AV Software Stack"
- AV Simulation (€1.3B, 53 companies) → hide, add as alias
- AV Labeling (€14.7B, 13 companies) → hide, add as alias

**3. SDV absorbs Vehicle as Software**
- Software Defined Vehicle (€8.2B, 280 companies) → stays canonical
- Vehicle as Software (€4.7B, 253 companies) → hide, add as alias

**4. Hide Teledriving**
- Teledriving (€6.1B, 63 companies) → set `excluded_from_sdv = true`

### Result: 12 technologies
1. Electric Vehicle
2. Autonomous Driving
3. Software Defined Vehicle (+ Vehicle as Software)
4. Sensor Fusion (formerly AV Radar + LiDAR + AV Camera)
5. AV Software Stack (formerly AV Software + AV Simulation + AV Labeling)
6. Energy Management Systems
7. Battery Management Systems
8. EV Battery
9. EV Charging
10. Telematics
11. Vehicle to Everything
12. Vehicle to Grid

### Implementation Steps

**Step 1 — Database updates** (using insert/update tool, not migration)
- Set `excluded_from_sdv = true` on: LiDAR, AV Camera, AV Simulation, AV Labeling, Vehicle as Software, Teledriving
- Rename AV Radar → "Sensor Fusion" (update `display_name` in `technology_keywords` and `name` in `technologies`)
- Rename AV Software → "AV Software Stack"
- Update aliases on the 3 canonical parents to include child names

**Step 2 — Update taxonomy-filters.ts**
- Add new entries to `DUPLICATE_KEYWORDS`:
  - `lidar` → `Sensor Fusion`
  - `av camera` → `Sensor Fusion`
  - `av simulation` → `AV Software Stack`
  - `av labeling` → `AV Software Stack`
  - `vehicle as software` → `Software Defined Vehicle`
  - `teledriving` → `Teledriving` (excluded)
- Update `CANONICAL_KEYWORDS` to include `Sensor Fusion` and `AV Software Stack`

**Step 3 — Reprocess keywords**
- After DB changes, trigger "Reprocess Keywords" from Admin to re-map company counts to the consolidated parents so data aggregates properly

### Files Modified
- `src/lib/taxonomy-filters.ts`
- Database: `technology_keywords` table (6 rows updated)
- Database: `technologies` table (2 renames)

