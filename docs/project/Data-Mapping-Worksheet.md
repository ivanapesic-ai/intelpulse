# Data Mapping Worksheet

**Project:** AI-CE Heatmap Platform  
**Purpose:** Map data fields from source systems to platform data model  
**Status:** Draft - To be completed during Kickoff Meeting

---

## 1. Platform Data Model (Target Schema)

### Core Technology Entity

| Field | Type | Description | Required | Source |
|-------|------|-------------|----------|--------|
| `technology_id` | UUID | Unique identifier | Yes | Generated |
| `name` | Text | Technology name | Yes | Multiple |
| `description` | Text | Brief description | Yes | CEI/Manual |
| `quadrant` | Enum | Materials, Digital, Energy, Manufacturing | Yes | Taxonomy |
| `maturity_ring` | Enum | Adopt, Trial, Assess, Hold | Yes | Calculated |
| `trl_score` | Integer | 1-9 | Yes | CEI/AI |
| `market_score` | Decimal | 0-9 | Yes | Calculated |
| `innovation_score` | Decimal | 0-9 | Yes | Calculated |
| `eu_alignment_score` | Decimal | 0-9 | Yes | Calculated |
| `composite_score` | Decimal | 0-9 | Yes | Calculated |
| `last_updated` | Timestamp | Last data refresh | Yes | System |

### Supporting Entities

| Entity | Purpose | Key Fields |
|--------|---------|------------|
| `companies` | Market data | name, funding, employees, location, sector |
| `patents` | Innovation data | title, applicant, filing_date, cpc_codes, citations |
| `documents` | CEI assessments | title, type, date, extracted_technologies |
| `policies` | EU alignment | name, technologies_mentioned, relevance_score |

---

## 2. Source: Dealroom API

### Available Data (To Be Confirmed)

| Dealroom Field | Platform Field | Transformation | Status |
|----------------|----------------|----------------|--------|
| `company.name` | `companies.name` | Direct | ⬜ TBC |
| `company.total_funding` | `companies.funding` | Convert to EUR | ⬜ TBC |
| `company.employees` | `companies.employees` | Direct | ⬜ TBC |
| `company.hq_location` | `companies.location` | Normalize | ⬜ TBC |
| `company.industries` | `companies.sector` | Map to taxonomy | ⬜ TBC |
| `company.technologies` | Technology link | Entity resolution | ⬜ TBC |
| `company.founded_date` | `companies.founded` | Direct | ⬜ TBC |
| `funding_rounds` | Funding history | Aggregate | ⬜ TBC |

### Questions for BluSpecs

- [ ] Which Dealroom subscription tier do we have access to?
- [ ] Can we filter by technology/sector at API level?
- [ ] Is historical data available (for trend analysis)?
- [ ] What is the rate limit and how should we handle pagination?

### Mapping Notes

*Space for notes during meeting:*

---

---

## 3. Source: CEI Documents

### Document Types

| Document Type | Expected Content | Extraction Method | Volume |
|---------------|------------------|-------------------|--------|
| Technology Assessment | TRL, description, applications | AI parsing | ⬜ TBC |
| Policy Brief | EU policy alignment, priorities | AI parsing | ⬜ TBC |
| Market Report | Company mentions, trends | AI parsing | ⬜ TBC |
| Presentation | Mixed content | AI parsing | ⬜ TBC |
| Research Paper | Deep technical content | AI parsing | ⬜ TBC |

### Field Extraction Targets

| Extracted Data | Platform Field | Confidence Threshold | Manual Review |
|----------------|----------------|---------------------|---------------|
| Technology mentions | Technology link | >70% | <70% flagged |
| TRL assessment | `trl_score` | >80% | Required |
| Company mentions | Company link | >70% | <70% flagged |
| Policy references | `policies` link | >60% | <60% flagged |
| Date/timeframe | Context metadata | >90% | N/A |

### Questions for BluSpecs

- [ ] Are documents structured (templates) or freeform?
- [ ] What languages are documents in?
- [ ] Are there existing metadata or tags?
- [ ] Can we get document history (versioning)?

### Mapping Notes

*Space for notes during meeting:*

---

---

## 4. Source: PATSTAT

### Patent Data Fields

| PATSTAT Field | Platform Field | Transformation | Status |
|---------------|----------------|----------------|--------|
| `appln_title` | `patents.title` | Direct | ⬜ TBC |
| `appln_filing_date` | `patents.filing_date` | Date format | ⬜ TBC |
| `applicant_name` | `patents.applicant` | Normalize | ⬜ TBC |
| `cpc_class_symbol` | `patents.cpc_codes` | Array | ⬜ TBC |
| `cited_appln_id` | Citation count | Aggregate | ⬜ TBC |
| `appln_auth` | `patents.jurisdiction` | Map country | ⬜ TBC |

### CPC Classifications to Track

| CPC Code | Technology Area | Quadrant |
|----------|-----------------|----------|
| Y02E | Energy | Energy & Storage |
| Y02P | Manufacturing | Manufacturing |
| Y02W | Waste | Materials & Chemistry |
| C08J | Polymers | Materials & Chemistry |
| G06N | AI/ML | Digital & AI |
| B33Y | 3D Printing | Manufacturing |
| H01M | Batteries | Energy & Storage |
| *Add more during meeting* | | |

