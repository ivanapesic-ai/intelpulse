# Interoperability & Data Space Ecosystem Reference

> Consolidated intelligence on standards bodies, data spaces, open APIs, and interoperability initiatives relevant to the SDV/EV charging technology landscape.
>
> Last updated: 2026-04-01

---

## 1. Standards & Industry Consortia

### 1.1 CharIN (Charging Interface Initiative)
- **Type**: Private Consortium
- **Focus**: EV charging interoperability — CCS, MCS (Megawatt Charging), Plug & Charge
- **Key Standards**: ISO 15118 series, DIN 70121, IEC 61851
- **Activities**: Testivals (interoperability testing events), VOLTS conferences, certification programs
- **Members**: 300+ (OEMs, CPOs, utilities, chip makers)
- **Website**: https://www.charin.global/
- **Data Access**: Event reports (public), test results (members only)
- **Platform Integration**: ✅ Already integrated — CharIN test events & results in `charin_test_events` / `charin_test_results`

### 1.2 Catena-X / Eclipse Tractus-X
- **Type**: Private Consortium + Open-Source Project
- **Focus**: Automotive supply chain data ecosystem — interoperable, sovereign data exchange
- **Key Standards**: CX-Saturn (current release), based on GAIA-X + IDS Framework
- **Core Elements**:
  - Standardised data formats (BOMs, carbon footprints, material traceability)
  - Open APIs (EDC — Eclipse Dataspace Connector)
  - Uniform processes (traceability, CO₂ tracking)
  - Data sovereignty protocols
- **Certification**: Modular system — Connector, Traceability, MaaS, PCF modules
- **Roles**: Enablement Service Provider, Core Service Provider, Business Application Provider
- **Members**: BMW, Mercedes-Benz, Bosch, SAP, Siemens, T-Systems, and 100+ others
- **Website**: https://catena-x.net/ | https://eclipse-tractusx.github.io/
- **Open-Source**: Apache 2.0 — full EDC connector framework on GitHub (`eclipse-tractusx`)
- **Data Access**: Code is open; **data exchange requires membership** via Cofinity-X operating company
- **Platform Integration**: 🔲 Not yet — could monitor Tractus-X GitHub repos via existing GitHub fetcher

### 1.3 5G-ACIA (5G Alliance for Connected Industries and Automation)
- **Type**: Private Consortium (under ZVEI umbrella)
- **Focus**: Industrial 5G for manufacturing, logistics, automotive — bridging ICT and OT
- **Key Activities**:
  - White papers on industrial 5G deployment, ROI calculation, spectrum policy
  - Testbed endorsement program (interoperability & TSN testing)
  - 5G RedCap assessment for Industrial IoT
  - Plenary meetings (37th–38th in 2026), Hannover Messe "5G Arena"
- **Relevance to SDV**: V2X communication, connected factory, OTA updates, edge computing
- **Members**: ABB, Bosch, Ericsson, Huawei, Nokia, Qualcomm, Siemens, Volkswagen, Deutsche Telekom, NTT DoCoMo, and 60+ others
- **Website**: https://5g-acia.org/
- **Data Access**: White papers (public download), testbed results (members), no public API
- **Platform Integration**: 🔲 Not yet — could add as consortia issuing body for 5G/V2X-related keywords

### 1.4 5GAA (5G Automotive Association)
- **Type**: Private Consortium
- **Focus**: Connected mobility — C-V2X, V2X communication, MEC, network slicing for automotive
- **Key Standards**: 3GPP C-V2X (PC5 + Uu), ETSI ITS standards
- **Members**: Audi, BMW, Ford, Huawei, Intel, Qualcomm, Samsung, Vodafone
- **Website**: https://5gaa.org/
- **Already tracked**: Listed in `ISSUING_BODIES_CONSORTIA` in platform code

### 1.5 AUTOSAR
- **Type**: Private Consortium
- **Focus**: Standardised software architecture for automotive ECUs
- **Key Standards**: Classic AUTOSAR, Adaptive AUTOSAR (SOA-based for SDV)
- **Already tracked**: Listed in `ISSUING_BODIES_CONSORTIA`

### 1.6 COVESA (Connected Vehicle Systems Alliance)
- **Type**: Private Consortium
- **Focus**: Vehicle Signal Specification (VSS), in-vehicle data standardisation
- **Already tracked**: Listed in `ISSUING_BODIES_CONSORTIA`

