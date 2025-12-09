# Data Flow Diagrams
## AI-CE Heatmap Platform - Data Processing Pipeline

---

## Data Refresh Flow

```mermaid
flowchart TD
    A[🔄 Admin Triggers Refresh] --> B[Edge Function: data-refresh]
    
    B --> C{Parallel Fetch}
    
    C --> D[📊 Dealroom API]
    C --> E[📄 PATSTAT CSV]
    C --> F[🤖 AI Doc Parsing]
    C --> G[🌐 Public Sources]
    
    D --> H[Normalize Data]
    E --> H
    F --> H
    G --> H
    
    H --> I[🧮 Scoring Engine]
    
    I --> J[Calculate TRL]
    I --> K[Compute Market Score]
    I --> L[Assess Innovation]
    I --> M[Evaluate EU Alignment]
    
    J --> N[Composite Score]
    K --> N
    L --> N
    M --> N
    
    N --> O[(Database Update)]
    
    O --> P[✅ Visualizations Updated]
```

---

## AI Document Processing

```mermaid
flowchart LR
    A[📎 Upload PPT/PDF] --> B[File Storage]
    
    B --> C[Edge Function: parse-document]
    
    C --> D[Lovable AI Gateway]
    
    D --> E{Document Type}
    
    E -->|PPT| F[Extract Slides]
    E -->|PDF| G[Extract Pages]
    
    F --> H[Text Extraction]
    G --> H
    
    H --> I[Entity Recognition]
    
    I --> J[Technology Mentions]
    I --> K[TRL Indicators]
    I --> L[Policy References]
    
    J --> M[Map to Taxonomy]
    K --> M
    L --> M
    
    M --> N{Confidence Check}
    
    N -->|>70%| O[Auto-categorize]
    N -->|<70%| P[Flag for Review]
    
    O --> Q[(Save to Database)]
    P --> Q
```

---

## User Authentication Flow

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
    
    U->>F: Request technologies
    F->>D: Query with auth header
    D->>D: Apply RLS policies
    D-->>F: Filtered results
    F-->>U: Display data
```

---

## Data Export Flow

```mermaid
flowchart TD
    A[📥 User Requests Export] --> B{Export Format}
    
    B -->|CSV| C[Generate CSV]
    B -->|PDF| D[Edge Function: export-pdf]
    B -->|PNG/SVG| E[Client-side Render]
    
    C --> F[Download File]
    
    D --> G[Fetch Current Data]
    G --> H[Apply Filters]
    H --> I[Generate Report Layout]
    I --> J[Render to PDF]
    J --> K[Upload to Storage]
    K --> L[Return Signed URL]
    L --> F
    
    E --> M[Canvas/SVG Export]
    M --> F
    
    F --> N[📊 User Downloads]
```

---

## Real-time Data Sync

```mermaid
flowchart LR
    subgraph Admin["Admin Panel"]
        A[Trigger Refresh]
        B[Add/Remove User]
    end
    
    subgraph Backend["Backend"]
        C[(PostgreSQL)]
        D[Realtime Channel]
    end
    
    subgraph Premium["Premium Users"]
        E[Dashboard 1]
        F[Dashboard 2]
        G[Dashboard N]
    end
    
    A --> C
    B --> C
    
    C --> D
    
    D --> E
    D --> F
    D --> G
    
    style D fill:#10b981,color:#fff
```

---

## Scoring Calculation Flow

```mermaid
flowchart TD
    subgraph Inputs["📥 Data Inputs"]
        A[Dealroom Data]
        B[PATSTAT Patents]
        C[CEI Assessments]
        D[Public Sources]
    end
    
    subgraph Dimension1["TRL Score (25%)"]
        E[Expert Assessment]
        F[AI TRL Detection]
        G[Deployment Evidence]
    end
    
    subgraph Dimension2["Market Score (25%)"]
        H[Funding Activity × 0.30]
        I[Company Count × 0.25]
        J[Deployments × 0.25]
        K[Growth Rate × 0.20]
    end
    
    subgraph Dimension3["Innovation Score (25%)"]
        L[Patents × 0.35]
        M[Publications × 0.25]
        N[Open Source × 0.20]
        O[EU Projects × 0.20]
    end
    
    subgraph Dimension4["EU Alignment (25%)"]
        P[Policy Mentions]
        Q[Horizon Funding]
        R[IPCEI Inclusion]
    end
    
    A --> H
    A --> I
    B --> L
    C --> E
    C --> P
    D --> M
    D --> N
    
    E --> S[TRL: 0-9]
    F --> S
    G --> S
    
    H --> T[Market: 0-9]
    I --> T
    J --> T
    K --> T
    
    L --> U[Innovation: 0-9]
    M --> U
    N --> U
    O --> U
    
    P --> V[EU: 0-9]
    Q --> V
    R --> V
    
    S --> W[🎯 Composite Score]
    T --> W
    U --> W
    V --> W
    
    W --> X{Radar Placement}
    
    X -->|7.5-9.0| Y[Adopt Ring]
    X -->|5.0-7.4| Z[Trial Ring]
    X -->|3.0-4.9| AA[Assess Ring]
    X -->|0.0-2.9| AB[Hold Ring]
```
