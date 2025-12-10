# Annex A: Technical Architecture

## Technology Stack

| Layer | Technology | Rationale |
|-------|------------|-----------|
| **Frontend** | React 18, TypeScript, Tailwind CSS | Modern component architecture, type safety, responsive design |
| **Visualizations** | Recharts | Production-ready charting library with accessibility support |
| **Backend** | Lovable Cloud (PostgreSQL) | EU-hosted, built-in auth, auto-scaling, ISO 27001 infrastructure |
| **AI Processing** | Lovable AI Gateway | Document parsing, TRL assessment, no external API keys required |
| **State Management** | TanStack Query | Server state caching, optimistic updates, background sync |
| **Hosting** | EU Region (AWS Frankfurt/Ireland) | GDPR compliance, data residency guarantee |

---

## System Architecture

```mermaid
graph TB
    subgraph Users["👥 Users"]
        A[Public Visitors]
        B[Premium Clients]
        C[BluSpecs Admin]
    end
    
    subgraph Frontend["🖥️ Frontend - React + TypeScript"]
        D[Public Demo View]
        E[Premium Dashboard]
        F[Admin Panel]
        G[Technology Radar]
        H[Heatmap Matrix]
    end
    
    subgraph Backend["☁️ Lovable Cloud - EU Hosted"]
        I[Authentication & Sessions]
        J[PostgreSQL Database]
        K[Row-Level Security]
        L[Edge Functions]
        M[File Storage]
    end
    
    subgraph EdgeFunctions["⚡ Edge Functions"]
        N[data-refresh]
        O[parse-document]
        P[export-pdf]
        Q[ai-categorize]
    end
    
    subgraph External["📊 External Data Sources"]
        R[Dealroom API]
        S[PATSTAT/EPO]
        T[CEI Documents]
        U[Public Sources]
    end
    
    A --> D
    B --> E
    C --> F
    
    D --> G
    D --> H
    E --> G
    E --> H
    F --> I
    
    G --> I
    H --> I
    
    I --> J
    J --> K
    
    L --> N
    L --> O
    L --> P
    L --> Q
    
    N --> R
    N --> S
    O --> T
    Q --> U
    
    N --> J
    O --> J
    P --> M
```

---

## Frontend Architecture

### Component Hierarchy

```mermaid
graph TD
    A[App] --> B[Router]
    B --> C[Layout]
    
    C --> D["/mockups/radar"]
    C --> E["/mockups/heatmap"]
    C --> F["/mockups/admin"]
    C --> G["/mockups/public"]
    
    D --> H[TechnologyRadar]
    D --> I[FilterPanel]
    D --> J[TechDetailsSidebar]
    D --> K[CompareModal]
    
    E --> L[HeatmapMatrix]
    E --> I
    E --> M[CellDetailsPopover]
    E --> N[SortControls]
    
    F --> O[UserManagement]
    F --> P[DataRefreshPanel]
    F --> Q[AnalyticsDashboard]
    F --> R[AccessRequestsQueue]
    
    G --> H
    G --> L
    G --> S[LeadCaptureModal]
    G --> T[DemoBanner]
```

### Key Components

| Component | Purpose | Key Features |
|-----------|---------|--------------|
| **TechnologyRadar** | Circular quadrant visualization | 4 domains, 4 maturity rings, hover/click interactions |
| **HeatmapMatrix** | Grid-based maturity landscape | Sortable columns, expandable rows, color-coded cells |
| **FilterPanel** | Multi-criteria filtering | Domain, geography, TRL range, confidence level |
| **ExportDialog** | Data export functionality | CSV, PDF report, PNG/SVG chart export |
| **AdminPanel** | User & data management | User CRUD, access grants, data refresh trigger |

---

## Backend Architecture

### Database Schema Overview

