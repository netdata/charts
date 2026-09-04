# uPlot migration — progress & handoff

> **START HERE for open parity work: `docs/uplot-parity-worklist.md`.** It holds the results of a
> four-domain systematic audit (options surface, interaction model, data path, lifecycle/overlays)
> with per-item `file:line` evidence, a recommended order, and the session's gotchas. This file
> remains the history + perf protocol; the older `uplot-prod-parity-gap-map.md` is superseded for
> open items.

> Shipped as **PR #234** (branch `feat/uplot-renderer`), squashed from the `explore/uplot-spike`
> spike branch, which is kept unsquashed as the history record. Last updated: 2026-09-04.
>
> **The renderer is opt-in; the shipped default stays `chartLibrary: "dygraph"`.** The flip is
> deliberately out of the PR, gated on the real-dashboard measurement in "Task 3" below.
>
> Verified on the PR branch: full suite **184 suites / 1928 passing / 2 skipped**, of which the
> uPlot renderer is **15 suites / 250 tests**; `yarn build` clean (537 CJS / 540 ES6).
>
> **Rebased onto `main` (#222–#229).** All of #222–#229 audited for uPlot parity drift: #222
> (renderIfStale boolean contract) and non-stepped line smooth curves were ported (`b811b15`,
> `01eb4a1`); the rest are NO-OP for uPlot. Full record: `docs/uplot-prod-parity-gap-map.md`
> (RECONCILED section).
> Background/decision: `docs/charting-library-exploration.md`. Design: `docs/uplot-migration-design.md`.
> Phase 0 plan: `docs/uplot-phase0-plan.md`.
> uPlot source reference (demos used throughout): a local checkout of the uPlot repo.

Goal: replace dygraphs with **uPlot** as the Netdata time-series renderer, incrementally, behind
the SDK's `chartLibrary` abstraction. This doc is the pick-up point for a new session.

## Where it lives
- Chart library: `src/chartLibraries/uplot/` (~2,540 LOC excluding tests)
  - `index.js` — the chart-library module (the `(sdk, chart) => instance` contract)
  - `stacking.js` (+ `.test.js`) — pure diverging-stack math
  - `bars/` — vendored uPlot demo helpers: `quadtree.js`, `distr.js`, `stack.js`, `seriesBarsPlugin.js`
  - `index.test.js` — real-uPlot tests (jsdom + jest-canvas-mock, no library mocking)
- Registered in `src/makeDefaultSDK.js` `ui` map (first-class, like dygraph).
- Storybook: `chartLibrary` control (dygraph | uPlot) on all `src/index.stories.js` stories; uPlot
  CSS imported globally in `.storybook/preview.js`.

## Commits on the branch (oldest → newest)
```
8cb61e4 spike (mount/render/line/area/hover/crosshair)
d036b21 Phase 0: decouple time-series renderer from chart type
c7d9da0 docs: exploration + design spec + Phase 0 plan
6d25ee0 fix: create uPlot only when mounted; line/area parity
560adb6 feat: chartLibrary control on Line stories + uPlot CSS
622a0dc docs: contract matrix (line/area parity)
65d973a feat: navigation (pan, drag-zoom, wheel, dblclick reset)
2f3229a feat: bars/stepped paths            (plain-bars path here was later reverted)
8f1051d refactor: register uplot in makeDefaultSDK; drop story addUI
c09f56c feat: render modes — diverging stacked area + grouped/stacked bars
```

## Done (verified by tests; render/nav also visually confirmed in Storybook)
- **Lifecycle**: `mount`/`unmount`/`render`/`getUPlot`; **created only when mounted** (a
  render-before-mount bug orphaned uPlot on a null element — guarded in `render`/`create`).
- **Line / area**: columnar transform of `payload.data` (ms→uPlot seconds), per-dimension palette
  colors, theme-aware axes (`themeGridColor`/`themeLabelColor`), area fill.
- **Ranges**: x from `getDateWindow()`; y honors `getValueRange`/`staticValueRange`.
- **Axis formatting**: x via `chart.formatXAxis` (timezone-aware); y via `getConvertedValueWithUnit`.
- **Reactions**: `theme`, `chartType`, `selectedLegendDimensions`, `navigation`,
  `enabledNavigation`, `staticValueRange`, `timezone`, `unitsConversionPrefix`, `hoverX`/`clickX`.
- **Empty / outOfLimits**: clears the chart; `render` skips while `processing`/`panning`/`highlighting`.
- **Hover**: emits `highlightHover`/`highlightBlur`/`hoverChart`/`blurChart`; gated by `enabledHover`.
- **Crosshair**: receives synced `hoverX`/`clickX` via a `draw` hook + `valToPos` + `ctx`.
- **Sparkline**: axes hidden; **plot-area sizing** (`getChartWidth/Height` from `u.over`).
- **Navigation**: drag-select zoom (select/highlight), selectVertical, custom pan, wheel zoom,
  dblclick → `resetNavigation`; mode from `navigation`, gated by `enabledNavigation`.
- **Stacked area (diverging)**: `stacking.js` (per-value +/- accumulation matching
  `dygraph/divergingStack.js`) drawn as filled polygons in a `draw` hook; series draw no line
  (`nullPathBuilder`); y-range spans the stack extremes.
- **Bars**: `multiBar` → grouped, `stackedBar` → stacked (`stack()` + `bands`) via the vendored
  `seriesBarsPlugin` (ordinal x). `groupWidth: 0.6` for visible gaps. Bar-type point reduction is
  already handled by `pointMultiplierByChartType` (`api/helpers.js`, `multiBar`/`stackedBar` = 0.1).
- **stepped** lines for `stepPlot`.
- **Phase 0**: `chartLibrariesByType` map + `getRendererForChartType`/`isTimeSeriesRenderer`
  (`makeControllers.js`); toolbox `ChartType` components resolve via `isTimeSeriesRenderer` and no
  longer throw on a non-dygraph renderer.

## Key gotchas / architecture notes
- **uPlot's CSS is inlined, not imported.** The rules it actually needs (`.u-wrap`, `.u-over`,
  `.u-under`, `.u-axis`, `.u-select`, `.u-cursor-*`, `.u-off`) live in
  `components/line/chartContentWrapper.js`, scoped to the chart container. Upstream's remaining
  selectors are legend/title chrome only, and the renderer sets `legend: { show: false }`
  (`uplot/index.js:1418`) with no title — so **no consumer needs to import
  `uplot/dist/uPlot.min.css`**. `.storybook/preview.js` imports it as well; that import is
  redundant. (An earlier revision of this doc claimed consumers must import it. Wrong.)
