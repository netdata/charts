# G10 — uPlot Renderer Parity (remaining P0/P1) — plan / mandate

> Parity sub-project G10 (`docs/uplot-prod-parity-gap-map.md`). **Governing rule: match dygraph
> exactly** — every behavior/decision reproduces what the dygraph renderer does today; acceptance =
> dygraph parity. Covers the P0/P1 gaps NOT handled by G9 (navigation/cursor/CSS). Each part cites
> the dygraph source it must mirror.

## P0 — must fix before prod

### P0.1 Hover value popover (re-emit pointer events on the chartUI bus)
dygraph forwards raw DOM pointer events through its interactionModel:
`mousemove/mouseout/mouseover/mousedown/mouseup/dblclick/wheel/touch*` → `chartUI.trigger(...)`
(`dygraph/index.js:64-75`). The popover subscribes to `chart.getUI().on("mousemove"|"mouseout")` and
reads `event.offsetX/offsetY` (`components/line/popover/index.js:45-79`). uPlot emits none of these.
**Fix:** in uPlot `mount`/`attachNavigation`, attach listeners on `u.over` and re-emit via
`chartUI.trigger("mousemove", event)` / `"mouseout"` (and `"mouseover"` for symmetry), matching
dygraph's contract. Ensure the event carries `offsetX/offsetY` relative to the chart element the
popover positions against — verify the popover's target container origin matches (dygraph offsets are
canvas-relative; confirm parity, adjust with the plot-area left/top if needed). Do not change the
popover component.
**Test:** mount uPlot, dispatch a `mousemove` on `u.over`, assert a `chart.getUI().on("mousemove")`
listener fires with usable offsets; `renderWithChart` popover opens on uPlot.

### P0.2 Fire `yAxisChange` on y-range change (unit rescale + min/max)
dygraph fires `chart.trigger("yAxisChange", min, max)` from the y-axis label formatter, guarded by a
`prevMin/prevMax` dedup so it only fires when the range actually changes (`dygraph/index.js:238-250`,
heatmap path `:305`). `helpers/unitConversion/index.js:108` is the sole consumer → recomputes
`unitsConversionPrefix`/`FractionDigits` and updates `min`/`max`.
**Fix:** in uPlot, compute the committed y-range (from the same source the y-axis uses) and fire
`chart.trigger("yAxisChange", min, max)` when it changes, with the identical prevMin/prevMax guard to
prevent the conversion→attr-change→redraw→fire loop. Hook it where the y range is known per commit
(y-scale `range` fn or a draw hook reading `u.scales.y.min/max`). Skip for heatmap unless dygraph
fires there too (it does — mirror it).
**Test:** mount uPlot, change the visible range (setScale y / new data), assert `yAxisChange` fires
once per distinct range and not on unchanged re-renders; assert no infinite render loop.

### P0.3 Honor `enabledXAxis` / `enabledYAxis`
dygraph sets `{ drawAxis: false }` per axis when disabled (`dygraph/index.js:374-388`).
**Fix:** in uPlot `getAxes`, set the x/y axis `show: false` when `enabledXAxis`/`enabledYAxis` are
false (independent of the existing sparkline all-off case). Rebuild on change (add to the
`onAttributeChange` list if not covered).
**Test:** `enabledYAxis:false` → `u.axes[1].show === false`; `enabledXAxis:false` → `u.axes[0].show
=== false`; toggling re-renders.

## P1 — visible regressions

### P1.1 Y-range padding (`yRangePad: 15`)
dygraph pads the y-range by 15px each end for line/area (`dygraph/index.js:109,230,341,359`).
**Fix:** in uPlot `getScales().y.range`, after computing `[min,max]` for the line/area path, extend by
15px-equivalent in value units using the committed plot height (`u.bbox.height/dpr`), fallback to a
small factor before first layout. Match dygraph's 15px; acceptance is visual (data never touches the
top/bottom border). Do not pad bars (they keep the existing 5% `padAwayFromZero`) unless dygraph does.
**Test:** line chart y-range is wider than the raw data extent by a stable margin; bars unchanged.

