# Data-Focused Kickoff Meeting Agenda

**Project:** AI-CE Heatmap Platform  
**Date:** January 8, 2025  
**Duration:** 2 hours  
**Focus:** Data Sources, Mapping & Integration  
**Location:** [To be confirmed]

---

## Attendees

### House Eleven Oy
- [Project Lead]
- [Technical Lead]

### BluSpecs
- [Product Owner]
- [Domain Expert]
- [Technical Contact / Data Owner]

---

## Agenda

### 1. Welcome & Project Context (10 min)
- Brief introductions
- Project objectives recap
- Meeting focus: Establishing data foundation

### 2. Data Sources Overview (15 min)
- Inventory of all available data sources
- Current state of access and credentials
- Data ownership and responsibilities
- Identify any additional sources not yet discussed

---

### 3. Dealroom API Deep Dive (20 min)

| Topic | Questions to Address |
|-------|---------------------|
| **Access Status** | API credentials available? Sandbox vs Production? |
| **Data Fields** | Which fields are accessible? Company, funding, employees? |
| **Coverage** | Geographic scope? Technology sector filtering? |
| **Limits** | Rate limits? Query restrictions? Data export allowed? |
| **Freshness** | Update frequency? Historical data available? |

**Action Items to Define:**
- [ ] API access handover date
- [ ] Sample data extraction target
- [ ] Field mapping to our taxonomy

---

### ☕ Break (5 min)

---

### 4. CEI Documents Analysis (20 min)

| Topic | Questions to Address |
|-------|---------------------|
| **Volume** | How many documents? Estimated growth rate? |
| **Formats** | PDF, PPT, Word? Scanned vs native digital? |
| **Structure** | Consistent templates or varied formats? |
| **Content** | Technology mentions? TRL assessments? Policy references? |
| **Access** | Where are they stored? Access permissions? |

**Action Items to Define:**
- [ ] Sample documents to share (minimum 5)
- [ ] Document classification categories
- [ ] AI parsing priority order

---

### 5. Future Data Sources (5 min)

| Source | Status | Notes |
|--------|--------|-------|
| **PATSTAT/Patent Data** | Phase 2 | Requires EPO subscription, evaluate after MVP |
| **Additional APIs** | TBD | Identify any other sources for future phases |

**Discussion:**
- What patent/innovation data sources might be valuable post-MVP?
- Any other data sources not yet discussed?

---

### 6. Technology Taxonomy Workshop (20 min)

#### 6.1 Quadrant Structure
Review and validate the four proposed quadrants:

| Quadrant | Description | Sample Technologies |
|----------|-------------|---------------------|
| **Materials & Chemistry** | Advanced materials, green chemistry | [To be defined] |
| **Digital & AI** | Software, automation, data analytics | [To be defined] |
| **Energy & Storage** | Batteries, renewables, efficiency | [To be defined] |
| **Manufacturing** | Processes, robotics, 3D printing | [To be defined] |

#### 6.2 Maturity Levels
Validate TRL mapping:
- TRL 1-3: Research phase
- TRL 4-6: Development phase
- TRL 7-9: Deployment phase

#### 6.3 Exercise: Categorize 5 Sample Technologies
*Hands-on validation of taxonomy with real examples*

---

### 7. Data Mapping & Integration Planning (10 min)

- Review Data Mapping Worksheet (separate document)
- Identify field mappings across sources
- Discuss data normalization needs
- Define composite score calculation inputs

---

### 8. Next Steps & Data Handover Plan (5 min)

| Data Source | Owner | Handover Date | Format |
|-------------|-------|---------------|--------|
| Dealroom API access | BluSpecs | Jan 10 | API credentials |
| CEI sample documents | BluSpecs | Jan 10 | Shared folder |
| Technology taxonomy approval | Both | Jan 12 | Spreadsheet |

---

## Pre-Meeting Preparation

### House Eleven Oy to Prepare
- [x] Data Requirements Questionnaire
- [x] Data Mapping Worksheet
- [x] Project Timeline
- [ ] Sample taxonomy spreadsheet

### BluSpecs to Prepare
- [ ] Dealroom API documentation/credentials
- [ ] 5+ sample CEI documents
- [ ] PATSTAT access details or sample export
- [ ] List of 10-20 priority technologies to categorize
- [ ] Existing technology classifications (if any)

---

## Key Data Questions to Resolve

1. **Dealroom**: What exact API endpoints and fields are available to us?
2. **CEI Documents**: Are there templates or is every document unique?
3. **Taxonomy**: Is there an existing classification we should align with?
4. **Gaps**: What data do we need that no source currently provides?
5. **Quality**: What data quality issues should we anticipate?
6. **Updates**: What is the refresh cycle expectation (daily/weekly/monthly)?

---

## Meeting Outputs

By the end of this meeting, we should have:

- [ ] Complete inventory of data sources with access status
- [ ] Agreed technology taxonomy (4 quadrants confirmed)
- [ ] Data handover schedule with owners and dates
- [ ] Initial field mapping for each data source
- [ ] Identified data gaps and mitigation strategies
- [ ] Clear next steps for data integration phase

---

## Future Meetings

| Meeting | Focus | Target Date |
|---------|-------|-------------|
| **UX/UI Design Sprint** | User research, wireframes, prototypes | Week 3 (Jan 20-24) |
| **Technical Architecture** | System design, API structure | Week 2 (Jan 13-17) |
| **Data Workshop #2** | Scoring algorithm, normalization | Week 2 (Jan 15) |

---

## Notes

*Space for meeting notes:*

---

---

---

*Document Version: 2.0*  
*Last Updated: December 21, 2024*  
*Focus: Data-centric kickoff*
