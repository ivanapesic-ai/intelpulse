# Annex B: Visual Mockups

UI layouts, design system, interaction patterns

---

## Live Interactive Mockups

> **Live mockups available at:** `/mockups` in the application

| View | URL | Description |
|------|-----|-------------|
| Technology Radar | `/mockups/radar` | Circular quadrant-based visualization |
| Heatmap Matrix | `/mockups/heatmap` | Grid-based maturity landscape |
| Admin Panel | `/mockups/admin` | User and data management interface |
| Public Demo | `/mockups/public` | Limited public-facing view |

---

## Technology Radar Layout

```mermaid
flowchart TD
    subgraph Radar["Technology Radar"]
        direction TB
        
        subgraph Q1["Cloud - Top-Right"]
            C1["•"]
        end
        
        subgraph Q2["AI/ML - Top-Left"]
            A1["•"]
        end
        
        subgraph Q3["IoT - Bottom-Left"]
            I1["•"]
        end
        
        subgraph Q4["Edge - Bottom-Right"]
            E1["•"]
        end
    end
    
    subgraph Rings["Concentric Rings"]
        R1["Adopt (7.5-9.0)"]
        R2["Trial (5.0-7.4)"]
        R3["Assess (3.0-4.9)"]
        R4["Hold (0.0-2.9)"]
    end
```

---

## User Interaction Patterns

```mermaid
flowchart LR
    subgraph Hover["Hover"]
        H1["Technology dot"]
        H2["→ Tooltip"]
    end
    
    subgraph Click["Click"]
        C1["Technology"]
        C2["→ Detail panel"]
    end
    
    subgraph Filter["Filter"]
        F1["Quadrant"]
        F2["Confidence"]
        F3["Score range"]
    end
    
    subgraph Compare["Compare"]
        CO1["Select multiple"]
        CO2["→ Side-by-side"]
    end
```

---

## Radar Quadrants

| Quadrant | Position | Color | Icon |
|----------|----------|-------|------|
| Cloud Technologies | Top-Right | 🔵 Blue | ☁️ |
| AI/ML | Top-Left | 🟣 Purple | 🤖 |
| IoT | Bottom-Left | 🟠 Orange | 📡 |
| Edge Computing | Bottom-Right | 🟢 Green | ⚡ |

---

## Heatmap Color Scale

| Score Range | Color | Meaning |
|-------------|-------|---------|
| 8.0 - 9.0 | 🟢 Deep Green | Highly mature, ready for adoption |
| 6.0 - 7.9 | 🟢 Light Green | Mature, worth trialing |
| 4.0 - 5.9 | 🟡 Yellow | Developing, assess carefully |
| 2.0 - 3.9 | 🟠 Orange | Early stage, monitor |
| 0.0 - 1.9 | 🔴 Red | Nascent, hold |
