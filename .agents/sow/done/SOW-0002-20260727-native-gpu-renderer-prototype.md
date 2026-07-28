# SOW-0002 - Netdata-Native GPU Renderer Prototype

## Status

Status: completed

Sub-state: Native WebGPU feasibility prototype passed and is accepted. The exact implementation, fallback, benchmark, review, tests, builds, and physical-GPU evidence are complete; production parity and rollout are tracked in SOW-0004.

## Requirements

### Purpose

Determine whether a Netdata-native GPU rendering engine can make high-cardinality charts exceptional rather than forcing Netdata's series-heavy, one-second data model through assumptions made by general-purpose Canvas chart libraries.

The prototype must prove or reject the rendering architecture against the actual approved workloads before a production renderer is designed. It must preserve the existing Charts SDK and payload contracts, retain Dygraphs as the default and fallback, and avoid speculative WASM complexity until profiling identifies a CPU bottleneck.

### User Request

Replace the uPlot direction with a purpose-built renderer tightly integrated with Netdata payloads and environment. Pursue exceptional mount, update, and interaction performance rather than selecting a charting library merely to use a library. Update this SOW and try the native-engine approach.

### Assistant Understanding

Facts:

- Netdata owns the legend, tick generation, stacking logic, overlays, SDK state, and interaction contracts around the current renderer.
- The approved workloads are series-heavy: 100 series x 1,000 points and 1,000 series x 1,000 points.
- Exact smooth uPlot Canvas rendering was slower than Dygraphs on both workloads. uPlot's optimized linear Canvas path still missed every hard gate.
- Suppressing series drawing while retaining data conversion, scales, lifecycle, and update work passed the gates decisively. Series path construction and Canvas rasterization are the measured blockers.
- WebAssembly accelerates CPU computation but does not remove Canvas rasterization cost. A GPU backend is the architectural change required to test the hypothesis.
- Current browser support does not justify removing the fallback. WebGPU capability and initialization can fail even in otherwise supported browsers.

Inferences:

- Netdata's aligned timestamps and fixed visualization contracts allow a substantially simpler and more efficient GPU data layout than a generic chart API.
- A shared GPU device, shared pipelines, persistent buffers, and uniform-only pan/zoom updates should make warm chart mounts and interactions much cheaper than independent renderer instances.
- JavaScript typed-array conversion may already fit the budget. Rust/WASM should be introduced only if measured CPU-side conversion or geometry work prevents the GPU path from meeting its budget.

Unknowns answered by this prototype:

- Whether exact 100 x 1,000 and 1,000 x 1,000 straight/step geometry meets the approved feasibility gates on the workstation's physical GPU.
- Cold device/pipeline startup cost versus prewarmed per-chart mount cost.
- Full-buffer one-second update cost, persistent GPU memory, teardown behavior, and repeated-update stability.
- Whether the current row-major payload-to-typed-buffer conversion is material after Canvas is removed.

### Acceptance Criteria

- The abandoned uPlot runtime, dependency, CSS, test setup, and renderer registration are removed; no rejected approximation remains active or commit-ready.
- The completed per-chart-type routing and lifecycle-safe UI replacement remain intact and fully tested.
- An internal `webgpu` line renderer can be selected through `chartLibrariesByType`; Dygraphs remains the default and automatic fallback.
- Unsupported WebGPU, adapter/device acquisition failure, pipeline failure, and device loss never produce a blank chart when Dygraphs is available.
- Charts in one SDK share one GPU adapter/device and reusable shader pipelines; chart teardown releases chart-owned buffers and canvas configuration without destroying a shared device still used by other charts.
- The prototype consumes the existing row-major payload without changing queries or public payload semantics and creates cached typed renderer buffers.
- The GPU path draws every visible series and every in-range segment for regular and `stepPlot` lines, preserves colors and null gaps, and performs no LOD, sampling, series aggregation, or silent approximation in the feasibility measurements.
- Pan/zoom transforms update uniforms without rebuilding or re-uploading unchanged data.
- The committed task-specific comparator measures identical deterministic workloads for Dygraphs and the GPU prototype and reports:
  - cold runtime initialization separately;
  - prewarmed frame-settled mount;
  - synchronous and frame-settled full-data updates;
  - GPU queue completion where available;
  - sustained update rate, browser task/script/layout time, peak heap, retained heap, and GPU buffer bytes.
