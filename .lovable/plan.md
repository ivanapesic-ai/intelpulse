

## Plan: Technology Deep Dive Page Redesign + Explorer Navigation Fix

### Summary of Issues (from screenshots and user feedback)

1. **Explorer**: Clicking a technology opens a dialog — should navigate directly to the deep dive page
2. **Strategic Assessment**: C-O cards are too large with empty space underneath
3. **Domain badge chip** at top (e.g. "Software Defined Vehicle Ecosystem") — remove it
4. **Standards section**: Missing from the deep dive page entirely
5. **Market Intelligence**: Missing Top Strategic Investors, Geographic Concentration, and Funding Stage Distribution — these existed in `MarketIntelligence.tsx` but aren't used on this page
6. **Region Breakdown**: Replace simple bar chart with the richer Geographic Concentration from MarketIntelligence
7. **Patents**: Chinese applicant names unreadable; need ability to list actual patents (not just top applicants)
8. **Research**: Show top papers instead of just top institutions; make horizons expandable to see full lists
9. **Add to My Signals**: No watchlist toggle on the deep dive page
10. **Three Horizons cards**: Should show summary numbers in the card headers, and expand into a sheet/dialog with full listings when clicked

---

### Step 1 — Explorer: Navigate directly to deep dive

Remove the `Dialog` from `TechnologyExplorer.tsx`. Change card `onClick` to navigate to `/technology/:slug` directly using `useNavigate()`. Remove all dialog-related state and markup.

### Step 2 — Deep Dive header cleanup

- Remove the domain badge chip (`tech.domainName` badge)
- Add watchlist toggle button (eye icon) next to the title, using `useWatchlist` + `useToggleWatch`

### Step 3 — Compact Strategic Assessment

Shrink the C-O cards: reduce padding, make them fixed-height so there's no empty space. Change layout from `lg:grid-cols-2` (2 cards + signal breakdown) to `lg:grid-cols-3` (challenge card + opportunity card + signal breakdown side by side, all same height).

### Step 4 — Add Market Intelligence sections

Import and render `MarketIntelligence` component on the deep dive page after the Company Landscape section. This adds:
- Top Strategic Investors (with investment counts)
- Geographic Concentration (country bars with percentages)
- Funding Stage Distribution (badge chips)

Remove the current simple "Region Breakdown" card since Geographic Concentration replaces it.

### Step 5 — Add Standards section

Import `StandardsSection` and render it after Score Cards (or after Strategic Assessment), passing `keywordId` and `aliases`.

### Step 6 — Three Horizons: expandable with details

Add a `Sheet` (slide-over panel) for each horizon. The card shows summary stats (news count, patent count, research paper count). Clicking a card opens the sheet with:
- **News**: Full list of news items with links
- **Patents**: Patent list (titles from `patentSearch.data.patents` if available, plus top applicants)
- **Research**: Top papers list from `research.topPapers` (title, year, citations, DOI link) + top institutions

### Step 7 — Patent improvements

In the Patents horizon card and sheet:
- If `patentSearch.data.patents` array exists, show patent titles/abstracts
- For Chinese applicant names: no data-level fix possible (EPO returns original-language names), but add a note or attempt translation display

---

### Files Modified

| File | Change |
|---|---|
| `src/pages/mockups/TechnologyExplorer.tsx` | Remove dialog, navigate directly to deep dive |
| `src/pages/mockups/TechnologyDeepDive.tsx` | Major redesign: compact C-O, add watchlist toggle, add MarketIntelligence, add Standards, expandable Three Horizons, remove domain badge |

