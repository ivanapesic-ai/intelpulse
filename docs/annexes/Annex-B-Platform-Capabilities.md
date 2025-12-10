# Annex B: Platform Capabilities

Document processing, data integration, user features

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

## Document Processing Capabilities

The platform's AI layer transforms unstructured documents into structured technology intelligence. This is critical for processing CEI internal datasets which arrive as PowerPoint presentations and PDF reports rather than structured data.

**Supported Formats** — PDF reports, PowerPoint presentations (PPT/PPTX), Word documents (DOC/DOCX), and plain text files. The system extracts text, preserves document structure, and processes embedded tables.

**Processing Pipeline** — Documents are parsed for layout structure, text is extracted and cleaned, and NLP models identify technology entities, company mentions, funding data, and readiness indicators.

**Quality Assurance** — Each extraction includes confidence scores. Low-confidence extractions are flagged for human review. Domain experts can validate and correct AI assessments through the admin interface.

> 📊 **[Diagram: Document Processing Capabilities]** — See interactive version at `/mockups/annex-b`

---

## Data Source Integration

The platform integrates multiple heterogeneous data sources to provide comprehensive technology assessment.

**Dealroom API** — Company profiles, funding rounds, investor networks, and growth metrics. Provides the foundation for Market Score calculation. REST API with structured JSON responses.

**PATSTAT (EPO)** — European Patent Office data on patent filings, citations, and patent families. Primary source for Innovation Score. Delivered as CSV exports for batch processing.

**CEI Internal Documents** — Strategic assessments, technology reports, and policy analyses from the Cloud-Edge-IoT sphere. Unstructured documents processed through AI document intelligence layer.

**Manual Data Entry** — Admin interface for adding technologies, correcting AI assessments, and inputting expert evaluations not available in automated sources.

> 📊 **[Diagram: Data Source Integration]** — See interactive version at `/mockups/annex-b`

---

## Data Source Capabilities

| Source | Type | Data Provided | Refresh |
|--------|------|---------------|---------|
| Dealroom API | REST API | Companies, funding, investors, growth metrics | On-demand refresh |
| PATSTAT | CSV Export | Patents, citations, applicants, classifications | Quarterly batch |
| CEI Documents | PDF/PPT | Strategic assessments, policy analysis, reports | As published |
| Expert Input | Manual Entry | TRL validation, corrections, annotations | Continuous |

---

## User Capabilities by Tier

Access tiers are managed manually by BluSpecs—no self-service registration or payment integration.

**Public Demo (Free)** — Access to a curated subset of technologies with limited historical data. No account required. *Limit: ~20 technologies, no export*

**Premium Clients (Paid)** — Full access to all technologies, complete historical data, detailed scoring breakdowns, source citations, and export capabilities. *Access: Managed by BluSpecs*

**Administrators (BluSpecs Staff)** — All premium features plus user management, data source configuration, manual data entry, AI assessment validation, and system monitoring. *Access: BluSpecs staff only*

> 📊 **[Diagram: User Capabilities by Tier]** — See interactive version at `/mockups/annex-b`

---

## Cloud-Edge-IoT-AI Taxonomy

Technologies are classified into four primary domains within the ML-SDV (Mobility, Logistics, Software-Defined Vehicles) sphere.

| Domain | Description |
|--------|-------------|
| ☁️ Cloud Technologies | Infrastructure, platforms, and services delivered via cloud computing models |
| 🤖 AI/ML | Artificial intelligence, machine learning, and cognitive computing systems |
| 📡 IoT | Connected devices, sensors, and Internet of Things ecosystems |
| ⚡ Edge Computing | Distributed computing infrastructure at the network edge |

---

## Export & Reporting

Premium users can export technology data for offline analysis, presentations, and integration with other tools.

| Format | Description |
|--------|-------------|
| PDF Report | Formatted report with visualizations, suitable for presentations and stakeholder briefings |
| CSV Export | Raw data export for analysis in spreadsheet tools or further processing |
| API Access | Programmatic access to technology data for integration with other systems (premium tier) |