- At 100,000 values, where both renderers present within one physical display frame, the feasibility gate is one-frame presentation, at least 3x lower synchronous/main-thread mount and update work, and GPU queue completion within the frame budget.
- At 1,000,000 values, the feasibility gate remains at least 5x faster prewarmed frame-settled mount and repeated update against Dygraphs.
- Physical-GPU browser evidence is captured. Software adapters may validate correctness but cannot satisfy the performance gate.
- No WASM, worker, SharedArrayBuffer requirement, payload protocol change, WebGL fallback, generalized performance HUD, or production instrumentation is added in this prototype.
- The passing prototype is not made the default and is not claimed visually production-complete. Smooth spline parity, axes, overlays, full interactions, exports, broader browser support, and additional visualization families are tracked in `SOW-0004-20260727-webgpu-visualization-renderer.md`.
- A failing prototype records the measured blocker and leaves every visualization on Dygraphs.

## Analysis

Sources checked:

- Current Charts SDK, renderer routing, lifecycle, payload, dimensions, line components, Dygraphs renderer, tests, Storybook, and consumer-contract spec.
- Three reproducible Dygraphs baseline runs and multiple uPlot diagnostic comparator runs recorded below.
- Official uPlot source, documentation, performance guidance, and maintainer discussions on Canvas limits and GL shaders.
- Current WebGPU implementation-status documentation and MDN compatibility guidance.
- Locally cloned open-source GPU chart implementations recorded under Open-source reference evidence.

Current state:

- Phase 0 is committed at `a0266e8a19ae`: renderer resolution is per chart type, unavailable renderers fall back to Dygraphs, and mounted UI replacement preserves chart identity, mount, custom UI overrides, and React subscriptions.
- Every default `chartLibrariesByType` entry remains `dygraph`.
- The worktree contains an uncommitted uPlot prototype and comparator. Its benchmark evidence is useful, but its runtime code and dependency are rejected by the new design.
- The immutable provisional prerequisite integration base remains `3c9eac8bea1f`; final production claims still require rebasing onto merged latest `origin/main` after PRs #225-#228 merge.

Risks:

- WebGPU is unavailable on some browsers, operating systems, drivers, virtual machines, and restricted environments. Capability detection and Dygraphs fallback are mandatory.
- GPU initialization and pipeline compilation are asynchronous and non-zero. Per-chart mount can be near-instant only after a shared runtime is prewarmed.
- GPU device loss, canvas reconfiguration, resize, virtualization, and multi-chart resource ownership can cause blank charts or leaks if lifecycle ownership is wrong.
- Thick anti-aliased lines require triangle expansion; native GPU line width is not portable. Null gaps must degenerate complete segments rather than draw spurs.
- Epoch timestamps lose precision in `f32`. The shader data model must use an x-origin offset or another precision-safe representation.
- A fast straight-line prototype does not prove smooth-spline parity or full production readiness.
- JSON parsing and row-major conversion may become the next bottleneck after GPU rendering; this must be measured rather than preemptively addressed with WASM.
- GPU benchmarks can lie if they measure command submission without presentation or queue completion. The comparator must report CPU submission, frame settlement, and queue completion separately.
- Rendering 1,000 exact lines quickly does not by itself make them understandable. Density or LOD visualization is explicitly excluded from this renderer work; it requires a separately requested and approved product mode and must never be a silent performance substitution.

## Pre-Implementation Gate

Status: ready. The user approved replacing the uPlot milestone with a WebGPU-first native renderer prototype, preserving Phase 0 and Dygraphs fallback, and excluding WASM unless profiling in SOW-0004 proves it is needed and a new decision approves it.

Problem / root-cause model:

- The existing Canvas renderers spend the dominant high-cardinality cost constructing and rasterizing series paths.
- General-purpose chart libraries cannot remove that Canvas bottleneck while preserving the approved series-heavy exact workload.
- WebGPU can keep typed data resident in GPU buffers, transform data in shaders, render segment geometry in parallel, and apply pan/zoom through uniforms without rebuilding paths.
- Netdata's aligned payload permits one shared x buffer, dimension-major y storage, per-series color metadata, and one or very few draw calls. This is a narrower and more favorable contract than generic arbitrary-series chart APIs.

Evidence reviewed:

- `.agents/sow/specs/charts-public-consumer-contract.md`
- `src/makeDefaultSDK.js`
- `src/sdk/makeChart/filters/makeControllers.js`
- `src/sdk/makeChart/index.js`
- `src/components/chartContainer.js`
- `src/chartLibraries/dygraph/`
- `src/components/line/`
- `jest/testUtilities/`
- Dygraphs baseline:
  - 100,000 values: 170.7 ms frame-settled mount, 79.0 ms update, 13.68 updates/second, 65.3 MiB sampled peak heap delta.
  - 1,000,000 values: 1,503.5 ms frame-settled mount, 715.4 ms update, 1.65 updates/second, 347.3 MiB sampled peak heap delta.
- Exact smooth uPlot diagnostic:
  - 100,000 values: 229.1 ms mount and 225.5 ms update.
  - 1,000,000 values: 2,219.2 ms mount and 2,220.5 ms update.
- Optimized linear uPlot diagnostic:
  - 100,000 values: 113.2 ms mount and 95.9 ms update.
  - 1,000,000 values: 967.1 ms mount and 952.8 ms update.
- No-series diagnostic, which retained conversion/scales/lifecycle but intentionally did not draw data:
  - 100,000 values: 13.4 ms mount and 16.7 ms update.
  - 1,000,000 values: 34.7 ms mount and 21.0 ms update.
- `leeoniya/uPlot#323`: a general Canvas-to-WebGL substitution requires custom shaders for thickness, gaps, and path semantics and is not a drop-in context replacement.
- `leeoniya/uPlot#1122`: millions of points across hundreds of series are identified as a GL-shader problem; adaptive preprocessing is recommended when exact rendering is unnecessary.
- GPUWeb implementation-status matrix and MDN WebGPU API guidance: support is substantial but not universal, secure contexts are required, and fallback remains necessary.

Affected contracts and surfaces:

- Internal renderer registration and routing, chart UI lifecycle, SDK root resource ownership, chart payload conversion, canvas mounting, resize, colors, visibility, gap semantics, `stepPlot`, pan/zoom, error/fallback behavior, test infrastructure, browser benchmark tooling, CJS/ES6 builds, Storybook, and Cloud Frontend consumption.
- The prototype must not change public package entrypoints, queries, payloads, attributes, events, chart types, or defaults.

Existing patterns to reuse:

- Phase 0 `chartLibrariesByType`, `reconcileChartLibrary`, and `replaceUI` lifecycle.
- Existing `makeChartUI`, attributes, event buses, plugins, resize observer, and renderer factory contract.
- Current Dygraphs behavior and payload helpers as the compatibility oracle.
- Existing deterministic benchmark workloads and frame-settled measurement method.
- `makeAxisTicks`, unit conversion, selectors, overlays, and interaction plugins in the production work tracked by SOW-0004 rather than recreating them inside the GPU kernel.
- Open-source shared-device, pipeline-cache, GPU-buffer, gap, thick-line, and batched-submit patterns listed below.

Risk and blast radius:

- High if enabled by default; low while the renderer is internal opt-in with tested fallback.
- A global/shared runtime can affect every chart if device ownership or loss recovery is wrong.
- Browser-only GPU behavior cannot be proven by jsdom. Real browser tests are required; no fake GPU implementation will be used to manufacture passing coverage.
- Build tooling must not require consumers to import shader assets or initialize a runtime manually.

Sensitive data handling plan:

