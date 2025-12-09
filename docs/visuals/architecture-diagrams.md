# Architecture Diagrams
## AI-CE Heatmap Platform - System Design

---

## System Overview

```mermaid
graph TB
    subgraph Users["👥 Users"]
        A[Public Visitors]
        B[Premium Subscribers]
        C[Admin - BluSpecs]
    end
    
    subgraph Frontend["🖥️ Frontend - React + TypeScript"]
        D[Public Demo View]
        E[Premium Dashboard]
        F[Admin Panel]
    end
    
    subgraph Backend["☁️ Lovable Cloud - EU Hosted"]
        G[Authentication]
        H[PostgreSQL Database]
        I[Row-Level Security]
        J[Edge Functions]
        K[File Storage]
    end
    
    subgraph External["📊 External Data Sources"]
        L[Dealroom API]
        M[PATSTAT/EPO]
        N[CEI Documents]
        O[Public Sources]
    end
    
    A --> D
    B --> E
    C --> F
    
    D --> G
    E --> G
    F --> G
    
    G --> H
    G --> I
    
    J --> L
    J --> M
    J --> N
    J --> O
    
    J --> H
    K --> H
```

---

## Frontend Architecture

```mermaid
graph LR
    subgraph Pages["📄 Pages"]
        A["/mockups/radar"]
        B["/mockups/heatmap"]
        C["/mockups/admin"]
        D["/mockups/public"]
    end
    
    subgraph Components["🧩 Components"]
        E[TechnologyRadar]
        F[HeatmapMatrix]
        G[FilterPanel]
        H[AdminPanel]
        I[ExportDialog]
    end
    
    subgraph Hooks["🪝 Hooks"]
        J[useTechnologies]
        K[useScores]
        L[useFilters]
        M[useExport]
    end
    
    subgraph State["📦 State"]
        N[React Query]
        O[Local State]
    end
    
    A --> E
    B --> F
    C --> H
    D --> E
    D --> F
    
    E --> G
    F --> G
    
    E --> J
    F --> K
    G --> L
    I --> M
    
    J --> N
    K --> N
    L --> O
```

---

## Security Architecture

```mermaid
graph TB
    subgraph Auth["🔐 Authentication Layer"]
        A[Email/Password Login]
        B[Session Management]
        C[JWT Tokens]
    end
    
    subgraph Roles["👤 Role-Based Access"]
        D[Public - No Auth]
        E[Premium - Authenticated]
        F[Admin - Elevated]
    end
    
    subgraph RLS["🛡️ Row-Level Security"]
        G[Public Data Policy]
        H[Premium Data Policy]
        I[Admin Full Access]
    end
    
    subgraph Data["📊 Data Access"]
        J[Sample Technologies]
        K[Full Technology Set]
        L[User Management]
        M[Analytics]
    end
    
    A --> B
    B --> C
    
    C --> D
    C --> E
    C --> F
    
    D --> G
    E --> H
    F --> I
    
    G --> J
    H --> K
    I --> L
    I --> M
```

---

## Component Hierarchy

```mermaid
graph TD
    A[App] --> B[Router]
    B --> C[MockupsIndex]
    B --> D[TechnologyRadarPage]
    B --> E[HeatmapMatrixPage]
    B --> F[AdminPanelPage]
    B --> G[PublicDemoPage]
    
    D --> H[TechnologyRadar]
    D --> I[FilterPanel]
    D --> J[TechDetails]
    
    E --> K[HeatmapMatrix]
    E --> I
    E --> L[CellDetails]
    
    F --> M[UserManagement]
    F --> N[DataRefresh]
    F --> O[Analytics]
    
    G --> H
    G --> K
    G --> P[AccessPrompt]
```

---

## API Layer

```mermaid
graph LR
    subgraph Client["Frontend"]
        A[Supabase Client]
    end
    
    subgraph API["API Endpoints"]
        B[/auth/*]
        C[/rest/v1/technologies]
        D[/rest/v1/scores]
        E[/rest/v1/profiles]
        F[/functions/v1/data-refresh]
        G[/functions/v1/export-pdf]
    end
    
    subgraph DB["Database"]
        H[(PostgreSQL)]
    end
    
    A --> B
    A --> C
    A --> D
    A --> E
    A --> F
    A --> G
    
    C --> H
    D --> H
    E --> H
    F --> H
    G --> H
```
