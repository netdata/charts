# G1 — uPlot overlay positioning foundation — design

> Branch `explore/uplot-spike`. First sub-project of the parity effort
> (`docs/uplot-parity-gap-map.md`, gap G1). Enabler only — draws no overlays.

## Purpose

Give uPlot the renderer-neutral coordinate primitives the overlay/positioning layer depends on, and
fix the one place that silently breaks under uPlot today (`AlertTimeline` misalignment). This
unblocks G2 (alert overlays) and G3 (anomaly/annotation) without drawing anything itself.

## Verified mechanism (what this stands on)

- React overlay badges are positioned by `src/components/line/overlays/container.js:66-72`, which
  listens for `chartUI.on("overlayedAreaChanged:<id>", area => …)` and positions from
  `area = { from, to, width }` (DOM px). With no emitter, `container.js:77`
  (`if (!area && !fixed) return null`) renders nothing — why alarm/alarmRange/highlight/proceeded
  badges are invisible on uPlot.
- That area is computed per-overlay from a time **range** by `getArea(dygraph, range)`
  (`src/chartLibraries/dygraph/overlays/helpers.js:1-20`) using `dygraph.xAxisRange()` +
  `dygraph.toDomXCoord()`, then emitted via `trigger(chartUI, id, area)` inside `requestAnimationFrame`.
- `usePlotArea` (`src/components/provider/selectors.js:683-690`) separately needs the whole plot
  rect: `chart.getUI(uiName)?.getDygraph?.()?.getArea()` → `{ left: area.x, width: area.w }`. On
  uPlot `getDygraph` is undefined → `{ left: 0, width: 0 }` → `AlertTimeline` (`index.js:183`)
  misaligns silently.

Both are bound to dygraph APIs (`toDomXCoord`, `getArea`). G1 replaces those with a neutral contract.

## Components

### 1. Neutral coordinate primitives on the chartUI contract
Add to BOTH renderers' chartUI instances:

- **`getPlotArea()` → `{ left, top, width, height }`** (DOM px, plotting-area rect).
  - dygraph (`src/chartLibraries/dygraph/index.js`, where `getDygraph` is defined): wrap
    `getDygraph().getArea()` → `{ left: x, top: y, width: w, height: h }`.
  - uPlot (`src/chartLibraries/uplot/index.js` instance at `:505-516`): derive from the live `u`
    instance's plotting box (`u.bbox` in canvas px ÷ `devicePixelRatio`, or `u.over` offsets),
    relative to the chart container so it matches the frame `container.js`/`usePlotArea` expect.
    Returns a zero rect when `u` is not yet created (unmounted).
- **`getXCoord(timestampMs)` → DOM px x** in the same reference frame `getArea` uses today.
  - dygraph: `getDygraph().toDomXCoord(timestampMs)`.
  - uPlot: `u.valToPos(timestampMs / 1000, "x")` adjusted to the same frame as dygraph's
    `toDomXCoord` (uPlot x-scale is in seconds; the SDK stores ms).

### 2. Shared `getArea(chartUI, range)` helper
Move the range→`{ from, to, width }` logic out of `dygraph/overlays/helpers.js` into a
renderer-neutral module (e.g. `src/chartLibraries/helpers/overlayArea.js`) that computes from
`chartUI.getPlotArea()` + `chartUI.getXCoord(...)` instead of `dygraph.xAxisRange()`/`toDomXCoord()`.
dygraph's `overlays/helpers.js` re-exports / delegates to it so existing dygraph overlays behave
identically (no visual change, verified by their existing tests/stories). The neutral helper is what
G2 will call to emit `overlayedAreaChanged:<id>` from uPlot.

### 3. Fix `usePlotArea`
Rewrite `src/components/provider/selectors.js:683-690` to read `chart.getUI(uiName)?.getPlotArea?.()`
and map to `{ left, width }` (keeping the existing `rendered`/`resize` re-render subscription). Both
renderers now supply a real rect → `AlertTimeline` aligns under uPlot.

## Interfaces (contracts later tasks rely on)

- `chartUI.getPlotArea(): { left, top, width, height }` — DOM px; zero rect when unmounted.
- `chartUI.getXCoord(timestampMs: number): number` — DOM px x, same frame as dygraph today.
- `getArea(chartUI, range: [afterSec, beforeSec]): { from, to, width } | null` — null when the range
  is fully outside the visible window (preserves current dygraph behavior at `helpers.js:11`).

## Non-goals (G1)

- No drawing or emitting of any alarm/alarmRange/alertTransitions/highlight/annotation/anomaly
  overlay on uPlot — that is G2/G3, built on these primitives.
- No change to dygraph overlay *behavior* — only the internal refactor to the shared helper.

## Testing

- `getArea(chartUI, range)` math: with a stub chartUI exposing `getPlotArea`/`getXCoord`, assert
  `{from,to,width}` and the null-when-outside case. Real logic, no mocks of app components.
- dygraph `getPlotArea`/`getXCoord`: via real `makeTestChart` (dygraph default) — assert shape and
  delegation.
- `usePlotArea`: with `renderWithChart`, assert it reads `getPlotArea()` and returns `{left,width}`.
- uPlot `getPlotArea`/`getXCoord`: jsdom cannot paint, so `u.bbox`/`valToPos` yield no real layout —
  cover the unmounted zero-rect path in jest, and verify real positioning visually in Storybook
  (a uPlot chart with a highlight selection shows the badge in the right place; `AlertTimeline`
  aligns).

## Verified anchors

- Badge positioning consumer: `src/components/line/overlays/container.js:66-72,77`.
- Per-overlay area + emit: `src/chartLibraries/dygraph/overlays/helpers.js:1-23`.
- Whole-plot accessor to fix: `src/components/provider/selectors.js:683-690`;
  consumer `src/components/alertTimeline/index.js:183`.
- uPlot chartUI instance to extend: `src/chartLibraries/uplot/index.js:505-516`
  (`getChartWidth`/`getChartHeight` already derive from `u.over`).
- dygraph `getDygraph`/`getArea` surface: `src/chartLibraries/dygraph/index.js` (getDygraph defined).

## Coordination

Implementation touches `src/chartLibraries/uplot/index.js`, which the frontend-design subagent is
currently editing. G1 implementation must land **after** that work and rebase on it.