- Use deterministic synthetic benchmark data only.
- Do not use production systems or raw private fixtures.
- Durable artifacts must contain no credentials, bearer tokens, community/customer or personal data, identifying non-private addresses, private endpoints, or proprietary incident details.

Implementation plan:

1. Remove the rejected uncommitted uPlot implementation, dependency, CSS, Jest browser shim, and registration. Preserve only renderer-neutral changes that are required by the GPU design and independently tested.
2. Adapt the task-specific comparator from `uplot` to `webgpu`; keep workloads and Dygraphs measurement identical.
3. Add regression-first tests for renderer registration, capability failure, automatic Dygraphs fallback, shared runtime ownership, mounted replacement, cleanup, and unchanged defaults. Use real SDK objects and no new Jest module mocks.
4. Implement a small shared WebGPU runtime owned per SDK root: adapter/device acquisition, canvas format, pipeline creation/cache, device-loss signal, reference-safe disposal, and buffer-byte accounting.
5. Implement the aligned Netdata line kernel:
   - precision-safe shared x offsets;
   - dimension-major `f32` y values;
   - per-series color/visibility metadata;
   - null-gap segment rejection;
   - screen-space triangle expansion for configured line width;
   - regular and step segments;
   - scale/plot uniforms;
   - one or few draw calls over all aligned series.
6. Integrate the kernel behind the chart-library factory with payload caching, resize, render, unmount, and automatic fallback. Keep axes/overlays outside the feasibility kernel and record that the benchmark proves architecture, not production visual parity.
7. Run correctness first with a software adapter if needed, then run the hard comparator on the workstation's physical GPU in real Chromium. Capture cold and warm results separately.
8. If the prototype passes, finish this SOW with evidence and create a separately approved production-renderer SOW for smooth splines and full parity. If it fails, record the blocker and remove or quarantine the prototype without changing defaults.

Validation plan:

- Pure tests for payload packing, timestamp precision, segment indexing, gaps, step geometry, colors, visibility, ranges, and buffer reuse.
- Real SDK/browser tests for routing, fallback, shared device lifecycle, resize, repeated updates, pan/zoom uniform updates, and teardown.
- Shader validation and rendered-pixel/browser checks using a real WebGPU adapter; software adapters are correctness-only.
- Identical deterministic 100 x 1,000 and 1,000 x 1,000 workloads against Dygraphs and WebGPU.
- Cold runtime initialization, prewarmed mount, synchronous update, frame-settled update, queue completion, sustained rate, main-thread metrics, heap, GPU bytes, and teardown stability.
- Focused tests, adjacent routing/lifecycle tests, full Jest with coverage, changed-file lint, repository lint baseline comparison, CJS/ES6 builds, Storybook build, and Cloud Frontend consumer validation if the prototype remains in package output.
- Search adjacent renderer factories and lifecycle paths for the same ownership/fallback failure patterns.

Artifact impact plan:

- `AGENTS.md`: update only if the prototype establishes a durable project-wide GPU or benchmark guardrail.
- Runtime project skills: replace uPlot-specific renderer guidance with proven native-GPU lifecycle and benchmark instructions if the prototype remains.
- Specs: preserve the public consumer contract; add the internal GPU renderer/fallback only if it remains a supported package capability.
- End-user/operator docs: no change for an internal opt-in prototype; production support is tracked in SOW-0004.
- End-user/operator skills: no change for the prototype; any production operation or integration impact is tracked in SOW-0004.
- SOW lifecycle: this SOW ends with a measured prototype verdict. A passing result maps full production parity to a new SOW rather than silently expanding this prototype.

Open-source reference evidence:

- `ChartGPU/ChartGPU @ 4ee780e6ecb7d8bd938fb1dccec2db00695f64e1`
  - `src/core/GPUContext.ts`
  - `src/core/PipelineCache.ts`
  - `src/core/gpu/submitBatcher.ts`
  - `src/renderers/createLineRenderer.ts`
  - `src/shaders/line.wgsl`
  - `docs/guides/multichart-dashboard-cookbook.md`
  - `benchmarks/baselines/main.json`
  - Useful patterns: shared device/pipelines, batched submission, storage-buffer line rendering, screen-space thick-line triangles, gap rejection, device loss, and disposal.
  - Limitation: its published 1M baseline uses one series with LTTB sampling and is not evidence for Netdata's exact 1,000 x 1,000 workload.
