# G2 — uPlot Alert Overlays — plan / mandate

> Parity sub-project G2 (`docs/uplot-parity-gap-map.md`). Builds on G1 primitives
> (`getPlotArea`/`getXCoord`/`getXAxisRange`, neutral `getArea`). Executed via subagent.
> **Acceptance = dygraph parity: the same overlays must appear in the same place with the same UX.**

## Scope

Port the dygraph **alert** overlays to uPlot: `alarm`, `alarmRange`, `alertTransitions`, and the
`highlight` selection shading — the canvas-draw layer AND the `overlayedAreaChanged:<id>` emits that
position their React badges. Crosshair/point is already done on uPlot. **Out of scope (→ G3):**
annotation markers/popover and the anomaly ribbon.

## How dygraph does it (the thing to mirror)

- `src/chartLibraries/dygraph/overlays/index.js` returns `{ toggle, destroy }`; `toggle` subscribes
  `drawOverlays` to `chartUI.on("underlayCallback", …)` when `chart.getAttribute("overlays")` is
  non-empty. `drawOverlays` iterates the overlays map, looks up `types[type]`
  (`dygraph/overlays/types.js`), and calls `makeOverlay(chartUI, id)`.
- Each overlay file (`alarm.js`, `alarmRange.js`, `alertTransitions.js`, `highlight.js`) draws on
  the dygraph canvas (`dygraph.hidden_ctx_`/`canvas_ctx_`) using `dygraph.getArea()` +
  `dygraph.toDomXCoord()` + the shared `getArea(dygraph, range)` (`overlays/helpers.js`), and emits
  position via `trigger(chartUI, id, area)` → `overlayedAreaChanged:<id>` (RAF).
- The React badge components (`src/components/line/overlays/{alarm,alarmRange,highlight}.js`) are
  renderer-agnostic — they only need the `overlayedAreaChanged:<id>` events (via `container.js`).
  They must NOT need changes; if they do, that's a signal the emit contract diverged.

## Porting rules (STRICT — user standing rule)

**Copy-then-edit; never rewrite from scratch.** For each overlay:
1. `cp src/chartLibraries/dygraph/overlays/<file>.js src/chartLibraries/uplot/overlays/<file>.js`
   (and copy `types.js` + create a uplot `overlays/index.js` from the dygraph one).
2. Edit ONLY the renderer-specific calls, using the G1 primitives + the live `u`:
   - `chartUI.getDygraph()` / `dygraph` → the uPlot instance `u` (pass it into the draw fns).
   - `dygraph.getArea()` `{x,y,w,h}` → `chartUI.getPlotArea()` `{left,top,width,height}`.
   - `dygraph.toDomXCoord(tsMs)` → `chartUI.getXCoord(tsMs)`.
   - `dygraph.hidden_ctx_` / `canvas_ctx_` → `u.ctx`.
   - `getArea(dygraph, range)` (helpers) → the neutral `getArea(chartUI, range)` from
     `@/chartLibraries/helpers/overlayArea` (already built in G1).
   - `dygraph.renderGraph_(false)` (force redraw) → `u.redraw()`.
   - `chartUI.on("underlayCallback", drawOverlays)` → register `drawOverlays` so it runs inside
     uPlot's existing `draw` hook (`src/chartLibraries/uplot/index.js` builds
     `hooks: { draw: [drawStacked, draw] }` — add an overlays draw pass there, with `u.ctx`).
   Leave the drawing math, colors, theme lookups, alpha, and emit logic otherwise identical.
3. Preserve each overlay's `overlayedAreaChanged:<id>` emit exactly (same id, same
   `{from,to,width}` shape) so the React badges position identically.

## Wiring into uPlot

- Instantiate the uPlot overlays module in `uplot/index.js` (mirror where dygraph calls
  `makeOverlays(chartUI)` and `toggle()`), so overlays redraw when the `overlays` attribute (and the
  relevant reactive attributes: `hoverX`/selection for highlight, alarm data) change. Match dygraph's
  redraw triggers — reuse uPlot's existing attribute-change → `u.redraw()` reactions; add overlay
  attribute reactions where dygraph has them.
- Overlays draw during the `draw` hook using `u.ctx`, `u.bbox`, and `chartUI.getXCoord`. Match
  dygraph's visual layering (shading behind series / with alpha) as closely as uPlot's draw-hook
  timing allows; if uPlot's draw runs over series where dygraph drew under, use the same alpha so the
  result matches — verify visually.

## Tests (real, no mocks — makeTestChart)

- uPlot overlays module: with `overlays: { <id>: { type: "alarmRange", … } }` set on a
  `chartLibrary:"uplot"` chart, assert the module subscribes and, on a render, emits
  `overlayedAreaChanged:<id>` with a `{from,to,width}` (or null when out of window) — mirror the
  existing `dygraph/overlays/*.test.js` (`highlight.test.js`, `point.test.js`, `proceeded.test.js`)
  so coverage matches. Reuse their assertions where possible.
- Confirm the React badge components render given the emitted event (they're unchanged; a light
  integration check via `renderWithChart` that the alarm/alarmRange/highlight badge appears for a
  uPlot chart with the overlay attribute set).
- Full suite green after (touches `uplot/index.js` + new `uplot/overlays/*`).

## Visual verification (maintainer — jsdom can't paint)
This also closes the G1 T3 open item. In Storybook on a `uPlot` chart:
- An alarm / alarmRange overlay draws its shaded band + badge at the correct time position (matches
  where dygraph draws it).
- alertTransitions markers appear at the right x.
- A drag-select highlight shows the shaded selection + correlation/zoom badge over the selection.
State exactly what to check; do NOT run a dev server.

## Constraints
No semicolons; double quotes; 2-space indent; 100-char; ES5 trailing commas; arrow functions;
imports at top; no description comments; NEVER mock; JSX files import React. Don't touch
`numberFormat.js`. Test: `yarn jest --config ./jest/config.js <path> --collectCoverage=false`.
