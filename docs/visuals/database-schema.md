# Database Schema
## AI-CE Heatmap Platform - Entity Relationship Diagram

---

## Entity Relationship Diagram

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
        uuid user_id FK "→ auth.users"
        string email
        string organization
        uuid role_id FK
        date access_until
        timestamp created_at
        timestamp updated_at
    }
    
    ROLES {
        uuid id PK
        string name UK "public, premium, admin"
        jsonb permissions
        timestamp created_at
    }
    
    ACCESS_LOGS {
        uuid id PK
        uuid user_id FK
        string action "view, export, refresh"
        string resource
        jsonb metadata
        timestamp created_at
    }
    
    TECHNOLOGIES {
        uuid id PK
        string name
        string slug UK
        text description
        uuid category_id FK
        jsonb metadata
        boolean is_public
        timestamp created_at
        timestamp updated_at
    }
    
    CATEGORIES {
        uuid id PK
        string name
        uuid parent_id FK "self-reference"
        string sphere "ML-SDV"
        int display_order
        timestamp created_at
    }
    
    SCORES {
        uuid id PK
        uuid technology_id FK
        uuid data_source_id FK
        float trl_score "0-9"
        float market_score "0-9"
        float innovation_score "0-9"
        float eu_alignment_score "0-9"
        float composite_score "0-9"
        string confidence "high, medium, low"
        date assessment_date
        jsonb raw_data
        timestamp created_at
    }
    
    DATA_SOURCES {
        uuid id PK
        string name UK "dealroom, patstat, cei, public"
        string type "api, csv, document"
        jsonb config
        timestamp last_refresh
        string status "active, error, pending"
    }
    
    DATA_REFRESH_LOGS {
        uuid id PK
        uuid triggered_by FK "→ profiles"
        timestamp started_at
        timestamp completed_at
        string status "running, success, failed"
        jsonb summary
        text error_message
    }
```

---

## Table Relationships

```mermaid
graph TD
    subgraph Auth["🔐 Auth Schema"]
        A[auth.users]
    end
    
    subgraph Public["📊 Public Schema"]
        B[profiles]
        C[roles]
        D[access_logs]
        E[technologies]
        F[categories]
        G[scores]
        H[data_sources]
        I[data_refresh_logs]
    end
    
    A -->|user_id| B
    C -->|role_id| B
    B -->|user_id| D
    F -->|category_id| E
    F -->|parent_id| F
    E -->|technology_id| G
    H -->|data_source_id| G
    B -->|triggered_by| I
    H -.->|included in| I
```

---

## Row-Level Security Policies

```mermaid
graph LR
    subgraph Policies["🛡️ RLS Policies"]
        A[public_technologies_select]
        B[premium_technologies_select]
        C[admin_full_access]
        D[user_own_profile]
        E[admin_manage_profiles]
    end
    
    subgraph Tables["📋 Tables"]
        F[technologies]
        G[scores]
        H[profiles]
        I[access_logs]
    end
    
    subgraph Roles["👤 Roles"]
        J[anonymous]
        K[authenticated]
        L[admin]
    end
    
    J --> A
    A --> F
    
    K --> B
    B --> F
    B --> G
    
    K --> D
    D --> H
    
    L --> C
    C --> F
    C --> G
    C --> H
    C --> I
    
    L --> E
    E --> H
```

---

## Index Strategy

```mermaid
graph TD
    subgraph Performance["⚡ Performance Indexes"]
        A[idx_technologies_category]
        B[idx_technologies_public]
        C[idx_scores_technology]
        D[idx_scores_composite]
        E[idx_access_logs_user]
        F[idx_profiles_role]
    end
    
    subgraph Tables["📋 Tables"]
        G[technologies]
        H[scores]
        I[access_logs]
        J[profiles]
    end
    
    A --> G
    B --> G
    C --> H
    D --> H
    E --> I
    F --> J
```

---

## Data Types Reference

| Table | Column | Type | Notes |
|-------|--------|------|-------|
| profiles | permissions | JSONB | `{"export": true, "api": false}` |
| technologies | metadata | JSONB | `{"funding_total": 1000000, "patent_count": 15}` |
| scores | raw_data | JSONB | Source-specific raw data for audit |
| data_sources | config | JSONB | API keys, endpoints, auth config |
| data_refresh_logs | summary | JSONB | `{"records_updated": 150, "errors": 2}` |

---

## Enums

```sql
-- Role names
CREATE TYPE role_name AS ENUM ('public', 'premium', 'admin');

-- Access log actions
CREATE TYPE log_action AS ENUM ('view', 'export', 'filter', 'refresh', 'login');

-- Confidence levels
CREATE TYPE confidence_level AS ENUM ('high', 'medium', 'low');

-- Refresh status
CREATE TYPE refresh_status AS ENUM ('pending', 'running', 'success', 'failed');

-- Data source types
CREATE TYPE source_type AS ENUM ('api', 'csv', 'document', 'manual');
```
