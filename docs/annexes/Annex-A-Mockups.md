# Annex A: Visual Mockups
## AI-CE Heatmap Platform - Visual Design Concepts

---

## 1. Technology Radar View

### Concept Description

The Technology Radar provides a circular, quadrant-based visualization for quick technology comparison across the ML-SDV sphere.

```
                         ADOPT
                           │
                    ┌──────┼──────┐
                   ╱       │       ╲
                  ╱    ●   │   ●    ╲
                 ╱  Cloud  │  Edge   ╲
                ╱    ●     │     ●    ╲
               ╱           │           ╲
              │    TRIAL   │            │
    HOLD ─────┼────────────┼────────────┼───── ASSESS
              │            │            │
               ╲           │           ╱
                ╲    ●     │     ●    ╱
                 ╲   IoT   │    AI   ╱
                  ╲    ●   │   ●    ╱
                   ╲       │       ╱
                    └──────┼──────┘
                           │
                        HOLD
```

### Radar Ring Definitions

| Ring | Description | Criteria |
|------|-------------|----------|
| **Adopt** | Ready for production use | TRL 8-9, High market adoption, Proven ROI |
| **Trial** | Worth pursuing in pilots | TRL 6-7, Growing adoption, Clear use cases |
| **Assess** | Worth exploring | TRL 4-5, Emerging players, Strategic potential |
| **Hold** | Monitor only | TRL 1-3, Limited adoption, Uncertain trajectory |

### Quadrant Categories (ML-SDV Focus)

| Quadrant | Technologies Included |
|----------|----------------------|
| **Cloud** | Infrastructure, Platforms, Cloud-native services |
| **Edge** | Edge computing, Fog computing, Edge AI |
| **IoT** | Sensors, Connectivity, V2X protocols |
| **AI/ML** | Computer Vision, Autonomous systems, Predictive analytics |

### Interactive Features

- **Hover**: Display technology details (name, TRL score, key metrics)
- **Click**: Open detailed technology profile
- **Filter**: Show/hide by category, maturity level, or custom tags
- **Compare**: Select multiple technologies for side-by-side view
- **Export**: PNG, SVG, or PDF snapshot

---

## 2. Heatmap Matrix View

### Concept Description

The Heatmap Matrix provides a detailed grid visualization showing maturity levels across technology domains and assessment dimensions.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        TECHNOLOGY MATURITY HEATMAP                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│           │ TRL │ Market │ Innovation │ EU Alignment │ Overall │           │
│ ──────────┼─────┼────────┼────────────┼──────────────┼─────────┤           │
│ Cloud     │ ███ │  ███   │    ██░     │     ███      │   ███   │           │
│ Infra     │ 8.5 │  8.0   │    6.5     │     8.0      │   7.8   │           │
│ ──────────┼─────┼────────┼────────────┼──────────────┼─────────┤           │
│ Edge      │ ██░ │  ██░   │    ███     │     ██░      │   ██░   │           │
│ Computing │ 6.5 │  5.5   │    8.0     │     6.0      │   6.5   │           │
│ ──────────┼─────┼────────┼────────────┼──────────────┼─────────┤           │
│ IoT       │ ███ │  ██░   │    ██░     │     ███      │   ██░   │           │
│ Sensors   │ 7.5 │  6.0   │    5.5     │     7.5      │   6.6   │           │
│ ──────────┼─────┼────────┼────────────┼──────────────┼─────────┤           │
│ AI/ML     │ ██░ │  ███   │    ███     │     ██░      │   ███   │           │
│ Vision    │ 6.0 │  8.5   │    9.0     │     5.5      │   7.3   │           │
│ ──────────┼─────┼────────┼────────────┼──────────────┼─────────┤           │
│ V2X       │ █░░ │  █░░   │    ██░     │     ██░      │   ██░   │           │
│ Protocol  │ 4.5 │  3.5   │    6.0     │     5.5      │   4.9   │           │
│                                                                             │
│ Legend:  ███ High (7-9)  ██░ Medium (4-6)  █░░ Low (1-3)                   │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Color Scale

