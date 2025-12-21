# Data Mapping Worksheet (MVP)
## AI-CE Heatmap Platform

---

## What We're Building

A visual map showing **technologies** organized by:
- **Category** (4 groups: Materials, Digital, Energy, Manufacturing)
- **Readiness** (4 levels: Ready → Emerging → Early → Research)

Each technology gets a **score from 0-9** based on how promising it is.

---

## What Data Do We Need?

For each technology, we need:

| Data | Example | Where From? |
|------|---------|-------------|
| Name | "Solid-state batteries" | BluSpecs provides list |
| Category | Energy | BluSpecs decides |
| Description | "Next-gen batteries..." | CEI documents |
| Readiness level | "Emerging" | CEI assessment |
| Score | 7.2 | Calculated from data |

**MVP Scope:** Start with **20-30 technologies** that BluSpecs selects.

---

## Data Sources for MVP

### 1. Technology List (Required)
**BluSpecs provides:** A list of technologies to include
- Name, category, and brief description for each
- Initial readiness assessment

### 2. CEI Documents (Optional for MVP)
**If available:** Upload existing assessments
- We can extract technology info automatically
- Helps calculate scores

### 3. Manual Entry (Fallback)
**If no documents:** Admin enters data manually
- Simple form to add/edit technologies
- Can add data sources later

---

## Questions for BluSpecs

### Must Answer Before Building

1. **Technology List**
   - [ ] Can you provide a list of 20-30 technologies to start?
   - [ ] Or should we create a sample list for you to review?

2. **Categories**
   - [ ] Are these 4 categories correct?
     - Materials & Chemistry
     - Digital & AI  
     - Clean Energy
     - Smart Manufacturing

3. **Scoring**
   - [ ] For MVP: Simple manual scoring (1-9) or calculated from data?

4. **Access**
   - [ ] Who can view? (Public or login required?)
   - [ ] Who can edit? (How many admins?)

---

## MVP vs Later Phases

| Feature | MVP | Later |
|---------|-----|-------|
| Technology data | Manual entry | Auto from APIs |
| Scoring | Admin sets scores | Calculated from data |
| Data sources | CEI documents | Dealroom, PATSTAT, etc. |
| Number of technologies | 20-30 | 100+ |
| Users | Admin only | Public + Premium |

---

## Next Steps

### Before January 8
- [ ] BluSpecs: Confirm technology list (or approve sample)
- [ ] BluSpecs: Confirm 4 categories
- [ ] BluSpecs: Answer questions above

### January 8 Meeting
- [ ] Walk through this together
- [ ] Finalize MVP scope
- [ ] Assign action items

---

*Document Version: 3.0 (MVP Focus)*  
*Last Updated: January 2025*
