# uPlot ↔ dygraph parity — verified gap map

> Branch `explore/uplot-spike`. Built from three read-only code audits (chartTypes/routing, uPlot
> current state, overlays/actions coupling). Every claim has file:line evidence. This is the
> orchestration backbone for the "full functionality parity" effort.

## Scope clarification (confirm before planning)

"All plotters/chartTypes on uPlot" = the **time-series family only**: `line`, `stacked`, `area`,
`stackedBar`, `multiBar`, `heatmap` (`src/components/toolbox/chartType.js:26-77`). The other `ui`
entries — `table`, `bars`, `easypiechart`, `gauge`, `d3pie`, `number`, `groupBoxes`
(`src/makeDefaultSDK.js:25`) — are **distinct chart libraries selected directly**, not chartTypes
routed to a renderer; they are **out of uPlot's scope** and uPlot should not replace them.

## Already done on uPlot (verified)

- **ChartTypes**: line, area, stacked (diverging, via `draw`-hook polygons + `stacking.js`), multiBar,
  stackedBar (vendored `seriesBarsPlugin`), stepped, sparkline — `src/chartLibraries/uplot/index.js:55-96,340-381`.
- **Actions/navigation**: pan, wheel-zoom, drag-select, selectVertical, hover, crosshair,
  dblclick-reset — all emit the **same SDK events** as dygraph (`index.js:205-338`). The nine SDK
  action plugins (`src/sdk/plugins/*`) are **renderer-agnostic** and work unchanged (grep: zero
  dygraph refs). Navigation does NOT need porting.
- **Axes/units/theme/ranges/timezone** for the line/area/stacked path — `index.js:87-146`.

## Gaps (what full parity requires)

### G1. Overlay positioning foundation (enabler)
dygraph's canvas layer emits `overlayedAreaChanged:<id>` to position the React DOM overlays
(`src/chartLibraries/dygraph/overlays/helpers.js:22-23`). uPlot emits **nothing**, so
`container.js:77` (`if (!area && !fixed) return null`) makes alarm/alarmRange/highlight/proceeded
badges **silently never render** on uPlot. Also `usePlotArea` (`src/components/provider/selectors.js:683`)
reads `getDygraph?.().getArea()` → `{left:0,width:0}` on uPlot → `AlertTimeline` misaligns silently
(`src/components/alertTimeline/index.js:183`). **Fix:** uPlot emits `overlayedAreaChanged` from its
plot area, and a renderer-agnostic plot-area accessor replaces the dygraph-only `usePlotArea` path
(uPlot already has `getChartWidth/Height` off `u.over`). Prerequisite for all React overlays.

### G2. Alert overlays (canvas draw layer)
alarm, alarmRange, alertTransitions, highlight shading, proceeded-area, crosshair-point are
dygraph-only (`src/chartLibraries/dygraph/overlays/*`, using `toDomXCoord`/`hidden_ctx_`/`getArea`).
**Port target exists:** uPlot's `draw` hook (`index.js:199-203`) already draws crosshair + stacked
fill — same pattern, reimplemented with `u.valToPos`/`u.ctx`/`u.bbox`. Depends on G1 for badges.
Highest user-facing impact (alerts are on nearly every chart).

### G3. Anomaly ribbon + annotations strip
Implemented as **fake dygraph series with custom plotters** (`dygraph/plotters/anomaly.js`,
`plotters/annotations.js`, registered `dygraph/index.js:80,88`); hit-tested via pixel bands
(`dygraph/hoverX.js:40-41`). No uPlot analog. Plus the annotation React component is hard-gated to
dygraph (`src/components/line/overlays/annotation/index.js:412` uses `getDygraph()`/`canvas_`/
`toDomXCoord`), so annotation hover popovers are unreachable on uPlot. **Fix:** draw-hook ribbon +
strip, hit-testing bands, and a uPlot path for the annotation component. Builds on G1/G2 patterns.

### G4. Bars parity (multiBar / stackedBar)
Bars render but via a **separate uPlot instance with no cursor/hooks/navigation**
(`createBars`, `index.js:361-391` returns before `attachNavigation`): no SDK hover emission, no
crosshair/pan/zoom/select/dblclick, **ordinal x-scale shows raw index not formatted time**
(`bars/seriesBarsPlugin.js:148-150`), y clamped `[0,max]` so **negatives are clipped**
(`seriesBarsPlugin.js:69-72`), axes unstyled/unformatted. Self-contained (isolated in `createBars`).

### G5. Heatmap chartType (the one missing plotter)
Zero uPlot implementation. Data primitives are already renderer-agnostic
(`chart.getVisibleHeatmapIds`/`getHeatmapScale`/`getHeatmapYIndex`, `src/sdk/makeChart/makeDimensions.js:272-299`).
**Fix:** a `draw`-hook plugin painting colored bucket cells (analogous to
`dygraph/plotters/heatmap.js`) + a custom y-axis ticker (analogous to `dygraph/tickers/heatmap.js`).
Also **resolves the routing-safety gap**: today if `chartLibrary:"uplot"` and payload sets
`chartType:"heatmap"`, `getRendererForChartType` falls back to `"uplot"` and would render a heatmap
on a renderer with no heatmap support (`makeControllers.js:124-126`).

### G6. Hover fidelity + click actions
uPlot `setCursor` always reports the **first** visible dimension, not nearest-series/nearest-Y
(`index.js:107,226`; dygraph does real closest-point detection, `dygraph/hoverX.js:33-79`). Missing:
diverging-stacked-point and heatmap-column hit-testing; click-to-annotate (`draftAnnotation`/
`annotationCreate`); `highlightClick`; and uPlot fires only `sdk.trigger`, not `chart.trigger`
(dygraph fires both — matters for direct `chart.on(...)` listeners).

### G7. Touch / mobile navigation
No touch handlers on uPlot (dygraph has touch + double-tap, `navigation/generic.js:104-141`).

### G8. Stacked-area polish
Null/gap bridging and top stroke (per `docs/uplot-migration-progress.md`).

## Proposed decomposition & sequence

Each is an independent spec→plan→execute cycle (same rigor as the perf harness). Recommended order:

1. **G1 Overlay foundation** — prerequisite enabler (unblocks all React overlays + AlertTimeline). Small, high-leverage.
2. **G2 Alert overlays** — highest user-facing impact; depends on G1.
3. **G5 Heatmap** — distinct, independent of overlays; closes the routing-safety gap. Can run parallel to G2.
4. **G4 Bars parity** — self-contained; independent.
5. **G3 Anomaly/annotation** — builds on G1/G2 patterns.
6. **G6 Hover fidelity + click actions** — refines existing hover.
7. **G7 Touch nav** + **G8 stacked polish** — small polish, last.

## Coordination note

The frontend-design subagent is currently editing `src/chartLibraries/uplot/index.js` (visual
polish + showcase story). Any parity implementation touching that file (G1/G2/G4/G5/G6) must land
**after** that work to avoid conflicts; G-work will rebase on the design changes.