### Questions for BluSpecs

- [ ] PATSTAT access method: API, bulk download, or service provider?
- [ ] Which years of data do we need?
- [ ] EU patents only or global?
- [ ] How to handle patent families (avoid double-counting)?

### Mapping Notes

*Space for notes during meeting:*

---

---

## 5. Source: Public Data

### Additional Data Sources

| Source | Data Type | Access Method | Frequency |
|--------|-----------|---------------|-----------|
| Horizon Europe | EU project funding | CORDIS API | Monthly |
| OpenAlex | Publications | API | Weekly |
| GitHub | Open source activity | API | Weekly |
| News sources | Trend signals | RSS/API | Daily |

### Questions for BluSpecs

- [ ] Which public sources are priorities?
- [ ] Any existing data partnerships?
- [ ] Restrictions on certain data types?

---

## 6. Technology Taxonomy Mapping

### Quadrant Definitions

| Quadrant | Definition | Keywords | Example Technologies |
|----------|------------|----------|---------------------|
| **Materials & Chemistry** | Physical materials, chemical processes, sustainable materials | polymer, composite, bio-based, recycling, chemistry | ⬜ TBC |
| **Digital & AI** | Software, data, automation, intelligence | AI, ML, IoT, blockchain, digital twin | ⬜ TBC |
| **Energy & Storage** | Power generation, storage, efficiency | battery, solar, hydrogen, grid, efficiency | ⬜ TBC |
| **Manufacturing** | Production processes, equipment, logistics | 3D printing, robotics, automation, logistics | ⬜ TBC |

### Maturity Ring Criteria

| Ring | Composite Score | TRL Range | Description |
|------|-----------------|-----------|-------------|
| **Adopt** | 7.5 - 9.0 | TRL 7-9 | Market-ready, proven at scale |
| **Trial** | 5.0 - 7.4 | TRL 5-7 | Worth experimenting with |
| **Assess** | 3.0 - 4.9 | TRL 3-5 | Worth watching, early stage |
| **Hold** | 0.0 - 2.9 | TRL 1-3 | Research phase, not ready |

---

## 7. Composite Score Calculation

### Score Components

| Dimension | Weight | Inputs | Source |
|-----------|--------|--------|--------|
| **TRL Score** | 25% | Expert assessment, AI detection, deployment evidence | CEI docs |
| **Market Score** | 25% | Funding (30%), Companies (25%), Deployments (25%), Growth (20%) | Dealroom |
| **Innovation Score** | 25% | Patents (35%), Publications (25%), Open Source (20%), EU Projects (20%) | PATSTAT, Public |
| **EU Alignment** | 25% | Policy mentions, Horizon funding, IPCEI inclusion | CEI docs, CORDIS |

### Normalization Rules

| Input Metric | Normalization Method | Scale |
|--------------|---------------------|-------|
| Funding amount | Log scale, percentile | 0-9 |
| Company count | Percentile ranking | 0-9 |
| Patent count | Percentile ranking | 0-9 |
| TRL assessment | Direct mapping | 1-9 |

### Questions for BluSpecs

- [ ] Are these weights appropriate?
- [ ] Any dimensions to add/remove?
- [ ] How to handle missing data points?

---

## 8. Data Quality Considerations

### Quality Checks

| Check | Rule | Action if Failed |
|-------|------|------------------|
| Completeness | >80% required fields | Flag for manual entry |
| Freshness | <6 months old | Mark as stale |
| Consistency | Cross-source validation | Flag discrepancies |
| Accuracy | Confidence score | Manual review queue |

### Known Data Gaps (To Be Identified)

| Gap | Impact | Mitigation |
|-----|--------|------------|
| *Identify during meeting* | | |
| | | |
| | | |

---

## 9. Data Refresh Strategy

### Refresh Schedule

| Data Source | Frequency | Method | Trigger |
|-------------|-----------|--------|---------|
| Dealroom | Weekly | Scheduled job | Auto |
| CEI Documents | On upload | Event-driven | Manual |
| PATSTAT | Monthly | Batch import | Admin |
| Public Sources | Weekly | Scheduled job | Auto |

### Manual Override

- Admin can trigger full refresh anytime
- Individual technology manual update available
- Audit log for all changes

---

## 10. Action Items from Mapping Session

| Item | Owner | Due Date | Status |
|------|-------|----------|--------|
| | | | ⬜ |
| | | | ⬜ |
| | | | ⬜ |
| | | | ⬜ |
| | | | ⬜ |

---

## Appendix: Sample Technology Mapping Exercise

*Complete during meeting with 5 sample technologies:*

### Technology 1: [Name]

| Attribute | Value | Source | Confidence |
|-----------|-------|--------|------------|
| Quadrant | | | |
| TRL | | | |
| Key Companies | | | |
| Patent Activity | | | |
| EU Alignment | | | |

### Technology 2: [Name]

| Attribute | Value | Source | Confidence |
|-----------|-------|--------|------------|
| Quadrant | | | |
| TRL | | | |
| Key Companies | | | |
| Patent Activity | | | |
| EU Alignment | | | |

*(Repeat for 3 more technologies)*

---

*Document Version: 1.0*  
*Created: December 21, 2024*  
*Purpose: Working document for data mapping session*
