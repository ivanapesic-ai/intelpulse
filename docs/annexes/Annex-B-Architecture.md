# Annex B: Technical Architecture
## AI-CE Heatmap Platform - System Design

---

## 1. System Overview

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              USERS                                          │
│    ┌──────────┐     ┌──────────────┐     ┌─────────────────┐               │
│    │ Public   │     │ Premium      │     │ Admin           │               │
│    │ Visitors │     │ Subscribers  │     │ (BluSpecs)      │               │
│    └────┬─────┘     └──────┬───────┘     └────────┬────────┘               │
└─────────┼──────────────────┼───────────────────────┼────────────────────────┘
          │                  │                       │
          ▼                  ▼                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           FRONTEND                                          │
│   React + TypeScript + Tailwind CSS + Recharts                              │
│   ┌────────────────┐  ┌────────────────┐  ┌────────────────┐               │
│   │ Public Demo    │  │ Premium        │  │ Admin Panel    │               │
│   │ - Limited view │  │ - Full access  │  │ - User mgmt    │               │
│   │ - Lead capture │  │ - Export       │  │ - Data refresh │               │
│   └────────────────┘  └────────────────┘  └────────────────┘               │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ HTTPS (TLS 1.3)
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                    LOVABLE CLOUD (EU-HOSTED)                                │
│                                                                             │
│   ┌─────────────────────────────────────────────────────────────────────┐  │
│   │                         API LAYER                                    │  │
│   │   ┌─────────────┐   ┌─────────────┐   ┌─────────────────────────┐   │  │
│   │   │ Supabase    │   │ Row-Level   │   │ Edge Functions          │   │  │
│   │   │ Auth        │   │ Security    │   │ (Deno)                  │   │  │
│   │   │ - Email     │   │ - Public    │   │ - AI Processing         │   │  │
│   │   │ - Roles     │   │ - Premium   │   │ - Data Integration      │   │  │
│   │   │             │   │ - Admin     │   │ - Report Generation     │   │  │
│   │   └─────────────┘   └─────────────┘   └─────────────────────────┘   │  │
│   └─────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│   ┌─────────────────────────────────────────────────────────────────────┐  │
│   │                      DATABASE LAYER                                  │  │
│   │                      PostgreSQL                                      │  │
│   │   ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐           │  │
│   │   │ users    │  │ techno-  │  │ scores   │  │ access   │           │  │
│   │   │          │  │ logies   │  │          │  │ _logs    │           │  │
│   │   └──────────┘  └──────────┘  └──────────┘  └──────────┘           │  │
│   └─────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│   ┌─────────────────────────────────────────────────────────────────────┐  │
│   │                      STORAGE LAYER                                   │  │
│   │   ┌─────────────────────┐   ┌─────────────────────┐                 │  │
│   │   │ Document Storage    │   │ Export Files        │                 │  │
│   │   │ (PDF, PPT uploads)  │   │ (Generated reports) │                 │  │
│   │   └─────────────────────┘   └─────────────────────┘                 │  │
│   └─────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                        EXTERNAL DATA SOURCES                                │
│   ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│   │ Dealroom     │  │ PATSTAT/EPO  │  │ CEI Internal │  │ Public       │  │
│   │ REST API     │  │ CSV Import   │  │ PPT/PDF      │  │ Sources      │  │
│   └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Data Flow Architecture