- `huww98/TimeChart @ 6d1d26c70f03a71e321a27c9bb49d2896693910b`
  - `src/plugins/lineChart.ts`
  - `src/chartZoom/mouse.ts`
  - `src/chartZoom/touch.ts`
  - `src/chartZoom/wheel.ts`
  - Useful patterns: WebGL triangle-strip thick lines, regular/step/native paths, uniform transforms, and separated interaction plugins.
  - Limitation: old beta and WebGL context model; reference only.
- `danchitnis/webgl-plot @ d518667f75c5e288782f30b92f5dc6530833c4fb`
  - `src/WebglLinePlot.ts`
  - `src/WebglLineThick.ts`
  - `src/ShadersThick.ts`
  - Useful patterns: packed multi-line buffers, partial buffer updates, and screen-space thick-line shader handling.
  - Limitation: WebGL-specific and not a complete Netdata chart contract.
- `leeoniya/uPlot @ 0e5812c504430f5c804e0f993376d8999b26cc34`
  - `README.md:3-14`
  - `src/uPlot.js`
  - Useful evidence: Canvas 2D scope and explicit recommendation to use WebGL/WebGPU when Canvas cannot keep up.

Open decisions:

- All feasibility-prototype decisions are resolved.
- Production scope, parity sequence, rollout policy, and defaulting remain design decisions for the separately tracked production-renderer SOW.

## Implications And Decisions

1. **Native engine instead of uPlot:** approved. The uncommitted uPlot renderer is rejected and will be removed; its measured failure remains evidence.
2. **WebGPU-first:** approved. WebGPU is the prototype backend; Dygraphs is the automatic unsupported/failure fallback. No WebGL backend is included in the prototype.
3. **No WASM-first design:** approved. Start with TypeScript, typed arrays, and WGSL. Add WASM only after profiling identifies a CPU bottleneck and the user approves the deployment implications.
4. **Exact feasibility workload:** approved. Draw every series and segment in the 100 x 1,000 and 1,000 x 1,000 measurements; no silent LOD or aggregation.
5. **Shared runtime:** approved. One adapter/device and shared pipelines per SDK root; do not initialize an independent device per chart.
6. **Incremental scope:** approved. Prove regular/step geometry, gaps, colors, visibility, resize, full updates, and uniform pan/zoom first. Full visual parity follows only after the architecture passes.
7. **Fallback and defaults:** approved. Keep all defaults on Dygraphs and preserve a tested automatic fallback.
8. **Performance interpretation:** initially approved as 3x/5x prewarmed frame-settled ratios with cold initialization reported separately.
9. **Sub-frame correction:** approved. At 100,000 values, one-frame presentation plus at least 3x lower synchronous/main-thread work and queue completion within the frame budget replaces the impossible frame-settled ratio. The 5x frame-settled gate remains where Dygraphs exceeds one frame.
10. **Production direction:** approved. Accept WebGPU—not WebGL or a third-party chart library—as the production renderer direction. This is not approval to default incomplete prototype charts; full parity and rollout require the next SOW.

## Plan

1. Cleanly retire uPlot work and restore a coherent GPU-focused worktree.
2. Add failing routing/fallback/runtime/data-kernel tests.
3. Implement shared WebGPU runtime and exact aligned line kernel.
4. Integrate internal opt-in renderer and deterministic comparator.
5. Validate correctness, lifecycle, builds, and physical-GPU performance.
6. Record a pass/fail verdict and map any production work to a separately approved SOW.

## Execution Log

### 2026-07-27 - Phase 0 renderer routing and lifecycle

Implemented and committed as `a0266e8a19ae`:

- Added internal `chartLibrariesByType` routing with every current type still defaulting to Dygraphs.
- Added registered-renderer resolution, fallback, parent/first-payload reconciliation, explicit switch-back, and standalone-renderer protection.
- Added lifecycle-safe `replaceUI`, preserving the mounted element, custom UI overrides, and public chart identity.
- Added `chartUIChanged`/`useChartUI` so React subscriptions move to replacement renderers.
- Kept chart-type controls visualization-oriented.

Validation:

- Focused routing/lifecycle/toolbox/default tests: 6 suites, 51 tests passed.
- Adjacent SDK/provider/line/container tests: 6 suites, 104 tests passed.
- Full suite without coverage: 152 suites passed; 1,510 tests passed and 2 skipped.
- Full coverage suite passed configured thresholds.
- Changed-file ESLint, CJS/ES6 builds, static Storybook, SOW audit, and `git diff --check` passed.
- Repository lint retained the same 36 unrelated pre-existing errors.

### 2026-07-27 - uPlot rejection evidence

- Implemented an uncommitted complete-line uPlot prototype and real-object tests to avoid rejecting the approach based on theory.
- Captured exact smooth, optimized linear, no-series, and grouped-path diagnostic runs.
- Established that Canvas series drawing prevents the approved workloads and gates from coexisting with exact current visuals.
- Rejected silent series-envelope approximation because it changed visible data.
- User approved replacing the uPlot milestone with this native GPU feasibility prototype.

### 2026-07-27 - GPU architecture research

- Verified shared-device, shared-pipeline, screen-space line expansion, gap, buffer-residency, and batched-submit patterns in current ChartGPU source.
- Verified WebGL thick-line, step, transform, touch, and wheel patterns in TimeChart and webgl-plot.
- Confirmed that available upstream benchmark claims do not prove Netdata's exact series-heavy workload; the local comparator remains authoritative.
- Local headless Chromium exposed WebGPU only with a software adapter. Physical-GPU performance must use a real headed browser session; software results cannot satisfy the gate.

### 2026-07-27 - Native WebGPU feasibility implementation

Implemented:

- Removed the rejected uPlot source, dependency, CSS, test shim, and registration.
- Added capability-aware renderer routing and a lifecycle-safe asynchronous fallback to Dygraphs.
- Added a shared WebGPU runtime per SDK with one adapter/device, cached pipeline promises, device-loss notification, reference-safe chart leases, and idle disposal.
- Added precision-safe shared x offsets, dimension-major `f32` values, NaN gap markers, packed colors/visibility, buffer reuse, uniform-only view transforms, regular/step segment layouts, and one instanced thick-line draw over all aligned series.
- Added a task-specific comparator with physical/software adapter distinction, cold runtime and pipeline warmup, synchronous/work-completion/frame-settled timing, sustained rate, browser task metrics, heap, and GPU buffer bytes.
- Added pure tests for payload packing, millisecond precision, gaps, immutability, colors, draw layouts, capability fallback, stale asynchronous failure, and default registration.

Physical-GPU evidence:

- Chromium 150 used the workstation's NVIDIA Blackwell adapter through Vulkan/Wayland. Headless SwiftShader compiled the shader but destroyed its device on the first real frame and was correctly rejected as performance evidence.
- Three physical runs consistently showed:
  - 100,000 values:
    - Dygraphs prewarmed mount: 43.5-51.4 ms frame-settled; WebGPU: 14.7-16.6 ms.
    - Dygraphs update: 11.7-14.1 ms synchronous and 16.0-16.6 ms frame-settled; WebGPU: 1.0-1.3 ms synchronous, 4.8-5.2 ms queue-complete, and 16.6 ms frame-settled.
    - WebGPU sustained 56-59 updates/second. The literal 3x frame update ratio is impossible because both paths present in one 60 Hz frame.
  - 1,000,000 values:
    - Dygraphs prewarmed mount: 309.3-339.8 ms; WebGPU: 27.2-33.3 ms, a 9.4x-12.5x frame-settled gain.
    - Dygraphs update: 105.5-138.2 ms synchronous and 127.8-176.7 ms frame-settled; WebGPU: 5.0-7.0 ms synchronous, 11.0-12.5 ms queue-complete, and 16.6-16.8 ms frame-settled, a 7.6x-10.6x frame-settled gain.
    - WebGPU sustained 55-59 updates/second versus Dygraphs 7-8 updates/second.
    - WebGPU allocated about 4.2 MiB of GPU buffers. Sampled peak heap was 70-90 MiB versus about 366 MiB for Dygraphs; post-teardown retained heap was under 1 MiB versus about 329 MiB.
  - Cold adapter/device initialization was 103-140 ms and first pipeline warmup was 26-50 ms. These costs are shareable/prewarmable and are reported separately rather than hidden in per-chart mount.
