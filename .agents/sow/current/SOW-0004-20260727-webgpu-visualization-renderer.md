# SOW-0004 - Production WebGPU Visualization Renderer

## Status

Status: in-progress

Sub-state: The production-capable opt-in Line and Area renderers pass physical WebGPU and WebGL2 gates on the clean integration branch from current `origin/main`. Visualization/renderer separation, shared exact Cartesian semantics/interactions, one-canvas presentation, `WebGPU -> WebGL2 -> Dygraphs` routing, exports, hover feedback, device/context-loss fallback, and shared-runtime multi-chart lifecycle are implemented. The user approved migrating all remaining graphical chart families before the final cross-platform matrix; Stacked is next. Runtime/power policy and rollout/defaulting remain deferred, and Dygraphs remains every default.

## Requirements

### Purpose

Deliver a production-quality Netdata-native WebGPU visualization engine that preserves Netdata's public, payload, visual, interaction, lifecycle, and consumer contracts while making high-cardinality visuals materially faster. The internal organization must support eventual migration of all current and future Netdata visualization families, while implementing ordinary line charts as the first end-to-end tranche. Existing libraries remain supported as compatibility and runtime-failure fallbacks until each visualization reaches proven parity.

### User Request

Proceed with WebGPU as the preferred renderer direction after the native feasibility prototype proved exact 100,000-value one-frame rendering and more than 5x frame-settled gains at 1,000,000 values. Organize it for eventual migration of every Netdata visualization, not only line or time series; line remains the first implementation. Minimize visible DOM: deterministic, simple visualization pixels should be drawn on canvas, with any unavoidable DOM surface explicitly managed. Do not confuse the benchmark's one-frame acceptance rule with runtime renderer selection.

On 2026-07-29, the user approved two ordered hardening stages: repair and physically verify the missing WebGPU hover hairline/popover; then build an exact WebGL2 feasibility backend and promote it to the runtime chain `WebGPU -> WebGL2 -> Dygraphs` only if it passes the existing correctness, performance, export, and lifecycle gates.

After those stages passed, the user approved migrating every remaining graphical chart family before running the final Windows/macOS/browser matrix. The ordered scope is Area, Stacked, Stacked Bar, Multi Column, Heatmap, EasyPie/Circle, Gauge, and D3 Pie. Bars, Value, Group Boxes, and Table remain Netdata-native React/DOM visualizations because rasterizing semantic text and controls would add no material benefit and would regress accessibility.

### Assistant Understanding

Facts:

- SOW-0002 proves the exact unsampled regular/step GPU kernel, shared runtime, payload packing, lifecycle fallback, device-loss recovery, and physical-GPU performance architecture.
- WebGPU is a low-level browser GPU API, not a chart library. Netdata continues to own chart semantics and UI.
- The feasibility prototype is internal opt-in; every default renderer mapping remains Dygraphs.
- The opt-in ordinary-line tranche now implements smooth/step geometry, axes/text, overlays/decorations, complete pointer/touch interactions, direct/current html2canvas export behavior, and shared-runtime multi-chart ownership. The approved follow-on migrates graphical adapters in dependency order, beginning with Area, while browser/device policy, batching policy, and rollout remain deferred.
- Public payloads, queries, attributes, events, timestamps, chart types, and visuals must remain compatible.
- The current SDK conflates the selected visualization and its active chart library: time-series types use `chartType`, while gauge, pie, bars, number, group boxes, and table use `chartLibrary`. Current `chartLibrariesByType`, `isTimeSeriesRenderer`, and the WebGPU folder are therefore too time-series-specific for the approved direction.
- Netdata's topology WebGL renderer already proves the preferred text pattern: Canvas2D rasterizes labels into bounded DPR-aware texture atlases, then GPU sprites render those textures without one visible DOM node per label.

Inferences:

- Production work should create a small Netdata-specific rendering engine with shared runtime, surfaces, ordered layers, primitive pipelines, text atlases, and visualization adapters. It must not become a public or general-purpose chart framework.
- Visualization identity must be separated internally from rendering backend so line, area, bars, heatmaps, radial charts, scalar visuals, tables, group layouts, and future visualizations can use the same backend incrementally.
- Only abstractions exercised by the line tranche should be implemented now. Stable extension seams and registry contracts are required; empty future adapters and speculative primitive implementations are not.
- The initial plot boundary is one visible WebGPU canvas. Grid, axes, ticks, labels, series, annotations, crosshairs, and selections become ordered GPU layers. Browser text shaping/rasterization happens on a reusable offscreen Canvas2D surface and is uploaded into a bounded GPU texture atlas.
- Existing React controls with real interaction or semantic responsibilities—toolbox, menus, popovers, and the current legend—remain outside the plot canvas in the first tranche. They are not duplicated per tick or data point.
- The boundary is deliberately reversible. Move an element to DOM when browser semantics, focus/accessibility, text selection, complex layout, or maintainability outweigh canvas costs; move it to canvas when repeated nodes, style/layout work, synchronization, export composition, or lifecycle ownership are measurably worse.
- Internal layer/interaction contracts must prevent a placement change from altering public chart behavior. The user authorized evidence-based boundary changes without another design round-trip, provided they preserve approved contracts; public behavior or accessibility trade-offs still require explicit approval.
- Runtime, prewarming, browser matrix, rollout, and default policy should be evaluated from the working production renderer rather than fixed now.

Unknowns:

- Browser/platform support, initialization/power, rollout/defaulting, and final performance policies; these are explicitly deferred until graphical adapter migration is complete.
- Whether profiling will justify workers or WASM for any CPU-side kernel.

### Acceptance Criteria

- The internal engine separates visualization identity from rendering backend and provides shared runtime, surface/frame, ordered-layer, primitive, text-atlas, and interaction seams usable by all current visualization families without line/time-series assumptions.
- The first implementation exercises those seams through exact visual and interaction parity for ordinary line charts; no empty future visualization adapters or unused speculative primitives are added.
- Approved production scope has exact visual and interaction parity against Dygraphs for every enabled chart type and state.
- WebGPU is preferred only for approved eligible chart types after capability and feature checks. WebGL2 is the proven accelerated compatibility fallback for implemented GPU chart types, and Dygraphs remains installed as the final compatibility fallback.
- Runtime routing never benchmarks renderers dynamically and never falls back solely because WebGPU requires more than one display frame.
- Shared device/pipelines, prewarming, persistent buffers, multi-chart ownership, virtualization, resize, teardown, and device-loss recovery are validated without leaks or blank charts.
- Existing payload/query/public timestamp contracts remain unchanged; compact point-schema values, null gaps, visibility, colors, corrected history, and full updates retain exact semantics.
- The plot uses no visible per-label/tick/annotation DOM. Deterministic plot chrome and text are canvas/GPU layers, with bounded caches and explicit device, resize, theme, DPR, and teardown ownership.
- The completed line tranche validates regular, step, smooth, sparkline, axes, overlays, hover, pan, zoom, selection, touch, annotations, alerts, anomalies, and export behavior.
- The follow-on migration implements Area, Stacked, Stacked Bar, Multi Column, Heatmap, EasyPie/Circle, Gauge, and D3 Pie through the same renderer chain without changing defaults. Each adapter must preserve its legacy baseline, stacking, gap, ordering, color, hover, axis, sparkline, export, and lifecycle behavior before the next dependent adapter begins.
- Performance tests retain exact unsampled 100,000/1,000,000-value gates and add representative multi-chart, interaction, repeated-update, and teardown stability evidence without generalized production instrumentation.
- CJS/ES6 builds, full tests with coverage, repository lint baseline, Storybook, physical browsers, and Cloud Frontend consumption pass before any default switch.
- No worker, SharedArrayBuffer, WASM, payload protocol change, silent LOD, aggregation, or approximation is introduced without profiling evidence and explicit approval.

