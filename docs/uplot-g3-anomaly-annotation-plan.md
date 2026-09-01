# G3 — uPlot Anomaly Ribbon + Annotations — plan / mandate

> Parity sub-project G3 (`docs/uplot-parity-gap-map.md`). **Acceptance = dygraph parity:** anomaly
> ribbon, annotations strip, annotation markers, the annotation hover popover, and click-to-annotate
> must work on uPlot exactly as on dygraph. Builds on G1 primitives and the G2 uPlot overlay
> orchestration (`src/chartLibraries/uplot/overlays/`).

## Parts

### 1. Anomaly ribbon (`ANOMALY_RATE`)
dygraph draws it as a fake series with a custom plotter: `src/chartLibraries/dygraph/plotters/anomaly.js`
(uses `plotter.drawingContext`, `plotter.points[].canvasx/.xval`, top band). Reimplement as a uPlot
**draw hook** painting the top ribbon, positioned by time via `chartUI.getXCoord`/`u.valToPos` and
`chartUI.getPlotArea()` for the band height/offset. Reuse whatever anomaly-rate accessors dygraph's
plotter uses from the chart (they're renderer-agnostic). Match colors/height.

### 2. Annotations strip (`ANNOTATIONS`)
dygraph: `src/chartLibraries/dygraph/plotters/annotations.js` (bottom strip, per-point alert/annotation
flags). Reimplement as a uPlot draw hook (bottom band) the same way.

### 3. Annotation canvas markers (saved + draft)
dygraph: `src/chartLibraries/dygraph/overlays/annotation.js` (G2 deliberately skipped this). COPY-
THEN-EDIT it into `src/chartLibraries/uplot/overlays/annotation.js` and register it in the uPlot
overlay orchestration G2 built (`uplot/overlays/index.js`/`types.js`), swapping dygraph APIs per the
G2 pattern (`getDygraph`→uPlot `u`, `getArea`→`getPlotArea`, `toDomXCoord`→`getXCoord`,
`hidden_ctx_`→`u.ctx`, `getArea(dygraph,range)`→neutral `getArea(chartUI,range)`). The G2
orchestration already has a `draftAnnotation` branch — make sure the annotation type resolves there.

### 4. Annotation hover popover (React component)
`src/components/line/overlays/annotation/index.js:407-441` early-returns unless
`chartLibrary === "dygraph"` and uses `chartUI.getDygraph().canvas_` + `dygraph.toDomXCoord(ts*1000)`
for mouse-proximity detection. COPY-THEN-EDIT this `useEffect`: remove the dygraph-only gate and
replace the dygraph calls with renderer-agnostic ones — `chart.getUI().getXCoord(annotation.timestamp
* 1000)` (G1) and the plot-area/container for the canvas rect. Keep the proximity math identical.
Works for BOTH renderers after (dygraph still uses `getXCoord` which delegates to `toDomXCoord`).

### 5. Click-to-annotate
dygraph wires it in `src/chartLibraries/dygraph/hoverX.js:115-148` (`annotate()` →
`updateAttribute("draftAnnotation", …)` + `annotationCreate` trigger, and `highlightClick`). Add the
equivalent to uPlot's cursor/click handling in `src/chartLibraries/uplot/index.js` (a click handler
on `u.over` that maps click x→timestamp via the x scale and sets `draftAnnotation`/triggers
`annotationCreate`/`highlightClick`). Match dygraph's behavior and attribute contract.

## Out of scope → G6
Ribbon hover hit-testing (cursor over the top/bottom bands resolving `ANOMALY_RATE`/`ANNOTATIONS`,
`dygraph/hoverX.js:40-41`) is part of hover fidelity (G6). G3 draws the ribbons + wires the
annotation popover proximity + click-to-annotate; note the ribbon-band hover deferral.

## Tests (real, no mocks — makeTestChart)
- Mirror `dygraph/plotters/anomaly.test.js` + `annotations.test.js` for the uPlot ribbon draw hooks
  (assert the hook is registered and draws for a payload with `ANOMALY_RATE`/`ANNOTATIONS`).
- Annotation overlay: mirror the dygraph annotation coverage; assert the uPlot annotation type
  registers in the orchestration and emits/positions.
- Annotation popover: a `renderWithChart` test that the popover proximity path now runs for
  `chartLibrary:"uplot"` (no early return) — assert it reads `getXCoord`, not `getDygraph`.
- Click-to-annotate: simulate a click on the uPlot over-element and assert `draftAnnotation` is set /
  `annotationCreate` fires.
- Full suite green; eslint clean on changed files.

## Visual verification (maintainer)
Storybook `chartLibrary:"uplot"`: anomaly ribbon along the top colored by anomaly rate; annotations
strip along the bottom; hovering near an annotation shows its popover; clicking on the plot starts a
draft annotation — all matching dygraph. Do NOT run a dev server.

## Constraints
No semicolons; double quotes; 2-space indent; 100-char; ES5 trailing commas; arrow functions;
imports at top; no description comments; NEVER mock; JSX files import React. COPY-THEN-EDIT the
canvas plotters/markers and the React popover effect — do not rewrite. Don't touch `numberFormat.js`.
Commit in logical chunks. Test: `yarn jest --config ./jest/config.js <path> --collectCoverage=false`.