- **Bars no longer use a separate config.** The vendored `seriesBarsPlugin` and the isolated
  `createBars` ordinal-x path are both gone; `isBarType` (`uplot/index.js:196`) branches inside the
  single config, and bars share the time x-axis and the SDK hover bus — `highlightHover` fires from
  `uplot/index.js:865-866` like every other type.
- **The mock ignores requested points** (`makeMockPayload` emits `data.length` rows), so bars look
  dense in Storybook; production's 0.1 multiplier yields genuinely wide bars.
- **A consumer's own component map must gain a `uplot` key — this fails silently.** A host that
  maps `chartLibrary` → React component needs `uplot` pointing at the same generic
  `components/line` component as dygraph (`components/line` has no renderer-specific branching; the
  renderer is resolved from the attribute through `sdk.ui`). Verified in cloud-frontend:
  `src/charts/index.js` has a `byType` map with a `dygraph` key and no `uplot` key, and its `Chart`
  ends in `if (!Component) return null` — so setting `chartLibrary: "uplot"` renders **empty
  containers with no console error and nothing thrown**. Cost us a debugging session; see Task 3
  setup below.
- **Renderer selection**: `chartLibrariesByType` maps a chart *type* → renderer. Auto-applying it at
  *initial* render (so a configured `line → uplot` applies before any toggle) is **deferred to the
  flip-the-default step** because `chartType` is payload-driven (`makeDataFetch.js:121`).