## Analysis

Sources checked:

- `.agents/sow/done/SOW-0002-20260727-native-gpu-renderer-prototype.md` after SOW-0002 closes.
- `.agents/sow/specs/charts-public-consumer-contract.md`.
- `src/chartLibraries/webgpu/`, all current `src/chartLibraries/`, `src/components/`, `src/sdk/`, and `benchmarks/time-series-renderers/`.
- `netdata/cloud-frontend @ bf2ba8182cff`, especially topology Canvas2D/WebGL renderers, texture atlases, label caches, DPR bucketing, renderer tiers, hit indexes, and WebGPU compute fallback.
- Current official W3C WebGPU and browser implementation guidance.
- Proven open-source references recorded in SOW-0002.
- Current Grafana visualization/plugin and canvas organization as a breadth reference; it does not provide WebGPU or DOM-free chart-text precedent.

Current state:

- Phase 0 renderer routing is committed at `a0266e8a19ae`; the accepted feasibility implementation is committed at `d9caf88`.
- Dygraphs is the default for all chart types; WebGPU is registered only as internal opt-in.
- Ordinary `line` charts use Netdata's custom monotonic cubic Bézier plotter. `stepPlot` explicitly bypasses that plotter. The straight feasibility kernel is therefore not regular-line visual parity.
- Dygraphs currently owns plot layout, axes, grid, y autoscaling, mouse/touch event conversion, hover hit-testing, pan/zoom/selection mechanics, crosshairs, anomaly/annotation strips, and renderer-level overlays.
- Cloud Frontend dispatches the line React component only for `chartLibrary: "dygraph"`; a `webgpu` non-sparkline chart currently renders no component. The consumer must use `chart.isTimeSeriesRenderer()` rather than another renderer-name branch.
- The current PNG/PDF path uses html2canvas foreign-object rendering. A physical Chromium check captured the WebGPU canvas correctly through that exact path; direct `canvas.toDataURL()` also worked, while raw Canvas2D `drawImage(webgpuCanvas)` did not.
- The project already has renderer-neutral `getPlotArea`/`getXCoord` seams and root-level hover/pan/select plugins, but Dygraphs-specific navigation and nearest-series logic still sit under `src/chartLibraries/dygraph/`.
- The current renderer router handles only six time-series `chartType` values. Standalone visualizations are selected by setting `chartLibrary` directly, so merely adding more WebGPU kernels under the current router would hard-code the time-series split.
- The topology WebGL renderer creates labels with Canvas2D `measureText`/`fillText`, allocates them into 4,096-pixel DPR-aware bounded texture-atlas pages, and renders atlas sprites through Pixi. This is GPU-presented text, not visible DOM text and not native GPU font rasterization.

Risks:

- Defaulting before complete parity can silently change visuals or interactions.
- WebGPU support varies by browser, operating system, device, driver, VM, window-system/backend selection, and security policy. The local Chromium X11 path exposes `navigator.gpu` but returns no adapter, while native Wayland acquires the same physical NVIDIA GPU. WebGL2 is broader but adds another context, shader language, resource lifecycle, context-loss path, and export surface that must be independently proven.
- The prototype requests a high-performance adapter. MDN warns this can materially reduce laptop battery life and increase device loss; production should use the browser's default adapter unless measured evidence proves it insufficient.
- Cold device/pipeline startup, device loss, uncaptured validation/out-of-memory errors, resource ownership, and many simultaneous charts can create latency, blanks, or GPU-memory leaks.
- Raw `f32` y values can lose meaningful variation around large baselines. Production packing needs a double-precision CPU origin/scale before storing normalized `f32` values.
- Dygraphs autoscales y over the visible x window. Re-scanning one million values on every pan would violate the interaction budget; production needs an exact block-range index built with payload packing and queried without GPU-buffer rebuilds.
- Smooth, stacked, area, overlays, hit-testing, and export semantics can erase the prototype's performance gains if implemented through per-frame CPU reconstruction.
- A full-string text atlas can grow forever on live timestamp labels unless it has bounded ownership and generational repacking. A per-glyph atlas can mishandle complex scripts if it bypasses browser shaping. The text subsystem must retain browser shaping while bounding atlas pages and reclaiming stale entries.
- A prematurely generic engine can become a chart library project. The mitigation is to define shared contracts for all visualization families but implement only line-driven primitives and adapters until another family needs more.
- Exact visual parity may expose existing-library behavior that is accidental but publicly relied upon.

## Pre-Implementation Gate

Status: ready

Problem / root-cause model:

- GPU rasterization is proven; the immediate design risk is locking line/time-series assumptions into the renderer or recreating chart pixels as thousands of DOM nodes. Browser, power, rollout, and default policy are later gates.

Evidence reviewed:

- SOW-0002 physical-GPU benchmark, rendered-pixel, device-loss, tests, builds, and review evidence.
- Current Charts public-consumer contract and default routing.

Affected contracts and surfaces:

- Internal visualization/renderer identity, shared GPU resources, line-family visuals and interactions, canvas text/chrome, payload conversion, exports, Storybook, package distributions, and Cloud Frontend consumption.

Existing patterns to reuse:

- Accepted WebGPU runtime/kernel and benchmark.
- Renderer-neutral UI geometry, `useChartUI`, UI replacement/fallback, existing Netdata ticks/units/legend/overlays/plugins, and current libraries as compatibility oracles.
- Topology's Canvas2D-to-GPU texture atlas, bounded caches, DPR bucketing, imperative camera, hit index, and tiered renderer lifecycle—adapted to WebGPU and Charts ownership rather than copied wholesale.

Risk and blast radius:

- Low while opt-in; high once enabled by default. Rollout and defaulting must be separate verified milestones.

Sensitive data handling plan:

- Use deterministic synthetic or sanitized fixtures only. Durable artifacts must contain no raw secrets, credentials, bearer tokens, community/customer or personal data, identifying non-private addresses, private endpoints, or proprietary incident details.

Implementation plan:

