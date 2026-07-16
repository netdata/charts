# G6 — uPlot Hover Fidelity + Click Actions — plan / mandate

> Parity sub-project G6 (`docs/uplot-parity-gap-map.md` §G6). **Acceptance = dygraph parity.**
> Refines the existing uPlot `setCursor` hover so it reports the **nearest** series/bucket like
> dygraph, adds ribbon-band hit-testing (deferred from G3), and fires `chart.trigger` alongside
> `sdk.trigger` for the highlight events. Click-to-annotate + `highlightClick` + their `chart.trigger`
> already landed in G3.

## Current gap (verified)
`src/chartLibraries/uplot/index.js` `setCursor` reports `chart.getVisibleDimensionIds()?.[0]` — always
the **first** visible dimension — and fires only `sdk.trigger("highlightHover"/"highlightBlur")`.
dygraph does real closest-point detection (`dygraph/hoverX.js:33-79`), resolves ribbon bands, and
fires both `chartUI.sdk.trigger` AND `chartUI.chart.trigger` (`hoverX.js:95-96,166-167`).

## Parts

### 1. Nearest-dimension hit-testing (`hover.js`)
New `src/chartLibraries/uplot/hover.js` exporting `makeGetHoverDimension(chart) => self => dimensionId`,
mirroring `dygraph/hoverX.js` `findClosest` order and using `self.cursor.top`/`self.cursor.idx` +
`self.valToPos(v, "y")` (verified same plot-area CSS origin as `cursor.top`):
- **Ribbon bands first** (match dygraph order): `top > over.clientHeight - 10` → `"ANNOTATIONS"`;
  `top < 15` → `"ANOMALY_RATE"`. Gated on `showAnnotations`/`showAnomalies` (dygraph gates implicitly
  via `getPropertiesForSeries` returning undefined when the fake series is absent).
- **heatmap** → nearest visible bucket by `|valToPos(getHeatmapYIndex(id),"y") - top|` → bucket id
  (analog of `getClosestHeatmapDimension`).
- **stacked** → diverging-stack band distance using `getStackBounds` (`./stacking`), analog of
  `findDivergingStackedPoint` (`dygraph/divergingStack.js`): distance 0 inside `[baseY,endY]`, else gap.
- **stackedBar** → same band distance from the cumulative `stack()` tops (`./bars/stack`), consistent
  with how `drawStackedBars` paints segments (`[top-value, top]`).
- **default (line/area/multiBar)** → nearest visible series by `|valToPos(value[idx],"y") - top|`
  (analog of `findClosestPoint`). Fallback to first visible id if none resolve.

### 2. Wire into `setCursor`
Replace the first-dimension lookup with `getHoverDimension(self)`; add
`chart.trigger("highlightHover", timestamp, dimensionId)` after the sdk trigger and
`chart.trigger("highlightBlur")` in the blur branch (dygraph fires both). Leave the existing
`hoverChart`/`blurChart` emission untouched (out of G6 scope; those also flow from React
`onHover`/`onBlur` → `chart.focus`/`chart.blur`).

## Out of scope
Touch/mobile hit-testing (G7). Diverging data-handler internals (dygraph-specific); uPlot recomputes
bounds from the same `stacking.js`/`bars/stack.js` used for drawing.

## Tests (real, no mocks — makeTestChart)
- `hover.test.js`: for each chartType, mount, set `u.cursor` near a known series/bucket/band, call
  `makeGetHoverDimension(chart)(u)`, assert the resolved dimensionId is the nearest one (not always
  the first); ribbon bands resolve `ANOMALY_RATE`/`ANNOTATIONS` and respect the show flags.
- `index.test.js`: assert `setCursor` emits `highlightHover` on BOTH the sdk bus and the chart bus
  with the nearest dimension, and `highlightBlur` on both when the cursor leaves.
- Full suite green; eslint clean on changed files.

## Visual verification (maintainer)
Storybook `chartLibrary:"uplot"`: hovering different series highlights the nearest one (tooltip/legend
follows the cursor's Y), stacked/heatmap resolve the band/bucket under the cursor, top/bottom ribbon
bands report anomaly/annotation. Do NOT run a dev server.

## Constraints
No semicolons; double quotes; 2-space indent; 100-char; ES5 trailing commas; arrow functions; imports
at top; no description comments; NEVER mock; JSX files import React. Reuse `stacking.js`/`bars/stack.js`
— do not duplicate stack math. Commit in logical chunks.
Test: `yarn jest --config ./jest/config.js <path> --collectCoverage=false`.
