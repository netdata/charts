# uPlot Prod-Parity Gap Map — dygraph → uPlot, zero functionality loss

> Master checklist for switching production dashboards from dygraph to uPlot without losing any
> current functionality. Built from two source audits (renderer-internal + app-coupling) plus the
> navigation work. Status: `✓` = verified against source this session (file:line shown); `⧖` =
> audit-reported, individual spot-check still pending. Nothing here is implemented yet.

## P0 — must fix before any prod switch (affects every / most charts, or a silent functional loss)

| # | Gap | Evidence | Status | Plan |
|---|-----|----------|--------|------|
| P0.1 | **Hover value popover dead on uPlot.** Popover subscribes to chartUI `mousemove`/`mouseout` (`components/line/popover/index.js:45,76`); dygraph feeds that bus via its interactionModel (`dygraph/index.js:66-69`); uPlot emits no such chartUI events (only `rendered`/`resize`). Listeners are dead → tooltip silently never opens. | verified | G10 |
| P0.2 | **`yAxisChange` never fired → stale units + min/max.** dygraph fires it on every y-axis redraw (`dygraph/index.js:249,305`); `unitConversion` is the sole consumer that rescales prefix/precision + updates `min`/`max` (`helpers/unitConversion/index.js:108`); uPlot never fires it. After any zoom/pan/auto-range, unit prefix/precision and value formatting go stale. Needs a prevMin/prevMax dedup guard to avoid render loops. | verified | G10 |
| P0.3 | **X/Y axis show-hide toggles inert.** dygraph maps `enabledXAxis`/`enabledYAxis`→`drawAxis:false` (`dygraph/index.js:374-388`); uPlot's `getAxes` reads neither (`uplot/index.js:205-238`). Display-tab switches do nothing. | verified | G10 |
| P0.4 | **Navigation cursors missing on uPlot.** `cursorStyle` gated to the dygraph branch (`chartContentWrapper.js:43,48`); uPlot gets no cursor. | verified | G9.1 |
| P0.5 | **uPlot layout CSS not shipped by the library.** `uplot/dist/uPlot.min.css` imported only in `.storybook/preview.js:5`; Babel-only build, no bundler; inject rules via styled-components like dygraph. Without it: no `.u-select` rectangle, broken `.u-over/.u-under` positioning for consumers. | verified | G9.2 |

## P1 — visible regressions on common charts (fix before/with prod)

| # | Gap | Evidence | Status | Plan |
|---|-----|----------|--------|------|
| P1.1 | **No y-range padding.** dygraph `yRangePad:15` (`dygraph/index.js:109,230`); uPlot none for line/area → peaks/troughs flush against the plot border. | verified | G10 |
| P1.2 | **`area` doesn't force zero baseline.** dygraph `forceIncludeZero` for area (`dygraph/index.js:288,365-367`); uPlot area falls through to plain range (`uplot/index.js:172-174`). | verified | G10 |
| P1.3 | **Modifier-key nav switching missing** (Shift→select, Alt→highlight, Shift+Alt→selectVertical; restore on mouseup). dygraph `navigation/generic.js:20-40`; uPlot handles only pan. | verified | G9.3 |
| P1.4 | **`highlightStart` fires at drag-end not drag-start** → hover not suppressed during select. dygraph `navigation/select.js:9`; uPlot `onSetSelect` `uplot/index.js:547,552`. | verified | G9.4 |
| P1.5 | **No 5px drag threshold; wheel-zoom modifier mismatch.** dygraph `select.js:47`, wheel gated `generic.js:47`; uPlot fires on any width, zooms on plain wheel. | verified | G9.5 |
| P1.6 | **Sparkline series styling** (solid fill, zero stroke). dygraph `makeSparklineOptions` (`dygraph/index.js:437-449`); uPlot hides axes but `getSeries` ignores `isSparkline` (`uplot/index.js:93-116`). | ⧖ | G10 |
| P1.7 | **Synced cross-chart hover point dots lost.** dygraph `setSelection` draws dots (`dygraph/index.js:142-155`, `crosshair.js`); uPlot only redraws the vertical line (`uplot/index.js:861-862`). | ⧖ | G10 |
| P1.8 | **Shaded overlays paint on top of series, not behind.** dygraph draws on `underlayCallback` (`dygraph/overlays/index.js:42`); uPlot `drawOverlays` is the last draw hook (`uplot/index.js:791`) → alertTransitions/alarmRange tint the data lines. | ⧖ | G10 |
| P1.9 | **Empty / out-of-limits renders blank.** dygraph substitutes `[[0]]`/`["X"]` to keep a framed empty grid (`dygraph/index.js:48-54`); uPlot destroys the chart (`uplot/index.js` getData→null→destroyChart). | ⧖ | G10 |

## P2 — cosmetic / edge / perf / no current consumer (schedule after P0–P1)

| # | Gap | Evidence | Status | Plan |
|---|-----|----------|--------|------|
| P2.1 | Y-axis duration-aware tick placement + per-tick unit selection. dygraph `tickers/numeric.js:18-57` + per-tick unit (`dygraph/index.js:251-261`); uPlot uses default linear splits + one global unit (`uplot/index.js:234-235`). | ⧖ | G11 |
| P2.2 | `yAxisLabelWidth` / `axisLabelFontSize` ignored (hardcoded size 60, 11px — `uplot/index.js:19,228,232`). | ⧖ | G11 |
| P2.3 | `stepPlot` not applied to stacked/area interior (`uplot/index.js:84-90`, drawStacked straight segments). | ⧖ | G11 |
| P2.4 | Anomaly-rate y-axis indicator icon missing (dygraph `tickers/numeric.js:61-65`). | ⧖ | G11 |
| P2.5 | `proceeded` overlay type unimplemented on uPlot (`uplot/overlays/types.js`) — but masked by the independent `Processing` render path (`chartContentWrapper.js:92`), so user-visible effect ≈ nil. | ⧖ | G11 |
| P2.6 | `point` overlay type unimplemented — no shared consumer creates one today; only an external/API risk. | ⧖ | G11 |
| P2.7 | Stacked-area per-pixel point reduction (dense-data perf) not ported (`dygraph/plotters/stackedArea.js:73-115`). Output identical; perf only. | ⧖ | G11 |

## Decisions
- **Governing rule: match dygraph exactly.** Wherever uPlot and dygraph differ, reproduce dygraph's
  behavior/decision — no new UX.
- **Wheel-zoom:** RESOLVED → match dygraph (Shift/Alt-gated; plain wheel does nothing). Drives G9.5.
- **P2 scope:** still open — which P2 items are required for the target dashboards vs droppable.

## Notes
- App-coupling audit found **no crash-level** gaps: every chartUI method shared code calls is present
  on uPlot's `getUI()` surface or optional-chained. The only functional app-coupling loss is P0.1.
- Proposed grouping: **G9** = navigation/cursor/CSS (P0.4–5, P1.3–5; plan written). **G10** = the
  remaining P0/P1 renderer + popover regressions. **G11** = P2 polish.