1. Start with one visible WebGPU plot canvas and a bounded offscreen Canvas2D-to-GPU text atlas. Treat placement as an implementation boundary behind stable layers, and move it only with concrete performance, accessibility, visual, export, or maintenance evidence. Keep runtime, browser, rollout, and default policy deferred.
2. Refactor the internal selection model so visualization identity is independent of active renderer backend. Preserve current attributes/methods as compatibility bridges and keep all existing defaults unchanged.
3. Reorganize WebGPU into a Netdata visualization engine with shared runtime, one surface/frame coordinator, ordered layers, resource ownership, reusable primitive pipelines, bounded text-atlas ownership, and visualization adapters. Add only line-exercised implementations; document extension contracts for Cartesian, radial, scalar, table/group, graph, and future families without empty modules.
4. Implement one visible WebGPU plot surface. Rasterize complete shaped strings through reusable offscreen Canvas2D, upload them to a bounded generational texture atlas, and render text quads together with GPU grid, axes, data, annotations, and interaction layers. Do not keep a hidden Dygraphs instance or visible per-label DOM.
5. Add production line data/range models: normalized precision-safe y storage, exact block min/max index for visible-window autoscaling, feature support checks, and existing public value/timestamp semantics.
6. Add pixel-equivalent smooth Bézier tessellation in the GPU from every original point, preserving regular/step gaps and colors without data LOD or sampling.
7. Move coordinate conversion, nearest-point lookup, hover/click, navigation, selection, and overlay contracts behind renderer-neutral interfaces, retaining the existing React legend/toolbox/popover surfaces.
8. Build line parity incrementally behind opt-in routing with regression-first tests, rendered-pixel evidence, and real Cloud Frontend consumption.
9. After line passes, migrate graphical adapters in the approved order: Area; Stacked; Stacked Bar; Multi Column; Heatmap; EasyPie/Circle; Gauge; D3 Pie. Reuse the existing exact buffers, triangle primitives, axes, text, interactions, and fallback lifecycle without silently approximating data. Keep Bars, Value, Group Boxes, and Table in React/DOM.
10. Run the final authorized browser/device matrix only after graphical migration, unless an adapter introduces a genuinely new non-core GPU API dependency. Evaluate runtime/power, batching, rollout, and defaulting after that evidence.

Validation plan:

- Pure geometry/data tests; real SDK/component tests without new Jest mocks; rendered-pixel and interaction tests on physical WebGPU browsers; fallback/device-loss tests; deterministic performance and memory tests; CJS/ES6, Storybook, and Cloud Frontend builds.
- Compare every enabled state against Dygraphs and scan adjacent chart types for the same failure class.

Artifact impact plan:

- AGENTS.md: update only for durable project-wide rules not already covered by runtime skills.
- Runtime project skills: update proven production renderer, browser, parity, and rollout workflow.
- Specs: update supported renderer/default/fallback reality at each rollout milestone.
- End-user/operator docs: update only if consumers or users gain configurable behavior.
- End-user/operator skills: update only if operation or integration changes.
- SOW lifecycle: SOW-0002 is closed; keep this SOW in `current/` during design analysis and do not implement until its pre-implementation gate is ready.

Open-source reference evidence:

- Reuse the commit-pinned ChartGPU, TimeChart, webgl-plot, and uPlot references recorded in SOW-0002.
- `ChartGPU/ChartGPU @ 4ee780e6ecb7d8bd938fb1dccec2db00695f64e1`:
  - `src/core/gpu/submitBatcher.ts`: one microtask-batched `queue.submit()` per shared device while preserving safe deferred buffer destruction.
  - `src/core/renderCoordinator/render/renderAxisLabels.ts`: low-cardinality DOM axis-label overlay separated from GPU geometry.
  - `src/interaction/findPointsAtX.ts` and `createInsideZoom.ts`: binary-search x rollover and renderer-neutral pointer/pan/pinch conversion.
  - Limitation: no smooth line implementation and its generic chart behavior is not Netdata parity evidence.
- `netdata/cloud-frontend @ bf2ba8182cff`:
  - `src/charts/index.js`: current renderer-name dispatch requiring a renderer-neutral consumer fix.
  - `src/domains/functions/components/graph/renderer/webglRenderer.js`: full-string labels shaped/rasterized by Canvas2D, DPR-bucketed and cached, packed into texture-atlas pages, then rendered as GPU sprites; actor textures, bounded caches, and explicit retirement/teardown use the same ownership model.
  - `src/domains/functions/components/graph/renderer/canvasRenderer.js` and `forceGraphCanvas.js`: one imperative canvas surface, coalesced frame scheduling, offscreen composition, indexed hit testing, and no React commit for pan/zoom.
  - `src/domains/functions/components/graph/renderer/tieredRenderer.js`: visualization state separated from interchangeable canvas/WebGL rendering tiers.
  - `src/domains/functions/components/graph/webgpuLayout.js`: error scopes, async pipeline creation, timeout/cooldown, output validation, and fallback patterns already used by Netdata.
  - `src/domains/functions/components/graph/webgpuLiveSimulation.js`: device-loss and shared asynchronous GPU-work lessons.
- W3C WebGPU Candidate Recommendation Draft, 2026-07-14: device loss invalidates all device-owned resources and may otherwise fail quietly; explicit loss/error handling is required.
- GPUWeb Implementation Status, accessed 2026-07-27: major browsers ship WebGPU on substantial platform subsets, but capability remains device/driver/platform dependent.
- MDN `GPU.requestAdapter()`, updated 2026-05-05: the default adapter is normally sufficient; `high-performance` can materially reduce battery life and increase device-loss risk.

Open decisions:

1. **Deferred until graphical adapter migration completes:** adapter/power policy, prewarming, batching, browser/device matrix, rollout/defaulting, and cross-platform authorization. No decision is required for Area because it uses the already-proven core buffer, triangle, blending, text, interaction, and fallback APIs.

## Implications And Decisions