### 1.7 Eclipse Foundation (Eclipse SDV Working Group)
- **Type**: Open-Source Foundation
- **Focus**: Eclipse SDV projects — Velocitas, Kuksa, Leda, Ankaios
- **Already tracked**: Listed in `ISSUING_BODIES_CONSORTIA`

---

## 2. European Data Spaces & Mobility Initiatives

### 2.1 Mobility Data Space (MDS)
- **Type**: Data sharing community (Germany-led, expanding EU-wide)
- **Focus**: Connecting data providers & consumers for mobility innovation
- **Architecture**: Built on GAIA-X + IDS principles, sovereign data exchange
- **Data Categories**:
  - Motion data (mobile phone-based movement)
  - Vehicle status data (OEM-provided)
  - Driving speed (real-time, pan-European coverage)
  - Origin-destination analyses
  - EV charging data
  - Parking data
  - Traffic flow / congestion
- **Members**: OEMs, mobility service providers, municipalities, insurers, startups
- **Mobilithek Integration**: Open data from Germany's national mobility data platform is accessible within MDS
- **Website**: https://mobility-dataspace.eu/
- **Data Access**: **Membership required** — contact `community@mobility-dataspace.eu`
- **Open Component**: Mobilithek datasets (open license) are brokered through MDS
- **Platform Integration**: 🔲 Potential — Mobilithek open data could be fetched directly

### 2.2 EONA-X
- **Type**: Non-profit association (France)
- **Focus**: Data sharing for transport, mobility, and tourism
- **Members**: SNCF, Air France, Amadeus, Renault, and French transport leaders
- **Website**: https://eona-x.eu/
- **Data Access**: **Membership required**
- **Platform Integration**: 🔲 Reference only — no open API

### 2.3 PrepDSpace4Mobility (CSA)
- **Type**: EU Coordination & Support Action (12-month project)
- **Focus**: Laying foundations for the **common European mobility data space**
- **Key Outputs**:
  - Inventory of existing EU mobility data ecosystems (interactive map)
  - Gap analysis of data sharing frameworks
  - Common building blocks & governance proposals
  - Recommendations for trust, interoperability, data sovereignty
- **Website**: https://mobilitydataspace-csa.eu/
- **Data Access**: **Public inventory** of data ecosystems at `/inventory/` — catalogues EU-wide initiatives
- **Platform Integration**: 🔲 Valuable reference — the inventory maps the entire EU landscape

### 2.4 MobiSpaces (Horizon Europe — CORDIS 101070279)
- **Type**: EU-funded R&D project (Horizon Europe)
- **Focus**: End-to-end mobility data governance platform
- **Key Innovation**: Decentralised actionable insights from mobile sensors & IoT
- **Use Cases**: Smart public transport, vessel tracking, green mobility, urban planning, air quality
- **Budget**: €10.4M EU contribution
- **Duration**: 2022–2025
- **Website**: https://mobispaces.2way.it/ | https://cordis.europa.eu/project/id/101070279
- **Data Access**: Research deliverables (public), platform (consortium only)
- **Platform Integration**: 🔲 Could be seeded into `cordis_eu_projects` table

### 2.5 DS4SSCC (European Data Space for Smart Communities)
- **Type**: EU deployment action (DEP)
- **Focus**: Cross-sectorial data space for governments — Green Deal goals
- **Scope**: Smart cities, energy, mobility, environment — all government levels
- **Current Phase**: Deployment (moved from preparation) — Round 4 Call for Pilots open
- **Website**: https://www.ds4sscc.eu/
- **Data Access**: **Pilot program** — open calls for participation
- **Relevance**: Intersects V2G, smart grid, charging infrastructure at city/regional level
- **Platform Integration**: 🔲 Reference — tracks policy/deployment momentum

### 2.6 NAPCORE (National Access Point Coordination Organisation for Europe)
- **Type**: EU coordination platform
- **Focus**: Harmonising 30+ National Access Points (NAPs) for mobility data across EU
- **Key Standard**: `mobilityDCAT-AP` — metadata specification for mobility data portals
- **Scope**: Traffic data, multimodal transport, parking, EV charging, road infrastructure
- **Website**: https://napcore.eu/
- **Data Access**: **Each NAP is independently accessible** — many have REST APIs
- **Platform Integration**: ⭐ High potential — NAPs are the open data layer for EU mobility

