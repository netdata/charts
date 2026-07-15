# uPlot migration — progress & handoff

> Working branch: `explore/uplot-spike`. Last updated: 2026-07-15.
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
6. **Flip-the-default** — wire `chartLibrariesByType` into initial renderer selection + measure real
   dashboard CPU/memory/frame-time/bundle delta before making uPlot the default `line` renderer,
   then remove dygraph. **No local perf measurements exist yet** (benchmark numbers in the
   exploration doc are upstream-published only).
7. **Bundle** — uPlot now ships with `makeDefaultSDK` for all consumers (~48KB). Fine for now;
   revisit at flip time if bundle size matters.
8. **ECharts consolidation (Phase B)** — pie/gauge/easyPie/bars → ECharts. Not started.

## How to verify
- Tests: `yarn jest --config ./jest/config.js src/chartLibraries/uplot/ --collectCoverage=false`
  (24 renderer tests + 4 stacking-math tests). Full suite: `yarn jest --config ./jest/config.js`.
- Visual: `yarn storybook` → any **Charts** story → toolbar **Chart library: uPlot** → switch chart
  types via the header toolbox. (Do NOT run dev servers on the maintainer's behalf — they verify.)

## Not ours (leave uncommitted)
`src/components/toolbox/settings/numberFormat.js` (+ `.test.js`) are the maintainer's in-flight work;
excluded from every commit.