1. **GPU direction:** approved and proven. WebGPU remains the preferred production backend. WebGL2 is the exact accelerated compatibility fallback—not a replacement or third-party chart library—and passed the production benchmark/parity gates before entering routing.
2. **Runtime fallback meaning:** approved. Fallback is for capability, unsupported feature, initialization/pipeline failure, or device loss—not a one-frame performance threshold.
3. **Current default:** approved. Dygraphs remains default until the production SOW proves and receives approval for a rollout milestone.
4. **No silent approximation:** retained. Exact rendering remains mandatory unless a separate explicit product mode is designed and approved.
5. **All-visualization organization:** approved. Separate visualization identity from renderer backend and organize shared engine contracts for all current and future Netdata visualization families. Implement line first; migrate the others on success.
6. **Adaptive canvas/DOM discipline:** approved. Start with deterministic plot pixels on one WebGPU canvas and semantic interactive controls in DOM. Engineering may move the boundary based on concrete performance, accessibility, text-quality, export, lifecycle, or maintenance evidence while preserving public behavior. Any proposed public or accessibility trade-off still requires user approval.
7. **Exact data preservation:** retained. Smooth curves may use screen-error-bounded GPU tessellation of every source pair; this is raster geometry, not data sampling. Raw points, gaps, and values remain exact.
8. **Precision and autoscaling:** recommended line design. Normalize y values from double-precision payload ranges before `f32` storage and build exact block min/max indexes so pan/zoom changes uniforms and low-cost range queries, not data buffers.
9. **Runtime, platforms, and rollout:** explicitly deferred by the user until a production-capable renderer works. Prototype fallback behavior remains unchanged in the meantime.
10. Production architecture implementation is approved. Later runtime/platform/rollout policy remains deferred and does not block the opt-in renderer.
11. **Hover regression repair:** approved. Treat `clickX` as active only when it contains a finite timestamp, otherwise render valid `hoverX`; forward WebGPU native pointer exit/motion through the renderer-neutral `chartUI` event contract so the existing React popover works unchanged.
12. **WebGL2 fallback:** approved and implemented. The standalone feasibility and full production backend passed deterministic 100,000/1,000,000-value gates. Visualization/data/interaction logic is shared; shaders, GPU resources, surfaces, and loss handling remain backend-specific. The chain is `WebGPU -> WebGL2 -> Dygraphs`; no sampling, approximation, or WebGPU compatibility-mode assumption is allowed.
13. **Migration before platform matrix:** approved. Complete the remaining graphical adapters before Windows/macOS/browser validation because no unresolved core API question blocks them. Pause only if an adapter requires a new non-core GPU feature.
14. **Semantic visualizations remain DOM:** approved. Bars, Value, Group Boxes, and Table are already Netdata-native React/DOM surfaces. They are not GPU migration targets because accessibility, selection, and semantic controls outweigh rasterization.
15. **Area adapter:** approved and implemented. Area reuses the exact line payload, axes, interactions, text, and lifecycle while adding per-segment baseline trapezoids. It preserves Dygraphs' reverse fill order, zero-or-nearest-edge baseline, straight/step geometry, gaps, fill opacity, stroke, and sparkline behavior.
16. **Stacked adapter:** approved and implemented. Build exact diverging bounds on the CPU in one row-major pass, processing visible series in reverse dimension order and maintaining independent positive/negative totals. Upload precision-normalized base/end arrays once per payload or visibility change; reuse them for fill/stroke/gap pixels while exact Float64 block extrema drive visible-window autoscaling. Hover resolves the signed band under the pointer. Do not carry forward the legacy plotter's six-points-per-pixel reduction.
17. **Stacked Bar adapter:** approved and implemented under the existing ordered migration. Reuse exact Stacked base/end residency, range, visibility rebasing, and signed-band hover. Generate one centered rectangle per finite source value directly in the GPU shader, preserving series-major paint order, opaque fill, the existing 0.7 CSS-pixel lightened border, and borderless sparkline behavior. Compute CSS bar width exactly as `max(1, floor(2/3 * minimum adjacent x separation))`, with the legacy plot-width/point-count fallback. Null/hidden bars draw nothing; Stacked Bar does not add line gap markers or respond to line step/smooth modes.
18. **Multi Column adapter:** approved and implemented under the existing ordered migration. Reuse ordinary precision-normalized series residency, range, axes, default nearest-value hover, overlays, interactions, and lifecycle. Generate one zero-baseline rectangle per finite value in original visible-series paint order, reflowing visible ranks when dimensions hide. Preserve the legacy grouped width from the first two reduced-window points, `floor(2/3 * separation)`, including zero-width high-density stroke bars; preserve its exact historical per-series left-offset formula rather than silently correcting the uneven overlap for three or more series. Use opaque fills, legacy parsed 0.7-pixel lightened borders, and borderless sparklines. Multi Column omits line gap markers and ignores line step/smooth modes.

## Plan

1. Preserve the completed line branch as backup and transplant only project/GPU commits onto current `origin/main`, excluding duplicate prerequisite history.
2. Revalidate the clean integration base with full Jest and CJS/ES6 builds.
3. Implement Area as exact per-adjacent-pair baseline trapezoids sharing line data/color buffers. Draw fills in reverse series order before straight/step strokes, discard any pair touching a gap, clamp the zero baseline to the plot, and preserve Dygraphs opacity/include-zero/sparkline semantics.
4. Validate Area routing, exact draw counts, gaps, overlap ordering, baseline behavior, step behavior, exports, interactions, runtime loss, multi-chart lifecycle, and performance on local physical WebGPU and WebGL2 paths.
5. Continue in order with Stacked, Stacked Bar, Multi Column, Heatmap, EasyPie/Circle, Gauge, and D3 Pie, applying the same adapter-specific parity gate each time.
6. After graphical migration, run Storybook and Cloud consumption plus the authorized Windows/macOS/browser matrix, then decide runtime/power policy, prewarming, batching, rollout, and defaulting.

## Execution Log

### 2026-07-27

- Created as the real tracked follow-up after the user accepted WebGPU feasibility and direction.
- Promoted to active design analysis after SOW-0002 completed in `d9caf88`; implementation remains gated on unresolved production decisions.
- Mapped the current Dygraphs contract: custom smooth Bézier regular lines, step bypass, plot area/range/axes, hover/click, mouse/touch navigation, overlays, anomaly/annotation strips, sparkline options, and chart-type-specific plotters.
- Verified that Cloud Frontend's `src/charts/index.js` recognizes only `dygraph` as a line renderer for non-sparkline charts; production integration must dispatch through `chart.isTimeSeriesRenderer()`.
- Verified current official browser/platform gaps and the battery/device-loss implications of forcing a high-performance adapter.
- Reused Netdata's existing Cloud Frontend WebGPU error-scope/fallback lessons and ChartGPU's shared-device submit batching, DOM axis labels, rollover, and interaction patterns without adopting either as a chart library.
- Physical Chromium export check: WebGPU `toDataURL()` captured 2,308 line pixels; Canvas2D `drawImage(webgpuCanvas)` captured none; the actual html2canvas foreign-object path captured 10,380 non-background pixels at its configured 2x scale. Export can remain on the current path but requires browser-matrix regression tests.
- Plain Chromium on the local Linux workstation exposed `navigator.gpu` but returned no adapter under its default X11 path; current Wayland Chromium acquired a hardware adapter without unsafe flags. This confirms capability/adapter acquisition—not browser-name checks—must control fallback.
- User corrected the architecture scope: organize for eventual migration of every visualization while implementing line first; avoid deterministic plot DOM and defer runtime/browser/rollout decisions until a working production renderer exists.
- Verified the topology precedent. Its WebGL path does not use native GPU font rasterization: it shapes and rasterizes complete labels through Canvas2D, packs them into DPR-aware texture-atlas pages, and presents them as GPU sprites with bounded caches and explicit resource retirement. This preserves browser text behavior while eliminating visible label DOM.
- User approved the proposed strategy and delegated the exact canvas/DOM boundary to engineering judgment. Initial rule: repeated deterministic plot content stays on the GPU canvas; semantic interaction stays in DOM. Boundary changes are authorized when backed by measured performance, accessibility, text-quality, export, lifecycle, or maintenance evidence and do not alter public behavior.

### 2026-07-28