### Data Ingestion Pipeline

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         DATA INGESTION FLOW                                 │
└─────────────────────────────────────────────────────────────────────────────┘

                    ADMIN TRIGGERS "REFRESH DATA"
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                      EDGE FUNCTION: data-refresh                            │
│                                                                             │
│   ┌────────────────────────────────────────────────────────────────────┐   │
│   │                     PARALLEL PROCESSING                             │   │
│   │                                                                     │   │
│   │   ┌──────────────┐   ┌──────────────┐   ┌──────────────┐          │   │
│   │   │ Dealroom     │   │ PATSTAT      │   │ Public       │          │   │
│   │   │ API Fetch    │   │ CSV Parse    │   │ Sources      │          │   │
│   │   └──────┬───────┘   └──────┬───────┘   └──────┬───────┘          │   │
│   │          │                  │                   │                  │   │
│   │          ▼                  ▼                   ▼                  │   │
│   │   ┌──────────────────────────────────────────────────────────┐    │   │
│   │   │              NORMALIZE & TRANSFORM                        │    │   │
│   │   │   • Map to unified schema                                 │    │   │
│   │   │   • Extract key metrics                                   │    │   │
│   │   │   • Apply categorization rules                            │    │   │
│   │   └──────────────────────────────────────────────────────────┘    │   │
│   │                              │                                     │   │
│   └──────────────────────────────┼─────────────────────────────────────┘   │
│                                  ▼                                          │
│   ┌────────────────────────────────────────────────────────────────────┐   │
│   │                    CEI DOCUMENT PROCESSING                          │   │
│   │                                                                     │   │
│   │   ┌──────────────┐   ┌──────────────┐   ┌──────────────┐          │   │
│   │   │ Upload       │   │ AI Parsing   │   │ Structured   │          │   │
│   │   │ PPT/PDF      │──▶│ (Lovable AI) │──▶│ Data Output  │          │   │
│   │   └──────────────┘   └──────────────┘   └──────────────┘          │   │
│   │                                                                     │   │
│   └────────────────────────────────────────────────────────────────────┘   │
│                                  │                                          │
│                                  ▼                                          │
│   ┌────────────────────────────────────────────────────────────────────┐   │
│   │                      SCORING ENGINE                                 │   │
│   │   • Calculate TRL scores                                            │   │
│   │   • Compute market adoption metrics                                 │   │
│   │   • Assess innovation signals                                       │   │
│   │   • Generate composite scores                                       │   │
│   └────────────────────────────────────────────────────────────────────┘   │
│                                  │                                          │
│                                  ▼                                          │
│   ┌────────────────────────────────────────────────────────────────────┐   │
│   │                      DATABASE UPDATE                                │   │
│   │   • Upsert technologies                                             │   │
│   │   • Update scores table                                             │   │
│   │   • Log refresh metadata                                            │   │
│   └────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Database Schema

### Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          DATABASE SCHEMA                                    │
└─────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────┐         ┌──────────────────────┐
│       profiles       │         │        roles         │
├──────────────────────┤         ├──────────────────────┤
│ id (PK, UUID)        │         │ id (PK, UUID)        │
│ user_id (FK→auth)    │         │ name (unique)        │
│ email                │    ┌───▶│ permissions (JSONB)  │
│ organization         │    │    └──────────────────────┘
│ role_id (FK)─────────┼────┘
│ access_until (date)  │
│ created_at           │
│ updated_at           │
└──────────┬───────────┘
           │
           │ 1:N
           ▼
┌──────────────────────┐
│     access_logs      │
├──────────────────────┤
│ id (PK, UUID)        │
│ user_id (FK)         │
│ action (enum)        │
│ resource             │
│ metadata (JSONB)     │
│ created_at           │
└──────────────────────┘

┌──────────────────────┐         ┌──────────────────────┐
│     technologies     │         │      categories      │
├──────────────────────┤         ├──────────────────────┤
│ id (PK, UUID)        │         │ id (PK, UUID)        │
│ name                 │    ┌───▶│ name                 │
│ slug (unique)        │    │    │ parent_id (FK, self) │
│ description          │    │    │ sphere               │
│ category_id (FK)─────┼────┘    │ display_order        │
│ metadata (JSONB)     │         └──────────────────────┘
│ is_public (bool)     │
│ created_at           │
│ updated_at           │
└──────────┬───────────┘
           │
           │ 1:N
           ▼
┌──────────────────────┐         ┌──────────────────────┐
│       scores         │         │    data_sources      │
├──────────────────────┤         ├──────────────────────┤
│ id (PK, UUID)        │         │ id (PK, UUID)        │
│ technology_id (FK)   │    ┌───▶│ name                 │
│ dimension (enum)     │    │    │ type (API/CSV/DOC)   │
│ value (decimal)      │    │    │ config (JSONB)       │
│ source_id (FK)───────┼────┘    │ last_refresh         │
│ confidence (decimal) │         │ record_count         │
│ assessed_at          │         └──────────────────────┘
│ created_at           │
└──────────────────────┘

