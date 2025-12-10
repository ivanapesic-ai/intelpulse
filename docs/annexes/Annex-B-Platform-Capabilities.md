# Annex B: Platform Capabilities

Document processing, data integration, user features

> **⚠️ Note:** Data source configurations and integration details are preliminary. The final data pipeline will be validated during the design sprint based on actual Dealroom API access level, PATSTAT export format, and CEI document samples provided by BluSpecs.

---

## Overview

The AI-CE Heatmap Platform transforms heterogeneous data sources—structured APIs, semi-structured files, and unstructured documents—into actionable technology intelligence. This annex details the platform's document processing capabilities, data source integrations, and user features by access tier.

---

## Interactive Prototypes

Explore the working prototypes to experience platform capabilities firsthand.

| View | URL | Description |
|------|-----|-------------|
| Technology Radar | `/mockups/radar` | Circular quadrant-based visualization |
| Heatmap Matrix | `/mockups/heatmap` | Grid-based maturity landscape |
| Admin Panel | `/mockups/admin` | User and data management interface |
| Public Demo | `/mockups/public` | Limited public-facing view |

---

## Document Processing Pipeline

The platform's core differentiator is its ability to transform unstructured documents into structured intelligence. CEI internal datasets arrive as PowerPoint presentations and PDF reports rather than structured data—requiring sophisticated AI processing.

**Stage 1: Ingestion** — Documents are uploaded through the admin interface or API. The system identifies file type, extracts metadata, and queues for processing. Supported formats include PDF, PPT/PPTX, DOC/DOCX, and plain text.

**Stage 2: Parsing** — Layout analysis preserves document structure including headings, tables, lists, and embedded diagrams. Text is extracted while maintaining semantic relationships between sections.

**Stage 3: NLP Processing** — Named Entity Recognition (NER) identifies technology mentions, company names, funding amounts, locations, and temporal references. Relationship extraction links entities together.

**Stage 4: Enrichment** — AI models assess Technology Readiness Levels from contextual signals, classify technologies into the Cloud-Edge-IoT-AI taxonomy, and generate confidence scores for each extraction.

**Stage 5: Validation** — Low-confidence extractions are flagged for human review. Domain experts can validate, correct, or enhance AI assessments through the admin interface.

> 📊 **[INSERT DIAGRAM: document-processing-pipeline.png]**

---

## Data Source Architecture

The platform integrates four distinct data sources, each contributing unique intelligence dimensions. The architecture handles structured APIs, semi-structured files, and unstructured documents through specialized connectors.

**Dealroom API (REST)** — Real-time company profiles, funding rounds, investor networks, and growth metrics. Primary source for Market Score calculation. Structured JSON responses with pagination and rate limiting.

**PATSTAT (CSV Batch)** — European Patent Office quarterly exports containing patent filings, citations, applicant data, and IPC classifications. Primary source for Innovation Score. Large-scale batch processing with entity resolution.

**CEI Documents (Unstructured)** — Strategic assessments, technology reports, and policy analyses from the Cloud-Edge-IoT sphere. Requires full AI document intelligence pipeline. Source for TRL assessment and EU Alignment scoring.

**Expert Input (Manual)** — Admin interface for adding technologies not captured by automated sources, correcting AI assessments, and inputting domain expert evaluations. Provides validation layer and fills data gaps.

All sources feed into a unified data model with provenance tracking, enabling source attribution and confidence weighting in final scores.

> 📊 **[INSERT DIAGRAM: data-source-architecture.png]**

---

## Data Source Summary

| Source | Type | Refresh | Data Provided |
|--------|------|---------|---------------|
| Dealroom | REST API | On-demand | Companies, funding, investors, growth metrics |
| PATSTAT | CSV Export | Quarterly | Patents, citations, applicants, IPC codes |
| CEI Documents | Unstructured | As published | Strategic assessments, technology reports |
| Expert Input | Manual | Continuous | TRL validation, corrections, annotations |

---

## Access Control Architecture

The platform implements Row-Level Security (RLS) at the database level, ensuring users only access data appropriate to their tier. This architecture enables a freemium model while protecting premium content.

**Public Tier** — Unauthenticated access to a curated sample dataset (~20 technologies). Demonstrates platform capabilities without exposing full intelligence. No export, limited history, basic visualizations only.

**Premium Tier** — Authenticated access with full dataset visibility. Complete historical data, detailed score breakdowns, source citations, and export capabilities (PDF/CSV). Access managed by BluSpecs—no self-service registration.

**Admin Tier** — Full platform access plus management capabilities: user provisioning, data source configuration, AI validation tools, manual data entry, audit logs, and system monitoring dashboards.

Security is enforced at multiple layers: authentication (Lovable Cloud Auth), authorization (RLS policies), and UI (feature gating based on user claims).