## Remaining work

> **Items 1–4 of this list were written 2026-07-15 (`efca3cc8`) and were never revised as the work
> landed. They are corrected below.** If you are looking for open parity items, the live list is
> `docs/uplot-parity-worklist.md` (§ "Queued work"), not this section.

**Closed since that revision — do not re-report:**

1. ~~**Heatmap** — not implemented.~~ **Done.** `drawHeatmap` (`uplot/index.js:555`), heatmap
   y-axis, value range and tick density all present, following the `latency-heatmap` demo pattern.
2. ~~**Bars polish** — raw timestamps on x; no `highlightHover`.~~ **Done.** The separate ordinal
   config is gone; bars share the time x-axis and fire `highlightHover` (`uplot/index.js:865-866`).
   Negative handling is resolved through `getBarValueRange` (`uplot/index.js:310`).
3. ~~**Overlays** — alert / anomaly / annotation are dygraph-only.~~ **Done.** Seven overlays under
   `chartLibraries/uplot/overlays/` (alarm, alarmRange, alertTransitions, annotation, highlight,
   point, proceeded) plus the anomaly ribbon and anomaly-rate badge in `plotters/`, each with tests.
   The `chartLibrary === "dygraph"` guard in `components/line/overlays/annotation/index.js` is gone.
4. ~~**Stacked area polish** — nulls bridged, no top stroke.~~ **Done.** `traceStackTop`
   (`uplot/index.js:106`, called at `:495`/`:508`) strokes the stack top; `gapEdgeIndexes`
   (`uplot/index.js:91`, used at `:243`) handles gaps.

**Still open:**

5. **Multi-node / grouped payloads, groupBoxes/table/gauge/etc.** — untouched (still their own libs);
   only the time-series family is being moved.
6. **Flip-the-default.** The SDK-side wiring is DONE and tested (`makeControllers.test.js:277-355`):
   `chartLibrary` is the single selector, `chartLibrariesByType` defaults to `{}` and only overrides
   per-type, `getRendererForChartType` falls back to `chartLibrary`, `isTimeSeriesRenderer` uses the
   `["dygraph","uplot"]` set. Timeseries charts inherit the root attribute; gauge/pie/table keep
   their own.

   **Correction: this is NOT the "one-attribute change" earlier revisions of this doc claimed.** In
   cloud-frontend it takes three changes, two of them permanent, and two of the three fail silently:
   - `src/charts/index.js` — add `uplot: Line` to the `byType` map. Without it `Chart` hits
     `if (!Component) return null` and every chart is an empty container, no console error.
   - `src/domains/charts/toc/getMenuChartAttributes.js` — the returned attributes hardcode
     `chartLibrary: "dygraph"`, spread into every menu chart by `getMenu.js:205`. It overrides the
     root attribute, so without removing it the A/B measures dygraph on **both** runs.
   - `src/components/sdkProvider/index.js` — the root `chartLibrary` attribute itself.

   Roughly 33 further charts pin `chartLibrary: "dygraph"` per-context in cloud-frontend's
   `contexts.js` and `taxonomy/*` and stay on dygraph regardless. That is not a blocker: the perf
   HUD buckets samples per renderer (`perfMonitor/registry.js:23` keys on `chartId:renderer`), so a
   single mixed run yields `renderers.uplot` and `renderers.dygraph` side by side on the same page.

   The shipped default stays `"dygraph"` until the real-dashboard go/no-go (protocol below).
   **Still owed:** that measurement. It needs a browser on a live streaming dashboard — jsdom/jest
   cannot paint. Playwright *is* available (`playwright@1.62.1`, devDependency) and drives
   `yarn perf:bench` against Storybook, but there is no driver for an authenticated cloud dashboard.
7. **Bundle** — uPlot now ships with `makeDefaultSDK` for all consumers (~48KB). Fine for now;
   revisit at flip time if bundle size matters.
8. **ECharts consolidation (Phase B)** — pie/gauge/easyPie/bars → ECharts. Not started.

