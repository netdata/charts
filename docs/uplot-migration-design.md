# uPlot migration — design spec

**Background & rationale:** see `docs/charting-library-exploration.md` (the exploration reference —
library comparison, SDK↔library contract, dygraph coupling, domain features). This spec formalizes
the design; that doc is the "why".

**Goal:** replace dygraphs with uPlot as the Netdata time-series renderer, incrementally and
behind the existing `chartLibrary` abstraction, without regressing any chart feature.

## Phasing

- **Phase 0 — renderer/type decoupling (this spec's detailed plan).** Make the time-series
  renderer configurable per chart type so uPlot can be selected safely in-app. Prerequisite for
  everything else. Detailed plan: `docs/uplot-phase0-plan.md`.
- **Phase A — uPlot parity** (planned per-subsystem after Phase 0 + first perf read): line/area →
  navigation/selection → shared overlay primitives (crosshair/alert/anomaly/annotation) → tickers
  & unit/timezone/range reactions → stacked/diverging/bar/heatmap → sparkline. Then measure real
  dashboard CPU/memory/frame-time/bundle delta, then flip the `line` default to uPlot, then remove
  dygraph.
- **Phase B — ECharts consolidation** (later): pie/gauge/easyPie/bars.

## Phase 0 design

### Problem (verified)
The time-series renderer is hardcoded to `"dygraph"` at three sites:
- `src/sdk/makeChart/filters/makeControllers.js:122-158` — `updateChartTypeAttribute` sets
  `chartLibrary:"dygraph"` for every dygraph-backed chart type (line/stacked/area/stackedBar/
  multiBar/heatmap) and gates UI rebuild on `prevChartLibrary !== "dygraph"`.
- `src/components/toolbox/chartType.js:131-136` — `value = chartLibrary === "dygraph" ? chartType
  : chartLibrary`; then `items.find(v => v===value)` **throws** if `value` is unknown (e.g. a
  non-dygraph time-series renderer).
- `src/components/toolbox/settings/tabs/chartType.js:142-148` — same `=== "dygraph"` assumption;
  `options.find(...) || options[0]` fallback (no throw, but wrong selection).

(4th, non-blocking: `src/components/line/chartContentWrapper.js:14` maps `chartLibrary`→CSS with a
`|| ""` fallback — noted, not required for Phase 0.)

### Mechanism
Introduce a **per-chart-type renderer map** so each dygraph-backed chart type resolves to a
configurable renderer. This enables *incremental* migration — e.g. flip `line` to uPlot while
`heatmap` stays on dygraph until its plotter is ported.

- **New SDK default attribute `chartLibrariesByType`** (map chartType → renderer), defaulting to
  the current behavior:
  ```js
  chartLibrariesByType: {
    line: "dygraph", stacked: "dygraph", area: "dygraph",
    stackedBar: "dygraph", multiBar: "dygraph", heatmap: "dygraph",
  }
  ```
  Set in `src/makeDefaultSDK.js` alongside `chartLibrary: "dygraph"`; overridable per SDK/app.
  Attribute overrides are **shallow-merged** (`makeDefaultSDK.js` spreads `...attributes`), so
  passing `{ line: "uplot" }` **replaces** the whole map — omitted types still resolve to
  `"dygraph"` via `getRendererForChartType`'s fallback, so a partial override is safe. Spread the
  default into the override to keep other entries explicit.
- **New chart helpers** (added to `makeControllers` return → spread onto the node at
  `makeChart/index.js:423`):
  - `getRendererForChartType(chartType)` → `chartLibrariesByType[chartType] || "dygraph"`.
  - `isTimeSeriesRenderer(chartLibrary)` → `true` if `chartLibrary` is any value present in
    `chartLibrariesByType` (or the literal `"dygraph"` default) — i.e. it renders chart *types*
    rather than being a standalone library.
- **`updateChartTypeAttribute(selected)`**: for a time-series chart type, resolve
  `const next = getRendererForChartType(selected)`, set `{ chartLibrary: next, chartType:
  selected }`, and rebuild the UI when `prevChartLibrary !== next` (instead of `!== "dygraph"`).
  Standalone-library branch unchanged.
- **Both toolbox components**: `value = isTimeSeriesRenderer(chartLibrary) ? chartType :
  chartLibrary`, and guard `items.find(...)`/`options.find(...)` against `undefined` so an
  unmapped value can never throw.

### Design decisions to confirm (at spec review)
1. **Attribute name** `chartLibrariesByType` (map keyed by chart type). Alternative: a single
   `defaultChartLibrary` scalar (simpler, but no per-type incremental rollout). *Recommendation:
   the map — it is what makes migration incremental.*
2. **Where configured:** an SDK default attribute (per-SDK/app override), not per-React-component
   prop. Your 1b note said "check against `component.defaultChartLibrary`" — this spec instead
   exposes `chart.isTimeSeriesRenderer(...)` / `chart.getRendererForChartType(...)` so the same
   logic serves the controller and both components. Confirm this placement/naming.
3. **uPlot stays out of the menu** — users pick `line`, which resolves to the configured renderer.
   uPlot is never a directly-selectable menu item.

### Non-goals for Phase 0
Phase 0 is **selection plumbing only — it does not render uPlot**; dygraph stays the default
renderer for every type. No uPlot feature work, and no uPlot-rendering concerns such as shipping
`uplot/dist/uPlot.min.css` (which is **functional** — it drives `.uplot` layout and cursor
positioning, not just styling) — those are Phase A. After Phase 0, setting
`chartLibrariesByType.line = "uplot"` with uPlot registered via `sdk.addUI` routes line charts to
uPlot without breaking the toolbox.

## Testing strategy
- **Jest** (`makeTestChart`, `renderWithChart`): controller resolves the mapped renderer; toolbox
  components don't throw and select correctly when the time-series renderer is non-dygraph.
- **Storybook**: per §7 of the exploration doc — register uPlot via `sdk.addUI`, exercise the
  scenario checklist (synced charts, empty transitions, live updates, resize, virtualization
  remounts, unit/timezone). Bare container now; full wrapper after Phase 0.

## Global constraints (from repo conventions)
- No semicolons, double quotes, 2-space indent, 100-col, ES5 trailing commas, arrow functions.
- No descriptive inline comments; only real function docs.
- Lowercase filenames for JS/components.
- Tests never mock netdata-ui/providers/components; use real imports + `makeTestChart`.
- Peer deps only (React 19, styled-components 6, @netdata/netdata-ui); no new runtime deps in
  Phase 0.