- Physical browser screenshots verified that the shader draws the expected default color, hides unselected dimensions, leaves a full two-segment gap around a null sample, and produces visibly distinct regular and stepped geometry.

Validation completed:

- Regression-first focused suite initially failed for missing packing/geometry modules, missing capability routing/fallback, missing renderer registration, and compact point-schema value extraction.
- Final focused WebGPU/routing/default suite: 5 suites and 25 tests passed.
- Full suite with coverage: 155 suites passed; 1,523 tests passed and 2 skipped; configured coverage thresholds passed.
- Changed-file ESLint passed.
- Repository ESLint reports 35 pre-existing errors; the prior integration baseline had 36, and no WebGPU or changed source file is listed.
- CommonJS and ES6 builds passed with 488 files compiled in each distribution.
- Static Storybook completed successfully; its existing missing-MDX and asset-size warnings remained non-fatal.
- The canonical physical benchmark exited zero with `passed: true`:
  - 100,000 values: 183.5x lower synchronous mount work, 10.0x lower synchronous update work, 5.4/4.6 ms mount/update queue completion, and 15.8/16.5 ms frame presentation against a measured 16.7 ms refresh interval.
  - 1,000,000 values: 14.59x frame-settled mount and 7.18x frame-settled update speedups.
- A physical device-destroy exercise replaced the mounted WebGPU UI with a live Dygraphs instance; the preview also verified two shared runtime references and rendered 2,570 non-background step/gap pixels.
- CJS/ES6 and Storybook validate package generation and browser bundling. Cloud Frontend was not modified for an internal opt-in renderer with unchanged defaults; SOW-0004 makes real Cloud Frontend validation mandatory before rollout.
- SOW audit and `git diff --check` passed.

## Validation

Acceptance criteria evidence:

- Renderer architecture, exact unsampled geometry, shared runtime, fallback, typed packing, uniform transforms, benchmark measurements, physical-GPU evidence, and unchanged defaults are implemented.
- The 1,000,000-value hard gate passes decisively.
- The corrected 100,000-value gate passes: WebGPU presents within one frame, uses 9x-14x less synchronous update work, over 100x less synchronous mount work, and completes submitted GPU work within the frame budget.

Tests or equivalent validation:

- Focused WebGPU/routing/default tests: 5 suites and 25 tests passed.
- Full Jest with coverage: 155 suites, 1,523 tests passed and 2 skipped; thresholds passed.
- Changed-file ESLint passed; repository lint retained only 35 recorded unrelated baseline errors.
- CommonJS and ES6 builds passed with 488 files each; static Storybook passed.
- Four complete physical-GPU comparator runs, canonical corrected-gate pass, regular/step/gap rendered-pixel checks, shared-runtime reference check, and real device-loss fallback completed.

Real-use evidence:

- Chromium 150 successfully acquired the NVIDIA Blackwell Vulkan adapter, compiled the WGSL pipeline, mounted repeated charts through the real SDK, alternated complete 100k/1M payload revisions, waited for GPU queue completion, presented frames, and released chart buffers.

Reviewer findings:

- Internal implementation review completed after the approved performance interpretation.
- High finding fixed: payload packing now uses shared point-schema value extraction, with a regression-first compact JSON2 test.
- Medium finding fixed: synchronous GPU runtime errors now trigger one lifecycle-safe fallback, and buffer destruction handles rejected queue completion without unhandled promises.
- Low finding fixed: rejected/gap shader vertices now use a valid offscreen homogeneous position instead of `w = 0`.
- No unresolved implementation-review findings remain. External review was not requested or authorized.

