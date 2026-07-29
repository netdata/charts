# SOW-0004 - Production WebGPU Visualization Renderer

## Status

Status: in-progress

Sub-state: The first production-capable opt-in line renderer now works and passes its physical-GPU gates. Visualization/renderer separation, one-canvas rendering, exact line data semantics, interactions, fallback, exports, and shared-runtime multi-chart lifecycle are implemented. Runtime/power policy, broader browser/device coverage, rollout/defaulting, and later visualization adapters remain intentionally deferred; Dygraphs remains every default.

## Requirements

### Purpose

Deliver a production-quality Netdata-native WebGPU visualization engine that preserves Netdata's public, payload, visual, interaction, lifecycle, and consumer contracts while making high-cardinality visuals materially faster. The internal organization must support eventual migration of all current and future Netdata visualization families, while implementing ordinary line charts as the first end-to-end tranche. Existing libraries remain supported as compatibility and runtime-failure fallbacks until each visualization reaches proven parity.

### User Request

Proceed with WebGPU as the renderer direction after the native feasibility prototype proved exact 100,000-value one-frame rendering and more than 5x frame-settled gains at 1,000,000 values. Organize it for eventual migration of every Netdata visualization, not only line or time series; line remains the first implementation. Minimize visible DOM: deterministic, simple visualization pixels should be drawn on canvas, with any unavoidable DOM surface explicitly managed. Do not confuse the benchmark's one-frame acceptance rule with runtime renderer selection.

### Assistant Understanding

Facts:

- SOW-0002 proves the exact unsampled regular/step GPU kernel, shared runtime, payload packing, lifecycle fallback, device-loss recovery, and physical-GPU performance architecture.
- WebGPU is a low-level browser GPU API, not a chart library. Netdata continues to own chart semantics and UI.
- The feasibility prototype is internal opt-in; every default renderer mapping remains Dygraphs.
- The opt-in ordinary-line tranche now implements smooth/step geometry, axes/text, overlays/decorations, complete pointer/touch interactions, direct/current html2canvas export behavior, and shared-runtime multi-chart ownership. Stacking, area, bars, heatmaps, radial/scalar/table/group/graph adapters, browser/device policy, batching policy, and rollout remain outside this tranche.
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

- The eventual migration order after line succeeds.
- Browser/platform support, initialization/power, rollout/defaulting, and final performance policies; these are explicitly deferred.
- Whether profiling will justify workers or WASM for any CPU-side kernel.

### Acceptance Criteria

- The internal engine separates visualization identity from rendering backend and provides shared runtime, surface/frame, ordered-layer, primitive, text-atlas, and interaction seams usable by all current visualization families without line/time-series assumptions.
- The first implementation exercises those seams through exact visual and interaction parity for ordinary line charts; no empty future visualization adapters or unused speculative primitives are added.
- Approved production scope has exact visual and interaction parity against Dygraphs for every enabled chart type and state.
- WebGPU is preferred only for approved eligible chart types after capability and feature checks; Dygraphs remains installed and automatically handles unsupported capability/features, initialization/pipeline failure, and device loss.
- Runtime routing never benchmarks renderers dynamically and never falls back solely because WebGPU requires more than one display frame.
- Shared device/pipelines, prewarming, persistent buffers, multi-chart ownership, virtualization, resize, teardown, and device-loss recovery are validated without leaks or blank charts.
- Existing payload/query/public timestamp contracts remain unchanged; compact point-schema values, null gaps, visibility, colors, corrected history, and full updates retain exact semantics.
- The plot uses no visible per-label/tick/annotation DOM. Deterministic plot chrome and text are canvas/GPU layers, with bounded caches and explicit device, resize, theme, DPR, and teardown ownership.
- The first line tranche validates regular, step, smooth, sparkline, axes, overlays, hover, pan, zoom, selection, touch, annotations, alerts, anomalies, and export behavior. Other visualization implementations remain out of this tranche but fit the same internal engine.
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
- WebGPU support varies by browser, operating system, device, driver, VM, and security policy. Official May 2026 status still leaves gaps, including Firefox stable on Linux/Android and some Chromium Linux/Android GPU families.
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
8. Build line parity incrementally behind opt-in routing with regression-first tests, rendered-pixel evidence, and real Cloud Frontend consumption. Evaluate runtime/power, multi-chart batching, export edge cases, browser matrix, rollout, and defaulting only from that working implementation.

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

1. **Deferred until the first production renderer works:** adapter/power policy, prewarming, batching, browser/device matrix, rollout/defaulting, and cross-platform authorization. No decisions are requested for these now.

## Implications And Decisions