- Added renderer-neutral visualization identity and `chartRenderersByVisualization` while preserving `chartLibrariesByType`, existing defaults, direct chart-library selection, mounted UI replacement, and visualization-oriented toolbox state.
- Reorganized WebGPU into shared engine/runtime/surface/resource modules, reusable rectangle/circle primitives, one bounded complete-string Canvas2D-to-GPU atlas, and a registry containing only the exercised ordinary-line adapter.
- Implemented one ordered WebGPU plot surface: grid, overlays, exact regular/step/screen-error-bounded smooth lines, gap-edge markers, crosshairs/selections, and shaped text. Existing semantic legend/toolbox/menu/popover DOM remains unchanged.
- Added precision-normalized payload packing, compact point-schema support, exact lazy per-series block range indexes, exact visible-window autoscaling, visibility/colors, gaps, corrected full updates, anomaly/annotation strips, renderer overlays, and raw-range unit-conversion notifications.
- Added nearest-row/series hover, click/annotation, mouse pan/select/highlight/vertical select, wheel zoom, reset, touch pan/pinch/tap/double-tap, and teardown recovery through existing renderer-neutral SDK plugins and attributes.
- Added capability/unsupported-visualization/initialization/pipeline/render/uncaptured-device-error/device-loss fallback, shared resources, persistent growing buffers, submission-safe retirement, and compatibility bridges at the prototype module paths.
- Found and fixed a real physical-browser failure before acceptance: reporting the display-padded y domain through `yAxisChange` fed padding back through unit conversion recursively until stack overflow and Dygraphs fallback. The renderer now reports the raw data range; the benchmark page also displays its active workload so a blank run is visibly a failure.
- Final physical NVIDIA Blackwell/Chromium benchmark passed. At 100,000 values WebGPU completed mount work in 6.7 ms and update work in 4.9 ms, both presented within one measured frame. At 1,000,000 values frame-settled speedups were 9.28x mount and 6.27x update; sustained updates were 48.75/sec with 4,218,976 GPU-buffer bytes.
- The benchmark exported non-empty PNGs (2,102,822 bytes at 100,000 values; 2,919,630 bytes at 1,000,000) and mounted/updated/tore down four charts on one SDK runtime. Runtime references returned from five during the four-chart run to the one explicit benchmark lease.
- Direct current-renderer export and the existing html2canvas foreign-object path both retained rendered WebGPU pixels. A raw Canvas2D `drawImage(webgpuCanvas)` copy remains unsupported and is not used.
- Initial Cloud Frontend validation used the duplicate checkout at `/home/costa/src/netdata/cloud-frontend`; that evidence was invalid. Rechecking established `/home/costa/src/dashboard/cloud-frontend` as the active shared checkout, but touching it would conflict with another worker. All charts, Cloud Frontend, and netdata-ui work is now isolated under `/home/costa/src/PRs/webgpu-charts/`.
- Applied renderer-neutral time-series component dispatch and updated the consumer charts skill in isolated Cloud Frontend commit `65b5d559e`. Scoped ESLint and the full `ENV=testing` production build passed against the local WebGPU charts distribution.
- The first local-agent installation was invalid because `agent.sh` ran `yarn install` after the local package copy and restored the published charts package. Corrected the order: built and copied isolated netdata-ui and charts into Cloud Frontend, verified source/consumer file hashes, rebuilt Cloud Frontend without reinstalling dependencies, and ran `sudo ./agent.sh install`. `/v3/netdata.charts.js` now exactly matches the verified Cloud build (`sha256 497c8265890b4b006cc634572d10bda27621ebf42c72d46f772d3eb364752348`) and contains the WebGPU renderer.
- Built the installed local `/v3/` demo with an ephemeral `line -> webgpu` preference so the user can inspect WebGPU without changing the committed default. The installed `app.js` matches the demo build (`sha256 48061a08137c840c3aa2f52feb85297ed1c660e4035a1ca9beecaf06f5cc9547`); the temporary source override was then removed, leaving all isolated branches clean.
- The user's normal Chromium is explicitly forced to X11 and reports `No available adapters`; line charts correctly fell back to Dygraphs there while topology GPU rendering continued through its separate WebGL backend. A separate native-Wayland Chromium profile, without unsafe WebGPU flags, loaded the same `/v3/` build and proved `adapterAcquired: true`, preference `{ line: "webgpu" }`, 10 visible WebGPU canvases, 10 WebGPU chart instances, and 7 expected non-line Dygraphs instances.
- Committed the production-capable opt-in line milestone with message `feat: add production WebGPU line renderer`.
- The user selected line/Cloud/browser hardening before any rollout or next-visualization work.

### 2026-07-29