```mermaid
erDiagram
    PROFILES ||--o{ ACCESS_LOGS : generates
    PROFILES }o--|| ROLES : has
    TECHNOLOGIES ||--o{ SCORES : has
    TECHNOLOGIES }o--|| CATEGORIES : belongs_to
    CATEGORIES ||--o{ CATEGORIES : parent_of
    SCORES }o--|| DATA_SOURCES : from
    DATA_REFRESH_LOGS ||--o{ DATA_SOURCES : includes
    
    PROFILES {
        uuid id PK
        uuid user_id FK
        string email
        string organization
        uuid role_id FK
        date access_until
    }
    
    TECHNOLOGIES {
        uuid id PK
        string name
        string slug UK
        uuid category_id FK
        boolean is_public
    }
    
    SCORES {
        uuid id PK
        uuid technology_id FK
        float trl_score
        float market_score
        float innovation_score
        float eu_alignment_score
        float composite_score
        string confidence
    }
    
    CATEGORIES {
        uuid id PK
        string name
        uuid parent_id FK
        string sphere
    }
    
    DATA_SOURCES {
        uuid id PK
        string name UK
        string type
        timestamp last_refresh
    }
```

> **Full schema:** See [Database Schema](../visuals/database-schema.md) for complete ERD with all fields

### Core Tables

| Table | Purpose | RLS Policy |
|-------|---------|------------|
| `profiles` | User information & access level | Own profile only; Admin full access |
| `technologies` | Technology registry | Public: `is_public=true`; Premium: all |
| `scores` | Maturity assessments | Linked to technology visibility |
| `categories` | Taxonomy hierarchy | Public read |
| `data_sources` | Integration configs | Admin only |
| `access_logs` | Audit trail | Admin only |

---

## Edge Functions

### Function Catalog

| Function | Trigger | Purpose |
|----------|---------|---------|
| `data-refresh` | Manual (Admin button) | Fetch all sources, normalize, recalculate scores |
| `parse-document` | File upload | AI extraction from PDF/PPT via Lovable AI Gateway |
| `export-pdf` | User request | Generate branded PDF report with charts |
| `ai-categorize` | Data refresh | Auto-categorize technologies using AI |

### Data Refresh Flow

```mermaid
flowchart TD
    A[🔄 Admin Triggers Refresh] --> B[Edge Function: data-refresh]
    
    B --> C{Parallel Fetch}
    
    C --> D[📊 Dealroom API]
    C --> E[📄 PATSTAT CSV]
    C --> F[🤖 AI Document Parsing]
    C --> G[🌐 Public Sources]
    
    D --> H[Normalize & Validate]
    E --> H
    F --> H
    G --> H
    
    H --> I[🧮 Scoring Engine]
    
    I --> J[TRL Score × 0.25]
    I --> K[Market Score × 0.25]
    I --> L[Innovation Score × 0.25]
    I --> M[EU Alignment × 0.25]
    
    J --> N[Composite Score]
    K --> N
    L --> N
    M --> N
    
    N --> O{Radar Placement}
    
    O -->|7.5-9.0| P[Adopt Ring]
    O -->|5.0-7.4| Q[Trial Ring]
    O -->|3.0-4.9| R[Assess Ring]
    O -->|0.0-2.9| S[Hold Ring]
    
    P --> T[(Database Update)]
    Q --> T
    R --> T
    S --> T
    
    T --> U[✅ Visualizations Updated]
```

### AI Document Processing

```mermaid
flowchart LR
    A[📎 Upload PPT/PDF] --> B[File Storage]
    
    B --> C[Edge Function: parse-document]
    
    C --> D[Lovable AI Gateway]
    
    D --> E{Extraction}
    
    E --> F[Technology Mentions]
    E --> G[TRL Indicators]
    E --> H[Policy References]
    
    F --> I[Map to Taxonomy]
    G --> I
    H --> I
    
    I --> J{Confidence Check}
    
    J -->|≥70%| K[Auto-categorize]
    J -->|<70%| L[Flag for Review]
    
    K --> M[(Save to Database)]
    L --> M
```

