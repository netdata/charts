# G8 — uPlot Stacked-Area Polish — plan / mandate

> Parity sub-project G8 (`docs/uplot-parity-gap-map.md` §G8, `docs/uplot-migration-progress.md` §4).
> **Acceptance = dygraph parity.** Two items were listed: null/gap handling and a top stroke.

## State (verified)
- **Top stroke**: already present — `drawStacked` (`src/chartLibraries/uplot/index.js`) draws a
  per-series top-edge stroke (`stackedEdgeAlpha`, `edgeWidth = devicePixelRatio`) after the fill.
  dygraph draws stacked with `strokeWidth: 0.1` (`dygraph/index.js:278`). Nothing to add here.
- **Null/gap handling — the gap**: dygraph sets `stackedGraphNaNFill: "none"` (`dygraph/index.js:368`),
  i.e. it does NOT fill across null/NaN — gaps show. uPlot's `drawStacked` skips null bounds with
  `continue`, so the fill polygon and the top stroke are drawn straight across the gap (**bridged**),
  not broken.

## Parts

### Segment the stacked fill/stroke at nulls
Refactor `drawStacked` so each series is drawn as one or more **contiguous non-null segments**
instead of one bridged path. Extract a `drawStackSegment(self, ctx, xs, series, start, end, color,
edgeWidth)` that draws the existing two passes (filled polygon: forward along `bound[1]` top, back
along `bound[0]` base; then the top-edge stroke) for a single `[start..end]` run. `drawStacked` walks
each series' `stackBounds()`, and for every maximal run of non-null bounds calls `drawStackSegment`.
A null bound ends the current run and starts a new one → the gap is left empty, matching dygraph.

Preserve every existing detail exactly (clip rect, `stackedFillAlpha`/`stackedEdgeAlpha`, `edgeWidth`,
draw order) — this is an in-place segmentation, not a rewrite.

## Out of scope
Gap-edge points (dygraph `drawGapEdgePoints`) — subtle dots at gap boundaries; not required for the
gap itself. Non-stacked chart types.

## Tests (real, no mocks — makeTestChart)
- `index.test.js`: mount a `stacked` chart with and without a null in one series; count `ctx.moveTo`
  calls during the draw hooks (drawStacked is the only `moveTo` source when no crosshair/overlays and
  the payload has no `all` ribbon data) — the null case must yield strictly more subpaths (segments),
  proving the gap is not bridged.
- Full suite green; eslint clean on changed files.

## Visual verification (maintainer)
Storybook `chartLibrary:"uplot"` stacked with null holes: gaps appear where data is missing (no
bridging), top stroke follows each segment, mixed-sign (diverging) still renders. Do NOT run a dev
server.

## Constraints
No semicolons; double quotes; 2-space indent; 100-char; ES5 trailing commas; arrow functions; imports
at top; no description comments; NEVER mock. Preserve existing fill/stroke passes exactly.
Test: `yarn jest --config ./jest/config.js <path> --collectCoverage=false`.