| Score Range | Color | Interpretation |
|-------------|-------|----------------|
| 8.0 - 9.0 | Deep Green | Highly mature, ready for adoption |
| 6.0 - 7.9 | Light Green | Maturing, suitable for trials |
| 4.0 - 5.9 | Yellow/Orange | Emerging, worth assessing |
| 2.0 - 3.9 | Orange/Red | Early stage, monitor only |
| 0.0 - 1.9 | Deep Red | Nascent, high uncertainty |

### Interactive Features

- **Cell Hover**: Show detailed breakdown of score components
- **Row Click**: Expand to show sub-technologies
- **Column Sort**: Sort by any dimension
- **Drill-down**: Click cell to view contributing data sources
- **Compare Mode**: Highlight differences between selected technologies

---

## 3. Filter Panel

### Filter Categories

```
┌─────────────────────────────────────────────────────────┐
│ FILTERS                                          [Reset] │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ Technology Domain                                       │
│ ┌─────────────────────────────────────────────────┐    │
│ │ ☑ Cloud    ☑ Edge    ☑ IoT    ☑ AI/ML          │    │
│ └─────────────────────────────────────────────────┘    │
│                                                         │
│ Maturity Level                                          │
│ ┌─────────────────────────────────────────────────┐    │
│ │ ☑ Adopt    ☑ Trial    ☑ Assess    ☐ Hold       │    │
│ └─────────────────────────────────────────────────┘    │
│                                                         │
│ Geography                                               │
│ ┌─────────────────────────────────────────────────┐    │
│ │ [Select regions...                           ▼] │    │
│ └─────────────────────────────────────────────────┘    │
│                                                         │
│ Funding Stage (Dealroom)                                │
│ ┌─────────────────────────────────────────────────┐    │
│ │ ○ All  ○ Pre-Seed  ○ Seed  ○ Series A+         │    │
│ └─────────────────────────────────────────────────┘    │
│                                                         │
│ Patent Activity (PATSTAT)                               │
│ ┌─────────────────────────────────────────────────┐    │
│ │ High ●────────────○ Low                         │    │
│ └─────────────────────────────────────────────────┘    │
│                                                         │
│ Time Period                                             │
│ ┌─────────────────────────────────────────────────┐    │
│ │ [Last 12 months                              ▼] │    │
│ └─────────────────────────────────────────────────┘    │
│                                                         │
│                              [Apply Filters]            │
└─────────────────────────────────────────────────────────┘
```

---

## 4. Public vs Premium Views

### Public Demo View

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ BluSpecs AI-CE Heatmap                              [Request Access]        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────┐  ┌────────────────────────────────┐   │
│  │                                 │  │  SAMPLE DATA                   │   │
│  │     [Technology Radar]          │  │  ──────────────────────────    │   │
│  │     Limited to 10 technologies  │  │  Showing 10 of 150+ tracked    │   │
│  │                                 │  │  technologies                   │   │
│  │         ● ●                     │  │                                │   │
│  │       ●     ●                   │  │  🔒 Full access requires       │   │
│  │         ● ●                     │  │     premium subscription       │   │
│  │                                 │  │                                │   │
│  └─────────────────────────────────┘  │  [Contact Us for Demo]         │   │
│                                        └────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │ Limited Filters: Domain only | No export | No drill-down             │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │ 💡 Premium Features Include:                                          │  │
│  │    • Full technology coverage (150+ technologies)                     │  │
│  │    • Advanced filtering (geography, funding, patents)                 │  │
│  │    • Export to CSV, PDF reports                                       │  │
│  │    • Quarterly data updates                                           │  │
│  │    • Priority support                                                 │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Premium User View

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ BluSpecs AI-CE Heatmap           [Export ▼]  [Filters]  [User: john@...]   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  [Radar View]  [Heatmap View]  [Compare]  [Reports]                        │
│  ━━━━━━━━━━━━                                                              │
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                                                                       │  │
│  │                    [Full Technology Radar]                            │  │
│  │                    All 150+ technologies                              │  │
│  │                                                                       │  │
│  │              ● ●     ●                                               │  │
│  │            ●     ●     ●                                             │  │
│  │          ●    ●   ●     ●                                            │  │
│  │            ●     ●     ●                                             │  │
│  │              ● ●     ●                                               │  │
│  │                                                                       │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  Active Filters: Cloud, AI/ML | Europe | Series A+ | Last 12 months        │
│  [Clear All]                                                                │
│                                                                             │
│  Last Updated: 2024-12-01 | Next Refresh: 2025-03-01                       │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 5. Admin Panel