- Reproduced the missing hover behavior in the installed native-Wayland WebGPU demo. Native canvas mouse events fire and update `hoverX`, but neither plot pixels nor the React popover change.
- Isolated two concrete causes: array-valued default `clickX: [null, null]` masks finite `hoverX` in crosshair selection, and the WebGPU canvas does not forward native `mousemove`/`mouseout` through `chartUI`, which is the existing popover contract.
- The user approved the surgical hover repair followed by an exact WebGL2 feasibility backend. WebGPU remains preferred; WebGL2 may enter the production fallback chain only after passing the same deterministic performance, export, lifecycle, and visual gates.
- Official Chrome 146 compatibility mode starts with Android OpenGL ES 3.1 and only explores other platforms, so it is not accepted as a Linux desktop fallback. TimeChart and WebGL Plot provide source evidence for WebGL2 float-texture/vertex-shader line rendering, but they do not prove Netdata parity or performance; the local benchmark remains authoritative.
- Repaired both hover failures without changing public behavior or the canvas/DOM boundary. A click selection now wins only when its timestamp is finite; otherwise a finite synchronized hover selection drives the GPU crosshair. Native WebGPU canvas motion/exit now forwards through the same `chartUI` events consumed by the existing React popover.
- Added real SDK/chart and DOM-event regression coverage without new Jest mocks. Full Jest passed 167 suites with 1,554 passed and 2 skipped; focused tests, changed-file ESLint, CJS/ES6 builds, SOW audit, and `git diff --check` passed.
- Rebuilt the isolated Cloud consumer with the verified local Charts distribution and reinstalled `/v3/`; the installed Charts bundle matches the build at `sha256 cb9ed72f8ecd68e8490db53cbced419bc96d86dd6995c20ee4f85439c692e023`. The temporary line-to-WebGPU preference was removed from source after the build.
- Fresh-cache physical Chromium 150/Wayland validation passed: the React popover opened on hover and closed on exit, `clickX` remained `[null, null]`, synchronized `hoverX` became finite, and the GPU canvas changed by exactly 88 pixels corresponding to the visible dashed hairline. No console or page errors occurred. Ephemeral evidence is `/tmp/webgpu-hover-validation.json` and `/tmp/webgpu-hover-canvas-{before,after}.png`.
- Added an isolated WebGL2 feasibility backend to the deterministic renderer benchmark without registering a production renderer. It reuses production precision-normalized packing and draw-layout rules, ports exact gaps/step/monotonic smooth tessellation and thick-line antialiasing to GLSL ES 3.00, stores exact values in float textures, uses asynchronous shader completion, and explicitly owns/loses each WebGL context.
- Physical Chromium 150/X11 on the NVIDIA RTX 5090 passed the WebGL2 feasibility gates. At 100,000 values, mount/update work completed in 14.8/2.1 ms within the measured frame budget with 6.06x/5.40x synchronous speedups. At 1,000,000 values, frame-settled mount/update speedups were 10.39x/7.20x and sustained updates reached 59.20/sec.
- WebGL2 correctness checks rendered every source pair, distinct smooth/step output, an empty pixel band across an injected exact null gap, non-empty PNG exports, and four-chart mount/update/teardown with context references returning from four to zero. Final ephemeral evidence is `/tmp/webgl2-feasibility-benchmark-final.json`.
- The feasibility gate is therefore passed. Production integration may proceed behind shared visualization/data/interaction contracts; final routing remains blocked until axes, text, overlays, interactions, export, context-loss fallback, tests, builds, Cloud consumption, and physical X11/Wayland validation pass.
- Moved backend-neutral color, text shaping/cache, axes, overlays, exact payload/range logic, smooth/step layout, and interactions under `src/chartLibraries/gpu/`. WebGPU and WebGL2 now supply only runtime/surface/resource/shader implementations to the same line visualization.
- Added recursive capability/runtime routing. A configured WebGPU line uses WebGL2 when WebGPU is unsupported or adapter/device/pipeline/render initialization fails; unsupported WebGL2 or context loss advances to Dygraphs without changing visualization identity or the mounted React Line component.
- The first production WebGL2 implementation used one context/program set per chart and failed the 100,000-value mount gate at 31-37 ms. Replaced it with one SDK-owned shared context/program cache and exact per-chart Canvas2D presentation. This avoids browser context limits, retains one visible canvas per chart, improves direct/html2canvas export compatibility, and reduced 100,000-value mount work to 9.1 ms.
- Final physical Chromium 150/X11 production benchmark passed: 100,000-value mount/update work was 9.1/2.0 ms; 1,000,000-value frame-settled mount/update speedups were 11.05x/7.02x; sustained updates were 59.97/sec. Exact smooth/step/gap pixels, PNG export, four-chart shared-runtime references, and forced context-loss fallback to Dygraphs passed. Evidence: `/tmp/webgl2-production-benchmark-final.json`.
- A final combined Chromium 150/Wayland run passed both production backends and the complete runtime-loss chain. At 1,000,000 values WebGPU achieved 8.33x/7.54x mount/update frame speedups and WebGL2 achieved 12.09x/7.27x; both passed exports and shared-runtime lifecycle. Forced WebGPU device loss selected WebGL2, then forced WebGL2 context loss selected Dygraphs with no retained context. Evidence: `/tmp/gpu-production-benchmark-final.json`.
- Rebuilt and installed the isolated Cloud consumer. Native Wayland retained WebGPU, while normal X11 reported no WebGPU adapter and automatically rendered ordinary lines through WebGL2. Physical WebGL2 hover produced a finite synchronized `hoverX`, a visible GPU hairline, an opening/closing React popover, and a non-empty PNG while `clickX` remained `[null, null]`. Evidence: `/tmp/gpu-cloud-wayland-validation.json`, `/tmp/webgl2-cloud-x11-validation.json`, `/tmp/webgl2-cloud-x11-hover-validation.json`, and `/tmp/webgl2-cloud-x11-hover-large.png`.
- Both GPU-backed Cloud browser reloads emitted the same React development warning about an asynchronous state update before mount. No stack currently attributes it to Charts, but a non-GPU baseline was not rerun, so its ownership is unproven. It caused no page error, blank chart, unexpected fallback, or failed interaction; diagnose separately if it persists during rollout hardening.
- Reproduced a Cloud sparkline parity defect on four live dashboard tiles: `sparkline` was true while both explicit axis flags remained true, so the GPU plot reserved 74 pixels for the y axis and 16 pixels for the x axis. Dygraphs independently overrides both axes off for sparklines; the shared GPU axis layer did not.
- Added the same sparkline axis override to the backend-neutral GPU plot layout and axis generation, including reactive invalidation when `sparkline` changes. Normal charts and explicit axis flags retain their prior behavior.
- Full Jest passed 169 suites with 1,559 passed and 2 skipped; changed-file ESLint and CJS/ES6 builds passed. Fresh installed Cloud validation passed on both physical paths: X11/WebGL2 and Wayland/WebGPU each rendered four live sparkline canvases with full-height, zero-gutter plots and no GPU axis pixels, while normal chart axes remained enabled. Evidence: `/tmp/webgl2-sparkline-axis-validation.json`, `/tmp/webgpu-sparkline-axis-validation.json`, and their matching canvas PNGs.
- Reproduced blurry and transiently stretched GPU axis text at the workstation's DPR 1.25. Atlas allocations round outward to integer physical pixels, while both backends draw fractional CSS-size-times-DPR quads at fractional origins through linear filtering. During a 546-to-339 CSS-pixel resize, the 200 ms shared resize debounce left a 683-pixel backing canvas scaled to 339 CSS pixels until it was rebuilt at 424 pixels. Evidence: `/tmp/gpu-font-resize-validation.json` and `/tmp/gpu-font-{before,during-resize,after-resize}.png`.
- The user approved the long-term fix: position complete-string atlas entries on integer physical-pixel origins, draw their exact allocated physical dimensions without scaling, and give GPU renderers an immediate ResizeObserver path instead of changing the legacy shared 200 ms behavior used by Dygraphs. Preserve linear filtering for source glyph antialiasing and retain the one-visible-canvas architecture.
- Reproduced the intermittently partial WebGL2 grid deterministically across width changes. Tracing proved the grid buffer and full-canvas scissor were correct, but the shared GLSL program declares `uCanvas` as `vec4` while primitive and text layers call `uniform2f`; WebGL rejects the wrong uniform arity and leaves the previous chart's canvas dimensions active. The following line pass writes the correct `vec4`, explaining why lines and labels can be current while the earlier grid is clipped or scaled to another chart's size.
- Reproduced the zero-motion mouse-pan defect. Desktop mousedown emits `panStart` immediately, and mouseup emits `panEnd` even at zero distance; this changes `after`/`before` from relative to absolute values, toggles synchronized panning state, and may trigger a subsequent fetch although no pan occurred. The approved correction is to cross the existing five-pixel drag threshold before starting or committing a desktop pan, matching the already-lazy touch behavior and preserving ordinary click selection.
- Implemented exact physical-pixel text placement for both atlases, immediate GPU-only ResizeObserver rendering, the correct WebGL2 `uniform4f` canvas update for primitive/text passes, and lazy thresholded desktop pan start/end. The legacy Dygraphs resize path and public interaction contracts are unchanged.
- Fresh installed Cloud validation at DPR 1.25 passed both physical backends. X11/WebGL2 kept every horizontal grid within one pixel of the expected plot boundary through three 680-to-300-to-680 CSS-pixel cycles, rebuilt backing canvases within 50 ms, emitted integer atlas geometry, ignored zero-motion pan without changing relative `after`/`before`, and retained real drag panning. Wayland/WebGPU passed the same immediate resize and zero-motion pan gates with a complete visible grid. Evidence: `/tmp/webgl2-visual-hardening.json`, `/tmp/webgl2-real-pan-validation.json`, `/tmp/webgpu-visual-hardening.json`, and matching PNGs.
- The final combined physical benchmark passed after visual hardening. At 1,000,000 values WebGPU retained 10.43x/7.52x mount/update frame speedups and WebGL2 retained 10.01x/7.57x; exact data, gaps, exports, four-chart lifecycle, forced WebGPU-to-WebGL2 device-loss transition, and WebGL2-to-Dygraphs context-loss transition all passed. Evidence: `/tmp/gpu-visual-hardening-benchmark.json`.
- Verified prerequisite PRs #225, #226, #227, and #228 are merged in `origin/main` at `f36403e`. Created clean integration branch `codex/webgpu-charts-integration` from that commit and replayed only project/GPU changes as ten commits; the backup branch remains untouched. Tree comparison shows only current upstream changes, including merged gauge thresholds, differ from the backup.
- Installed dependencies under the required Node 22.22.0 runtime and revalidated the clean base: 172 Jest suites passed with 1,588 tests passed and 2 skipped; CJS compiled 548 files and ES6 compiled 555 files; SOW audit and `git diff --check` passed.
- The user approved completing graphical adapter migration before the final cross-platform matrix. Area is first because it introduces only baseline trapezoids over the proven exact line buffers and core triangle/blending APIs. Official Dygraphs source confirms fills are drawn in reverse series order before strokes, use straight/step segment tops, break at null gaps, and clamp the zero baseline to the plot. `ChartGPU/ChartGPU @ 4ee780e6ecb7d8bd938fb1dccec2db00695f64e1` independently confirms the six-vertex per-segment trapezoid and dual-endpoint NaN-discard pattern; its optional LOD is explicitly rejected for Netdata's exact mode.
- Implemented Area as a thin backend-neutral adapter over the exact line payload/range/axes/overlays/interactions model. WebGPU and WebGL2 share x/y/color residency with the stroke and add one six-vertex trapezoid per adjacent source pair, reverse fill order, zero-baseline clamping, exact null-pair discard, straight/step tops, 0.2 fill alpha, 0.7 stroke, and opaque no-stroke sparkline behavior. Area is registered in both GPU backend capability maps while all default renderer maps remain Dygraphs.
- The first combined Area benchmark exposed a real prewarmed WebGPU mount miss: median work completed in 13.2 ms but presentation took 28.9 ms. Parallelized independent WebGPU layer/resource initialization using failure-safe `Promise.allSettled`, reducing the accepted final 100,000-value Area mount to 10.1 ms work and 12.3 ms presentation without changing lifecycle ownership.
- Final physical Chromium 150/Wayland Area benchmark passed both backends and retained Line correctness. At 100,000 values, WebGPU mount/update work completed in 10.1/7.0 ms and WebGL2 in 11.5/2.7 ms within one measured frame. At 1,000,000 values, WebGPU achieved 10.29x/8.08x and WebGL2 11.53x/14.06x mount/update frame speedups over Dygraphs. Exact fill/stroke instance counts, regular/step distinction, an empty null-gap band, PNG exports, four-chart lifecycle, WebGPU device loss to WebGL2, WebGL2 context loss to Dygraphs, and zero retained contexts passed.
- Deterministic overlap sampling proved exact Dygraphs pixel parity, including reverse fill order and a zero baseline clamped below an all-positive `[20, 100]` range. Dygraphs, WebGPU, and WebGL2 produced identical interior RGBA values: transparent `[0,0,0,0]`, first-series fill `[255,0,0,51]`, and overlap/baseline fill `[141,0,114,92]`. Evidence: `/tmp/gpu-area-production-benchmark-final.clean.json`.
- Full validation after Area passed: 174 Jest suites; 1,594 tests passed and 2 skipped; coverage 62.10% statements, 56.09% branches, 60.50% functions, and 63.36% lines; CJS/ES6 each compiled 562 files; Storybook built successfully with only existing size warnings. Cloud installation and external platform checks remain intentionally deferred until graphical migration completes.
- Mapped the existing diverging Stacked contract before implementation. `divergingStack.js` processes visible dimensions in reverse order, accumulates positive and negative values independently, leaves nulls out of totals, and rebases after visibility changes. `stackedArea.js` fills each exact base/end band before drawing its straight/step end line and uses signed-band hover, but its high-density path silently reduces to at most six points per canvas pixel. The GPU adapter preserves stacking, gaps, order, hover, opacity, stroke, sparkline, and autoscaling semantics while deliberately rejecting that legacy approximation. ChartGPU's separate base/end stacked-area shader confirms the per-pair six-vertex band pattern but its optional LOD remains out of scope.
- Implemented Stacked on the shared Cartesian adapter with exact row-major precision-normalized base/end residency, independent positive/negative accumulation, reverse visible-series ordering, null-pair discard, straight/step band geometry, visibility-triggered rebasing, exact block-indexed visible-window extrema, signed-band hover, and inherited axes/overlays/interactions/text/export/lifecycle behavior. The WebGPU and WebGL2 backends add only a base buffer/texture and backend shader binding; default routing remains Dygraphs.
- Deterministic pixel probes matched Dygraphs exactly for top positive, lower positive, negative, and empty regions on both backends: `[255,0,0,204]`, `[0,0,255,204]`, `[0,255,0,204]`, and transparent `[0,0,0,0]`. Exact draw-count and null-gap checks passed for regular and step bands; Line and Area regression/parity checks remained unchanged.
- The first WebGL2 100,000-value runs narrowly missed the strict presentation budget despite 17-18 ms median work. Repacked stack storage from series-major to row-major so each segment's two source rows are contiguous, removed redundant initialization and hot-loop `Math.min`/`Math.max` calls, and retained exact source semantics. The accepted combined run completed 100,000-value mount work/presentation in 14.2/15.7 ms on WebGPU and 15.2/18.2 ms on WebGL2; updates completed in 6.9/16.6 ms and 5.2/16.7 ms respectively.
- Final physical Chromium 150/Wayland Stacked benchmark passed both backends. At 1,000,000 values, WebGPU completed mount/update work in 54.0/37.1 ms and WebGL2 in 52.5/26.2 ms, with greater-than-100x frame-settled gains over Dygraphs' legacy Stacked implementation. PNG exports, four-chart lifecycle, WebGPU device loss to WebGL2, WebGL2 context loss to Dygraphs, and zero retained contexts passed. Evidence: `/tmp/gpu-stacked-production-benchmark-final.clean.json`.
- Implemented Stacked Bar as a thin adapter over exact Stacked residency/range/visibility/hover. Both shaders generate one series-major centered rectangle per source value; null/hidden values are discarded. CSS width exactly follows the legacy two-thirds minimum-separation rule, normal charts use opaque fills plus the 0.7-pixel lightened Canvas2D border, sparklines omit the border, line step mode is ignored, and unused gap-marker resources/data are not created.
- Pixel-footprint validation exposed a pre-existing GPU y-padding mismatch. Dygraphs computes `span * yRangePad / plotHeight`; the GPU path incorrectly divided by `plotHeight - 2 * yRangePad`. Correcting the formula produced the exact shared `[-3.18, 3.18]` range and reduced the sampled bar-height difference to the two antialiased outer-edge pixels allowed by the raster contract.
- Reproduced Canvas2D `fillRect` followed by `strokeRect` composition analytically in both shaders, including legacy color parsing, series paint order, subpixel alpha, and the historical lightening function. Interior positive/negative/fill/empty pixels matched exactly; the sampled border differed by at most one RGBA unit, horizontal bar footprint matched exactly, and vertical footprint differed only at the two outer antialiased pixels.
- Removed the unnecessary circle-marker layer for Stacked Bar and replaced shared-context `gl.finish()` with `gl.flush()` before the synchronizing Canvas2D `drawImage`, avoiding a per-chart full GPU stall while preserving current-frame capture. Line, Area, Stacked, exports, and runtime-loss checks remained green.
- Current physical Chromium 150 evidence passed each backend under workstation contention. At 100,000 values, WebGPU mount/update work completed in 10.7/7.5 ms and presented in 14.7/16.6 ms; WebGL2 completed in 16.4/4.0 ms and presented in 19.3/16.5 ms. At 1,000,000 values, WebGPU completed mount/update work in 51.7/28.0 ms and WebGL2 in 68.0/27.1 ms, each retaining more than 15x frame-settled gains over Dygraphs. Exact instances, gaps, no-op step mode, bar width/range/fill/border pixels, PNG export, four-chart lifecycle, WebGPU device loss to WebGL2, WebGL2 context loss to Dygraphs, and zero retained contexts passed. Evidence: `/tmp/gpu-stacked-bar-webgpu-current.clean.json` and `/tmp/gpu-stacked-bar-webgl2-current.clean.json`.
- Implemented Multi Column over ordinary precision-normalized series residency. The adapter reproduces Dygraphs' reduced-window first-pair width, zero-baseline positive/negative bars, visible-series rank reflow, original visible paint order, opaque fill, parsed lightened border, borderless sparkline, null omission, and no-op line step mode. It deliberately preserves the historical uneven three-or-more-series left-offset formula rather than silently fixing public pixels.
- Extended the shared bar shader with a distinct Multi Column mode: series-major y lookup, interleaved fill/stroke/visible-rank metadata, grouped zero-baseline positioning, and horizontal subpixel coverage needed for fractional and zero-width bars. Multi Column skips line gap-edge data and circle-marker resources; no payload or public attribute changes were introduced.
- Deterministic normal and two-of-three-visible captures matched Dygraphs exactly on both backends: all sampled RGBA deltas, grouped horizontal footprint, vertical footprint, and padded `[-3.18, 3.18]` range deltas were zero. This physically proves the existing overlap behavior and visibility reflow rather than only testing isolated rectangle colors.
- Current physical Chromium 150 evidence passed each backend. At 100,000 values, WebGPU mount/update work completed in 8.1/6.3 ms and presented in 15.6/16.4 ms; WebGL2 completed in 12.4/2.7 ms and presented in 14.7/16.6 ms. At 1,000,000 values, WebGPU completed mount/update work in 34.5/19.1 ms and WebGL2 in 36.6/12.3 ms, retaining 72.84x and 77.71x frame-settled update gains over Dygraphs. Exact instances, gaps, step no-op, overlap/reflow pixels, PNG export, four-chart lifecycle, the full loss chain, and all prior visualization regressions passed. Evidence: `/tmp/gpu-multi-bar-webgpu-final.clean.json` and `/tmp/gpu-multi-bar-webgl2-final.clean.json`.