---

## 3. Commercial Data Providers

### 3.1 Mobito
- **Type**: Commercial vehicle data platform
- **Focus**: Anonymised, high-resolution vehicle data (GPS traces, speed, fuel, acceleration)
- **Use Cases**:
  - EV charging station site selection
  - Traffic management & road infrastructure monitoring
  - Driving behaviour analysis
  - Fleet route optimisation
  - Event planning (crowd/traffic patterns)
- **Data Sources**: OEM telematics, fleet operators, connected car platforms
- **Coverage**: Europe-focused
- **Website**: https://www.mobito.io/
- **Data Access**: **Commercial API** — sales-led ("Let's Talk" model)
- **Platform Integration**: 🔲 Would require commercial agreement

---

## 4. Open Data & APIs Available for Integration

### 4.1 Freely Accessible (No Membership Required)

| Source | API/Endpoint | Data Type | Relevance |
|--------|-------------|-----------|-----------|
| **MobilityData.org** | `api.mobilitydatabase.org` | 2,000+ GTFS transit feeds globally | Transport coverage signal |
| **Mobilithek** | `mobilithek.info` (REST) | German traffic, parking, EV charging, road data | Direct infrastructure data |
| **NAPCORE NAPs** | Per-country portals | Traffic, multimodal, parking, charging per EU country | Pan-EU infrastructure |
| **CORDIS SPARQL** | `cordis.europa.eu/datalab/sparql` | EU R&D project metadata & funding | ✅ Already integrated |
| **Tractus-X GitHub** | `github.com/eclipse-tractusx` | Open-source SDV code activity | Via existing GitHub fetcher |
| **5G-ACIA White Papers** | `5g-acia.org/whitepapers/` | Industrial 5G research & deployment insights | Scrapeable (public PDFs) |
| **EPO Open Patent Services** | `ops.epo.org` | Patent data | ✅ Already integrated |

### 4.2 Membership / Commercial (Requires Agreement)

| Source | Access Model | Data Type |
|--------|-------------|-----------|
| **Mobility Data Space** | Membership | Vehicle motion, speed, OD matrices, charging data |
| **Mobito** | Commercial API | Anonymised GPS, speed, fuel consumption |
| **EONA-X** | Non-profit membership | French transport/tourism data |
| **DS4SSCC** | Pilot program | Smart city cross-sector data |
| **Catena-X** | Membership (via Cofinity-X) | Supply chain data exchange |

---

## 5. Recommended Integration Priority

### Phase 1 — Quick Wins (Already Have Infrastructure)
1. **Add 5G-ACIA as consortia body** → `keyword_standards` for 5G/V2X/TSN keywords
2. **Add Catena-X as consortia body** → `keyword_standards` for data interop keywords
3. **Seed MobiSpaces into CORDIS** → `cordis_eu_projects` table
4. **Monitor Tractus-X GitHub repos** → via existing `fetch-github-activity` function

### Phase 2 — New Data Sources
5. **Mobilithek open data** → new edge function to fetch German EV charging/traffic data
6. **MobilityData GTFS API** → transit coverage signal per keyword
7. **NAPCORE NAP catalogue** → map which countries have data for which technologies

### Phase 3 — Strategic Partnerships
8. **MDS membership** → access to real vehicle/charging data for deeper interop analysis
9. **5G-ACIA white paper ingestion** → PDF processing via existing `process-pdf` function
10. **DS4SSCC pilot participation** → track smart city deployment status

---

## 6. Mapping to Platform Keywords

| Initiative | Relevant Keywords |
|-----------|------------------|
| CharIN | ISO 15118, Plug & Charge, MCS, CCS, V2G, Bidirectional Charging |
| Catena-X | Digital Twin, Data Interop, Supply Chain, PCF |
| 5G-ACIA | 5G V2X, C-V2X, TSN, Edge Computing, Network Slicing |
| 5GAA | C-V2X, V2X Communication, Cellular V2X |
| MDS | Connected Vehicle Data, Mobility-as-a-Service |
| MobiSpaces | Smart Mobility, Green Transport, Data Governance |
| NAPCORE | Multimodal Transport, Traffic Data, Charging Infrastructure |
| DS4SSCC | Smart Grid, V2G, Smart City |
| Mobito | Fleet Management, EV Charging Site Selection |
| EONA-X | Multimodal Transport, Tourism Mobility |

