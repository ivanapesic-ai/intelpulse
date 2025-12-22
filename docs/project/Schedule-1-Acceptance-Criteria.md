# Schedule 1: Project Deliverables and Acceptance Criteria

**Agreement Reference:** AI-CE Heatmap Platform Service Agreement  
**Parties:** House Eleven Oy (Provider) and BluSpecs (Client)  
**Effective Date:** January 8, 2026

---

## 1. Overview

This Schedule defines the specific deliverables and acceptance criteria for the AI-CE Heatmap Platform development project.

---

## 2. Phase 1: Design Sprint & Data Workshop

**Duration:** Weeks 1-2 (January 8-21, 2026)

### Deliverables

| ID | Deliverable | Description |
|----|-------------|-------------|
| 1.1 | Project Charter | Documented scope, objectives, and success criteria |
| 1.2 | Data Schema Specification | Complete data model for all technology entities |
| 1.3 | UI/UX Design Package | Final mockups for all key screens |
| 1.4 | Technology Taxonomy | Agreed quadrant structure and maturity levels |

### Acceptance Criteria

- [ ] **1.1** Project charter reviewed and signed by both parties
- [ ] **1.2** Data schema covers: technologies, companies, patents, scores, users
- [ ] **1.3** Mockups include: Dashboard, Radar, Heatmap, Admin, Technology Profile
- [ ] **1.4** Taxonomy includes 4+ quadrants with 5 maturity levels each
- [ ] **1.4** At least 20 sample technologies categorized for validation

### Client Dependencies

- Provide domain expertise for taxonomy definition
- Provide sample data from each source (Dealroom, CEI)
- Designate decision-maker for design approval

---

## 3. Phase 2: Foundation & Core Infrastructure

**Duration:** Weeks 3-4 (January 22 - February 4, 2026)

### Deliverables

| ID | Deliverable | Description |
|----|-------------|-------------|
| 2.1 | Database Implementation | Production-ready schema with security policies |
| 2.2 | Authentication System | Multi-tier access (Public/Premium/Admin) |
| 2.3 | Admin Panel MVP | User management and basic data operations |
| 2.4 | API Layer | RESTful endpoints for all data operations |

### Acceptance Criteria

- [ ] **2.1** Database schema matches approved specification
- [ ] **2.1** Row-Level Security (RLS) policies implemented for all tables
- [ ] **2.2** Email/password authentication functional
- [ ] **2.2** Access tier restrictions enforced correctly
- [ ] **2.3** Admin can: create users, assign roles, view audit log
- [ ] **2.4** API endpoints documented and tested

### Demonstration

- Live demo of admin creating a Premium user
- Verification that Public users cannot access Premium features
- Database security audit results

---

## 4. Phase 3: Visualization Development

**Duration:** Weeks 5-6 (February 5-18, 2026)

### Deliverables

| ID | Deliverable | Description |
|----|-------------|-------------|
| 3.1 | Technology Radar | Interactive circular quadrant visualization |
| 3.2 | Heatmap Matrix | Grid view with color-coded maturity levels |
| 3.3 | Technology Profiles | Detailed view with scores and metadata |
| 3.4 | Filter System | Domain, maturity, score, and text search |
| 3.5 | Responsive Design | Mobile and tablet compatibility |

### Acceptance Criteria

- [ ] **3.1** Radar displays technologies in correct quadrants
- [ ] **3.1** Click interactions reveal technology details
- [ ] **3.2** Heatmap shows all technologies with maturity color coding
- [ ] **3.2** Sorting by any column functional
- [ ] **3.3** Profile shows: name, description, scores, quadrant, maturity
- [ ] **3.4** Filters work independently and in combination
- [ ] **3.4** Filter state persists in URL
- [ ] **3.5** All views functional on screens ≥320px width

### Demonstration

- Navigation through radar and heatmap with sample data
- Filter combination testing
- Mobile device testing

---

## 5. Phase 4: Data Integration & AI Processing

**Duration:** Weeks 7-8 (February 19 - March 4, 2026)

### Deliverables

| ID | Deliverable | Description |
|----|-------------|-------------|
| 4.1 | Dealroom Integration | Company and funding data pipeline |
| 4.2 | CEI Document Parser | AI-powered text extraction |
| 4.3 | Scoring Algorithm | Composite score calculation |
| 4.4 | Data Validation | Quality checks and error handling |

### Acceptance Criteria

- [ ] **4.1** Successfully imports company data from Dealroom API
- [ ] **4.2** Extracts technology mentions from sample CEI documents
- [ ] **4.2** Accuracy ≥80% on provided test documents
- [ ] **4.3** Scores calculated from all available data sources
- [ ] **4.3** Score methodology documented
- [ ] **4.4** Invalid data flagged for admin review

### Client Dependencies

- Dealroom API credentials provided
- Minimum 10 sample CEI documents provided

---

## 6. Phase 5: Polish, Testing & Launch

**Duration:** Weeks 9-10 (March 5-14, 2026)

### Deliverables

| ID | Deliverable | Description |
|----|-------------|-------------|
| 5.1 | Premium Features | Export, trends, citations |
| 5.2 | UAT Completion | All critical bugs resolved |
| 5.3 | Documentation | User guide and admin manual |
| 5.4 | Production Deployment | Live platform on EU infrastructure |
| 5.5 | Handover | Training session and support transition |

### Acceptance Criteria

- [ ] **5.1** PDF export generates valid report
- [ ] **5.1** CSV export includes all visible data
- [ ] **5.2** No critical or high-severity bugs outstanding
- [ ] **5.2** Performance: page load <3s on standard connection
- [ ] **5.3** Documentation covers all user workflows
- [ ] **5.4** Platform accessible via production URL
- [ ] **5.4** SSL certificate installed and valid
- [ ] **5.5** Training session completed with designated admin(s)

### Final Acceptance

Platform acceptance requires:
1. All Phase 5 criteria met
2. Client sign-off on production deployment
3. 5-day acceptance period with no critical issues

---

## 7. Change Management

### Minor Changes
- UI tweaks within approved design
- Bug fixes
- Performance optimizations

### Major Changes
- New features not in original scope
- Additional data source integrations
- Changes to core architecture

### Change Request Process
1. Client submits written change request
2. Provider assesses impact within 3 business days
3. Client approves or withdraws request
4. Timeline adjusted by mutual agreement

---

## 8. Acceptance Process

### Per-Phase Acceptance
1. Provider notifies Client of phase completion
2. Client has 5 business days to review
3. Client provides acceptance or itemized issues
4. Provider addresses issues within 5 business days
5. Repeat until acceptance granted or escalated

### Escalation
If parties cannot agree on acceptance criteria interpretation:
1. Joint technical review meeting
2. If unresolved, independent technical mediator
3. Mediator decision is binding

---

## 9. Signatures

**House Eleven Oy**

Name: _______________________  
Title: _______________________  
Date: _______________________  
Signature: _______________________

**BluSpecs**

Name: _______________________  
Title: _______________________  
Date: _______________________  
Signature: _______________________

---

*Schedule Version: 1.0*  
*Created: December 21, 2025*  
*To be finalized during Kickoff Meeting: January 8, 2026*