## Perf measurements (first pass — 2026-07-17)

Storybook `Perf/Benchmark` story (`src/perf.stories.js`), N charts streaming the `system.load` mock,
driven headless (Chromium via Playwright). Two independent measures, per chart-count, 40s (CDP) /
25s (HUD) windows, one run each. dygraph → uPlot, ratio = uPlot / dygraph (`<1` = uPlot cheaper).

**A. Whole-tab main-thread cost per render** — Chrome DevTools `Performance.getMetrics`
(`TaskDuration`, paint-inclusive; includes the shared React/mock/streaming overhead identical to both
renderers), normalised by render count (near-equal per renderer, so fair):

| charts | dygraph task/render | uPlot task/render | ratio | heap end (dyg → uPlot) |
|--------|--------------------:|------------------:|------:|------------------------|
| 10     | 7.19 ms             | 4.06 ms           | ×0.56 | 88 → 37 MB             |
| 25     | 7.42 ms             | 3.12 ms           | ×0.42 | 85 → 64 MB             |
| 50     | 8.49 ms             | 3.09 ms           | ×0.36 | 121 → 100 MB           |

**B. Isolated renderer render+paint** — the in-repo `perfMonitor` HUD (`registry.timeRender`), which
times only the `render()` fan-out plus the renderer's own (possibly microtask-deferred) paint:

| charts | dygraph p50 / p95   | uPlot p50 / p95   | p50 ratio |
|--------|---------------------|-------------------|----------:|
| 10     | 2.9 / 5.1 ms        | 0.5 / 0.8 ms      | ×0.17     |
| 25     | 3.5 / 5.5 ms        | 0.4 / 0.6 ms      | ×0.11     |
| 50     | 5.4 / 8.0 ms        | 0.3 / 0.5 ms      | ×0.06     |

**Takeaway:** both measures agree — uPlot is materially cheaper on main-thread cost and the advantage
grows with chart density. B (isolated renderer) shows uPlot at 6–17% of dygraph's per-render cost; A
(whole tab) dilutes that to 0.36–0.56× because the shared React/mock overhead is constant across
renderers. Heap is lower on uPlot but noisy (single end-of-window sample, no forced GC).

**Caveats:** the mock emits `data.length` rows regardless of requested points, so absolute ms are NOT
production figures — only the dygraph/uPlot ratio under identical conditions is meaningful. One run
per config, headless shell, one machine — no variance/repetition yet. Real absolute numbers need
`yarn to-cloud` + the HUD on a live dashboard (`perfMonitor: true`).

## Headless benchmark results (2026-08-03, `yarn perf:bench`)

210 paired runs, 0 failures, 5 cells skipped by the 3M-point cap (logged in the report). Each cell:
4s warmup, 10s measured window, 5 repeats per renderer, synthetic payload sized by rows × dims.
Full table: `.perf-results/summary.md`; raw per-run data: `.perf-results/raw.json`.

**Read `task/render`, not `total task`.** The two renderers do not render the same number of times.
Target cadence is 1 render/chart/s, so 10 charts × 10s ≈ 100 renders. dygraph falls to 84 renders
(100 dims) and 72 (5000 rows) while uPlot holds 88–100 — dygraph sheds frames under load, which
*lowers* its total-task figure while showing staler charts. Cells where uPlot's total looks worse are
cells where uPlot kept up:

| cell | dygraph | uPlot | verdict |
|---|---|---|---|
| line 300×100×50 | 222 renders, 24.6 ms/render | 339 renders, 23.1 ms/render | uPlot cheaper per render, +53% throughput |
| line 1000×100×10 | 84 renders, 31.4 ms/render | 100 renders, 35.7 ms/render | uPlot ~14% dearer per render (only real per-render loss) |
| line 5000×20×10 | 72 renders, 88.2 ms/render | 88 renders, 85.8 ms/render | parity per render, +22% throughput |
| stacked 1000×20×25 | 125 renders, 67.3 ms/render (p50 60.6 ms) | 254 renders, 18.1 ms/render (p50 4.3 ms) | uPlot 3.7× cheaper per render at 2× throughput |

