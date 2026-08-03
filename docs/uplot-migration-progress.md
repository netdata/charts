# uPlot migration — progress & handoff

> Working branch: `explore/uplot-spike`. Last updated: 2026-07-30.
>
> **Rebased onto `main` (#222–#229).** All of #222–#229 audited for uPlot parity drift: #222
> (renderIfStale boolean contract) and non-stepped line smooth curves were ported (`b811b15`,
> `01eb4a1`); the rest are NO-OP for uPlot. Full record: `docs/uplot-prod-parity-gap-map.md`
> (RECONCILED section). Next: Task 3 — flip-the-default + real-dashboard perf (§6 below).
> Background/decision: `docs/charting-library-exploration.md`. Design: `docs/uplot-migration-design.md`.
> Phase 0 plan: `docs/uplot-phase0-plan.md`.
> uPlot source reference (demos used throughout): `/Users/novykh/Projects/uPlot`.

Goal: replace dygraphs with **uPlot** as the Netdata time-series renderer, incrementally, behind
the SDK's `chartLibrary` abstraction. This doc is the pick-up point for a new session.

## Where it lives
- Chart library: `src/chartLibraries/uplot/` (~930 LOC)
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
- **uPlot needs its CSS** (`uplot/dist/uPlot.min.css`) — functional (layout/cursor), not cosmetic.
  Loaded in `.storybook/preview.js`; a real consumer (cloud-frontend) must import it too.
- **Bars use an ordinal x-scale** (`distr: 2`) via the plugin — a *different* uPlot config from the
  line/area path (built in `createBars`, isolated from `create`). Bars therefore currently show
  **raw timestamps on x** and don't emit SDK hover (the plugin owns its own cursor).
- **The mock ignores requested points** (`makeMockPayload` emits `data.length` rows), so bars look
  dense in Storybook; production's 0.1 multiplier yields genuinely wide bars.
- **Renderer selection**: `chartLibrariesByType` maps a chart *type* → renderer. Auto-applying it at
  *initial* render (so a configured `line → uplot` applies before any toggle) is **deferred to the
  flip-the-default step** because `chartType` is payload-driven (`makeDataFetch.js:121`).

## Remaining work
Prioritized; each needs Storybook visual verification (jsdom can't paint).

1. **Heatmap** — not implemented. Reference: `uPlot/demos/latency-heatmap.html` (a `draw` hook
   drawing colored cells with `valToPos` + `ctx`, series `paths: () => null` — same pattern as the
   crosshair/stacked fills). Uses `chart.getHeatmapScale`/`getVisibleHeatmapIds`/`getHeatmapYIndex`.
2. **Bars polish** — x-axis should show formatted time (currently raw timestamps); decide negative
   handling (y is clamped `[0, max]`, so negatives are clipped); bars don't emit `highlightHover`
   for cross-chart sync.
3. **Overlays** — alert (alarm / alarmRange / alertTransitions / highlight), anomaly ribbon,
   annotation strip are **dygraph-only**. Port to uPlot `draw` hooks (crosshair/stacked prove the
   pattern). `components/line/overlays/annotation/index.js` is guarded by `chartLibrary === "dygraph"`.
4. **Stacked area polish** — nulls are bridged (no gap handling); no top stroke; verify diverging
   (mixed-sign) visually.
5. **Multi-node / grouped payloads, groupBoxes/table/gauge/etc.** — untouched (still their own libs);
   only the time-series family is being moved.
6. **Flip-the-default** — **flip wiring is DONE and tested** (`makeControllers.test.js:284–320`):
   `chartLibrary` is the single selector, `chartLibrariesByType` defaults to `{}` and only overrides
   per-type, `getRendererForChartType` falls back to `chartLibrary`, `isTimeSeriesRenderer` uses the
   `["dygraph","uplot"]` set. So the flip is a **one-attribute change**: set root
   `chartLibrary: "uplot"` — timeseries charts inherit it, gauge/pie/table keep their own. The shipped
   default stays `"dygraph"` until the real-dashboard go/no-go (protocol below). `yarn build` compiles
   clean on this branch (531 CJS / 533 ES6), so `yarn to-cloud` is ready. **Still owed:** the
   real-dashboard measurement (maintainer's env — jsdom/jest can't paint, Playwright not installed).
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

## Task 3 — real-dashboard measurement protocol (maintainer-run, many-runs for certainty)

Why maintainer-run: real render+paint timing needs a real browser on a live streaming dashboard.
jsdom/jest can't paint; the repo has no Playwright driver; the mock ratios above are not production
numbers. The go/no-go is inherently an in-app measurement. The renderer + HUD are ready to ship it.

Setup (once):
1. `yarn to-cloud` from `charts/` (builds CJS+ES6 and copies into cloud-frontend `node_modules`).
2. In cloud-frontend, set the dashboard SDK root attributes `chartLibrary: "uplot"` and
   `perfMonitor: true` (the HUD self-mounts to `document.body`; A/B by toggling `chartLibrary` back to
   `"dygraph"` for the paired run). Keep everything else identical between the two runs of a pair.

Per data point (repeat for a matrix of dashboard sizes — e.g. a small ~10-chart view and a dense
~50+ chart view, on the same page, same time window, same theme):
1. Load the page, let it stream to steady state (~15s), then HUD **reset** to start a clean window.
2. Stream a fixed window — **≥60s** — untouched (no interaction; interaction jank is out of scope).
3. HUD **copy** → paste the JSON (per-renderer `count`, `p50`/`p95`/`max` ms, current+peak heap).
4. Toggle `chartLibrary` to the other renderer, repeat 1–3 for the paired run.
5. **Repeat the whole pair ≥5 times** (fresh reload each time) to get variance — report mean ± stddev
   of the p50/p95 **ratio** (uPlot/dygraph), not single runs. The ratio cancels shared React/stream
   overhead; the stddev is what turns "one number" into "certain."

Go/no-go read: uPlot's p50 and p95 render cost should be ≤ dygraph's across every size, with the gap
widening as chart density grows (the Storybook ratios predict 0.36–0.56× whole-tab, 0.06–0.17×
isolated). Watch heap peak too (best-effort, Chrome-only). If uPlot wins consistently across the
repeats, flip the shipped default to `chartLibrary: "uplot"` (one line in `makeDefaultSDK.js:42`);
otherwise keep dygraph and file the regressions.

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
  (24 renderer tests + 4 stacking-math tests). Full suite: `yarn jest --config ./jest/config.js`.
- Visual: `yarn storybook` → any **Charts** story → toolbar **Chart library: uPlot** → switch chart
  types via the header toolbox. (Do NOT run dev servers on the maintainer's behalf — they verify.)

## Not ours (leave uncommitted)
`src/components/toolbox/settings/numberFormat.js` (+ `.test.js`) are the maintainer's in-flight work;
excluded from every commit.
