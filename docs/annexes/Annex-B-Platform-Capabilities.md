# Annex B: Platform Capabilities

User features, interface capabilities, access tiers

---

## Overview

This annex details the user-facing capabilities of the AI-CE Heatmap Platform—what users can do, how they interact with the system, and what features are available at each access tier. For technical architecture and data processing details, see Annex A.

---

## Interactive Prototypes

Experience the platform capabilities through working prototypes.

| View | URL | Description |
|------|-----|-------------|
| Technology Radar | `/mockups/radar` | Circular quadrant-based visualization |
| Heatmap Matrix | `/mockups/heatmap` | Grid-based maturity landscape |
| Admin Panel | `/mockups/admin` | User and data management interface |
| Public Demo | `/mockups/public` | Limited public-facing view |

---

## User Journey & Workflows

The platform supports three distinct user journeys, each optimized for different goals and access levels. All journeys share a consistent interface while exposing tier-appropriate features.

**Discovery Journey (All Users)** — Users land on the Technology Radar or Heatmap Matrix, explore technologies visually, filter by domain or maturity, and drill into individual technology profiles. Public users see sample data; premium users see the full dataset.

**Analysis Journey (Premium)** — Deep-dive into technology assessments including score breakdowns across all four dimensions, historical trend charts, source citations, and related technologies. Export capabilities enable offline analysis and reporting.

**Management Journey (Admin)** — Configure platform settings, manage user accounts, validate AI assessments, perform manual data entry, and monitor system health. Full audit trail of all administrative actions.

Each journey is designed for minimal friction—users accomplish their goals within 2-3 clicks from any starting point.

> 📊 **[INSERT DIAGRAM: user-journey-workflows.png]**

---

## Visualization Modes

Two complementary visualization modes serve different decision-making contexts. Users can switch seamlessly between views while maintaining their current filters and selections.

**Technology Radar** — Circular quadrant layout inspired by ThoughtWorks Tech Radar. Technologies are positioned by domain (quadrant) and maturity (ring distance from center). Ideal for quick strategic overview—"What should we adopt now? What's emerging?" Interactive hover reveals technology details; click opens full profile.

**Heatmap Matrix** — Grid layout with domains as columns and maturity levels as rows. Cell color intensity indicates technology density or average score. Better for systematic coverage analysis—"Where are the gaps? Which domains are most mature?" Supports drill-down into individual cells.

**Custom Views** — Save and share filtered views with specific configurations. Useful for recurring analysis or stakeholder-specific dashboards. View types and configurations will be refined during the design sprint based on user needs identified in discovery.

> 📊 **[INSERT DIAGRAM: visualization-modes.png]**

---

## Filtering & Search

Powerful filtering enables users to focus on technologies relevant to their specific needs. All filters are combinable and URL-persistent for easy sharing.

**Domain Filter** — Select one or more technology domains: Cloud, Edge, IoT, AI/ML. Quadrant highlighting on radar; column filtering on heatmap.

**Maturity Filter** — Focus on specific readiness levels: Adopt, Trial, Assess, Hold. Ring highlighting on radar; row filtering on heatmap.

**Score Range** — Slider to filter by composite score (0-9) or individual dimension scores. Enables "show only high-innovation technologies" or similar queries.

**Text Search** — Full-text search across technology names, descriptions, and tags. Instant results with highlighted matches.

**Time Range** — For premium users with historical access, filter to specific date ranges to see how the landscape evolved.

Filter state is encoded in URL, enabling bookmarking and sharing of specific views.

> 📊 **[INSERT DIAGRAM: filtering-search.png]**

---

## Technology Profile View

Each technology has a detailed profile page providing comprehensive assessment information. Profile depth varies by access tier.

**Summary Section** — Technology name, domain classification, current maturity ring, and composite score. Visual indicator of score trend (improving, stable, declining).

**Score Breakdown** — Four-dimension radar chart showing TRL, Market, Innovation, and EU Alignment scores. Each dimension clickable to reveal calculation methodology and data sources.

**Trend History (Premium)** — Time-series chart showing how the technology's scores have evolved across data refresh cycles. Annotations mark significant events.

**Source Citations (Premium)** — Links to source documents and data points that contributed to the assessment. Enables validation and deeper research.

**Related Technologies** — Algorithmically suggested technologies with similar profiles or complementary capabilities. Enables ecosystem exploration.

> 📊 **[INSERT DIAGRAM: technology-profile.png]**

---

## Export & Sharing

Premium users can export and share technology intelligence in formats optimized for different audiences and use cases.

**PDF Executive Report** — One-click generation of a formatted report including radar visualization, top technologies summary, and key insights. Branded with BluSpecs identity. Ideal for stakeholder briefings and board presentations.

**CSV Data Export** — Download filtered technology data as spreadsheet-compatible CSV. Includes all visible dimensions and scores. Suitable for custom analysis in Excel, Google Sheets, or BI tools.

**Snapshot Share** — Generate a shareable link to the current view (with filters applied). Recipients see a read-only version. Useful for "look at this cluster of technologies" discussions.

**API Access (Roadmap)** — Programmatic JSON endpoints for integration with external systems. Planned for future release to enable third-party integrations and automated workflows.

> 📊 **[INSERT DIAGRAM: export-sharing.png]**

---

## Admin Capabilities

Administrators have full platform control through a dedicated management interface. All admin actions are logged for audit compliance.

**User Management** — Create, edit, and deactivate user accounts. Assign access tiers (Public/Premium/Admin). View user activity and last login timestamps.

**Data Validation** — Review AI-generated assessments flagged for low confidence. Approve, reject, or manually override TRL scores and classifications. Add expert annotations.

**Manual Entry** — Add technologies not captured by automated data sources. Input expert assessments for emerging technologies before they appear in external databases.

**System Monitoring** — Dashboard showing data freshness, processing queue status, error logs, and usage metrics. Alerts for failed data source connections or processing errors.

**Audit Trail** — Complete log of all data changes, user actions, and system events. Filterable by date, user, or action type. Exportable for compliance reporting.

> 📊 **[INSERT DIAGRAM: admin-capabilities.png]**

---

## Feature Availability by Tier

Access tiers are managed manually by BluSpecs—no self-service registration or payment integration.

| Feature | Public Demo | Premium | Admin |
|---------|-------------|---------|-------|
| Technology Radar view | ✓ | ✓ | ✓ |
| Heatmap Matrix view | ✓ | ✓ | ✓ |
| Domain & maturity filters | ✓ | ✓ | ✓ |
| Technology count | ~20 sample | Full dataset | Full dataset |
| Score breakdown (4 dimensions) | — | ✓ | ✓ |
| Historical trend charts | — | ✓ | ✓ |
| Source citations | — | ✓ | ✓ |
| PDF report export | — | ✓ | ✓ |
| CSV data export | — | ✓ | ✓ |
| API access | — | — | Roadmap |
| User management | — | — | ✓ |
| Data validation & override | — | — | ✓ |
| System monitoring | — | — | ✓ |

---

## Roadmap Features

Planned enhancements for future releases based on user feedback and strategic priorities.

| Feature | Description |
|---------|-------------|
| Saved Views | Save and name custom filter configurations for quick access |
| Alerts & Notifications | Get notified when tracked technologies change maturity level |
| Comparison Mode | Side-by-side comparison of 2-4 technologies |
| Collaboration Notes | Add private or shared notes to technologies |
| API Access | Programmatic JSON endpoints for Premium+ users. Enable integration with external BI tools, automated reporting, and webhook notifications for technology changes. |