Clean apples-to-apples cells (render counts matched within ~2%) — total-task ratio uPlot/dygraph:
300×3×10 **0.70**, 300×3×50 **0.52**, 300×20×10 **0.89**, 300×100×10 **0.95**, 1000×3×10 **0.77**,
1000×3×50 **0.60**, 1000×20×10 **0.88**, 5000×3×10 **0.96**, heatmap 1000×20×25 **0.75**.
uPlot wins every one, but **the margin narrows as dimension count grows** — roughly parity at 100 dims.

Hover (phase B/C): total main-thread cost is consistently **0.20–0.65×** dygraph, consistent with the
crosshair overlay change. Treat the per-render columns there as unreliable — hovering pauses autofetch,
so those cells collect only ~9–33 renders and the per-render stddev exceeds the mean in places.

**Caveats:** Storybook + synthetic mock in headless Chromium on one machine, not a real dashboard;
absolute ms are not production figures. The remaining unknown is a real cloud-frontend dashboard —
protocol below.

**These numbers were measured on a software rasteriser.** This run predates `--use-angle=metal` in the
driver, and headless Chromium with only `--no-sandbox` resolves WebGL through ANGLE **SwiftShader**
(CPU), not the GPU. Canvas2D — which both dygraph and uPlot draw through — is affected by that stack.
Re-measured under ANGLE Metal (see the 2026-08-11 section), the ratios move modestly *in uPlot's
favour*: `300 d20 c10` 0.89→0.747, `300 d100 c10` 0.95→0.793, `5000 d3 c10` 0.96→0.698. The verdict
here (uPlot wins every clean cell) holds and was, if anything, pessimistic. Treat this table as a
historical record; anything measured after the flag landed is not comparable to it.

**Render/fetch *counts* are harness-bound — do not read them as a product signal.** The mock resolves
via a main-thread timer (`perf.stories.js:97` → `makeMockPayload/index.js:14`), so at high chart counts
every chart's 300 ms delay queues behind every other chart's render work. Since the per-chart fetch
loop schedules on `max(updateEvery, response + processing)` (`makeChart/index.js:121-138`), the heavier
renderer posts fewer cycles *because* it renders heavier — the harness measures its own contention.
Production fetches are off-thread, so this effect does not exist there. Compare **per-render cost**
across renderers; use the real-dashboard protocol below for anything cadence-related.

## CPU-throttled comparison incl. GPU renderers (2026-08-11)

Run on branch `explore/gpu-renderers-perf` — this branch merged with PR #230 (ktsaou, WebGPU/WebGL2
renderers) so all four renderers could be compared on one workload. Cell: **50 charts × 100 dims ×
300 rows**, line, streaming, 10s window, **5 repeats**, ANGLE Metal, throttling via CDP
`Emulation.setCPUThrottlingRate`. `busy%` is CDP `TaskDuration` over wall-clock.

| renderer | CPU | busy% | renders | p50 ms | p95 ms |
|---|---|---|---|---|---|
| dygraph | 1× | 75.2±22.8 | 405±23 | 11.29±0.41 | 15.98±3.72 |
| uplot | 1× | 64.7±13.7 | 448±44 | 2.86±0.14 | 4.85±0.17 |
| webgl2 | 1× | 71.2±6.1 | 440±49 | 1.70±0.14 | 3.51±0.14 |
| dygraph | 4× | (unreliable) | 119±16 | 47.18±3.31 | 57.95±7.93 |
| uplot | 4× | 99.1±0.4 | 201±79 | 13.51±1.18 | 20.00±2.24 |
| webgl2 | 4× | 99.3±0.6 | 293±67 | 6.60±0.24 | 10.14±0.64 |
| dygraph | 6× | 99.4±0.2 | 60±29 | 73.42±1.89 | 83.92±2.23 |
| uplot | 6× | 98.8±0.2 | 157±28 | 26.80±2.93 | 41.34±4.01 |
| webgl2 | 6× | 99.7±0.1 | 172±78 | 16.64±5.38 | 24.51±7.92 |

