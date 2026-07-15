# Charting library exploration & migration reference

> Status: exploration complete, decision made, lifecycle + coordinate-transform spike
> implemented on branch `explore/uplot-spike` (uncommitted).
> Date: 2026-07-14.
> Purpose: durable record of *why* we are moving the time-series engine off dygraphs, *what*
> the replacement must satisfy, and *how* the SDK abstraction makes it incremental. Read this
> before re-investigating chart libraries — the comparison and sources are captured here so we
> do not repeat the research.

## 1. Goal

`@netdata/charts` is the rendering SDK behind cloud-frontend. The SDK was designed so the
rendering library is swappable per chart type (`chartLibrary` attribute). We want to know whether
dygraphs is still the right time-series engine and, if not, what to replace it with — optimizing
for **performance/scale, visual quality, new capabilities, and maintainability** (all four).

**Decision (2026-07-14):** replace dygraphs with **uPlot** as the time-series engine, done
**incrementally behind the existing abstraction** (register `uplot` as an additional
`chartLibrary`, reach parity, flip the default, then remove dygraph). A later phase consolidates
the non-line charts (d3pie / gauge / easyPie / bars) onto **Apache ECharts**. WASM/WebGL engines
were evaluated and deferred — they are not justified at our current data scale.

## 2. Why move off dygraphs

