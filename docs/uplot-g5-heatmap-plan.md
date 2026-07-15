# G5 — uPlot Heatmap — plan / mandate

> Parity sub-project G5 (`docs/uplot-parity-gap-map.md`). The one missing time-series chartType on
> uPlot. **Acceptance = dygraph parity: a uPlot heatmap must look/behave like the dygraph heatmap.**

## Scope
Render `chartType: "heatmap"` on the uPlot renderer: colored bucket cells over time (x) × bucket
rows (y), a bucket-boundary y-axis, and the correct y value-range. Closes the routing-safety gap
(a `chartLibrary:"uplot"` chart whose `chartType` becomes `heatmap` currently has no renderer).
**Out of scope → G6:** heatmap-specific hover/column hit-testing (`getClosestHeatmapDimension`,
`dygraph/hoverX.js:11-31`) — G5 delivers the rendered chart; hover hit-testing is part of the hover
sub-project. Note the boundary in your report.

## Reuse (renderer-agnostic — DO NOT copy, import directly)
- `chart.getVisibleHeatmapIds()`, `chart.getHeatmapScale()`, `chart.getHeatmapYIndex(id)`
  (`src/sdk/makeChart/makeDimensions.js:272-299`).
- Color + scale + label helpers: `src/helpers/heatmap.js` (`isHeatmap`, `makeGetColor`),
  `src/helpers/heatmapScale.js` (`detectHeatmapScale`, `formatHeatmapLabel`, `parseHeatmapValue`).
  These already back the dygraph heatmap and are renderer-neutral — use them unchanged.

## Study before implementing
- dygraph heatmap plotter: `src/chartLibraries/dygraph/plotters/heatmap.js` (`makeHeatmapPlotter`) —
  the authoritative cell color/position logic (per-bucket rectangles via `getHeatmapYIndex` +
  `makeGetColor`). This is the behavior to match.
- dygraph y-ticker: `src/chartLibraries/dygraph/tickers/heatmap.js` (`heatmapTicker`) — bucket
  boundary labels via `formatHeatmapLabel`, decimated to fit.
- dygraph wiring: `src/chartLibraries/dygraph/index.js` — `plotterByChartType.heatmap`,
  `optionsByChartType.heatmap` (y-ticker), and `makeDataOptions` setting `valueRange:
  [0, getVisibleHeatmapIds().length]` when heatmap.
- uPlot draw-hook templates already in the codebase: `src/chartLibraries/uplot/index.js` —
  `drawStacked` and the crosshair `draw` hook (series `paths: () => null` + custom `u.ctx` painting).
  This is the mechanism for heatmap cells.
- uPlot reference implementation: `/Users/novykh/Projects/uPlot/demos/latency-heatmap.html` — a
  draw-hook heatmap (colored cells via `u.valToPos` + `u.ctx`). Use it as the uPlot-idiom guide.

## Implementation
Because dygraph draws via its plotter's point objects and uPlot draws via a `draw` hook over
`u.data`/scales, the drawing loop is a faithful **reimplementation in uPlot's model** (not a literal
copy) — but it must reuse ALL the shared helpers above unchanged and reproduce dygraph's visual
result (same colors, same bucket rows, same cell extents). Concretely:
- A heatmap render path in `uplot/index.js` (isolated like the bars path `createBars`, or a
  `draw`-hook + `paths:()=>null` on the main instance — choose whichever matches dygraph's result
  and the demo; justify in the report). y-scale range `[0, getVisibleHeatmapIds().length]`.
- Draw hook paints one filled rect per (timeColumn × visible bucket): x from `chartUI.getXCoord`
  (G1) / `u.valToPos`, y-row from `getHeatmapYIndex`, color from `makeGetColor(chart)`.
- Custom y-axis: bucket-boundary labels via `formatHeatmapLabel` + the chart's heatmap scale, ported
  from `heatmapTicker` into uPlot's `axes[1]` `values`/`splits`.

## Tests (real, no mocks)
- Use `@jest/testUtilities` heatmap helpers (`loadHeatmapPayload`/`makeHeatmapPayload`). With a
  heatmap payload on a `chartLibrary:"uplot"` chart, assert: the heatmap render path is taken for
  `chartType:"heatmap"`; the y value-range is `[0, numBuckets]`; the shared helpers
  (`getVisibleHeatmapIds`/`getHeatmapYIndex`/`getHeatmapScale`) are exercised. jsdom can't paint, so
  assert structure/config, not pixels.
- Full suite green after; eslint clean on changed files.

## Visual verification (maintainer — jsdom can't paint)
Storybook, `chartLibrary:"uplot"`, a heatmap context (or the showcase's RenderModes): cells colored
by value matching dygraph, bucket-boundary y-axis labels correct, cell time-alignment matches
dygraph across pan/zoom. State what to check; do NOT run a dev server.

## Constraints
No semicolons; double quotes; 2-space indent; 100-char; ES5 trailing commas; arrow functions;
imports at top; no description comments; NEVER mock; JSX files import React. Don't touch
`numberFormat.js`. Commit in logical chunks. Test: `yarn jest --config ./jest/config.js <path> --collectCoverage=false`.