### User Management View

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ Admin Panel                                              [Logout: admin]   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  [Users]  [Analytics]  [Data Refresh]  [Settings]                          │
│  ━━━━━━━                                                                   │
│                                                                             │
│  Premium Users (12 active)                           [+ Add User]          │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │ Email                    │ Organization    │ Access Until │ Actions  │  │
│  │─────────────────────────┼─────────────────┼──────────────┼──────────│  │
│  │ maria@mobility.eu        │ EU Commission   │ 2025-12-31   │ [Edit]   │  │
│  │ john@sdv-alliance.org    │ SDV Alliance    │ 2025-06-30   │ [Edit]   │  │
│  │ anna@logistics-hub.de    │ Logistics Hub   │ 2025-09-15   │ [Edit]   │  │
│  │ ...                      │ ...             │ ...          │ ...      │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  Recent Activity                                                            │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │ • maria@mobility.eu viewed Radar - 2 hours ago                        │  │
│  │ • john@sdv-alliance.org exported PDF report - 1 day ago               │  │
│  │ • anna@logistics-hub.de logged in - 3 days ago                        │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Data Refresh View

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ Admin Panel                                              [Logout: admin]   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  [Users]  [Analytics]  [Data Refresh]  [Settings]                          │
│                        ━━━━━━━━━━━━━━                                      │
│                                                                             │
│  Data Sources Status                                                        │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │ Source          │ Last Refresh    │ Records  │ Status    │ Action   │  │
│  │─────────────────┼─────────────────┼──────────┼───────────┼──────────│  │
│  │ Dealroom        │ 2024-12-01      │ 2,450    │ ● Active  │[Refresh] │  │
│  │ PATSTAT/EPO     │ 2024-11-15      │ 15,230   │ ● Active  │[Refresh] │  │
│  │ CEI Internal    │ 2024-12-05      │ 89       │ ● Active  │[Refresh] │  │
│  │ EU Horizon      │ 2024-11-28      │ 340      │ ● Active  │[Refresh] │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  [Refresh All Sources]                                                      │
│                                                                             │
│  Refresh History                                                            │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │ 2024-12-05 14:32 - CEI Internal refresh completed (89 records)        │  │
│  │ 2024-12-01 09:15 - Dealroom refresh completed (2,450 records)         │  │
│  │ 2024-11-28 16:45 - EU Horizon refresh completed (340 records)         │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 6. Export Options

### Export Dialog

```
┌─────────────────────────────────────────────────────────┐
│ Export Data                                      [×]    │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ Format                                                  │
│ ┌─────────────────────────────────────────────────┐    │
│ │ ○ CSV (raw data)                                 │    │
│ │ ○ PDF Report (formatted with charts)             │    │
│ │ ○ PNG/SVG (visualization only)                   │    │
│ └─────────────────────────────────────────────────┘    │
│                                                         │
│ Content                                                 │
│ ┌─────────────────────────────────────────────────┐    │
│ │ ☑ Current view (with active filters)            │    │
│ │ ☐ Full dataset                                   │    │
│ │ ☐ Selected technologies only                     │    │
│ └─────────────────────────────────────────────────┘    │
│                                                         │
│ Include                                                 │
│ ┌─────────────────────────────────────────────────┐    │
│ │ ☑ Scores and metrics                             │    │
│ │ ☑ Data source references                         │    │
│ │ ☐ Detailed methodology notes                     │    │
│ └─────────────────────────────────────────────────┘    │
│                                                         │
│                    [Cancel]  [Export]                   │
└─────────────────────────────────────────────────────────┘
```

---

## Design Principles

### Visual Hierarchy
- Primary actions in brand color (blue/green)
- Consistent spacing and alignment
- Clear data/action separation

### Accessibility
- Color-blind safe palette options
- Sufficient contrast ratios
- Keyboard navigation support

### Responsiveness
- Desktop-first design (primary use case)
- Tablet-compatible views
- Mobile: read-only summary view

---

*These mockups represent conceptual designs. Final visual styling will be refined during the design sprint phase.*
