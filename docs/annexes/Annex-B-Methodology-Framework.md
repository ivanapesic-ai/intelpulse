# Annex B: Methodology Framework

## Technology Readiness Level (TRL)

Based on the EU Horizon Europe TRL scale:

| TRL | Name | Score |
|-----|------|-------|
| TRL 9 | Actual system proven in operational environment | 9.0 |
| TRL 8 | System complete and qualified | 8.0 |
| TRL 7 | System prototype demonstrated | 7.0 |
| TRL 6 | Technology demonstrated in relevant environment | 6.0 |
| TRL 5 | Technology validated in relevant environment | 5.0 |
| TRL 4 | Technology validated in laboratory | 4.0 |
| TRL 3 | Experimental proof of concept | 3.0 |
| TRL 2 | Technology concept formulated | 2.0 |
| TRL 1 | Basic principles observed | 1.0 |

---

## Maturity Scoring Framework

| Dimension | Weight | Data Source |
|-----------|--------|-------------|
| Technology Readiness Level (TRL) | 25% | Expert assessment + AI assist |
| Market Adoption | 25% | Dealroom funding/company data |
| Innovation Activity | 25% | PATSTAT patent filings |
| EU Strategic Alignment | 25% | CEI policy documents |

---

## Composite Score Calculation

```
Overall Score = (TRL × 0.25) + (Market Adoption × 0.25) + (Innovation Activity × 0.25) + (EU Alignment × 0.25)
```

Each dimension is normalized to a 0-9 scale before applying weights.

---

## Radar Chart Placement

| Overall Score | Radar Ring | Recommendation |
|---------------|------------|----------------|
| 7.5 - 9.0 | **Adopt** | Ready for production deployment |
| 5.0 - 7.4 | **Trial** | Suitable for pilot projects |
| 3.0 - 4.9 | **Assess** | Worth exploring and monitoring |
| 0.0 - 2.9 | **Hold** | Monitor development, not ready for adoption |

---

## Confidence Levels

| Level | Criteria |
|-------|----------|
| **High** | 3+ data sources agree, recent data (< 6 months) |
| **Medium** | 2 data sources, data within 12 months |
| **Low** | Single source or data > 12 months old |

Confidence levels are displayed alongside maturity scores to indicate data reliability.

---

## Data Source Mapping

### TRL Assessment
- Primary: Expert input from BluSpecs domain specialists
- Secondary: AI-assisted extraction from technical documentation
- Validation: Cross-reference with patent and publication data

### Market Adoption
- Primary: Dealroom API (funding rounds, company valuations)
- Secondary: Public market research reports
- Metrics: Number of companies, total funding, growth rate

### Innovation Activity
- Primary: PATSTAT/EPO patent filings
- Secondary: arXiv publications, GitHub activity
- Metrics: Patent count, citation index, publication velocity

### EU Strategic Alignment
- Primary: CEI policy documents and priorities
- Secondary: EU Horizon Europe program alignment
- Metrics: Policy mention frequency, funding program fit
