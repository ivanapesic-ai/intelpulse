# Annex C: Data Model

## Technology Taxonomy (ML-SDV Sphere)

| Domain | Sub-categories |
|--------|----------------|
| **Cloud Technologies** | Infrastructure, Platforms, Services |
| **Edge Computing** | Hardware, Software, Networking |
| **IoT** | Sensors, Connectivity, Protocols |
| **AI/ML** | Computer Vision, NLP, Predictive Analytics, Autonomous Systems |

---

## Database Schema

> **See:** [Database Schema](../visuals/database-schema.md) for detailed ERD

### Core Tables

#### Technologies
```sql
technologies (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  domain TEXT NOT NULL,        -- Cloud, Edge, IoT, AI
  sub_category TEXT,
  description TEXT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)
```

#### Maturity Scores
```sql
maturity_scores (
  id UUID PRIMARY KEY,
  technology_id UUID REFERENCES technologies,
  trl_score DECIMAL(3,1),
  market_adoption_score DECIMAL(3,1),
  innovation_score DECIMAL(3,1),
  eu_alignment_score DECIMAL(3,1),
  overall_score DECIMAL(3,1),
  confidence_level TEXT,       -- High, Medium, Low
  assessed_at TIMESTAMP,
  data_sources JSONB
)
```

#### Users & Access
```sql
profiles (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users,
  role TEXT NOT NULL,          -- public, premium, admin
  organization TEXT,
  created_at TIMESTAMP
)

access_grants (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users,
  granted_by UUID,
  access_level TEXT,
  valid_until TIMESTAMP,
  created_at TIMESTAMP
)
```

#### Data Sources
```sql
data_sources (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT,                   -- api, csv, manual
  last_refresh TIMESTAMP,
  status TEXT,
  config JSONB
)

data_imports (
  id UUID PRIMARY KEY,
  source_id UUID REFERENCES data_sources,
  imported_at TIMESTAMP,
  record_count INTEGER,
  status TEXT,
  errors JSONB
)
```

---

## Data Flow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Dealroom   │────▶│   Import    │────▶│  Normalize  │
│    API      │     │   Pipeline  │     │   & Store   │
└─────────────┘     └─────────────┘     └──────┬──────┘
                                               │
┌─────────────┐     ┌─────────────┐            │
│  PATSTAT    │────▶│   CSV       │────────────┤
│   Export    │     │   Parser    │            │
└─────────────┘     └─────────────┘            │
                                               ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│    CEI      │────▶│   AI        │────▶│  Maturity   │
│  Documents  │     │   Extract   │     │   Scoring   │
└─────────────┘     └─────────────┘     └─────────────┘
```

---

## Access Control Matrix

| Role | Technologies | Scores | Users | Data Refresh |
|------|--------------|--------|-------|--------------|
| Public | Sample only | Limited | — | — |
| Premium | Full ML-SDV | Full | — | — |
| Admin | Full + Edit | Full + Edit | Manage | Trigger |
