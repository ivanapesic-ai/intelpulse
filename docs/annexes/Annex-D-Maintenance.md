# Annex D: Maintenance Model
## AI-CE Heatmap Platform - Support & Operations

---

## 1. Maintenance Overview

This document outlines the support and maintenance model for the AI-CE Heatmap platform following initial delivery. The maintenance period is structured to ensure platform stability while establishing sustainable ongoing operations.

---

## 2. Included Maintenance Period

### Duration: 6 Months Post-Launch

**Start Date:** Upon production deployment sign-off
**End Date:** 6 months from start date

### What's Included

| Category | Coverage |
|----------|----------|
| **Bug Fixes** | Resolution of defects in delivered functionality |
| **Security Patches** | Critical security updates and vulnerability fixes |
| **Platform Updates** | Compatibility updates for underlying infrastructure |
| **Minor Adjustments** | Small UI/UX tweaks (< 2 hours each, up to 10 total) |
| **Email Support** | Response within 2 business days |
| **1 Data Refresh** | One complete data refresh cycle at month 3 |

### What's NOT Included

| Category | Notes |
|----------|-------|
| New Features | Requires separate scope and quote |
| Additional Data Sources | Beyond those specified in initial scope |
| Custom Integrations | New API integrations or connections |
| Extended Support Hours | 24/7 or weekend support |
| On-site Support | All support provided remotely |
| User Training | Beyond initial documentation |

---

## 3. Data Refresh Cycle

### Included Refresh (Month 3)

One complete data refresh is included in the initial delivery, scheduled approximately 3 months post-launch.

**Refresh Process:**

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        DATA REFRESH WORKFLOW                                │
└─────────────────────────────────────────────────────────────────────────────┘

Week -1: Preparation
├── Notify BluSpecs of upcoming refresh
├── Request updated CEI documents (if any)
├── Verify API access credentials
└── Backup current database

Week 0: Execution
├── Admin triggers refresh via panel
├── Dealroom API pull (automated)
├── PATSTAT/EPO import (if updated)
├── CEI document processing (if new docs)
└── Public sources refresh

Week 0-1: Validation
├── Review data quality metrics
├── Spot-check score calculations
├── Verify visualization updates
└── Address any import errors

Week 1: Completion
├── Notify BluSpecs of completion
├── Provide refresh summary report
└── Document any issues encountered
```

### Additional Refresh Cycles

Beyond the included refresh, additional cycles can be purchased:

| Service | Cost | Includes |
|---------|------|----------|
| **Standard Refresh** | €1,500 | Full data refresh from all sources |
| **Expedited Refresh** | €2,000 | Completed within 1 week |
| **Partial Refresh** | €750 | Single source update only |

**Recommended Cadence:** Quarterly (every 3 months) for optimal data currency

---

## 4. Support Channels

### Primary Support

| Channel | Response Time | Availability |
|---------|---------------|--------------|
| **Email** | 2 business days | Mon-Fri, 9am-6pm CET |

**Support Email:** [To be provided at project start]

### Issue Classification

| Priority | Definition | Response | Resolution Target |
|----------|------------|----------|-------------------|
| **Critical** | Platform completely unavailable | 4 hours | 24 hours |
| **High** | Major feature broken, no workaround | 8 hours | 3 business days |
| **Medium** | Feature impaired but usable | 2 business days | 5 business days |
| **Low** | Minor issue, cosmetic | 5 business days | Next release |

### Escalation Path

```
1. Initial Support Request → Support Email
                ↓
2. If Critical → Phone escalation (number provided at handover)
                ↓
3. If Unresolved (3 days) → Project Lead involvement
                ↓
4. If Unresolved (5 days) → Executive escalation
```

---

## 5. Ongoing Costs (Post-Maintenance)

### Infrastructure Costs

| Item | Estimated Cost | Billed By |
|------|----------------|-----------|
| **Lovable Cloud Hosting** | €25-50/month | Lovable |
| **Database Storage** | Included up to 500MB | Lovable |
| **Edge Function Invocations** | Included (standard tier) | Lovable |
| **File Storage** | €0.02/GB/month (beyond 1GB) | Lovable |

**Note:** Costs scale with usage. Estimates based on expected 100-500 users.

### Extended Maintenance Options

| Option | Cost | Coverage |
|--------|------|----------|
| **Basic Maintenance** | €300/month | Bug fixes, security patches, email support |
| **Standard Maintenance** | €500/month | Basic + 1 data refresh/quarter + priority support |
| **Premium Maintenance** | €800/month | Standard + 4 hours/month minor enhancements |

### Data Source Subscriptions

| Source | Estimated Cost | Notes |
|--------|----------------|-------|
| **Dealroom API** | Varies by tier | BluSpecs responsibility |
| **PATSTAT** | €100-500/year | Depending on access level |
| **EU Horizon** | Free | Public API |
| **GitHub API** | Free (within limits) | Public API |
| **arXiv API** | Free | Public API |

---

## 6. Handover Documentation

### Delivered at Project Completion

| Document | Contents |
|----------|----------|
| **Admin Guide** | User management, data refresh procedures, troubleshooting |
| **Technical Documentation** | Architecture overview, database schema, API documentation |
| **Deployment Guide** | How the system is deployed, environment configuration |
| **Runbook** | Common issues and resolutions |
| **Methodology Guide** | Scoring framework, data source details |

### System Access

At handover, BluSpecs will receive:

- Admin account credentials
- Documentation repository access
- Support contact information
- Emergency escalation procedures

---

## 7. Service Level Indicators

### Availability Target

| Metric | Target |
|--------|--------|
| **Platform Uptime** | 99.5% monthly |
| **Planned Downtime** | Max 4 hours/month (notified 48h in advance) |
| **Data Freshness** | Updated within 1 week of refresh trigger |

### Performance Targets

| Metric | Target |
|--------|--------|
| **Page Load Time** | < 3 seconds (standard connection) |
| **API Response Time** | < 500ms (p95) |
| **Export Generation** | < 30 seconds (PDF report) |

---

## 8. Transition to Extended Support

### 30 Days Before Maintenance Ends

1. **Review Meeting**: Assess platform performance, outstanding issues
2. **Renewal Decision**: Confirm extended maintenance option
3. **Documentation Update**: Refresh any outdated guides
4. **Knowledge Transfer**: Ensure BluSpecs team is self-sufficient for basic operations

### If No Extended Maintenance

- All documentation remains accessible
- Platform continues to operate on infrastructure
- No bug fixes or support after maintenance period
- Data refresh must be managed by BluSpecs or contracted separately

---

## 9. Future Enhancement Options

### Potential Phase 2 Additions

| Enhancement | Estimated Cost | Description |
|-------------|----------------|-------------|
| **Multi-Sphere Expansion** | €8,000-12,000 | Add additional technology spheres |
| **Automated Data Polling** | €3,000-5,000 | Scheduled refreshes instead of manual |
| **Custom Analytics Dashboard** | €5,000-8,000 | Advanced reporting beyond standard exports |
| **API Access for Clients** | €4,000-6,000 | Programmatic access for premium users |
| **White-Label Options** | €3,000-5,000 | Custom branding for enterprise clients |

### Request Process

1. Submit enhancement request via support email
2. Receive scope assessment and quote within 5 business days
3. Approve quote and timeline
4. Development and delivery per agreed schedule

---

## 10. Contact Information

**Support Email:** [Provided at project start]

**Emergency Contact:** [Phone number provided at handover]

**Project Documentation:** [Repository link provided at handover]

---

*This maintenance model ensures platform stability while providing clear pathways for ongoing support and future enhancements.*