> 📊 **[INSERT DIAGRAM: access-control-architecture.png]**

---

## Feature Comparison by Tier

Access tiers are managed manually by BluSpecs—no self-service registration or payment integration.

| Feature | Public Demo | Premium | Admin |
|---------|-------------|---------|-------|
| Technology count | ~20 sample | Full dataset | Full dataset |
| Historical data | Limited | Complete | Complete + audit |
| Score details | Composite only | All dimensions | All + sources |
| Export | — | PDF, CSV | PDF, CSV, API |
| User management | — | — | ✓ |
| Data configuration | — | — | ✓ |
| AI validation | — | — | ✓ |

---

## Cloud-Edge-IoT-AI Taxonomy

Technologies are classified into four primary domains within the ML-SDV (Mobility, Logistics, Software-Defined Vehicles) sphere. This taxonomy provides the quadrant structure for the Technology Radar and enables domain-specific filtering throughout the platform.

**Cloud Technologies** — Centralized computing infrastructure including hyperscaler platforms (AWS, Azure, GCP), container orchestration, serverless computing, and cloud-native development tools. Foundation for scalable backend services.

**Edge Computing** — Distributed processing at network periphery including edge nodes, gateways, MEC (Multi-access Edge Computing), and 5G/6G connectivity. Critical for low-latency applications in autonomous vehicles and real-time logistics.

**IoT (Internet of Things)** — Connected device ecosystems including sensors, actuators, telematics units, and fleet management systems. Primary data generation layer for mobility and logistics applications.

**AI/ML** — Cross-cutting intelligence capabilities spanning machine learning, computer vision, natural language processing, and autonomous decision systems. Enables intelligent automation across all other domains.

The taxonomy aligns with the CEI-Sphere Hourglass Model, ensuring platform intelligence maps directly to established strategic frameworks.

> 📊 **[INSERT DIAGRAM: taxonomy.png]**

| Domain | Icon | Description |
|--------|------|-------------|
| Cloud Technologies | ☁️ | Infrastructure, platforms, and services delivered via cloud computing models |
| AI/ML | 🤖 | Artificial intelligence, machine learning, and cognitive computing systems |
| IoT | 📡 | Connected devices, sensors, and Internet of Things ecosystems |
| Edge Computing | ⚡ | Distributed computing infrastructure at the network edge |

---

## Export & Reporting Pipeline

Premium users can export technology intelligence in multiple formats optimized for different use cases. The export pipeline applies access controls, formats data appropriately, and tracks usage for audit purposes.

**PDF Reports** — Formatted documents with embedded visualizations, suitable for executive briefings and stakeholder presentations. Includes radar snapshots, score breakdowns, and trend analysis. Branded with BluSpecs identity.

**CSV Export** — Raw data exports for offline analysis in spreadsheet tools or integration with business intelligence platforms. Includes all visible fields with proper escaping and encoding.

**API Access** — Programmatic endpoints returning JSON data for integration with external systems. Supports filtering, pagination, and webhooks for data change notifications. Rate-limited per client.

All exports include metadata: generation timestamp, user attribution, data freshness indicators, and source citations where applicable.

> 📊 **[INSERT DIAGRAM: export-reporting-pipeline.png]**

| Format | Description |
|--------|-------------|
| PDF Report | Formatted report with visualizations, suitable for presentations and stakeholder briefings |
| CSV Export | Raw data export for analysis in spreadsheet tools or further processing |
| API Access | Programmatic access to technology data for integration with other systems (premium tier) |

---

## Data Refresh Workflow

Data refresh is triggered manually via admin interface rather than automated polling. This design gives BluSpecs control over update timing and allows validation before data becomes visible to users.

**Initiation** — Administrator triggers refresh from the admin panel, selecting which data sources to update. The system validates credentials and connectivity before proceeding.

**Extraction** — Connectors pull data from external sources: Dealroom API calls, PATSTAT file imports, and document queue processing. Progress is tracked in real-time.

**Processing** — New data flows through the AI pipeline: normalization, entity extraction, TRL assessment, and score calculation. Delta detection identifies changes from previous refresh.

**Validation** — Admin reviews flagged items requiring human judgment. Low-confidence extractions and significant score changes are highlighted for attention.

**Publication** — Approved data is published to production, instantly available to all users. Full audit trail captures what changed, when, and who approved.

Initial delivery includes one data refresh cycle. Ongoing refresh cycles are quoted separately.

> 📊 **[INSERT DIAGRAM: data-refresh-workflow.png]**

---

## Supported Document Formats

| Format | Extensions | Typical Use |
|--------|------------|-------------|
| PDF | .pdf | Reports, whitepapers, policy documents |
| PowerPoint | .ppt, .pptx | Presentations, slide decks |
| Word | .doc, .docx | Text documents, assessments |
| Plain Text | .txt, .md | Simple text files, markdown |
