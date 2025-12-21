# Data Requirements Questionnaire

**Project:** AI-CE Heatmap Platform  
**Purpose:** Gather detailed information about data sources for integration planning  
**To be discussed:** January 8, 2025 Kickoff Meeting

---

## 1. Dealroom API

### Access & Authentication

| Question | Answer |
|----------|--------|
| Do we have API access credentials? | |
| What authentication method is used? (API key, OAuth, etc.) | |
| Are there rate limits? If so, what are they? | |
| Is there a sandbox/test environment available? | |
| Who is the technical contact at Dealroom? | |

### Data Availability

| Question | Answer |
|----------|--------|
| What company fields are available? (name, description, funding, employees, etc.) | |
| Can we filter by industry/sector relevant to ML-SDV? | |
| Is funding round history available? | |
| Are there geographic filters? | |
| Is technology stack information available? | |
| How frequently is the data updated? | |

### Data Volume

| Question | Answer |
|----------|--------|
| Approximately how many companies are relevant to ML-SDV sphere? | |
| Is there a maximum number of records per request? | |
| Are there any usage quotas (monthly/annual)? | |

### Sample Request

Could you provide a sample API response for a company query? This helps us understand the exact data structure.

---

## 2. CEI Documents

### Document Inventory

| Question | Answer |
|----------|--------|
| How many documents are in scope? | |
| What types of documents? (reports, position papers, meeting notes, etc.) | |
| What file formats? (PDF, Word, HTML, etc.) | |
| What is the date range of documents? | |
| Are they publicly available or confidential? | |

### Document Structure

| Question | Answer |
|----------|--------|
| Do documents follow a consistent structure/template? | |
| Are there metadata fields? (date, author, category, etc.) | |
| What languages are the documents in? | |
| Average document length? | |

### Content Extraction

| Question | Answer |
|----------|--------|
| What specific information should we extract? | |
| Are there technology mentions we should identify? | |
| Should we extract recommendations or conclusions? | |
| Are there specific sections to prioritize? | |

### Access Method

| Question | Answer |
|----------|--------|
| How will documents be provided? (API, file share, email, etc.) | |
| Is there a document management system in use? | |
| Will new documents be added regularly? | |
| How should we receive document updates? | |

### Sample Documents

Please provide 5-10 sample documents representing the variety of document types. Ideally:
- [ ] 2-3 strategic/policy documents
- [ ] 2-3 technical reports
- [ ] 2-3 meeting summaries or position papers
- [ ] Examples in different formats if applicable

---

## 3. Future Data Sources (Phase 2+)

> **Note:** The following data sources are planned for future phases, not MVP.

### PATSTAT / Patent Data

| Question | Answer |
|----------|--------|
| Do you have existing PATSTAT access? | |
| Is patent data a priority for Phase 2? | |
| Any alternative patent data sources to consider? | |

### Other Potential Sources

| Question | Answer |
|----------|--------|
| What other data sources might be valuable post-MVP? | |
| Any internal databases or spreadsheets to consider? | |

---

## 4. Technology Taxonomy

### Quadrant Structure

| Question | Answer |
|----------|--------|
| Are the 4 quadrants confirmed? (Sensing, Processing, Acting, Enabling) | |
| Are there sub-categories within quadrants? | |
| Is there overlap between quadrants? How handled? | |
| Should technologies be able to appear in multiple quadrants? | |

### Maturity Levels

| Question | Answer |
|----------|--------|
| Are the 5 maturity levels confirmed? | |
| What criteria define each maturity level? | |
| Who determines a technology's maturity level? | |
| Can maturity change over time? (tracking needed?) | |

### Technology Entries

| Question | Answer |
|----------|--------|
| What constitutes a "technology"? (granularity) | |
| Who will define the initial technology list? | |
| Expected number of technologies at launch? | |
| Will technologies be added post-launch? By whom? | |

### Scoring Methodology

| Question | Answer |
|----------|--------|
| How should the composite score be calculated? | |
| What weights for each data source? (Dealroom, CEI docs, manual entry) | |
| Should scores be normalized? Scale? | |
| How often should scores be recalculated? | |

---

## 5. User Access & Permissions

### Access Tiers

| Question | Answer |
|----------|--------|
| What features are Public vs Premium? | |
| How will Premium users be created? (invite-only, self-register, etc.) | |
| How many Premium users expected at launch? | |
| Are there different Premium levels? | |

### Admin Users

| Question | Answer |
|----------|--------|
| Who are the Admin users? | |
| What data can Admins modify? | |
| Should there be an audit log? | |
| Multi-admin approval workflows needed? | |

---

## 6. Additional Data Sources

### Current

| Question | Answer |
|----------|--------|
| Are there any other data sources not yet discussed? | |
| Internal databases or spreadsheets to migrate? | |
| External APIs or services to integrate? | |

### Future (Out of Scope but Good to Know)

| Question | Answer |
|----------|--------|
| What data sources might be added in future phases? | |
| Any planned integrations we should architect for? | |

---

## 7. Data Quality & Governance

### Data Ownership

| Question | Answer |
|----------|--------|
| Who owns the data in the platform? | |
| Are there licensing restrictions on any data? | |
| Can data be exported by users? | |
| Data retention requirements? | |

### Data Quality

| Question | Answer |
|----------|--------|
| Who is responsible for data accuracy? | |
| Process for correcting errors? | |
| Frequency of data validation/audit? | |

---

## Summary Checklist

Before Phase 2 begins, we need:

### From BluSpecs

- [ ] Dealroom API credentials and documentation
- [ ] 5-10 sample CEI documents
- [ ] Confirmed technology taxonomy (quadrants, maturity levels)
- [ ] List of 20+ seed technologies for testing
- [ ] Confirmed access tier feature split
- [ ] Designated Admin users

### Decisions Needed

- [ ] Scoring methodology weights
- [ ] Data refresh frequency
- [ ] Export permission scope
- [ ] Audit log requirements

---

*Document Version: 1.0*  
*Created: December 21, 2024*  
*To be completed during: Kickoff Meeting January 8, 2025*
