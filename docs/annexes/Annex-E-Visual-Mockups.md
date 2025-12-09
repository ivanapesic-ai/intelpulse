# Annex E: Visual Mockups

## Interactive Mockups

> **Live mockups available at:** `/mockups` in the application

| View | URL | Description |
|------|-----|-------------|
| Technology Radar | `/mockups/radar` | Circular quadrant-based visualization |
| Heatmap Matrix | `/mockups/heatmap` | Grid-based maturity landscape |
| Admin Panel | `/mockups/admin` | User and data management interface |
| Public Demo | `/mockups/public` | Limited public-facing view |

---

## Technology Radar Concept

### Layout
- **Shape**: Circular, divided into 4 quadrants
- **Rings**: 4 concentric rings from center outward

### Quadrants
| Position | Domain | Color Theme |
|----------|--------|-------------|
| Top-Right | Cloud Technologies | Blue |
| Bottom-Right | Edge Computing | Green |
| Bottom-Left | IoT | Orange |
| Top-Left | AI/ML | Purple |

### Rings (Maturity Levels)
| Ring | Label | Score Range | Distance from Center |
|------|-------|-------------|---------------------|
| Inner | Adopt | 7.5 - 9.0 | Closest |
| 2nd | Trial | 5.0 - 7.4 | — |
| 3rd | Assess | 3.0 - 4.9 | — |
| Outer | Hold | 0.0 - 2.9 | Furthest |

### Interactions
- **Hover**: Show technology name, score, confidence level
- **Click**: Open detail panel with full assessment
- **Filter**: Toggle quadrants, filter by confidence level
- **Compare**: Select multiple technologies for side-by-side view

---

## Heatmap Matrix Concept

### Layout
- **Rows**: Individual technologies (sortable)
- **Columns**: Assessment dimensions (TRL, Market, Innovation, EU Alignment)
- **Cells**: Color-coded score visualization

### Color Scale
| Score Range | Color | Meaning |
|-------------|-------|---------|
| 8.0 - 9.0 | Deep Green | Highly mature |
| 6.0 - 7.9 | Light Green | Mature |
| 4.0 - 5.9 | Yellow | Developing |
| 2.0 - 3.9 | Orange | Early stage |
| 0.0 - 1.9 | Red | Nascent |

### Features
- **Sorting**: By any column, ascending/descending
- **Filtering**: By domain, sub-category, score range
- **Row Expansion**: Click row to see detailed breakdown
- **Export**: Download visible data as CSV

---

## Admin Panel Concept

### Dashboard
- Quick stats: Total users, active sessions, last data refresh
- Recent activity log
- Pending access requests (if applicable)

### User Management
- User list with search and filter
- Add/remove premium users
- View user activity history
- Bulk operations

### Data Management
- Data source status overview
- Manual refresh trigger per source
- Import history and error logs
- Data quality indicators

---

## Public Demo Concept

### Restrictions
- Limited to 5-10 sample technologies
- Basic filtering only
- No export functionality
- Watermark or demo banner

### Lead Capture
- "Request Full Access" call-to-action
- Contact form integration
- Demo usage analytics for BluSpecs

---

## Design System

### Typography
- **Headings**: Inter or similar modern sans-serif
- **Body**: System font stack for performance
- **Data**: Monospace for scores and numbers

### Colors
- **Primary**: BluSpecs brand color
- **Success**: Green spectrum for high scores
- **Warning**: Yellow/orange for mid-range
- **Danger**: Red spectrum for low scores
- **Neutral**: Gray scale for UI elements

### Components
- Consistent button styles across all views
- Card-based layouts for data presentation
- Responsive breakpoints for mobile/tablet/desktop
- Accessible color contrast ratios (WCAG AA)