`dygraph 4×` busy came out 79.7**±39.4** — meaningless for a bounded percentage; that one cell is not
trustworthy. Its render count and p50 are tight and stand.

**1. At full speed the renderer does not affect frame count.** 405 / 448 / 440 renders are within
noise of each other while dygraph costs **6.6× more per render** than webgl2. Throughput here is set by
the fetch cadence, not by drawing — the same conclusion the harness-bound caveat above reaches from the
other direction. ~0.9 frames/chart/s against a 1/s target.

**2. dygraph → uPlot is unambiguous.** 2.7–3.9× cheaper per render at every throttle level with tight
error bars, and once the machine saturates it converts into frames: at 6×, 60±29 → 157±28 (2.6×,
non-overlapping).

**3. uPlot → webgl2 buys latency, not throughput.** Per-render cost is solidly 1.6–2.1× cheaper, but
frame counts never separate (4×: 201±79 vs 293±67; 6×: 157±28 vs 172±78 — overlapping). What does
separate is p95 at 6×: **41.34±4.01 vs 24.51±7.92**, i.e. less worst-case jank, not more frames.

**Retracted:** an earlier single run of this cell was read as "webgl2 delivers 1.7× more frames at 4×".
Repeats put it at 1.46× with overlapping error bars, and at parity at 6×. Single runs of this cell are
not usable — uPlot at 1× measured 64.7%±13.7 busy, and two separate single runs put idle at 53.2% and
28.6%. Under saturation the measurement becomes stable (sd ≤ 0.6).

**Caveats.** `setCPUThrottlingRate` throttles the **CPU only** — the GPU stays at full M2 Max speed,
so every webgl2 figure here flatters it relative to a real low-end machine with a weak integrated GPU.
The mock's main-thread delay (see caveat above) still contaminates anything cadence-related. Not a real
dashboard; absolute ms are not production figures.

