# uPlot perf harness + renderer-selection cleanup — design

> Working branch: `explore/uplot-spike`. Part of the uPlot migration (`docs/uplot-migration-progress.md`).
> This is the "prove the win first" step: de-risk the migration's premise (uPlot is
> meaningfully faster/lighter than dygraphs on real Netdata dashboards) **before** sinking
> more effort into feature parity.

## Goal

Let the maintainer flip a real Netdata dashboard — or a controlled Storybook story — to uPlot
and read an **apples-to-apples go/no-go number** vs dygraphs, covering the two costs that matter
for a streaming dashboard: **per-render time** and **JS heap**.

Nothing changes for existing consumers unless they opt in.

## Why this shape

Netdata charts stream: a chart emits a `"render"` event and `makeChart/index.js:138-139` fans out
to each UI instance's `render()` (coalesced via `executeLatest`); autofetch re-triggers this on each
chart's `updateEvery` cadence. So **per-`render()` cost, sustained across many streaming charts, is
the number that decides the win** — and that one fan-out line is a renderer-agnostic seam where
dygraph and uPlot are measured identically.

There is currently **no perf/benchmark harness anywhere** in the repo (no `performance.now`
instrumentation, no bench script), so item 6 of the migration progress doc ("no local perf
measurements exist yet") is not just unmeasured — there is no way to measure it. This design adds
that way.

## Non-goals (YAGNI)

- **No frame-time / long-task instrumentation** (pan/zoom jank). Render-time + heap is the 80/20
  for a streaming dashboard; interaction smoothness is deferred.
- **Not flipping uPlot to the default** renderer. The shipped default stays `chartLibrary: "dygraph"`;
  a dashboard opts in by setting its own root `chartLibrary: "uplot"`.
- **Not wiring the map into *initial* render.** `chartLibrariesByType` continues to apply only on a
  toolbox type-switch (as today); a per-type override taking effect on first paint is deferred — the
  `chartLibrary` flip covers the measurement need without it.
- **No perf stats stored in chart attributes** (see the critical constraint below).

## Opt-in model

Two independent opt-ins, both safe-by-default:

- **`perfMonitor`** (SDK-root attribute, default `false`) — turns on render-timing accumulation,
  heap sampling, and the HUD overlay. When off, overhead is a single boolean check per render.
- **`chartLibrary`** (existing attribute, default `"dygraph"`) — the single renderer selector.
  Flip a whole dashboard to uPlot by setting the SDK-root default `chartLibrary: "uplot"`:
  timeseries charts inherit it (`makeNode.js:119-121`, child-set values win), while gauge/pie/table
  charts keep their own explicit `chartLibrary` and are untouched. `chartLibrariesByType` stays as
  an **optional per-type override** (default `{}`) — e.g. `{ heatmap: "dygraph" }` to keep heatmap
  on dygraph while the rest go uPlot. Default consumers are unaffected: empty map ⇒ everything
  respects `chartLibrary: "dygraph"`.

## Components

### 1. Render-time instrumentation (SDK seam)

- **What it does:** times each `render()` call and records the duration against the chart id and
  its active renderer (`chartLibrary`).
- **Where:** the fan-out at `src/sdk/makeChart/index.js:139`
  (`Object.keys(uiInstances).forEach(uiName => uiInstances[uiName].render())`). Wrap each
  `render()` in a `performance.now()` delta.
- **Interface / dependency:** a standalone perf registry module (see §3a) exposing
  `record(chartId, renderer, ms)`. The seam calls `record` only when enabled (`isEnabled()` — a
  cached boolean toggled by the plugin, so the seam never reaches into the SDK attribute system).
- **Boundary:** the seam knows nothing about how stats are aggregated or displayed; it only reports
  a duration.

**Critical constraint:** stats live in a plain module-level registry, **never in chart
attributes**. Writing per-render stats into attributes would trigger attribute listeners and
additional renders, corrupting the very measurement.

### 2. Heap sampling

- **What it does:** samples `performance.memory.usedJSHeapSize` on a ~1s interval while
  `perfMonitor` is on; tracks current + peak in the registry.
- **Boundary:** Chrome-only. Guard `performance.memory` absence (Firefox/Safari) and surface as
  "n/a" in the HUD. The sampler is started/stopped by the plugin (§3b) alongside the HUD.

### 3. Perf registry + self-mounting HUD

**3a. Registry** (`src/sdk/plugins/perfMonitor/registry.js` or similar): a plain module holding
per-chart ring buffers of recent render durations (cap ~500 samples/chart) plus latest/peak heap.
Exposes:
- `record(chartId, renderer, ms)` — append a sample.
- `setEnabled(bool)` / `isEnabled()` — the seam's cheap gate.
- `snapshot()` — aggregate view: per-renderer and overall `count`, `p50/p95/max` ms, current + peak
  heap. Quantiles computed on read from the ring buffers.
- `reset()` — clear all samples (for a clean measurement window).
- `sampleHeap()` — record one heap sample (called by the interval).

**3b. HUD plugin** (`src/sdk/plugins/perfMonitor/index.js`): follows the existing plugin contract
(`sdk => { … return cleanup }`, mirroring `src/sdk/plugins/play.js`).
- On `perfMonitor` flipping `true` (via `sdk.getRoot().onAttributeChange("perfMonitor", …)`, plus an
  initial check): `registry.setEnabled(true)`, start the heap interval, create a `<div>`, append it
  to `document.body`, `createRoot` it (`react-dom/client`, React 19 — already a dependency), and
  render the HUD component into it.
- On flipping `false`: `setEnabled(false)`, clear the interval, unmount the React root, remove the
  DOM node.
- The returned cleanup does the same teardown and detaches the attribute listener.
- Registered in `src/makeDefaultSDK.js`'s `plugins` map.

**3c. HUD component** (`src/components/perf/`): polls `registry.snapshot()` on a ~500ms interval
(HUDs poll; they don't need reactivity), and renders a fixed-position box showing: renderer(s) in
play, total render count, aggregate `p50/p95/max` ms, current + peak heap. Controls: **reset**
(zero the window) and **copy** (JSON snapshot to paste into the progress doc).

### 4. Renderer selection: `chartLibrary` as the single selector

Collapse renderer selection onto `chartLibrary`; make `chartLibrariesByType` an optional per-type
override that defaults to `{}`. This is what makes the flip trivial (§ opt-in model) and removes the
redundant "every type → dygraph" default map.

- **`makeDefaultSDK.js:41`:** replace the enumerated map with `chartLibrariesByType: {}` (the
  `getAttribute(...) || {}` guards already handle absence). Keep `chartLibrary: "dygraph"`.
- **`getRendererForChartType`** (`makeControllers.js:122-123`): change the fallback from a hardcoded
  `"dygraph"` to `chartLibrary`, so an empty map respects the selector and an entry overrides it:
  ```
  const getRendererForChartType = chartType =>
    (chart.getAttribute("chartLibrariesByType") || {})[chartType] ||
    chart.getAttribute("chartLibrary")
  ```
- **`isTimeSeriesRenderer`** (`makeControllers.js:125-127`) — **the gotcha:** it currently decides
  "is this a timeseries renderer" *from the map's values*, so an empty map makes
  `isTimeSeriesRenderer("uplot")` return `false`, and the toolbox then treats uPlot as a *library*
  instead of showing the chart type (`chartType.js:133`, `settings/tabs/chartType.js:144`:
  `value = isTimeSeriesRenderer(chartLibrary) ? chartType : chartLibrary`). Fix with a constant set,
  unioned with any map values:
  ```
  const timeSeriesRenderers = ["dygraph", "uplot"]
  const isTimeSeriesRenderer = chartLibrary =>
    timeSeriesRenderers.includes(chartLibrary) ||
    Object.values(chart.getAttribute("chartLibrariesByType") || {}).includes(chartLibrary)
  ```
- **`index.stories.js:31`:** the `chartLibrary` toolbar control currently *builds* a full
  `chartLibrariesByType` map from its value; simplify it to set `chartLibrary` directly (leaving the
  map empty) so stories exercise the real flip path.
- **Flip mechanism (no new code):** set root `chartLibrary: "uplot"` at SDK creation → timeseries
  charts inherit it (`makeNode.js:119-121`), gauge/pie/table keep their own explicit `chartLibrary`.
  `makeChartUI` already resolves the renderer from `chartLibrary` (`makeChart/index.js:302`), so no
  reconcile dance and no `makeDataFetch` change are needed.
- **Tests to update:** `makeControllers.test.js` and `chartType.test.js` assert against the
  enumerated default map today; update them to the empty-default + `chartLibrary`-fallback semantics.

### 5. Storybook perf bench story

- **What it does:** a controlled, repeatable dygraph-vs-uPlot A/B.
- **Where:** `src/perf.stories.js` (new). Mounts N charts (control: 10 / 25 / 50) streaming mock
  ticks at a fixed interval, with the existing `chartLibrary` toolbar control and `perfMonitor` on.
  Workflow: set N, pick renderer, stream ~60s, copy stats, switch renderer, repeat.
- **Honest caveat (stated in the story):** the mock ignores requested point counts
  (`makeMockPayload` emits `data.length` rows), so absolute numbers won't match production — but the
  dygraph-vs-uPlot *ratio* under identical mock conditions is a valid comparison.

## Data flow

```
render event ─▶ makeChart:139 fan-out ─▶ render() [timed] ─▶ registry.record()
                                                                    │
heap interval ─────────────────────────────────────▶ registry.sampleHeap()
                                                                    │
                                                            registry.snapshot()
                                                                    ▲
                                              HUD component (polls ~500ms) ◀── self-mounted by plugin
```

## Testing (real components, no mocks — `makeTestChart` / testUtilities)

- **Registry:** feed known durations → assert `count`, `p50`, `p95`, `max`; assert `reset()` clears;
  assert heap "n/a" path when `performance.memory` is absent.
- **Renderer resolution:** empty map + `chartLibrary: "uplot"` → `getRendererForChartType("line")`
  returns `"uplot"`; with `{ heatmap: "dygraph" }`, `getRendererForChartType("heatmap")` returns
  `"dygraph"` while other types return `chartLibrary`; `isTimeSeriesRenderer("uplot")` is `true` with
  an empty map.
- **Flip via inheritance:** a chart under a root with `chartLibrary: "uplot"` and no own
  `chartLibrary` builds the uPlot UI; a chart with its own `chartLibrary: "gauge"` keeps gauge.
- **HUD:** renders and displays values from a seeded registry snapshot.

## Verified anchors (evidence)

- Render fan-out seam: `src/sdk/makeChart/index.js:138-139`.
- Renderer resolved from `chartLibrary` at UI creation: `src/sdk/makeChart/index.js:302`.
- Renderer resolve helpers + toolbox switch dance:
  `src/sdk/makeChart/filters/makeControllers.js:122-123` (`getRendererForChartType`), `125-127`
  (`isTimeSeriesRenderer`), `134` and `141-143`/`338-340` (unmount/remake).
- Attribute inheritance (child wins, snapshot at append): `src/sdk/makeNode.js:117-123`.
- Current default map + story-built map: `src/makeDefaultSDK.js:41`, `src/index.stories.js:31`.
- Plugin contract + root attribute listeners: `src/sdk/plugins/play.js`
  (`sdk.getRoot().onAttributeChange("paused", …)`, returns cleanup); registered via
  `src/sdk/index.js:27-29` `register`.
- `react-dom@^19.2.4` present (`createRoot`): `package.json:75`.

## Risks / open questions

- **Measurement fidelity vs. reality:** Storybook mock payload sizes differ from production; treat
  Storybook numbers as ratios, and use the self-mounting HUD on a real cloud dashboard for absolute
  figures.
- **`performance.now()` overhead in the seam:** negligible (two calls per render), and fully gated
  off when `perfMonitor` is false.
- **Heap availability:** `performance.memory` is Chrome-only; heap metric is best-effort.
- **`to-cloud` workflow:** measuring on a real dashboard requires `yarn to-cloud`; the maintainer
  runs and verifies this themselves.
