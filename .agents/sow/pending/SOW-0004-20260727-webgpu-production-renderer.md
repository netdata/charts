# SOW-0004 - Production WebGPU Time-Series Renderer

## Status

Status: open

Sub-state: WebGPU direction approved after the feasibility prototype passed. Production design and rollout decisions must be resolved before implementation.

## Requirements

### Purpose

Deliver a production-quality Netdata-native WebGPU time-series renderer that preserves Netdata's public, payload, visual, interaction, lifecycle, and consumer contracts while making high-cardinality charts materially faster. Dygraphs remains supported as the compatibility and runtime-failure fallback.

### User Request

Proceed with WebGPU as the renderer direction after the native feasibility prototype proved exact 100,000-value one-frame rendering and more than 5x frame-settled gains at 1,000,000 values. Do not confuse the benchmark's one-frame acceptance rule with runtime renderer selection.

### Assistant Understanding

Facts:

- SOW-0002 proves the exact unsampled regular/step GPU kernel, shared runtime, payload packing, lifecycle fallback, device-loss recovery, and physical-GPU performance architecture.
- WebGPU is a low-level browser GPU API, not a chart library. Netdata continues to own chart semantics and UI.
- The feasibility prototype is internal opt-in; every default renderer mapping remains Dygraphs.
- Full production parity is not yet implemented for smooth splines, stacking/area, axes, overlays, complete interactions, exports, multi-chart batching, or the supported browser/device matrix.
- Public payloads, queries, attributes, events, timestamps, chart types, and visuals must remain compatible.

Inferences:

- Production work should extend the narrow proven renderer rather than introduce a general-purpose chart abstraction.
- Shared runtime and pipeline prewarming should happen at SDK/page scope so first-chart initialization is not repeated.
- Rollout should be capability- and feature-based, never switch to Dygraphs merely because a GPU frame exceeds one refresh interval.

Unknowns:

- The exact first production chart-family tranche and parity sequence.
- Browser/platform support policy and validation matrix.
- Rollout/defaulting policy after parity is proven.
- Export strategy and whether unsupported export modes temporarily use Dygraphs.
- Whether profiling will justify workers or WASM for any CPU-side kernel.

### Acceptance Criteria

- Approved production scope has exact visual and interaction parity against Dygraphs for every enabled chart type and state.
- WebGPU is preferred only for approved eligible chart types after capability and feature checks; Dygraphs remains installed and automatically handles unsupported capability/features, initialization/pipeline failure, and device loss.
- Runtime routing never benchmarks renderers dynamically and never falls back solely because WebGPU requires more than one display frame.
- Shared device/pipelines, prewarming, persistent buffers, multi-chart ownership, virtualization, resize, teardown, and device-loss recovery are validated without leaks or blank charts.
- Existing payload/query/public timestamp contracts remain unchanged; compact point-schema values, null gaps, visibility, colors, corrected history, and full updates retain exact semantics.
- Approved regular, step, smooth, stacked/area, sparkline, axes, overlays, hover, pan, zoom, selection, touch, annotations, alerts, anomalies, and export behavior are validated according to the chosen tranche.
- Performance tests retain exact unsampled 100,000/1,000,000-value gates and add representative multi-chart, interaction, repeated-update, and teardown stability evidence without generalized production instrumentation.
- CJS/ES6 builds, full tests with coverage, repository lint baseline, Storybook, physical browsers, and Cloud Frontend consumption pass before any default switch.
- No worker, SharedArrayBuffer, WASM, payload protocol change, silent LOD, aggregation, or approximation is introduced without profiling evidence and explicit approval.

## Analysis

Sources checked:

- `.agents/sow/done/SOW-0002-20260727-native-gpu-renderer-prototype.md` after SOW-0002 closes.
- `.agents/sow/specs/charts-public-consumer-contract.md`.
- `src/chartLibraries/webgpu/`, `src/chartLibraries/dygraph/`, `src/components/line/`, `src/sdk/`, and `benchmarks/time-series-renderers/`.
- Current official W3C WebGPU and browser implementation guidance.
- Proven open-source references recorded in SOW-0002.

Current state:

- Phase 0 renderer routing is committed at `a0266e8a19ae`.
- The accepted feasibility implementation will close with SOW-0002.
- Dygraphs is the default for all chart types; WebGPU is registered only as internal opt-in.

Risks:

- Defaulting before complete parity can silently change visuals or interactions.
- WebGPU support varies by browser, operating system, device, driver, VM, and security policy.
- Cold device/pipeline startup, device loss, resource ownership, and many simultaneous charts can create latency, blanks, or GPU-memory leaks.
- Smooth, stacked, area, overlays, hit-testing, and export semantics can erase the prototype's performance gains if implemented through per-frame CPU reconstruction.
- Exact visual parity may expose Dygraphs behavior that is accidental but publicly relied upon.

## Pre-Implementation Gate

Status: needs-user-decision

Problem / root-cause model:

- GPU rasterization is proven; production risk now lies in parity, lifecycle breadth, browser support, integration, and rollout rather than raw line throughput.