**GPU heatmap defect (PR #230, not ours).** webgl2 and webgpu record **0 renders** for heatmap while
dygraph records ~204 and uPlot ~250 on the same build — their lower main-thread cost is the cost of not
drawing, and reads as a 2.3× win if taken at face value. Reproduced in isolation: 2 charts over 9s,
webgl2 heatmap renders **once** (0.2 ms) vs uPlot's 16, with no console or page errors and no renderer
fallback. Localized (dygraph+uPlot heatmap work; GPU line works; only GPU+heatmap fails) but **not
root-caused**. PR #230's own benchmark cannot catch this class of bug — it mounts a static preview and
captures pixels, so "renders once then stops" is invisible to it.

## Task 3 — real-dashboard measurement protocol (maintainer-run, many-runs for certainty)

Why maintainer-run: real render+paint timing needs a real browser on a live streaming dashboard.
jsdom/jest can't paint, and while Playwright is available (`playwright@1.62.1`) it only drives
Storybook via `yarn perf:bench` — there is no driver for an authenticated cloud dashboard. The mock
ratios above are not production numbers. The go/no-go is inherently an in-app measurement.

Setup (once) — **all four steps verified 2026-09-04; steps 2 and 3 fail silently if skipped**:
1. `yarn to-cloud` from `charts/` (builds CJS+ES6 and copies into cloud-frontend `node_modules`).
2. `cp -R node_modules/uplot ../cloud-frontend/node_modules/uplot`. `cp-cloud` copies `dist` only
   and installs nothing, and the compiled renderer does `require("uplot")`
   (`dist/chartLibraries/uplot/index.js`). Transitive resolution only kicks in after a real
   publish + install, so for a local loop the module has to be physically present. No
   `package.json` change is needed — see the CSS note in "Key gotchas": the stylesheet does *not*
   need importing.
3. In cloud-frontend, add `uplot: Line` to the `byType` map in `src/charts/index.js`, and remove the
   hardcoded `chartLibrary: "dygraph"` from `src/domains/charts/toc/getMenuChartAttributes.js`.
   Without the first, every chart is an empty container (`if (!Component) return null`, no error);
   without the second, the per-chart attribute overrides the root one and both halves of the A/B
   measure dygraph.
4. Set the dashboard SDK root attributes `chartLibrary: "uplot"` and `perfMonitor: true` in
   `src/components/sdkProvider/index.js` (the HUD self-mounts to `document.body`; A/B by toggling
   `chartLibrary` back to `"dygraph"` for the paired run). Keep everything else identical between
   the two runs of a pair. Do not run `yarn install` in cloud-frontend mid-measurement — it wipes
   both the copied `dist` and `uplot`.

Per data point (repeat for a matrix of dashboard sizes — e.g. a small ~10-chart view and a dense
~50+ chart view, on the same page, same time window, same theme):
1. Load the page, let it stream to steady state (~15s), then HUD **reset** to start a clean window.
2. Stream a fixed window — **≥60s** — untouched (no interaction; interaction jank is out of scope).
3. HUD **copy** → paste the JSON (per-renderer `count`, `p50`/`p95`/`max` ms, current+peak heap).
   Read the `renderers.<name>` entries, not `overall` — cloud-frontend pins ~33 charts to dygraph
   per-context, so a run is mixed and `overall` blends both. `window.__netdataPerf.snapshot()` and
   `.reset()` are exposed for driving this from the console instead of clicking.
4. Toggle `chartLibrary` to the other renderer, repeat 1–3 for the paired run.
5. **Repeat the whole pair ≥5 times** (fresh reload each time) to get variance — report mean ± stddev
   of the p50/p95 **ratio** (uPlot/dygraph), not single runs. The ratio cancels shared React/stream
   overhead; the stddev is what turns "one number" into "certain."

Go/no-go read: uPlot's p50 and p95 render cost should be ≤ dygraph's across every size, with the gap
widening as chart density grows (the Storybook ratios predict 0.36–0.56× whole-tab, 0.06–0.17×
isolated). Watch heap peak too (best-effort, Chrome-only). If uPlot wins consistently across the
repeats, flip the shipped default to `chartLibrary: "uplot"` (`makeDefaultSDK.js:42`) **and** land
the permanent cloud-frontend changes from item 6 above; otherwise keep dygraph and file the
regressions.

Parity-consistency pass (run alongside perf, same build): with `chartLibrary: "uplot"`, walk the
Storybook `Charts`/`RenderModes` stories and the real dashboard across all chart types (line, area,
stacked, stackedBar, multiBar, heatmap, sparkline) and interactions (hover popover, cross-chart sync,
pan/zoom/select, overlays) — the line charts now draw dygraph-identical smooth curves (`01eb4a1`).

**Harness note:** the HUD (measure B) initially reported uPlot at ~0 ms because uPlot defers its paint
to `microTask(_commit)`, outside the synchronous `timeRender` window, while dygraph paints
synchronously — an unfair artifact. Fixed by recording from a `queueMicrotask` after `fn()` so the
timing spans the deferred paint (commit `8c8fbd2`).

## How to verify
- Tests: `yarn jest --config ./jest/config.js src/chartLibraries/uplot/ --collectCoverage=false`
  (**15 suites / 250 tests** as of 2026-09-04). Full suite: `yarn jest --config ./jest/config.js`
  (**184 suites / 1928 passing / 2 skipped**). Build: `yarn build` (537 CJS / 540 ES6).
- Visual: `yarn storybook` → any **Charts** story → toolbar **Chart library: uPlot** → switch chart
  types via the header toolbox. (Do NOT run dev servers on the maintainer's behalf — they verify.)

## Not ours (leave uncommitted)
`docs/sre-exploration-audit.md` is the maintainer's own audit — untracked throughout and excluded
from every commit.

(Historical: `src/components/toolbox/settings/numberFormat.js` was listed here as in-flight
maintainer work. It has since landed on `main` independently and is not part of this branch's diff.)