1. **WebGPU direction:** approved. Build the production renderer on WebGPU, not WebGL or a third-party chart library.
2. **Runtime fallback meaning:** approved. Fallback is for capability, unsupported feature, initialization/pipeline failure, or device loss—not a one-frame performance threshold.
3. **Current default:** approved. Dygraphs remains default until the production SOW proves and receives approval for a rollout milestone.
4. **No silent approximation:** retained. Exact rendering remains mandatory unless a separate explicit product mode is designed and approved.
5. **All-visualization organization:** approved. Separate visualization identity from renderer backend and organize shared engine contracts for all current and future Netdata visualization families. Implement line first; migrate the others on success.
6. **Adaptive canvas/DOM discipline:** approved. Start with deterministic plot pixels on one WebGPU canvas and semantic interactive controls in DOM. Engineering may move the boundary based on concrete performance, accessibility, text-quality, export, lifecycle, or maintenance evidence while preserving public behavior. Any proposed public or accessibility trade-off still requires user approval.
7. **Exact data preservation:** retained. Smooth curves may use screen-error-bounded GPU tessellation of every source pair; this is raster geometry, not data sampling. Raw points, gaps, and values remain exact.
8. **Precision and autoscaling:** recommended line design. Normalize y values from double-precision payload ranges before `f32` storage and build exact block min/max indexes so pan/zoom changes uniforms and low-cost range queries, not data buffers.
9. **Runtime, platforms, and rollout:** explicitly deferred by the user until a production-capable renderer works. Prototype fallback behavior remains unchanged in the meantime.
10. Production architecture implementation is approved. Later runtime/platform/rollout policy remains deferred and does not block the opt-in renderer.

## Plan

1. Use completed feasibility commit `d9caf88` as the production base.
2. Start with the one-canvas/offscreen-text-atlas boundary and keep it reversible behind stable layer contracts.
3. Establish the renderer/visualization separation and shared engine seams with no behavior/default change.
4. Implement and validate line as the first complete adapter.
5. Evaluate runtime, browser, rollout, and the next visualization only after working evidence exists.

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

## Validation

Acceptance criteria evidence:

- All existing renderer defaults remain Dygraphs. The new map is empty by default and WebGPU registers only `line`; unsupported visualizations resolve to their legacy renderer before construction.
- Physical rendered output verified one visible WebGPU plot canvas with zero Dygraphs axis-label DOM nodes, regular/smooth/step lines, gaps/edge markers, axes/text, hover crosshair, and current export pixels.
- Public payload rows/timestamps remain unchanged; GPU storage uses shared x origin plus normalized y origin/scale. Exact source values feed lazy block indexes and interaction lookup.
- Final benchmark JSON: `/tmp/webgpu-production-benchmark-final.json` (ephemeral local evidence, not a repository artifact).

Tests or equivalent validation:

- Full Jest with coverage: 167 suites passed; 1,552 tests passed and 2 skipped. Coverage passed unchanged thresholds at 61.86% statements, 55.60% branches, 61.33% functions, and 62.83% lines.
- Focused WebGPU/routing/controller tests: 17 suites and 70 tests passed.
- Clean CommonJS and ES6 distributions built with 518 files each; stale prototype kernel/shader outputs were absent.
- Changed-file ESLint passed. Repository lint retained 35 unrelated pre-existing errors and introduced none in changed files.
- Storybook static build passed. SOW audit and `git diff --check` passed.
- Physical benchmark passed one-frame 100,000-value mount/update work, greater-than-5x 1,000,000-value frame speedups, PNG export, sustained updates, and four-chart shared-runtime lifecycle gates.

Real-use evidence:

- Physical Chromium 150 acquired the local NVIDIA Blackwell adapter through Wayland without unsafe flags and rendered/exported the production line adapter.
- Isolated Cloud Frontend consumption passed scoped ESLint and full testing/agent builds. The locally served `/v3/` bundle matches the verified agent build and contains the WebGPU renderer; results from duplicate or shared checkouts are not accepted as evidence.

Reviewer findings:

- No external reviewer was authorized for this tranche. Internal failure analysis found and fixed y-range recursion, invalid scissor bounds, stale resource retirement, unsupported CSS color normalization, lifecycle cancellation, and eager full range-index costs before acceptance.

Same-failure scan:

- Searched renderer-name dispatch in Charts and Cloud Frontend, y-axis event consumers, all GPU buffer/texture replacement paths, plot scissor paths, chart interaction teardown, and old WebGPU deep-module imports. Other visualization adapters remain deliberately absent and on legacy renderers.

Sensitive data gate:

- The SOW contains no raw secrets, credentials, bearer tokens, community/customer or personal data, identifying non-private addresses, private endpoints, or proprietary incident details.

Artifact maintenance gate:

- Updated the current-reality consumer contract and project development/testing skills. No end-user documentation or operator skill changes are warranted while WebGPU remains internal opt-in and defaults are unchanged.

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

The first production-capable ordinary-line WebGPU adapter is implemented and physically validated behind opt-in routing. The next approved milestone is line hardening through the active Cloud Frontend consumer and broader browser/device validation. Runtime/power policy, rollout/default approval, and the next visualization tranche remain intentionally deferred.

## Lessons Extracted

- Keep visualization identity stable while renderer backends change or fail.
- Keep deterministic plot pixels on one owned surface, but retain semantic controls in DOM.
- Treat visible blank benchmark windows as failures even when timing automation continues.

## Followup

None yet.

## Regression Log

None yet.

Append regression entries here only after this SOW was completed or closed and later testing or use found broken behavior. Use a dated `## Regression - YYYY-MM-DD` heading at the end of the file. Never prepend regression content above the original SOW narrative.