## Validation

Acceptance criteria evidence:

- All existing renderer defaults remain Dygraphs. The new map is empty by default and WebGPU registers only `line`; unsupported visualizations resolve to their legacy renderer before construction.
- Physical rendered output verified one visible WebGPU plot canvas with zero Dygraphs axis-label DOM nodes, regular/smooth/step lines, gaps/edge markers, axes/text, hover crosshair, and current export pixels.
- Public payload rows/timestamps remain unchanged; GPU storage uses shared x origin plus normalized y origin/scale. Exact source values feed lazy block indexes and interaction lookup.
- Final benchmark JSON: `/tmp/webgpu-production-benchmark-final.json` (ephemeral local evidence, not a repository artifact).

Tests or equivalent validation:

- Full Jest with coverage: 179 suites passed; 1,615 tests passed and 2 skipped. Coverage passed unchanged thresholds at 62.66% statements, 56.19% branches, 60.62% functions, and 63.94% lines.
- Focused shared-GPU, WebGPU, WebGL2 primitive, routing, controller, hover, and default-SDK tests passed without new Jest mocks.
- Clean CommonJS and ES6 distributions built with 582 files each; moved backend-neutral modules and both GPU backends were present, while stale pre-move paths were absent.
- Changed-file ESLint passed. Repository lint retained 35 unrelated pre-existing errors and introduced none in changed files.
- Storybook static build passed. The isolated Cloud production build and final agent installation passed. Mixed-size X11 WebGL2 canvases all exported non-empty frames without cropping or blanks (`/tmp/webgl2-cloud-x11-final.json` and matching narrow/large screenshots). SOW audit and `git diff --check` passed.
- Physical Line, Area, Multi Column, Stacked, and Stacked Bar benchmarks passed one-frame 100,000-value mount/update work, greater-than-5x 1,000,000-value frame speedups, exact source geometry/gaps, Dygraphs Area overlap/baseline pixels, diverging Stacked positive/negative pixels, Stacked Bar width/range/fill/border pixels, PNG export, four-chart shared-runtime lifecycle, and the complete runtime-loss chain.