Evidence reviewed:

- SOW-0002 physical-GPU benchmark, rendered-pixel, device-loss, tests, builds, and review evidence.
- Current Charts public-consumer contract and default routing.

Affected contracts and surfaces:

- All line-family visuals and interactions, SDK renderer lifecycle, shared GPU resources, payload conversion, browser support, exports, Storybook, package distributions, and Cloud Frontend consumption.

Existing patterns to reuse:

- Accepted WebGPU runtime/kernel and benchmark.
- Renderer-neutral UI geometry, `useChartUI`, `chartLibrariesByType`, UI replacement/fallback, existing Netdata ticks/units/legend/overlays/plugins, and Dygraphs as compatibility oracle.

Risk and blast radius:

- Low while opt-in; high once enabled by default. Rollout and defaulting must be separate verified milestones.

Sensitive data handling plan:

- Use deterministic synthetic or sanitized fixtures only. Durable artifacts must contain no raw secrets, credentials, bearer tokens, community/customer or personal data, identifying non-private addresses, private endpoints, or proprietary incident details.

Implementation plan:

1. Investigate and approve the exact production tranche, parity matrix, browser matrix, export behavior, prewarming, rollout, and performance gates.
2. Build parity incrementally behind opt-in routing with regression-first tests and real-browser visual/interaction evidence.
3. Validate package and Cloud Frontend integration before proposing any default switch.
4. Enable WebGPU only for the approved eligible surfaces; retain tested capability, feature, initialization, pipeline, and device-loss fallback.

Validation plan:

- Pure geometry/data tests; real SDK/component tests without new Jest mocks; rendered-pixel and interaction tests on physical WebGPU browsers; fallback/device-loss tests; deterministic performance and memory tests; CJS/ES6, Storybook, and Cloud Frontend builds.
- Compare every enabled state against Dygraphs and scan adjacent chart types for the same failure class.

Artifact impact plan:

- AGENTS.md: update only for durable project-wide rules not already covered by runtime skills.
- Runtime project skills: update proven production renderer, browser, parity, and rollout workflow.
- Specs: update supported renderer/default/fallback reality at each rollout milestone.
- End-user/operator docs: update only if consumers or users gain configurable behavior.
- End-user/operator skills: update only if operation or integration changes.
- SOW lifecycle: promote this file to `current/` only after SOW-0002 closes and production design decisions are approved.

Open-source reference evidence:

- Reuse the commit-pinned ChartGPU, TimeChart, webgl-plot, and uPlot references recorded in SOW-0002; refresh upstream sources during production analysis before relying on changed behavior.

Open decisions:

1. First production chart-family tranche and required parity states.
2. Supported browser/device matrix and fallback policy for feature-specific gaps.
3. Shared-runtime prewarming point and multi-chart submission strategy.
4. Export behavior during incremental parity.
5. Opt-in, staged rollout, and eventual defaulting criteria.
6. Production performance, memory, stability, and visual-diff gates beyond the feasibility workloads.

## Implications And Decisions

1. **WebGPU direction:** approved. Build the production renderer on WebGPU, not WebGL or a third-party chart library.
2. **Runtime fallback meaning:** approved. Fallback is for capability, unsupported feature, initialization/pipeline failure, or device loss—not a one-frame performance threshold.
3. **Current default:** approved. Dygraphs remains default until the production SOW proves and receives approval for a rollout milestone.
4. **No silent approximation:** retained. Exact rendering remains mandatory unless a separate explicit product mode is designed and approved.
5. Remaining production decisions are unresolved and block implementation.

## Plan

1. Complete SOW-0002 and establish its accepted commit as the production base.
2. Perform production parity and browser-matrix analysis.
3. Present numbered design options and recommendations.
4. Implement only the approved tranche, then validate before expanding or defaulting.

## Execution Log

### 2026-07-27

- Created as the real tracked follow-up after the user accepted WebGPU feasibility and direction.

## Validation

Acceptance criteria evidence:

- Pending approved implementation.

Tests or equivalent validation:

- Pending.

Real-use evidence:

- Pending.

Reviewer findings:

- Pending.

Same-failure scan:

- Pending.

Sensitive data gate:

- The SOW contains no raw secrets, credentials, bearer tokens, community/customer or personal data, identifying non-private addresses, private endpoints, or proprietary incident details.

Artifact maintenance gate:

- Pending implementation.

Specs update:

- Pending implementation.

Project skills update:

- Pending implementation.

End-user/operator docs update:

- Pending design and rollout impact.

End-user/operator skills update:

- Pending design and rollout impact.

Lessons:

- Pending.

Follow-up mapping:

- Production parity, broader browser support, exports, and rollout from SOW-0002 are tracked here.

## Outcome

Pending.

## Lessons Extracted

Pending.

## Followup

None yet.

## Regression Log

None yet.

Append regression entries here only after this SOW was completed or closed and later testing or use found broken behavior. Use a dated `## Regression - YYYY-MM-DD` heading at the end of the file. Never prepend regression content above the original SOW narrative.
