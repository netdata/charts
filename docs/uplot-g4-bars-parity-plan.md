# G4 — uPlot Bars Parity — plan / mandate

> Parity sub-project G4 (`docs/uplot-parity-gap-map.md`). **Acceptance = dygraph parity:**
> `multiBar`/`stackedBar` on uPlot must behave like dygraph bars — real time x-axis, working
> navigation, SDK hover/cross-chart sync, negative values, themed/formatted axes.

## The problem (verified)
Bars today render via `createBars` (`src/chartLibraries/uplot/index.js:503`), a SEPARATE uPlot
instance using the vendored ordinal-x `seriesBarsPlugin` (`distr:2`). `render`/`create` calls
`createBars(data)` and returns before `attachNavigation()` (`index.js:543-544,567`). Consequences vs
dygraph: (a) x shows raw ordinal index, not formatted time; (b) no crosshair/pan/wheel-zoom/
drag-select/dblclick-reset; (c) no `highlightHover`/`hoverChart` emit → no cross-chart hover sync;
(d) y clamped `[0,max]` → negative bars clipped; (e) axes unstyled/unformatted.

## Direction
The ordinal separate-instance approach **cannot** achieve time-axis + navigation parity — replace it
with the pattern the rest of uPlot now uses: draw bars via a **draw hook on the MAIN time-x uPlot
instance** (series `paths:()=>null`), exactly like `drawStacked`/`drawHeatmap`. On the main instance
bars automatically inherit the already-wired `setCursor` hover (`highlightHover`/`hoverChart`),
`attachNavigation` (pan/wheel/dblclick), `getCursor`/`onSetSelect` (drag-select), the crosshair, and
`chart.formatXAxis` time axis — closing (a),(b),(c),(e) for free.

Concretely:
- Add a `drawBars` draw hook (grouped for `multiBar`, stacked for `stackedBar`). Position each bar
  by time using `chartUI.getXCoord` (G1) / `u.valToPos`; compute bar width + per-group offsets from
  the time step (reference the geometry in `bars/seriesBarsPlugin.js` — group width, gap — but drive
  x off time, not ordinal index). Reuse the stack accumulation in `bars/stack.js` for `stackedBar`.
- **Negatives:** y value-range must span `[min, max]` including negative bar values (like line/area
  ranges), not `[0,max]`. Bars extend from the zero baseline both directions. Match dygraph.
- Remove the `barTypes`→`createBars` separate-instance branch and its early return; bars now flow
  through the normal `create`/`render` path with the draw hook. Keep `bars/stack.js` (reused);
  `seriesBarsPlugin.js`/`quadtree.js`/`distr.js` can be dropped if fully unused after — confirm with
  grep before deleting, and only delete what's truly orphaned.
- Bar-type point reduction is already handled upstream (`pointMultiplierByChartType`,
  `api/helpers.js`); don't change it.

## Hover fidelity note
Basic bar hover (emit the SDK hover events via the main-instance `setCursor`) is IN scope so
cross-chart sync works. Nearest-bar/column precise hit-testing refinement can align with G6 (hover
fidelity) — do the straightforward main-instance hover now; note anything deferred.

## Tests (real, no mocks — makeTestChart)
- With `chartType:"multiBar"` and `chartType:"stackedBar"` on a `chartLibrary:"uplot"` chart: assert
  the bars draw hook is registered on the main instance (not a separate ordinal instance), the x
  scale is time (not `distr:2` ordinal), the y value-range includes negatives when data has them,
  and stacked accumulation uses `stack.js`. Mirror existing uplot tests' style; jsdom can't paint so
  assert config/hook wiring, not pixels.
- Confirm bars now emit `highlightHover`/`hoverChart` through the shared `setCursor` (a hover test
  like the line path's).
- Full suite green; eslint clean on changed files.

## Visual verification (maintainer — jsdom can't paint)
Storybook `chartLibrary:"uplot"`, multiBar + stackedBar (showcase RenderModes): bars sit at correct
time positions with a formatted time x-axis; grouped bars have visible gaps; stacked bars stack
correctly; negative values render below the zero line; pan/wheel-zoom/dblclick-reset work; hovering a
bar drives the crosshair + cross-chart sync; light+dark theming. Compare against dygraph. Do NOT run
a dev server.

## Constraints
No semicolons; double quotes; 2-space indent; 100-char; ES5 trailing commas; arrow functions;
imports at top; no description comments; NEVER mock; JSX files import React. Don't touch
`numberFormat.js`. Commit in logical chunks. Test: `yarn jest --config ./jest/config.js <path> --collectCoverage=false`.
