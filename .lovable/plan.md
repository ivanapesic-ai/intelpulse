

## Plan: Fix Signal Lineage — CJK Filter, Confidence Threshold, Time Spread

### Problem Summary

1. **CJK filter not effective** — The filter runs on EPO patent *input* before sending to Gemini, but Gemini can still output Chinese-titled patents that came through news data or were already in the DB from a previous run. Need to also filter the AI *output* before inserting.
2. **Time axis shows "2025" to "2025"** — Research papers only have year (2025), patent filing dates are null, news clusters in recent weeks. No historical spread.
3. **Low-confidence matches** — 70% confidence links are noise. Raise threshold to 0.75.

### Changes

**`supabase/functions/identify-signal-lineage/index.ts`**:

1. **Filter AI output** — After parsing Gemini's response (line 241), filter out any link where `source_title` or `target_title` contains CJK characters. This catches Chinese titles regardless of source.

2. **Raise confidence threshold** — Change prompt from `> 0.6` to `> 0.75` (line 147). Also add a server-side filter after parsing: `links.filter(l => l.confidence >= 0.75)`.

3. **Improve date handling for historical spread** — When building patent items, parse the EPO filing date properly. For research papers from OpenAlex, use the actual `publication_year` to construct a date like `YYYY-01-01` so 2022 papers show on the left and 2025 papers on the right.

### Files Modified

| File | Change |
|---|---|
| `supabase/functions/identify-signal-lineage/index.ts` | Post-AI CJK filter on output, raise confidence to 0.75, ensure dates propagate |

After deploying, the user needs to re-run Step 7 (Analyze Signal Lineage) in the admin pipeline to regenerate clean data.