- **Maintenance risk.** dygraphs is at `2.2.1` with no substantive activity since ~early 2023.
  ([releases](https://github.com/danvk/dygraphs/releases))
- **Deep coupling to dygraph internals.** Our integration reaches into *private* dygraph APIs
  that break on any internal change: `renderGraph_`, `canvas_ctx_`, `hidden_ctx_`, `canvas_`,
  `layout_.setNames`, `axes_[0].valueRange`, `dateWindow_`, `Dygraph.defaultInteractionModel`,
  `Dygraph.startPan/movePan/endPan`, `Dygraph.startZoom`, `clearZoomRect_`, plus deep source
  imports (`dygraphs/src/datahandler/default`, `dygraphs/src/dygraph-utils`,
  `dygraphs/src/extras/smooth-plotter`). See §4.
- **Performance & size (upstream published numbers — NOT measured on Netdata).** In uPlot's own
  published benchmark, uPlot rendered in **~34 ms / 21 MB heap** vs dygraphs **~90 ms / 88 MB**,
  at **~48 KB vs ~132 KB** bundle. ([uPlot](https://github.com/leeoniya/uPlot)) We have **no
  local Netdata measurements yet**; §7 Phase A requires measuring real dashboard CPU / memory /
  frame time / bundle delta before flipping the default.
- **Precedent.** Grafana — the closest analog (dashboards with many time-series panels) —
  migrated off its old canvas library to uPlot in 7.4 and reported panels rendering **2–3×
  faster**; it now backs their Time series, Stat, Timeline, Histogram and Bar chart panels.
  ([Grafana blog](https://grafana.com/blog/how-the-new-time-series-panel-brings-major-performance-improvements-and-new-visualization-features-to-grafana-7-4/))

## 3. The SDK ↔ chart-library contract

A chart library is a factory `makeChartLibrary = (sdk, node) => instance`, registered under
`sdk.ui[name]` (`src/makeDefaultSDK.js`) and invoked at `src/sdk/index.js:52` and
`src/sdk/makeChart/index.js:310`. It builds on the shared base `makeChartUI(sdk, chart)`
(`src/sdk/makeChartUI.js:38-49`) and spreads it.

**Key architectural fact:** the interaction plugins in `src/sdk/plugins/` operate on the *core
node* (`chart.*`) and the *sdk event bus*, **not** on the rendering library. So the swappable
surface is small and well-defined:

### (a) Mandatory lifecycle methods the instance must expose
| Method | Caller | Obligation |
|---|---|---|
| `mount(element)` | `src/components/chartContainer.js:10` | attach renderer; call `chartUI.mount(el)` |
| `unmount()` | `chartContainer.js:11`, `makeChart/index.js:399` | tear down; call `chartUI.unmount()` |
| `render()` | core render loop, `makeChart/index.js:138` | redraw from payload; fire `chartUI.trigger("rendered")` |
| `getRenderedAt()` | `plugins/hover.js:26` | ms timestamp of last render's right edge (base provides) |
| `getChartWidth()` / `getChartHeight()` | provider selectors, api width calc (`makeChart/api/helpers.js:48`) | drawable px |
| `getElement()` | base utility | mounted DOM node |

### (b) Events the library must EMIT on the sdk bus (payloads are load-bearing)
| Event | Payload | Consumed by |
|---|---|---|
| `panStart` / `panEnd` | `(chart)` / `(chart, [afterMs, beforeMs])` | `plugins/pan.js` → `chart.moveX` |
| `highlightStart` / `highlightEnd` | `(chart)` / `(chart, [after,before]s\|null)` | `plugins/highlight.js`, `plugins/select.js` → `chart.moveX` |
| `highlightVerticalStart` / `highlightVerticalEnd` | `(chart)` / `(chart, [min,max]\|null)` | `plugins/selectVertical.js` → `chart.moveY` |
| `highlightHover` | `(chart, xMs, dimensionId)` | `plugins/hover.js:3` → sets `hoverX` on syncHover nodes |
| `highlightBlur` | `(chart)` | `plugins/hover.js:8` → clears `hoverX` |
| `hoverChart` / `blurChart` | `(chart)` | `plugins/hover.js:13/32` → `hovering` state for autofetch/play |
| `annotationCreate` | `(chart, xSeconds)` | consuming app / overlays |

Navigation methods the library just *calls* (already implemented by core): `chart.moveX`,
`chart.moveY`, `chart.updateStaticValueRange`, `chart.resetNavigation`, `chart.zoomIn/Out/X`
(`src/sdk/makeNode.js:127-169`).

### (c) Attribute reactions the library must implement (`chart.onAttributeChange`)
`hoverX`, `clickX` (synced crosshair — the hardest cross-chart coupling), `enabledHover`,
`enabledNavigation`, `navigation`, `overlays`, `draftAnnotation`, `theme`, `chartType`,
`unitsConversionPrefix`, `selectedLegendDimensions`, `staticValueRange`, `timezone`. Reference
implementation: `src/chartLibraries/dygraph/index.js:142-208`. Plus a ResizeObserver → resize.

### (d) Data/state the core PROVIDES (library consumes — free)
`chart.getPayload()` → `{ data, labels, all, point, byDimension, tree }`; `getDateWindow()`;
`getAttribute(s)`; dimension helpers (`getPayloadDimensionIds`, `getVisibleDimensionIds`,
`isDimensionVisible`, `selectDimensionColor`, `getDimensionUnit`, `getVisibleHeatmapIds`,
`getHeatmapScale`); formatting (`getConvertedValueWithUnit`, `getConvertedValue`,
`getUnitAttributesForValue`, `formatXAxis`, `getThemeAttribute`); `getClosestRow(ms)`.

## 4. Dygraph coupling catalog (what must be re-expressed)

The custom work is bolted onto dygraph's canvas + coordinate transforms. Grouped by portability:

- **Portable logic (reuse as-is):** color math (`plotters/helpers.js`), tick generation core
  (`@/helpers/ticks`), stacked-area point decimation, diverging-stack accumulation math, the
  `overlayedAreaChanged` event contract, the `chartUI` event-bus indirection.
- **Must re-implement against the new library's canvas/coords API:**
  - 7 custom plotters — `plotters/{stackedArea,stackedBar,multiColumnBar,heatmap,anomaly,annotations,linePlotter}.js`
  - 2 axis tickers — `tickers/{numeric,heatmap}.js`
  - the diverging-stack data handler — `divergingStack.js` (subclasses dygraph `DefaultHandler`)
  - 7 overlays + crosshair — `overlays/{alarm,alarmRange,alertTransitions,highlight,annotation,point,proceeded}.js`, `crosshair.js` (all draw into dygraph canvas contexts via `toDomXCoord`)
  - hover hit-testing — `hoverX.js`
  - 4 navigation modes — `navigation/{generic,pan,select,selectVertical}.js`
- **Two hardest friction points:**
  1. the `hoverX`/`clickX` synced-crosshair-by-timestamp mechanism;
  2. the annotation overlay hard-calls `chartUI.getDygraph()` and dygraph coordinate transforms
     (`src/components/line/overlays/annotation/index.js:419`) — needs a coordinate-transform
     shim or refactor, not a rewrite.

## 5. Domain features any time-series engine must express

Verified in code — the "beyond a line" requirements:

1. **Multi-value points per cell.** Raw cell = `[value, arp, pa]`; `point` maps valueKey→index
   (`src/sdk/makeChart/getPointValue.js`). After `transformResult` the consumed
   `payload.data` row is `[ts_ms, value₁…valueₙ, null(ANOMALY_RATE), null(ANNOTATIONS)]` and
   `payload.labels` carries the two synthetic trailing columns
   (`src/sdk/makeChart/camelizePayload.js:7-65`). Observed valueKeys: `value`, `arp`, `pa`,
   `avg/min/max/sum/count/volume/percent`.
2. **Per-dimension palette colors** with keyed/positional overrides, theme-aware
   (`makeDimensions.js:312-338`).
3. **Anomaly ribbon** — top strip, aggregated max `arp` scaled to color
   (`plotters/anomaly.js`).
4. **Data-quality annotation strip** — bottom strip driven by the `pa` bitmask
   (`helpers/annotations`, `plotters/annotations.js`).
5. **Alert overlays** — vertical markers, shaded ranges, state-transition region fills
   (warning/critical/clear) + user annotations (`overlays/`).
6. **Render modes** — line, area, stacked, diverging-stacked, bar, multi-bar, heatmap.
7. **Grouping & aggregation** — groupBy node/instance/dimension/label/percentage-of-instance;
   incremental/cumulative dimensions; sum/avg/min/max (`filters/`).
8. **Time-range highlight/selection** that feeds back into fetch (`chart.moveX`).

**Gaps worth noting:** there is **no rendered min/max shaded band** today (the per-point
min/max/avg data exists but is not drawn) — an easy new-capability win in uPlot. All
anomaly/annotation/alert overlays currently live **only in the dygraph library**, so parity work
must re-express them for uPlot.

## 6. Library landscape (verified 2026-07-14)

| Library | Tech | Bundle | Perf (published) | Maintained | Role |
|---|---|---|---|---|---|
| dygraphs (current) | Canvas 2D | ~132 KB | 90 ms / 88 MB | ⚠️ ~2023 | incumbent — replace |
| **uPlot** ✅ | Canvas 2D | ~48 KB | 34 ms / 21 MB | ✅ v1.6.32 (2026) | **time-series engine** |
| Apache ECharts | Canvas/SVG/WebGL | ~100 KB gz tree-shaken | progressive ~10M pts | ✅ active | phase 2: pie/gauge/bars/heatmap |
| Perspective (FINOS) | **WASM** + Arrow (Rust/C++) | heavy (WASM) | millions, streaming | ✅ active | only large analytical grids/streaming |
| TimeChart / webgl-plot | WebGL | small | millions @ 60fps | moderate | only if uPlot hits a ceiling |
| SciChart / LightningChart | WebGL (commercial) | — | millions @ 60fps | ✅ commercial | extreme scale, paid license |

**Why not WASM/WebGL now:** per uPlot's author and the benchmarks, WebGL/WASM carry higher
startup cost and code size and only pay off past canvas's ceiling. Netdata's per-chart point
count is bounded by pixel width (`src/sdk/makeChart/api/helpers.js:46` derives `points` from
chart width), so we are not rendering millions of raw points per chart. Canvas (uPlot) is the
correct tier; WASM/WebGL remains a targeted option for a specific heavy view later.

**uPlot capability check (verified against uPlot docs):** hooks + plugin system (the
`underlayCallback` equivalent), pluggable path renderers (linear/spline/stepped/bars), per-series
stroke/fill + show/hide, custom axes (`splits`/`values`), cursor sync across charts, zoom with
auto-rescale, live streaming via `setData`. Pan is a plugin (matches how we already treat pan as
a plugin). Its opinionated omission of *built-in* stacked series does not block us — we already
compute stacks ourselves (`divergingStack.js`) and feed pre-stacked series.

**Overlay foundation verified (from `node_modules/uplot/dist/uPlot.d.ts`, and exercised in the
spike):** `valToPos(val, scaleKey, canvasPixels?)` and `posToVal(leftTop, scaleKey,
canvasPixels?)` for data↔pixel transforms; hooks `init/setScale/setCursor/setSelect/drawClear/
drawAxes/drawSeries/draw/ready`; instance props `root`, `ctx` (2D context), `bbox`, `over`,
`under`; `redraw(rebuildPaths?, recalcAxes?)`, `setCursor({left,top}, fireHook?)`,
`setSelect({left,top,width,height}, fireHook?)`. This is everything the dygraph overlays/crosshair
use `toDomXCoord`/`hidden_ctx_`/`getArea` for today — so all §4 overlays port onto uPlot's
`draw` hook + `valToPos` + `ctx`. The spike exercises this path with a synced crosshair; the
`draw` hook + `valToPos` + `ctx` wiring runs without error and hover emission is asserted by an
automated test. **Pixel-coordinate correctness and cross-chart hover sync are validated manually
in Storybook, not yet by automated assertions.**

## 7. Phased plan

### Phase 0 — decouple renderer identity from chart presentation (prerequisite)

Today the time-series renderer is welded to the chart *type*, so uPlot cannot be selected through
the normal app flow, and forcing `chartLibrary:"uplot"` breaks the toolbox UI. Three sites:

- `src/sdk/makeChart/filters/makeControllers.js:111-131` — `updateChartTypeAttribute` hardcodes
  `chartLibrary:"dygraph"` for every non-library chart *type* (line/area/stacked/heatmap).
- `src/components/toolbox/chartType.js:131-136` — `value = chartLibrary === "dygraph" ? chartType
  : chartLibrary`; then `const {label,svg} = items.find(v => v===value)` **throws** when
  `chartLibrary` is anything other than a known menu entry (e.g. `uplot`).
- `src/components/toolbox/settings/tabs/chartType.js:140-148` — same `=== "dygraph"` assumption;
  does not throw (`options.find(...) || options[0]` fallback) but selects the wrong option.

**Design (finalized in `docs/uplot-migration-design.md`):** a **per-chart-type renderer map**
(`chartLibrariesByType`) resolves each dygraph-backed chart type (line/stacked/area/stackedBar/
multiBar/heatmap) to a configurable renderer, enabling incremental migration (flip `line → uplot`
while `heatmap` stays on dygraph):

- SDK default attribute `chartLibrariesByType` (chartType → renderer), all `"dygraph"` by default.
- Chart helpers `getRendererForChartType(chartType)` and `isTimeSeriesRenderer(chartLibrary)`
  (added to `makeControllers`, spread onto the node) — the two toolbox components use
  `isTimeSeriesRenderer` (not a literal `=== "dygraph"`) to decide whether to show the chart type
  or the library, and guard their `find` lookups so an unmapped value never throws.
- `updateChartTypeAttribute` resolves the renderer from the map; **initial** chart creation must
  also resolve it (so a configured `line → uplot` applies on first render, not only after a
  user toggles type) — see the Phase 0 plan.

This is real product/UX code (not spike code) and is a **prerequisite** for a safe in-app opt-in
and for the full-wrapper Storybook stories in §7 testing plan. Designed in
`docs/uplot-migration-design.md`; detailed TDD plan in `docs/uplot-phase0-plan.md`.

### Phase A — uPlot time-series engine

Port the line/area/stacked/heatmap rendering, overlays, tickers, navigation, and hover behind the
§3 contract; measure real dashboard perf + bundle delta; reach parity; flip the `line` default to
uPlot via the Phase 0 map; remove dygraph. Parity backlog = the "must re-implement" list in §4,
the domain features in §5, and the deferred rows in the §8 contract matrix.

### Phase B — ECharts consolidation (later)

Replace d3pie + gauge + easyPie + bars with ECharts equivalents for one modern, consistently-styled
system; retire `d3pie`, `easy-pie-chart`, and the custom gauge lib.

### Testing plan — Storybook (how we validate each step)

uPlot is **not** in the default SDK `ui` map (see §8), so it is not bundled for normal consumers.
Stories register it explicitly on a per-story SDK and drive it through `chartLibrary:"uplot"`:

```js
import makeDefaultSDK from "@/makeDefaultSDK"
import uplot from "@/chartLibraries/uplot"

const sdk = makeDefaultSDK()
sdk.addUI("uplot", uplot)                       // register only for this story
const chart = sdk.makeChart({ getChart, attributes: { chartLibrary: "uplot", /* ... */ } })
sdk.appendChild(chart)
```

- **Now (bare container):** stories wrap a `withChart(() => <ChartContainer/>)` so we can render
  uPlot without the toolbox chrome (which is dygraph-coupled until Phase 0). Import
  `uplot/dist/uPlot.min.css` in the story for cursor/axis DOM styling.
- **After Phase 0 (full wrapper):** add stories using the normal chart wrapper (header/legend/
  toolbox) to catch real application-integration issues.
- **Scenario checklist to cover as parity lands:** line, area, stacked, heatmap; dark mode;
  resize; **two synchronized charts** (hover/crosshair sync via `syncHover`); empty → data and
  data → empty transitions; live-tail updates; unit/timezone changes; static value range;
  virtualization remounts (mount → unmount → mount). Each becomes a story and, where the harness
  allows, a `makeTestChart` assertion.

## 8. Spike — lifecycle + coordinate-transform validation (branch `explore/uplot-spike`, uncommitted)

This is a **spike**, not a contract-complete adapter. Its goal was to de-risk two things: that a
uPlot library satisfies the SDK lifecycle, and that the canvas coordinate/draw path can express
our overlays. It does **not** implement the full §3 contract.

Files:

- `src/chartLibraries/uplot/index.js` — `mount`/`unmount`/`render`/`getUPlot`; transposes
  `payload.data` (ms → uPlot seconds) into columnar series; per-dimension colors; theme-aware axes
  (`themeGridColor`/`themeLabelColor`); unit-formatted y ticks (`getConvertedValueWithUnit`);
  ResizeObserver → `setSize`; emits `highlightHover`/`highlightBlur`/`hoverChart`/`blurChart` from
  the `setCursor` hook; draws a `hoverX`/`clickX` crosshair via the `draw` hook + `valToPos` +
  `ctx`.
- **Not** in the default SDK `ui` map — registered per-story/test via `sdk.addUI("uplot", uplot)`
  so it is not bundled for normal consumers (see §7 testing plan). uPlot CSS is imported only in
  the story.
- `uplot.stories.js` — bare-container stories (Line / Area / DarkMode) under **Charts/uPlot
  (spike)**; `yarn storybook` to view.
- `index.test.js` — real-uPlot tests (no lib mocking; jsdom + `jest-canvas-mock`). Chart data
  accessors are stubbed via a `withLoadedPayload` helper rather than driven through the real
  fetch flow — Phase A should replace this with a real `makeTestChart` payload/fetch. Added a
  `window.matchMedia` shim to `jest/setup.js` (uPlot reads it at load).

### Implemented / deferred contract matrix

| Contract area | Status in spike | Notes |
|---|---|---|
| `mount` / `unmount` / `render` lifecycle | ✅ implemented | verified by tests |
| line / area rendering, per-dimension colors | ✅ implemented | line/area only |
| theme grid/label colors, resize → `setSize` | ✅ implemented | rebuild on theme/chartType/legend change |
| y-axis unit formatting (+ `unitsConversionPrefix` reaction) | ✅ implemented | `getConvertedValueWithUnit`; redraws on prefix change |
| emit `highlightHover`/`highlightBlur`/`hoverChart`/`blurChart` | ✅ implemented | **emission asserted by automated test** |
| `hoverX`/`clickX` crosshair reception (draw hook + `valToPos` + `ctx`) | ⚠️ implemented, **pixel correctness Storybook-only** | not asserted at pixel level in tests |
| dimension **count** change (schema) | ⚠️ partial | rebuilds on series-length mismatch; reorder/recolor not handled |
| x-axis date-window / range | ✅ implemented | `scales.x.range` from `getDateWindow` |
| y-range: `staticValueRange` / `getValueRange` | ✅ implemented | `scales.y.range` honors `getValueRange`; redraws on `staticValueRange` change |
| empty / `outOfLimits` states + transitions | ✅ implemented | `getData` returns null on `outOfLimits`/empty; `render` destroys stale chart |
| `enabledHover` toggle | ✅ implemented | `setCursor` skips emit when disabled |
| `timezone` reaction | ✅ implemented | redraws (re-runs axis formatter) on change |
| `formatXAxis` integration | ✅ implemented | x-axis `values` use `chart.formatXAxis` (timezone-aware) |
| drawable-area dims (`getChartWidth/Height` = plot area) | ✅ implemented | returns `u.over` client size when mounted |
| sparkline mode | ✅ implemented | axes hidden via `isSparkline()` |
| processing guard | ✅ implemented | `render` skips while `highlighting`/`panning`/`processing` |
| stacked / diverging / bar / multi-bar / heatmap plotters | ❌ deferred | |
| anomaly ribbon, annotation strip | ❌ deferred | |
| alert overlays (alarm / alarmRange / alertTransitions / highlight) | ❌ deferred | same `draw`-hook pattern as crosshair |
| pan / zoom / select navigation | ❌ deferred | |
| required uPlot CSS (`uplot/dist/uPlot.min.css`) | ❌ deferred (Phase A) | **functional** (drives `.uplot` layout + cursor positioning), not cosmetic; story-only import today |
| in-app UI integration (toolbox chart-type) | ❌ blocked on Phase 0 | see §7 |

## 9. Sources

- uPlot — https://github.com/leeoniya/uPlot
- dygraphs releases — https://github.com/danvk/dygraphs/releases
- Grafana time-series panel (Flot → uPlot) — https://grafana.com/blog/how-the-new-time-series-panel-brings-major-performance-improvements-and-new-visualization-features-to-grafana-7-4/
- Apache ECharts features — https://echarts.apache.org/en/feature.html
- Perspective (FINOS) — https://perspective.finos.org/
- TimeChart (WebGL) — https://github.com/huww98/TimeChart
- SciChart JS benchmark — https://www.scichart.com/blog/chart-bench-compare-javascript-chart-libraries/
