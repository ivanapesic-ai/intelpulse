# Annex A: Technical Architecture

## Technology Stack

| Layer | Technology | Rationale |
|-------|------------|-----------|
| Frontend | React, TypeScript, Tailwind CSS | Modern, maintainable, responsive |
| Visualizations | Recharts | Production-ready charting library |
| Backend | Lovable Cloud (Supabase) | EU-hosted, built-in auth, scalable |
| AI Processing | Lovable AI Gateway | Document parsing, no external API keys needed |
| Hosting | EU Region | GDPR compliance, data residency |

---

## System Components

### Frontend Layer
- React + TypeScript + Tailwind CSS
- Public Demo View
- Premium Dashboard
- Admin Panel

### Backend Layer (Lovable Cloud - EU Hosted)
- Authentication & User Management
- PostgreSQL Database
- Row-Level Security (RLS)
- Edge Functions (AI Processing)

### External Data Sources
- Dealroom API (startup/funding data)
- PATSTAT/EPO (patent data via CSV)
- CEI Internal Datasets (format TBD)
- Public Sources (EU Horizon, GitHub, arXiv)

---

## Architecture Diagrams

> **See:** [Architecture Diagrams](../visuals/architecture-diagrams.md) for detailed Mermaid diagrams

### System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         USERS                                    │
│  ┌──────────┐  ┌──────────────┐  ┌──────────────────┐           │
│  │  Public  │  │   Premium    │  │   BluSpecs       │           │
│  │  Visitor │  │   Client     │  │   Admin          │           │
│  └────┬─────┘  └──────┬───────┘  └────────┬─────────┘           │
└───────┼───────────────┼───────────────────┼─────────────────────┘
        │               │                   │
        ▼               ▼                   ▼
┌─────────────────────────────────────────────────────────────────┐
│                     FRONTEND (React)                             │
│  ┌──────────┐  ┌──────────────┐  ┌──────────────────┐           │
│  │  Public  │  │   Premium    │  │   Admin          │           │
│  │  Demo    │  │   Dashboard  │  │   Panel          │           │
│  └──────────┘  └──────────────┘  └──────────────────┘           │
└─────────────────────────┬───────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                BACKEND (Lovable Cloud - EU)                      │
│  ┌────────────┐  ┌──────────────┐  ┌──────────────────┐         │
│  │   Auth &   │  │   PostgreSQL │  │   Edge           │         │
│  │   Users    │  │   Database   │  │   Functions      │         │
│  └────────────┘  └──────────────┘  └──────────────────┘         │
└─────────────────────────┬───────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                    DATA SOURCES                                  │
│  ┌──────────┐  ┌──────────────┐  ┌──────────────────┐           │
│  │ Dealroom │  │   PATSTAT    │  │   CEI Internal   │           │
│  │   API    │  │   (CSV)      │  │   Datasets       │           │
│  └──────────┘  └──────────────┘  └──────────────────┘           │
└─────────────────────────────────────────────────────────────────┘
```

### Security Architecture

- **Authentication Layer**: Email/password login, session management
- **Role-Based Access**: Public, Premium, Admin roles
- **Row-Level Security**: Database-level access control
- **Data Access**: Role-appropriate data filtering

---

## Technical Advantages

- **No vendor lock-in**: Standard technologies, exportable data
- **EU compliance built-in**: Data residency, security best practices
- **Scalable architecture**: Handles growth from 10 to 10,000 users
- **Maintainable codebase**: Clean architecture for future development
