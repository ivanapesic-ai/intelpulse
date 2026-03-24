

## Plan: Signal Lineage — LLM-based Concept Linking

Same plan as previously approved, with one visual refinement:

### Steps 1–5 — Unchanged

1. Migration: Create `signal_lineage` table with RLS
2. Edge function: `identify-signal-lineage` — Gemini Flash matching per keyword
3. Config: Add function entry to `supabase/config.toml`
4. Frontend: Lineage timeline + hook on Deep-Dive page
5. Admin: Add "Analyze Signal Lineage" as pipeline step 7

### Visual refinement: Bezier curve arrows

In `SignalLineageTimeline.tsx`, all connecting arrows between swim lanes use **cubic bezier SVG paths** instead of straight lines:

```text
  Research  ●─────────╮
                       ╰──────── ●  Patent
  Patent    ●────╮
                  ╰─────────────── ●  News
```

Implementation: each connection rendered as an SVG `<path>` with cubic bezier control points:

```tsx
// sourceY/targetY = swim lane Y positions, sourceX/targetX = date positions
const midX = (sourceX + targetX) / 2;
const d = `M ${sourceX} ${sourceY} C ${midX} ${sourceY}, ${midX} ${targetY}, ${targetX} ${targetY}`;
```

This produces smooth S-curves that remain readable even when multiple connections cross between lanes. Arrows get a small arrowhead marker at the target end and use opacity scaled by confidence (0.6–1.0).

### Files Modified

| File | Change |
|---|---|
| New migration SQL | Create `signal_lineage` table |
| `supabase/functions/identify-signal-lineage/index.ts` | New edge function |
| `supabase/config.toml` | Add function config |
| `src/hooks/useSignalLineage.ts` | New query hook |
| `src/components/intelligence/SignalLineageTimeline.tsx` | Swim-lane timeline with bezier arrows |
| `src/pages/mockups/TechnologyDeepDive.tsx` | Add lineage section |
| `src/components/admin/DataPipelinePanel.tsx` | Add pipeline step 7 |