---

## Security Architecture

### Authentication Flow

```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend
    participant A as Auth Service
    participant D as Database
    
    U->>F: Enter credentials
    F->>A: signInWithPassword()
    A->>D: Verify credentials
    D-->>A: User record
    A-->>F: Session + JWT
    F->>D: Fetch profile (with RLS)
    D-->>F: User data (role-filtered)
    F-->>U: Redirect to dashboard
    
    Note over F,D: All subsequent requests include JWT
    Note over D: RLS policies enforce data access
```

### Access Control Matrix

| Resource | Public | Premium | Admin |
|----------|--------|---------|-------|
| Sample technologies (5-10) | ✅ Read | ✅ Read | ✅ Full |
| Full technology set | ❌ | ✅ Read | ✅ Full |
| Export CSV | ❌ | ✅ | ✅ |
| Export PDF | ❌ | ✅ | ✅ |
| User management | ❌ | ❌ | ✅ |
| Data refresh | ❌ | ❌ | ✅ |
| Analytics | ❌ | ❌ | ✅ |

### Row-Level Security

```sql
-- Example: Premium users see all technologies
CREATE POLICY "premium_see_all" ON technologies
  FOR SELECT
  USING (
    is_public = true 
    OR 
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.user_id = auth.uid() 
      AND profiles.role_id IN (
        SELECT id FROM roles WHERE name IN ('premium', 'admin')
      )
    )
  );
```

---

## Infrastructure

### Deployment Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    CDN (Global Edge)                        │
└─────────────────────────────┬───────────────────────────────┘
                              │
┌─────────────────────────────▼───────────────────────────────┐
│              Lovable Hosting (EU Region)                    │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                    Frontend                          │   │
│  │         React SPA (Static Assets)                    │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────┬───────────────────────────────┘
                              │
┌─────────────────────────────▼───────────────────────────────┐
│            Lovable Cloud (EU - AWS Frankfurt)               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │    Auth      │  │  PostgreSQL  │  │    Storage   │      │
│  │   Service    │  │   Database   │  │   Buckets    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              Edge Functions (Deno)                   │   │
│  │   data-refresh │ parse-document │ export-pdf        │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### Performance Targets

| Metric | Target | Rationale |
|--------|--------|-----------|
| Initial Load | < 3s | CDN-cached static assets |
| Visualization Render | < 500ms | Client-side rendering with cached data |
| Data Refresh | < 5 min | Parallel API calls, batch processing |
| API Response (p95) | < 200ms | PostgreSQL with proper indexing |

---

## Technical Advantages

| Advantage | Benefit |
|-----------|---------|
| **No vendor lock-in** | Standard React/TypeScript, PostgreSQL, exportable data |
| **EU compliance built-in** | Data residency in EU, ISO 27001 certified infrastructure |
| **Scalable architecture** | Handles growth from 10 to 10,000+ users without changes |
| **AI-ready** | Lovable AI Gateway pre-integrated for document processing |
| **Maintainable** | Clean component architecture, typed APIs, documented patterns |

---

## API Reference

### Public Endpoints

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/rest/v1/technologies` | GET | Optional | List technologies (RLS-filtered) |
| `/rest/v1/categories` | GET | None | Technology taxonomy |
| `/functions/v1/export-pdf` | POST | Required | Generate PDF report |

### Admin Endpoints

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/rest/v1/profiles` | GET/POST/PATCH/DELETE | Admin | User management |
| `/functions/v1/data-refresh` | POST | Admin | Trigger data refresh |
| `/rest/v1/access_logs` | GET | Admin | View audit trail |

---

> **Related Documentation:**
> - [Data Flow Diagrams](../visuals/data-flow-diagrams.md)
> - [Database Schema](../visuals/database-schema.md)
> - [Methodology Framework](./Annex-B-Methodology-Framework.md)
