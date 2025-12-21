# Data Mapping Worksheet
## AI-CE Heatmap Platform

---

## Quick Reference (One-Page Summary)

| What We're Doing | Why It Matters |
|------------------|----------------|
| **Collecting data about technologies** | To show which technologies are promising for the EU |
| **From 4 main sources** | Dealroom, CEI Documents, PATSTAT, Public websites |
| **Organizing into 4 groups** | Materials, Digital, Energy, Manufacturing |
| **Scoring each technology** | So users can compare and prioritize |

**The Big Picture:** We're building a system that gathers information about technologies from different places, organizes it neatly, and gives each technology a score so decision-makers can see which ones are worth investing in.

---

## 1. What Data Do We Need?

Think of each technology like a product listing on Amazon. We need:

### Basic Information
| What | Example | Why We Need It |
|------|---------|----------------|
| **Name** | "Solid-state batteries" | To identify the technology |
| **Category** | "Energy" | To organize technologies into groups |
| **Description** | "Next-gen batteries that..." | To explain what it does |
| **Maturity level** | "Ready to use" or "Still in research" | To show how developed it is |

### Scores (Like Star Ratings)
| Score Type | What It Measures | Scale |
|------------|------------------|-------|
| **Readiness** | How close to real-world use? | 0-9 |
| **Market potential** | How big is the business opportunity? | 0-9 |
| **Innovation** | How many patents and new ideas? | 0-9 |
| **EU Priority** | How important to EU policies? | 0-9 |
| **Overall Score** | Average of all above | 0-9 |

### Supporting Details
- **Companies working on it** (names, funding, location)
- **Patents filed** (how many, by whom)
- **Related EU policies** (which EU programs mention it)
- **Recent news** (latest developments)

---

## 2. Where Does the Data Come From?

We have 4 main sources - think of them like different libraries:

### Source 1: Dealroom (Company & Market Data)
**What it is:** A database of tech companies and startups  
**What we get from it:**
- Company names and descriptions
- How much funding they've received
- Where they're located
- What technology they work on

**Questions for BluSpecs:**
- ❓ Do we already have access to Dealroom?
- ❓ Which filters should we use? (EU only? Certain industries?)
- ❓ How often should we update this data?

---

### Source 2: CEI Documents (Your Internal Reports)
**What it is:** PowerPoints, PDFs, and reports from the CEI team  
**What we get from it:**
- Technology assessments
- Maturity ratings
- Strategic priorities
- Policy references

**Questions for BluSpecs:**
- ❓ How many documents exist? (Rough estimate)
- ❓ What formats? (PPT, PDF, Word, Excel?)
- ❓ Are they confidential? Who can see what?
- ❓ Is there a standard template, or are they all different?
- ❓ Where are they stored? (SharePoint, email, etc.)

---

### Source 3: PATSTAT (Patent Database)
**What it is:** European patent information  
**What we get from it:**
- Number of patents per technology
- Who filed them (companies, universities)
- Which countries are innovating

**Questions for BluSpecs:**
- ❓ Do we have PATSTAT access, or should we use free alternatives?
- ❓ How should we link patents to technologies? (Keywords? Categories?)

---

### Source 4: Public Sources (Free Online Data)
**What it is:** Public websites, EU portals, news  
**What we get from it:**
- EU funding announcements
- Policy documents
- Industry news
- Research publications

**Examples:**
- EU Horizon Europe portal
- European Commission websites
- Industry news sites

---

## 3. How Do We Organize Technologies?

### The 4 Categories (Quadrants)
Like sections in a department store:

| Category | What's Included | Examples |
|----------|-----------------|----------|
| 🔬 **Advanced Materials** | New materials and chemicals | Graphene, bio-plastics, rare earth alternatives |
| 💻 **Digital Technologies** | Software, AI, computing | AI chips, quantum computing, cybersecurity |
| ⚡ **Clean Energy** | Power and sustainability | Batteries, hydrogen, solar, wind |
| 🏭 **Smart Manufacturing** | How things are made | Robotics, 3D printing, automation |

### The 4 Maturity Levels (Rings)
How ready is the technology?

