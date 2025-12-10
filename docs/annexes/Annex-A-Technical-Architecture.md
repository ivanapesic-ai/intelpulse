# Annex A: Technical Approach & Methodology

Architecture, AI capabilities, scoring framework

---

## System Architecture

The AI-CE Heatmap Platform follows a modern cloud-native architecture designed for security, scalability, and EU data residency compliance. The system implements a three-tier user model where Public Visitors access limited demo data, Premium Clients receive full platform capabilities with regular data updates, and Administrators manage users, data sources, and platform configuration.

The React frontend communicates exclusively through the Lovable Cloud backend, which enforces Row-Level Security (RLS) policies at the database level. This ensures that users only see data appropriate to their access tier. The AI Intelligence Layer operates as a separate processing pipeline, triggered by Edge Functions to handle document parsing, TRL assessment, and trend analysis.

All data is stored and processed within EU jurisdiction (AWS Frankfurt) ensuring GDPR compliance and meeting public sector data residency requirements.

**Key architectural decisions:**
- **Three-tier user model:** Public visitors see limited demo data, premium clients access full features, administrators manage the platform
- **AI Intelligence Layer:** Powered by Lovable AI Gateway for document processing, TRL assessment, and trend analysis
- **EU-hosted backend:** All data stored in AWS Frankfurt (eu-central-1) for GDPR compliance

> 📊 **[Diagram: System Architecture]** — See interactive version at `/mockups/annex-a`

---

## 4-Layer AI Architecture

The platform employs a sophisticated 4-layer AI architecture inspired by production intelligence systems. This design separates concerns and enables independent scaling of each layer.

**Layer 1 — Data Ingestion** handles API connectors (Dealroom REST API), document parsers (PDF/PPT from CEI internal sources), CSV processors (PATSTAT patent data), and data normalizers that transform heterogeneous inputs into a unified schema.

**Layer 2 — Intelligence Engine** performs entity extraction (identifying technology mentions using NLP), classification (mapping to Cloud-Edge-IoT-AI taxonomy), and TRL detection (assessing readiness levels from contextual signals in documents).

**Layer 3 — Analysis & Synthesis** executes trend detection (momentum and trajectory over time), pattern recognition (cross-technology correlations and clusters), and signal detection (early indicators of emerging technologies before mainstream recognition).

**Layer 4 — Presentation** renders the processed intelligence through the Technology Radar, Heatmap Matrix, and Analytics dashboards, each optimized for different decision-making contexts.

> 📊 **[Diagram: 4-Layer AI Architecture]** — See interactive version at `/mockups/annex-a`

---

## AI-Powered Document Intelligence

A key differentiator of the platform is its ability to extract structured intelligence from unstructured documents. The CEI internal datasets are provided as PowerPoint presentations and PDF reports rather than structured data—our AI layer transforms these into actionable technology assessments.

**Document Parsing** — The system processes PDF reports, PowerPoint presentations, and other document formats using advanced parsing techniques. Layout analysis preserves document structure, tables, and embedded diagrams.

**Entity Recognition** — Natural Language Processing (NLP) identifies technology mentions, company names, funding amounts, deployment locations, and readiness indicators within document text.

**TRL Auto-Detection** — The AI analyzes contextual signals (language patterns, deployment mentions, pilot references) to automatically suggest Technology Readiness Levels, which can be validated by domain experts.

**Confidence Scoring** — Each extracted data point includes a confidence score based on source reliability, extraction method, and corroboration across multiple sources.

> 📊 **[Diagram: AI-Powered Document Intelligence]** — See interactive version at `/mockups/annex-a`

---

## AI Capabilities Summary

The platform leverages advanced AI capabilities to transform heterogeneous data sources into actionable technology intelligence:

| Capability | Description |
|------------|-------------|
| Document Parsing | Extract text, tables, and structure from PDF, PPT, DOCX files |
| Entity Recognition | Identify technologies, companies, locations, and funding mentions |
| TRL Detection | Auto-assess technology readiness from contextual language patterns |
| Trend Analysis | Detect momentum shifts and trajectory changes over time |
| Pattern Recognition | Identify technology clusters and cross-domain correlations |
| Signal Detection | Early warning indicators for emerging technologies |

