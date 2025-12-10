# Annex B: Visual Mockups

UI layouts, design system, interaction patterns

---

## Overview

The AI-CE Heatmap Platform employs a dual visualization system: the **Technology Radar** for quick, high-level comparison and the **Heatmap Matrix** for detailed maturity analysis. These complementary views serve different decision-making contexts while maintaining consistent scoring and interaction patterns.

---

## Live Interactive Mockups

Explore the working prototypes to experience the interaction patterns and visual design firsthand.

> **Live mockups available at:** `/mockups` in the application

| View | URL | Description |
|------|-----|-------------|
| Technology Radar | `/mockups/radar` | Circular quadrant-based visualization |
| Heatmap Matrix | `/mockups/heatmap` | Grid-based maturity landscape |
| Admin Panel | `/mockups/admin` | User and data management interface |
| Public Demo | `/mockups/public` | Limited public-facing view |

---

## Technology Radar Layout

The Technology Radar provides a circular, quadrant-based visualization optimized for quick comparison and pattern recognition. Technologies are positioned based on their composite score (distance from center) and domain category (quadrant placement).

The circular layout enables rapid visual scanning: technologies closer to the center are more mature and adoption-ready, while those on the outer rings require more evaluation. Each quadrant represents a distinct technology domain within the Cloud-Edge-IoT-AI taxonomy, allowing stakeholders to quickly focus on their areas of interest.

This visualization is particularly effective for executive briefings and strategic planning sessions where the goal is to communicate relative positioning across the technology landscape.

> 📊 **[Diagram: Technology Radar Layout]** — See interactive version at `/mockups/annex-b`

---

## User Interaction Patterns

The platform implements progressive disclosure patterns to balance information density with usability. Users can explore the technology landscape through multiple interaction modes.

**Hover** — Hovering over any technology dot reveals a tooltip with key metrics: name, composite score, trend direction, and confidence level. This enables rapid scanning without context-switching.

**Click** — Clicking a technology opens a detail panel with full scoring breakdown, data source citations, historical trend charts, and related technologies. Premium users can access source documents and methodology notes.

**Filter** — The filter panel allows narrowing the view by quadrant, confidence level, and score range. Filters persist across sessions for returning users.

**Compare** — Users can select multiple technologies to display side-by-side comparison views, highlighting scoring differences across all four dimensions.

> 📊 **[Diagram: User Interaction Patterns]** — See interactive version at `/mockups/annex-b`

---

## Radar Quadrants

The four quadrants represent the Cloud-Edge-IoT-AI taxonomy, organizing technologies by their primary domain. Each quadrant uses a distinct color for rapid visual identification.

| Quadrant | Position | Color | Description |
|----------|----------|-------|-------------|
| ☁️ Cloud Technologies | Top-Right | 🔵 Blue | Infrastructure, platforms, and services delivered via cloud computing models |
| 🤖 AI/ML | Top-Left | 🟣 Purple | Artificial intelligence, machine learning, and cognitive computing systems |
| 📡 IoT | Bottom-Left | 🟠 Orange | Connected devices, sensors, and Internet of Things ecosystems |
| ⚡ Edge Computing | Bottom-Right | 🟢 Green | Distributed computing infrastructure at the network edge |

---

## Heatmap Color Scale

The heatmap matrix uses a traffic-light color progression that is intuitive and accessible. The scale moves from red (nascent) through yellow (developing) to green (mature), with each color band mapping to specific score ranges and recommended actions.

| Score Range | Color | Meaning |
|-------------|-------|---------|
| 8.0 - 9.0 | 🟢 Deep Green | Highly mature, ready for adoption |
| 6.0 - 7.9 | 🟢 Light Green | Mature, worth trialing |
| 4.0 - 5.9 | 🟡 Yellow | Developing, assess carefully |
| 2.0 - 3.9 | 🟠 Orange | Early stage, monitor |
| 0.0 - 1.9 | 🔴 Red | Nascent, hold |

---

## Design Principles

The visual design follows these core principles:

1. **Progressive Disclosure** — Show summary information first, with details available on demand
2. **Consistent Color Language** — Same colors mean the same things across all views
3. **Accessibility** — Color is never the only indicator; shapes and labels provide redundant encoding
4. **Responsive Layout** — All views adapt gracefully from mobile to large desktop displays
5. **Print-Ready** — Visualizations export cleanly to PDF for offline sharing and reporting