### P1.2 `area` forces zero baseline (when multi-dim + multi-selected)
dygraph includes zero when `includeZero || (forceIncludeZero && dimensionIds.length > 1 &&
selectedLegendDimensions.length > 1)` (`dygraph/index.js:365-367`; area sets `forceIncludeZero:true`
`:288`).
**Fix:** in uPlot y-range for `chartType==="area"`, apply the same condition; when true, clamp min to
`Math.min(0, min)` and max to `Math.max(0, max)`. Mirror the exact condition (incl. the
`selectedLegendDimensions.length > 1` clause) — do not zero-baseline single-series area.
**Test:** multi-dim multi-selected area includes 0; single-dim area does not.

### P1.3 Sparkline series styling
dygraph sparkline: `strokeWidth:0, fillAlpha:1, highlightCircleSize:3` (solid fill, no stroke)
(`dygraph/index.js:437-449`).
**Fix:** in uPlot `getSeries`, when `chart.isSparkline()`, render each series as a solid fill
(alpha 1) with zero stroke and no points — matching dygraph. (Axes already hidden, `uplot/index.js`
sparkline branch.)
**Test:** sparkline series has fill and `width:0`; non-sparkline unchanged.

### P1.4 Synced cross-chart hover point dots
dygraph draws the vertical crosshair line AND `dygraph.setSelection(row)` → highlighted point circles
at the synced row across series (`crosshair.js:25`, wired `dygraph/index.js:142-155`). uPlot only
draws the dashed vertical line on `hoverX`/`clickX` (`uplot/index.js` drawVerticalLine).
**Fix:** in the uPlot foreground `draw` hook, for `hoverX`/`clickX` compute the closest row and, for
each visible series, draw a filled dot at `(valToPos(x), valToPos(value))` — mirroring setSelection's
markers, colored per dimension. Keep it on the `draw` (foreground) hook (dygraph draws the crosshair
on the fg canvas, not underlay).
**Test:** with `hoverX` set, the draw hook plots one dot per visible series at the synced timestamp.

### P1.5 Shaded overlays behind series (z-order)
dygraph draws overlays via `underlayCallback` → behind the data (`dygraph/overlays/index.js:42`,
using `hidden_ctx_`). uPlot runs `drawOverlays` as the last `draw` hook → on top
(`uplot/index.js` draw hooks), so alertTransitions (30% α) / alarmRange (12% α) / highlight tint the
data lines. uPlot pipeline (verified `uPlot.cjs.js:4888-4891`): `drawClear` (before series) → series
→ `draw` (after).
**Fix:** move the overlay orchestration (`drawOverlays`) from the `draw` hook to a `drawClear` hook so
shaded overlays sit behind the series, matching dygraph's underlay. Keep the crosshair + synced dots
(P1.4) on the `draw` hook (foreground), matching dygraph's fg crosshair. Verify anomaly ribbon /
annotations strip stay at the data layer as today (dygraph draws them as series plotters).
**Test:** assert `drawOverlays` is registered on the `drawClear` hook and the crosshair on `draw`;
overlays still emit `overlayedAreaChanged`.

### P1.6 Empty / out-of-limits keeps a framed chart
dygraph substitutes `[[0]]`/`["X"]` so an empty grid/axes frame still draws
(`dygraph/index.js:48-54,426-427`). uPlot `getData` returns `null` and `render` calls `destroyChart`
(`uplot/index.js`), leaving nothing.
**Fix:** when `outOfLimits`/empty, keep a uPlot instance rendering an empty framed grid (axes visible,
no series data) instead of destroying it — matching dygraph's empty frame. Preserve the existing
"no element / not loaded" guards.
**Test:** set `outOfLimits:true` → `.uplot` still present with axes; no crash; recovers when data
returns.

## Sequencing
P0.1 → P0.2 → P0.3 (independent, highest impact) → P1.5 (z-order, small) → P1.1/P1.2 (range) →
P1.3 (sparkline) → P1.4 (dots) → P1.6 (empty state). Each TDD'd, committed separately.

## Tests / constraints
Real components, `makeTestChart`, synthetic events; NEVER mock. Full suite green + eslint clean on
changed files per part. No semicolons; double quotes; 2-space indent; 100-char; ES5 trailing commas;
arrow functions; imports at top; no description comments; JSX files import React.
Test: `yarn jest --config ./jest/config.js <path> --collectCoverage=false`.

## Visual verification (maintainer, Storybook — do NOT run a dev server on their behalf)
`chartLibrary:"uplot"`: hover shows the value popover; units relabel on zoom; axis toggles hide axes;
peaks have breathing room; multi-dim area sits on zero; sparklines are filled; synced hover shows
dots; alert bands sit behind the lines; out-of-limits shows an empty framed chart.