---

## 4-Dimension Scoring Methodology

Technologies are evaluated across four equally-weighted dimensions, each normalized to a 0-9 scale before computing the composite score. This methodology ensures balanced, multi-perspective assessment.

**TRL Score (25%)** — Technology Readiness Level based on EU Horizon Europe framework, combining expert assessment, AI-detected indicators from documents, and deployment evidence from data sources.

**Market Score (25%)** — Commercial viability calculated from funding activity (30%), company count (25%), production deployments (25%), and growth rate (20%). Primary data source: Dealroom API.

**Innovation Score (25%)** — R&D intensity derived from patent filings (35%), academic publications (25%), open source activity (20%), and EU research project participation (20%). Primary data source: PATSTAT.

**EU Alignment (25%)** — Strategic fit with European priorities based on policy document mentions, Horizon Europe funding allocation, and IPCEI (Important Projects of Common European Interest) inclusion.

The composite score directly determines radar ring placement, providing actionable guidance for technology adoption decisions.

> 📊 **[Diagram: 4-Dimension Scoring Methodology]** — See interactive version at `/mockups/annex-a`

---

## Data Pipeline & Integration

The data pipeline implements an ETL (Extract-Transform-Load) flow optimized for heterogeneous data sources. This architecture handles structured APIs, semi-structured files, and unstructured documents through a unified processing framework.

**External Sources** — Dealroom API (company and funding data), PATSTAT CSV exports (patent filings), and CEI internal documents (strategic assessments and reports).

**Ingestion** — Handles API authentication, rate limiting, file parsing, and initial validation. Each source has dedicated connectors with error handling and retry logic.

**Normalization** — Transforms source-specific schemas into the platform's unified data model. Entity resolution links technologies across sources.

**AI Enrichment** — Adds derived fields including entity tags, TRL assessments, trend indicators, and confidence scores using the AI Intelligence Layer.

**Scoring Engine** — Computes all four dimension scores and the composite score based on the scoring methodology.

Data refresh is triggered manually via admin interface with full audit logging of each refresh cycle.

> 📊 **[Diagram: Data Pipeline]** — See interactive version at `/mockups/annex-a`

---

## Technology Stack

The platform leverages modern, production-ready technologies optimized for rapid development, scalability, and EU compliance.

| Layer | Technology | Purpose |
|-------|------------|---------|
| Frontend | React 18 + TypeScript + Vite | Modern, type-safe UI with fast development iteration |
| Visualization | Recharts + Custom SVG | Interactive charts and custom radar/heatmap components |
| Backend | Lovable Cloud (PostgreSQL + RLS) | Managed database with row-level security policies |
| AI/ML | Lovable AI Gateway | Document processing, NLP, entity extraction, TRL detection |
| Edge Functions | Deno Runtime | Serverless API endpoints and data processing triggers |
| Hosting | EU Region (AWS Frankfurt) | GDPR compliance and EU data residency |

---

## TRL Scale (EU Horizon Europe)

Technology Readiness Levels follow the EU Horizon Europe framework, providing a standardized measure of technology maturity from basic research through proven deployment.

| Level | Phase | Description |
|-------|-------|-------------|
| 1-3 | Research | Basic principles → Proof of concept |
| 4-6 | Development | Lab validation → Prototype demo |
| 7-9 | Deployment | Operational demo → Proven system |

---

## Radar Rings & Actions

Each ring represents an actionable recommendation based on the technology's composite score, guiding strategic decision-making.

| Ring | Score Range | Action |
|------|-------------|--------|
| Adopt | 7.5 - 9.0 | Ready for production deployment |
| Trial | 5.0 - 7.4 | Suitable for pilot projects |
| Assess | 3.0 - 4.9 | Worth monitoring closely |
| Hold | 0.0 - 2.9 | Not ready for adoption |

---

## Composite Score Formula

The composite score provides a balanced assessment by weighting all four dimensions equally. Each dimension is normalized to a 0-9 scale before applying weights, ensuring comparability across different data sources and measurement units.

```
Score = (TRL × 0.25) + (Market × 0.25) + (Innovation × 0.25) + (EU × 0.25)
```