┌──────────────────────┐
│    refresh_logs      │
├──────────────────────┤
│ id (PK, UUID)        │
│ source_id (FK)       │
│ status (enum)        │
│ records_processed    │
│ errors (JSONB)       │
│ started_at           │
│ completed_at         │
└──────────────────────┘
```

### Key Tables Detail

| Table | Purpose | RLS Policy |
|-------|---------|------------|
| `profiles` | Extended user data, role assignment | Users see own; Admins see all |
| `roles` | Permission definitions (public, premium, admin) | Read-only for authenticated |
| `technologies` | Master technology records | Public sees `is_public=true`; Premium/Admin see all |
| `categories` | Technology taxonomy/hierarchy | Public read |
| `scores` | Maturity scores by dimension | Same as technologies |
| `data_sources` | External source configuration | Admin only |
| `access_logs` | User activity tracking | Admin only |
| `refresh_logs` | Data refresh history | Admin only |

---

## 4. AI Processing Pipeline

### Document Extraction Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    AI DOCUMENT PROCESSING PIPELINE                          │
└─────────────────────────────────────────────────────────────────────────────┘

┌────────────────┐     ┌────────────────┐     ┌────────────────┐
│ Admin Uploads  │     │ File Stored in │     │ Edge Function  │
│ PPT/PDF File   │────▶│ Supabase       │────▶│ Triggered      │
│                │     │ Storage        │     │                │
└────────────────┘     └────────────────┘     └───────┬────────┘
                                                      │
                                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                      EDGE FUNCTION: process-document                        │
│                                                                             │
│   ┌────────────────────────────────────────────────────────────────────┐   │
│   │  1. DOCUMENT PARSING                                                │   │
│   │     • Extract text from PDF/PPT                                     │   │
│   │     • Identify sections and structure                               │   │
│   │     • Extract tables and data points                                │   │
│   └────────────────────────────────────────────────────────────────────┘   │
│                                  │                                          │
│                                  ▼                                          │
│   ┌────────────────────────────────────────────────────────────────────┐   │
│   │  2. LOVABLE AI PROCESSING                                           │   │
│   │     Model: google/gemini-2.5-flash                                  │   │
│   │                                                                     │   │
│   │     Prompt Structure:                                               │   │
│   │     ┌────────────────────────────────────────────────────────────┐ │   │
│   │     │ System: You are a technology analyst extracting structured  │ │   │
│   │     │         data from CEI documents for the ML-SDV sphere.     │ │   │
│   │     │                                                             │ │   │
│   │     │ Task: Extract technologies with:                            │ │   │
│   │     │   - Name and description                                    │ │   │
│   │     │   - Category (Cloud/Edge/IoT/AI)                           │ │   │
│   │     │   - TRL assessment (1-9)                                    │ │   │
│   │     │   - Key metrics mentioned                                   │ │   │
│   │     │   - EU strategic relevance                                  │ │   │
│   │     └────────────────────────────────────────────────────────────┘ │   │
│   │                                                                     │   │
│   │     Output: Structured JSON via tool calling                        │   │
│   └────────────────────────────────────────────────────────────────────┘   │
│                                  │                                          │
│                                  ▼                                          │
│   ┌────────────────────────────────────────────────────────────────────┐   │
│   │  3. VALIDATION & ENRICHMENT                                         │   │
│   │     • Validate extracted data against schema                        │   │
│   │     • Cross-reference with existing technologies                    │   │
│   │     • Flag uncertain extractions for review                         │   │
│   └────────────────────────────────────────────────────────────────────┘   │
│                                  │                                          │
│                                  ▼                                          │
│   ┌────────────────────────────────────────────────────────────────────┐   │
│   │  4. DATABASE UPDATE                                                 │   │
│   │     • Upsert technologies                                           │   │
│   │     • Create score records with source reference                    │   │
│   │     • Log processing results                                        │   │
│   └────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 5. Security Architecture

### Authentication & Authorization

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       SECURITY LAYERS                                       │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ LAYER 1: NETWORK SECURITY                                                   │
│   • HTTPS/TLS 1.3 encryption in transit                                     │
│   • EU-region hosting (AWS eu-west-1 / eu-central-1)                        │
│   • DDoS protection via Cloudflare/AWS Shield                               │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ LAYER 2: AUTHENTICATION                                                     │
│   Supabase Auth                                                             │
│   ┌────────────────┐   ┌────────────────┐   ┌────────────────┐             │
│   │ Email/Password │   │ Magic Link     │   │ Admin Invite   │             │
│   │ (Premium)      │   │ (Optional)     │   │ (BluSpecs)     │             │
│   └────────────────┘   └────────────────┘   └────────────────┘             │
│                                                                             │
│   JWT Token issued on login, validated on each request                      │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ LAYER 3: AUTHORIZATION (Row-Level Security)                                 │
│                                                                             │
│   Role: PUBLIC (unauthenticated)                                            │
│   ┌──────────────────────────────────────────────────────────────────────┐ │
│   │ SELECT on technologies WHERE is_public = true                         │ │
│   │ SELECT on categories (all)                                            │ │
│   │ No INSERT/UPDATE/DELETE                                               │ │
│   └──────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│   Role: PREMIUM (authenticated, role='premium')                             │
│   ┌──────────────────────────────────────────────────────────────────────┐ │
│   │ SELECT on technologies (all)                                          │ │
│   │ SELECT on scores (all)                                                │ │
│   │ INSERT on access_logs (own records)                                   │ │
│   │ No INSERT/UPDATE/DELETE on core data                                  │ │
│   └──────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│   Role: ADMIN (authenticated, role='admin')                                 │
│   ┌──────────────────────────────────────────────────────────────────────┐ │
│   │ Full CRUD on all tables                                               │ │
│   │ Access to admin-only edge functions                                   │ │
│   │ Data refresh and user management                                      │ │
│   └──────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ LAYER 4: DATA SECURITY                                                      │
│   • Encryption at rest (AES-256)                                            │
│   • Secrets stored in Supabase Vault                                        │
│   • API keys for external services never exposed to frontend                │
│   • Audit logging for all data modifications                                │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 6. Integration Specifications

### External API Integrations

| Source | Integration Type | Authentication | Rate Limits | Data Format |
|--------|------------------|----------------|-------------|-------------|
| **Dealroom** | REST API | API Key (Bearer) | TBD (per subscription) | JSON |
| **PATSTAT/EPO** | CSV Import | N/A (public) | N/A | CSV |
| **EU Horizon** | REST API | API Key | 100 req/min | JSON |
| **GitHub** | GraphQL API | Personal Token | 5000 req/hour | JSON |
| **arXiv** | REST API | None | 3 req/sec | XML/JSON |

### Edge Functions

| Function | Purpose | Trigger | Auth Required |
|----------|---------|---------|---------------|
| `data-refresh` | Orchestrate data ingestion | Admin action | Admin |
| `process-document` | AI extraction from PDF/PPT | File upload | Admin |
| `generate-report` | Create PDF export | User request | Premium |
| `calculate-scores` | Run scoring engine | After data refresh | System |

---

## 7. Deployment Architecture

### Infrastructure Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        PRODUCTION DEPLOYMENT                                │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                           CDN LAYER                                         │
│                     (Lovable CDN / Cloudflare)                              │
│   • Static asset caching                                                    │
│   • Global edge distribution                                                │
│   • SSL termination                                                         │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                        LOVABLE CLOUD (EU)                                   │
│                                                                             │
│   ┌──────────────────────┐   ┌──────────────────────┐                      │
│   │   Frontend Hosting    │   │    Edge Functions    │                      │
│   │   (Static React App)  │   │    (Deno Runtime)    │                      │
│   └──────────────────────┘   └──────────────────────┘                      │
│                                                                             │
│   ┌──────────────────────────────────────────────────────────────────────┐ │
│   │                     Supabase Infrastructure                           │ │
│   │   ┌────────────┐   ┌────────────┐   ┌────────────┐                   │ │
│   │   │ PostgreSQL │   │ Auth       │   │ Storage    │                   │ │
│   │   │ (Primary)  │   │ (GoTrue)   │   │ (S3-compat)│                   │ │
│   │   └────────────┘   └────────────┘   └────────────┘                   │ │
│   │                                                                       │ │
│   │   ┌────────────┐   ┌────────────┐                                    │ │
│   │   │ Realtime   │   │ PostgREST  │                                    │ │
│   │   │ (WebSocket)│   │ (REST API) │                                    │ │
│   │   └────────────┘   └────────────┘                                    │ │
│   └──────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Scalability Considerations

| Component | Scaling Strategy | Capacity |
|-----------|------------------|----------|
| Frontend | CDN distribution | Unlimited |
| Edge Functions | Auto-scaling | Up to 1M invocations/month |
| Database | Connection pooling | 100 concurrent connections (upgradable) |
| Storage | S3-compatible | 1GB included (expandable) |

---

*This architecture is designed for the MVP phase and can be extended as the platform grows.*