---

## 7. Architecture & Three Horizons Mapping

The layered architecture maps directly to the platform's **Three Horizons** intelligence model:

```
┌─────────────────────────────────────────────────────────────┐
│                    EU DATA STRATEGY                          │
│            (Data Act, Data Governance Act)                   │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│   ┌─────────────┐  ┌──────────────┐  ┌───────────┐          │
│   │  Catena-X    │  │     MDS      │  │  DS4SSCC  │          │
│   │ (Automotive) │  │  (Mobility)  │  │  (Cities) │          │
│   └──────┬──────┘  └──────┬───────┘  └─────┬─────┘          │
│          │                │                 │                 │
│   ┌──────┴──────────────────┴─────────────────┴───┐          │
│   │        GAIA-X / IDS Reference Architecture     │          │
│   │        (Sovereign Data Exchange Framework)     │          │
│   └──────┬──────────────────┬─────────────────────┘          │
│          │                  │                                 │
│   ┌──────┴──────┐    ┌──────┴──────┐                         │
│   │   EDC       │    │  NAPCORE    │                         │
│   │ (Connector) │    │   (NAPs)   │                         │
│   └─────────────┘    └─────────────┘                         │
│                                                              │
├═══════════════════════════════════════════════════════════════┤
│                                                              │
│  H1 TODAY — Market Activity & Live Data                      │
│  ──────────────────────────────────────                      │
│  • Data spaces going live (MDS, Catena-X production)         │
│  • Mobilithek / NAPCORE open data feeds                      │
│  • Mobito commercial vehicle data                            │
│  • News signals (5G-ACIA announcements, Catena-X releases)   │
│  → Platform: News, company activity, market signals          │
│                                                              │
├───────────────────────────────────────────────────────────────┤
│                                                              │
│  H2 TOMORROW — Standards & Testing                           │
│  ─────────────────────────────────                           │
│  SDOs:  ISO · IEC · ETSI · IEEE · 3GPP · UNECE              │
│  Consortia:  CharIN · 5G-ACIA · 5GAA · AUTOSAR              │
│              COVESA · Catena-X · Eclipse SDV                 │
│                                                              │
│  Testing:  CharIN Testivals · 5G-ACIA Testbeds              │
│            Catena-X Certification · ETSI Plugtests           │
│  → Platform: Patent volume, standards coverage, test results │
│                                                              │
├───────────────────────────────────────────────────────────────┤
│                                                              │
│  H3 FUTURE — Academic Research & Vision                      │
│  ──────────────────────────────────────                      │
│  CORDIS: MobiSpaces · PrepDSpace4Mobility · DS4SSCC pilots   │
│  National: DFG · ANR · Innovate UK                           │
│  → Platform: Research intensity, emerging concepts, CORDIS   │
│                                                              │
├═══════════════════════════════════════════════════════════════┤
│                                                              │
│           ┌─────────────────────────────────┐                │
│           │   BluSpecs / IntelPulse Platform │                │
│           │   (Intelligence Aggregation)     │                │
│           │                                  │                │
│           │  Ingests → Scores → Visualises   │                │
│           │  across all three horizons       │                │
│           └─────────────────────────────────┘                │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 8. Keyword Taxonomy Gaps

Some initiatives reference concepts not currently in the platform taxonomy. These need resolution:

| Missing Concept | Source Initiative | Recommended Action |
|----------------|-------------------|--------------------|
| Data Governance | MobiSpaces, MDS | Map → `Software Defined Vehicle` (data sovereignty aspect) |
| Network Slicing | 5G-ACIA, 5GAA | Map → `5G V2X` (as alias or sub-concept) |
| PCF / Product Carbon Footprint | Catena-X | Map → `EV Battery` (lifecycle/supply chain aspect) |
| Digital Twin | Catena-X | Already partially covered via `Software Defined Vehicle` |
| TSN (Time-Sensitive Networking) | 5G-ACIA | Map → `Vehicle to Everything` (in-vehicle networking) |
| Multimodal Transport | NAPCORE, EONA-X | Out of scope — tangential to SDV core taxonomy |

> **Decision**: Rather than expanding the keyword taxonomy, map these concepts as **aliases** on existing keywords where relevant, keeping the ~23-keyword structure tight.