Same-failure scan:

- Capability and asynchronous fallback are implemented generically in renderer routing rather than as WebGPU checks in consumers. No WebGPU-specific React consumer branch exists.
- WebGPU payload conversion has no remaining direct value-cell coercion; it delegates scalar/object/compact-array semantics to `getPointValue`.
- GPU buffer retirement has no remaining rejection-unsafe `submission.finally()` path.
- Adjacent renderer replacement, UI subscriptions, overlays, mounted lifecycle, ordinary Dygraphs, and default routing tests pass.

Sensitive data gate:

- SOW, source, tests, screenshots, and comparator use deterministic synthetic data and contain no raw secrets, credentials, bearer tokens, community/customer or personal data, identifying non-private addresses, private endpoints, or proprietary incident details.

Artifact maintenance gate:

- `AGENTS.md`: no update required; its renderer/SOW/testing rules already cover this implementation.
- Runtime project skill: `.agents/skills/project-charts-development/SKILL.md` updated with proven WebGPU rules.
- Spec: `.agents/sow/specs/charts-public-consumer-contract.md` updated with current internal registration and fallback reality.
- End-user/operator docs and skills: no update; renderer remains internal opt-in with unchanged defaults and no operator workflow.
- SOW lifecycle: SOW-0002 closes with implementation in one commit; production work is tracked by pending SOW-0004.

Specs update:

- `.agents/sow/specs/charts-public-consumer-contract.md` records internal opt-in WebGPU registration, unchanged Dygraphs defaults, capability/runtime fallback, public time semantics, and point-schema value handling.

Project skills update:

- `.agents/skills/project-charts-development/SKILL.md` records shared WebGPU ownership, fallback, payload extraction, physical-browser validation, and GPU timing requirements.

End-user/operator docs update:

- No end-user behavior changes are authorized in this prototype.

End-user/operator skills update:

- No operator workflow changes are authorized in this prototype.

Lessons:

- Canvas library substitution does not solve series-heavy rendering when Canvas path construction/rasterization is the measured bottleneck.

Follow-up mapping:

- Production GPU renderer, smooth splines, full overlays/interactions, browser support, export, rollout, and additional visualization families are tracked in `.agents/sow/current/SOW-0004-20260727-webgpu-visualization-renderer.md`.
- WASM/workers remain excluded unless SOW-0004 profiling proves a CPU bottleneck and the user explicitly approves them.
- Density/LOD remains rejected from renderer work and would require a separately approved product mode.

## Outcome

Passed. The Netdata-native WebGPU architecture draws every exact regular/step segment without sampling, satisfies the corrected 100,000-value one-frame/main-thread gate, exceeds both 1,000,000-value 5x frame-settled gates, and preserves Dygraphs as the unchanged default and tested fallback.

The prototype remains internal opt-in and is not production visually complete. The accepted direction and remaining production work are tracked in SOW-0004.

## Lessons Extracted

- Once Canvas path construction/rasterization dominates, switching Canvas chart libraries cannot deliver the required series-heavy gains; the raster backend must change.
- Frame-settled ratios stop measuring renderer speed when both candidates complete before the same display refresh. Queue completion and synchronous work are the correct secondary gates there.
- Netdata's aligned timestamps permit one shared x buffer, dimension-major y storage, and one instanced draw across all series.
- Epoch-relative x offsets preserve millisecond precision in `f32`; raw epoch milliseconds do not.
- Browser-reported command submission is not completion. Physical-GPU evidence must include queue completion and frame presentation, while cold runtime/pipeline costs remain separate.
- Device loss and asynchronous initialization failure must use the same mounted UI replacement path as ordinary renderer routing.

## Followup

Production parity and rollout are tracked in `.agents/sow/current/SOW-0004-20260727-webgpu-visualization-renderer.md`.

## Regression Log

None yet.