| Level | What It Means | Score Range |
|-------|---------------|-------------|
| 🟢 **Adopt** | Ready to use now, proven technology | 7.5 - 9.0 |
| 🟡 **Trial** | Worth testing, showing promise | 5.0 - 7.4 |
| 🟠 **Assess** | Keep an eye on it, still developing | 3.0 - 4.9 |
| 🔴 **Hold** | Too early, needs more research | 0.0 - 2.9 |

**Question for BluSpecs:**
- ❓ Are these categories and levels correct? Should we adjust them?

---

## 4. How Do We Score Technologies?

### The Scoring Recipe
Each technology gets 4 scores, which are averaged into one overall score:

```
Overall Score = (Readiness + Market + Innovation + EU Priority) ÷ 4
```

### Score Breakdown

#### 1. Readiness Score (How mature?)
Based on:
- Expert assessments from CEI documents
- Evidence of real-world deployments
- How many companies are using it

#### 2. Market Score (How big is the opportunity?)
Based on:
- Total funding raised by companies in this space
- Number of active companies
- Growth rate (is it accelerating?)

#### 3. Innovation Score (How much R&D activity?)
Based on:
- Number of patents filed
- Research publications
- Open-source projects
- EU-funded research projects

#### 4. EU Priority Score (How important to EU?)
Based on:
- Mentions in EU policy documents
- Horizon Europe funding
- IPCEI (Important Projects of Common European Interest) inclusion

**Question for BluSpecs:**
- ❓ Are these the right factors? Should any be weighted more heavily?

---

## 5. Questions Checklist for BluSpecs

### Must Answer Before We Start Building

#### About Data Access
- [ ] Dealroom: Do we have access? What's the login?
- [ ] PATSTAT: Do we have access? Or use alternatives?
- [ ] CEI Documents: Where are they stored? Who can share them?

#### About the Technology List
- [ ] Is there an existing list of technologies to start with?
- [ ] How many technologies should we include? (10? 50? 200?)
- [ ] Who decides what technologies to add or remove?

#### About Scoring
- [ ] Who will review and approve the scoring methodology?
- [ ] Should any scores be manually adjustable by admins?
- [ ] How often should scores be recalculated?

#### About Users
- [ ] Who are the main users? (Analysts? Executives? Public?)
- [ ] What should public users see vs. logged-in users?
- [ ] How many admin users will there be?

---

## 6. Next Steps

### Before January 8 Meeting
1. **BluSpecs to provide:**
   - [ ] Sample CEI documents (2-3 examples)
   - [ ] Technology list (if one exists)
   - [ ] Dealroom access details
   - [ ] Answers to questions above

### During January 8 Meeting
2. **Walk through this worksheet together**
3. **Confirm data sources and access**
4. **Agree on technology categories**
5. **Review scoring approach**

### After January 8 Meeting
6. **We create detailed technical specifications**
7. **Begin building data connections**

---

## Appendix: Technical Details

*This section is for developers - skip if you're not technical*

### Data Model (Database Structure)

**Technologies Table**
```
- id: Unique identifier for each technology
- name: Technology name
- slug: URL-friendly name
- quadrant: Category (materials, digital, energy, manufacturing)
- ring: Maturity level (adopt, trial, assess, hold)
- description: What the technology does
- scores: The 4 individual scores
- composite_score: Overall average score
- metadata: Extra information (flexible)
- created_at: When it was added
- updated_at: When it was last changed
```

**Related Tables**
- Companies: Companies working on each technology
- Patents: Patent filings linked to technologies
- Documents: CEI documents and their extracted data
- Policies: EU policy references
- Data Sources: Where each piece of data came from

### Sample Technology Mapping

| Technology | Quadrant | Ring | TRL | Market | Innovation | EU | Overall |
|------------|----------|------|-----|--------|------------|-----|---------|
| Solid-state batteries | Energy | Trial | 6 | 7 | 8 | 8 | 7.3 |
| Industrial AI | Digital | Adopt | 8 | 9 | 7 | 6 | 7.5 |
| Green hydrogen | Energy | Assess | 5 | 6 | 6 | 9 | 6.5 |

---

*Document Version: 2.0 (Simplified)*  
*Last Updated: January 2025*  
*For: BluSpecs Kickoff Meeting*