Real-use evidence:

- Physical Chromium 150 acquired the local NVIDIA Blackwell adapter through Wayland without unsafe flags and rendered/exported the preferred WebGPU line backend.
- The same Chromium build under normal X11 could not acquire WebGPU, automatically selected hardware WebGL2, and rendered/exported/interacted through the same line visualization without unsafe flags.
- Isolated Cloud Frontend consumption passed its production agent build. The locally served `/v3/` Charts bundle matches the verified build at `sha256 e91a5bebda3ea9ebdcdeb2887102d2224fdec999164ff55210cba2f6390938c4`; results from duplicate or shared checkouts are not accepted as evidence.

Reviewer findings:

- No external reviewer was authorized for this tranche. Internal failure analysis found and fixed y-range recursion, invalid scissor bounds, stale resource retirement, unsupported CSS color normalization, lifecycle cancellation, and eager full range-index costs before acceptance.

Same-failure scan:

- Searched renderer-name dispatch in Charts and Cloud Frontend, y-axis event consumers, all GPU buffer/texture replacement paths, plot scissor paths, chart interaction teardown, and old WebGPU deep-module imports. Other visualization adapters remain deliberately absent and on legacy renderers.

Sensitive data gate:

- The SOW contains no raw secrets, credentials, bearer tokens, community/customer or personal data, identifying non-private addresses, private endpoints, or proprietary incident details.

Artifact maintenance gate:

- Updated the current-reality consumer contract, project development/testing skills, and isolated Cloud consumer references for the shared GPU model and `WebGPU -> WebGL2 -> Dygraphs` chain. No end-user documentation or operator skill changes are warranted while GPU rendering remains internal opt-in and defaults are unchanged.

Specs update:

- Updated `.agents/sow/specs/charts-public-consumer-contract.md` with visualization identity, renderer maps, fallback scope, and the canvas/DOM boundary.

Project skills update:

- Updated `project-charts-development` and `project-testing` with renderer-neutral dispatch, WebGPU ownership/fallback, raw y-range notification, resource teardown, physical benchmark, export, and non-blank-run requirements.

End-user/operator docs update:

- None. There is no new default or supported end-user configuration.

End-user/operator skills update:

- None. Operation and integration remain unchanged.

Lessons:

- Renderer events that feed attribute conversion must report semantic data ranges, not padded raster domains.
- A benchmark can pass automation while showing a blank headed page during setup/teardown; visible status plus explicit fallback/export gates prevent false visual confidence.
- Exact range indexes need not penalize the common full-window/all-series update path; build exact per-series blocks lazily when scoped autoscaling first needs them.

Follow-up mapping:

- Production parity, broader browser support, exports, and rollout from SOW-0002 are tracked here.

## Outcome

The production-capable Line, Area, Multi Column, diverging Stacked, and Stacked Bar GPU adapters are implemented, physically validated, and cleanly integrated on current `origin/main`. The approved next milestone is Heatmap, followed by EasyPie/Circle, Gauge, and D3 Pie before broader browser/device hardening. Runtime/power policy and rollout/default approval remain intentionally deferred.

## Lessons Extracted

- Keep visualization identity stable while renderer backends change or fail.
- Keep deterministic plot pixels on one owned surface, but retain semantic controls in DOM.
- Treat visible blank benchmark windows as failures even when timing automation continues.

## Followup

None yet.

## Regression Log

None yet.

Append regression entries here only after this SOW was completed or closed and later testing or use found broken behavior. Use a dated `## Regression - YYYY-MM-DD` heading at the end of the file. Never prepend regression content above the original SOW narrative.
