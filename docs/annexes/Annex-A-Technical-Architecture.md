# Annex A: Technical Approach & Methodology

Architecture, AI layers, scoring framework

---

## System Architecture

```mermaid
flowchart TD
    subgraph Users["User Tiers"]
        U1["Public Visitor"]
        U2["Premium Client"]
        U3["Admin"]
    end

    subgraph Frontend["React Application"]
        FD["Dashboard"]
        FE["Explorer"]
        FA["Analytics"]
        FM["Admin"]
    end

    subgraph AI["AI Intelligence Layer"]
        AI1["Document Processing"]
        AI2["TRL Assessment"]
        AI3["Trend Analysis"]
    end

    subgraph Backend["Lovable Cloud - EU"]
        B1["Auth"]
        B2["PostgreSQL"]
        B3["RLS"]
        B4["Edge Functions"]
    end

    subgraph Data["External Sources"]
        D1["Dealroom API"]
        D2["PATSTAT"]
        D3["CEI Documents"]
    end

    U1 --> FD
    U2 --> FE
    U3 --> FM
    Frontend --> B1
    B1 --> B3 --> B2
    B4 --> AI --> B2
    B4 --> Data
```

---

## 4-Layer AI Architecture

```mermaid
flowchart TB
    subgraph L1["Layer 1: Data Ingestion"]
        I1["API Connectors"]
        I2["Document Parsers"]
        I3["Normalizers"]
    end

    subgraph L2["Layer 2: Intelligence"]
        E1["Entity Extraction"]
        E2["Classification"]
        E3["TRL Detection"]
    end

    subgraph L3["Layer 3: Analysis"]
        A1["Trend Detection"]
        A2["Pattern Recognition"]
        A3["Signal Detection"]
    end

    subgraph L4["Layer 4: Presentation"]
        P1["Technology Radar"]
        P2["Heatmap Matrix"]
        P3["Analytics"]
    end

    L1 --> L2 --> L3 --> L4
```

---

## 4-Dimension Scoring & Radar Placement

```mermaid
flowchart TD
    subgraph Dimensions["Scoring Dimensions (25% each)"]
        D1["TRL Score"]
        D2["Market Score"]
        D3["Innovation Score"]
        D4["EU Alignment"]
    end

    Dimensions --> CS["Composite Score 0-9"]

    CS --> R{Radar Placement}
    R -->|"7.5-9.0"| A["ADOPT - Deploy"]
    R -->|"5.0-7.4"| T["TRIAL - Pilot"]
    R -->|"3.0-4.9"| AS["ASSESS - Monitor"]
    R -->|"0.0-2.9"| H["HOLD - Wait"]
```

---

## Data Pipeline

```mermaid
flowchart LR
    S["External Sources"] --> I["Ingestion"]
    I --> N["Normalize"]
    N --> AI["AI Enrichment"]
    AI --> SC["Scoring Engine"]
    SC --> DB["PostgreSQL"]
    DB --> V["Visualizations"]
```

---

## Technology Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18 + TypeScript + Vite |
| Visualization | Recharts + Custom SVG |
| Backend | Lovable Cloud (PostgreSQL + RLS) |
| AI/ML | Lovable AI Gateway |
| Hosting | EU Region (AWS Frankfurt) |

---

## TRL Scale (EU Horizon)

| Level | Phase | Description |
|-------|-------|-------------|
| 1-3 | Research | Basic principles → Proof of concept |
| 4-6 | Development | Lab validation → Prototype demo |
| 7-9 | Deployment | Operational demo → Proven system |

---

## Radar Rings

| Ring | Score Range | Action |
|------|-------------|--------|
| 🟢 Adopt | 7.5 - 9.0 | Ready for deployment |
| 🔵 Trial | 5.0 - 7.4 | Suitable for pilots |
| 🟡 Assess | 3.0 - 4.9 | Worth monitoring |
| 🔴 Hold | 0.0 - 2.9 | Not ready for adoption |

---

## Composite Score Formula

```
Score = (TRL × 0.25) + (Market × 0.25) + (Innovation × 0.25) + (EU × 0.25)
```

Each dimension is normalized to a 0-9 scale before applying weights.
