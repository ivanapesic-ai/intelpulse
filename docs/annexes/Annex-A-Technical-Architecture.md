# Annex A: Technical Approach & Methodology

Architecture, AI layers, scoring framework

---

## System Architecture

The AI-CE Heatmap Platform follows a modern cloud-native architecture designed for security, scalability, and EU data residency compliance. The system implements a three-tier user model where Public Visitors access limited demo data, Premium Clients receive full platform capabilities with regular data updates, and Administrators manage users, data sources, and platform configuration.

The React frontend communicates exclusively through the Lovable Cloud backend, which enforces Row-Level Security (RLS) policies at the database level. This ensures that users only see data appropriate to their access tier. The AI Intelligence Layer operates as a separate processing pipeline, triggered by Edge Functions to handle document parsing, TRL assessment, and trend analysis.

**Key architectural decisions:**
- **Three-tier user model:** Public visitors see limited demo data, premium clients access full features, administrators manage the platform
- **AI Intelligence Layer:** Powered by Lovable AI Gateway for document processing, TRL assessment, and trend analysis
- **EU-hosted backend:** All data stored in AWS Frankfurt (eu-central-1) for GDPR compliance

> 📊 **[Diagram: System Architecture]** — See interactive version at `/mockups/annex-a`

---

## 4-Layer AI Architecture

The platform employs a sophisticated 4-layer AI architecture inspired by production intelligence systems. This design separates concerns and enables independent scaling of each layer.

**Layer 1 — Data Ingestion** handles API connectors (Dealroom), document parsers (PDF/PPT from CEI internal sources), and data normalizers that transform heterogeneous inputs into a unified schema.

**Layer 2 — Intelligence Engine** performs entity extraction (identifying technology mentions), classification (mapping to taxonomy), and TRL detection (assessing readiness levels from contextual signals).

**Layer 3 — Analysis & Synthesis** executes trend detection (momentum and trajectory), pattern recognition (cross-technology correlations), and signal detection (early indicators of emerging technologies).

**Layer 4 — Presentation** renders the processed intelligence through the Technology Radar, Heatmap Matrix, and Analytics dashboards, each optimized for different decision-making contexts.

> 📊 **[Diagram: 4-Layer AI Architecture]** — See interactive version at `/mockups/annex-a`

---

## 4-Dimension Scoring & Radar Placement

Technologies are evaluated across four equally-weighted dimensions, each normalized to a 0-9 scale before computing the composite score.

**TRL Score (25%)** — Technology Readiness Level based on EU Horizon framework, combining expert assessment, AI-detected indicators, and deployment evidence.

**Market Score (25%)** — Commercial viability calculated from funding activity (30%), company count (25%), production deployments (25%), and growth rate (20%).

**Innovation Score (25%)** — R&D intensity derived from patent filings (35%), academic publications (25%), open source activity (20%), and EU research project participation (20%).

**EU Alignment (25%)** — Strategic fit with European priorities based on policy document mentions, Horizon Europe funding, and IPCEI inclusion.

The composite score directly determines radar ring placement, providing actionable guidance: Adopt (deploy now), Trial (pilot projects), Assess (monitor closely), or Hold (wait for maturity).

> 📊 **[Diagram: 4-Dimension Scoring & Radar Placement]** — See interactive version at `/mockups/annex-a`

---

## Data Pipeline

The data pipeline implements an ETL (Extract-Transform-Load) flow optimized for heterogeneous data sources. External sources include structured APIs (Dealroom), semi-structured files (PATSTAT CSV), and unstructured documents (CEI PowerPoints and PDFs).

The Ingestion stage handles authentication, rate limiting, and initial validation. Normalization transforms source-specific schemas into the platform's unified data model. AI Enrichment adds derived fields including entity tags, TRL assessments, and confidence scores. The Scoring Engine computes all four dimension scores and the composite score. Finally, results are persisted to PostgreSQL and propagated to visualization layers.

Data refresh is triggered manually via admin interface, with full audit logging of each refresh cycle.

> 📊 **[Diagram: Data Pipeline]** — See interactive version at `/mockups/annex-a`

---

## Technology Stack

The platform leverages modern, production-ready technologies optimized for rapid development and EU compliance.

| Layer | Technology |
|-------|------------|
| Frontend | React 18 + TypeScript + Vite |
| Visualization | Recharts + Custom SVG |
| Backend | Lovable Cloud (PostgreSQL + RLS) |
| AI/ML | Lovable AI Gateway |
| Hosting | EU Region (AWS Frankfurt) |

---

## TRL Scale (EU Horizon)

Technology Readiness Levels follow the EU Horizon Europe framework, providing a standardized measure of technology maturity from basic research through proven deployment.

| Level | Phase | Description |
|-------|-------|-------------|
| 1-3 | Research | Basic principles → Proof of concept |
| 4-6 | Development | Lab validation → Prototype demo |
| 7-9 | Deployment | Operational demo → Proven system |

---

## Radar Rings

Each ring represents an actionable recommendation based on the technology's composite score, guiding strategic decision-making.

| Ring | Score Range | Action |
|------|-------------|--------|
| 🟢 Adopt | 7.5 - 9.0 | Ready for production deployment |
| 🔵 Trial | 5.0 - 7.4 | Suitable for pilot projects |
| 🟡 Assess | 3.0 - 4.9 | Worth monitoring closely |
| 🔴 Hold | 0.0 - 2.9 | Not ready for adoption |

---

## Composite Score Formula

The composite score provides a balanced assessment by weighting all four dimensions equally. Each dimension is normalized to a 0-9 scale before applying weights, ensuring comparability across different data sources and measurement units.

```
Score = (TRL × 0.25) + (Market × 0.25) + (Innovation × 0.25) + (EU × 0.25)
```
