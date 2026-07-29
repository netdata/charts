---
name: project-charts-development
description: "Mandatory Charts architecture and compatibility workflow when changing SDK nodes, chart attributes, plugins, chart libraries/renderers, React chart components, package entrypoints, or consuming integration surfaces. Use before editing those areas or claiming public compatibility is preserved."
---
# Charts Development

## Purpose

Preserve the package's public consumer contract and attribute-driven architecture while changing internal chart behavior or rendering code.

## Scope

Use this skill when:

- changing `src/sdk/`, `src/makeDefaultSDK.js`, or SDK plugins;
- changing `src/chartLibraries/`, renderer selection, overlays, hover, pan, selection, or chart lifecycle;
- changing chart-aware React components, providers, hooks, attributes, package entrypoints, or distribution shape;
- claiming Cloud Frontend or another consumer remains compatible.

Do not use this skill for:

- isolated formatting-only edits;
- test mechanics without production architecture changes; use `project-testing`;
- netdata-ui component/theme API review; also load `project-netdata-ui`.

## Mandatory Knowledge

- `src/index.js` is a browser auto-mount entrypoint, not a named-export package barrel. Existing consumers use source-shaped deep paths under `dist/`. Evidence: `src/index.js`, `package.json`, `.agents/sow/specs/charts-public-consumer-contract.md`.
- `makeDefaultSDK` is the consumer factory. It registers the default chart libraries and the ordered plugin set ending with `fullscreen`. Evidence: `src/makeDefaultSDK.js`.
- Persistent chart state belongs in chart attributes so it survives virtualization and drives provider subscriptions. Read with `useAttributeValue`; do not duplicate persistent state in React `useState`. Evidence: `src/components/provider/selectors.js`, `AGENTS.md`.
- Public SDK, component, attribute, event, chart-type, payload, and query behavior are compatibility surfaces even when implementation modules are deep imports. Evidence: `.agents/sow/specs/charts-public-consumer-contract.md`.
- Renderer-specific behavior belongs behind chart-library/SDK seams. Do not spread renderer checks through unrelated React consumers. Evidence: `src/chartLibraries/`, `src/sdk/`, `.agents/sow/done/SOW-0002-20260727-native-gpu-renderer-prototype.md`.
- Visualization identity and active renderer are separate. New internal routing uses `chartRenderersByVisualization`; `chartLibrariesByType` remains the time-series compatibility map. Consumers dispatch through `chart.getVisualizationType()` and `chart.isTimeSeriesRenderer()`, never renderer-name branches. Unavailable mappings fall back to each visualization's legacy renderer. Renderer replacement must use the chart UI replacement lifecycle rather than unmounting and assigning a UI directly. Evidence: `src/sdk/makeChart/filters/makeControllers.js`, `src/sdk/makeChart/index.js`.
- GPU Line, Area, Multi Column, Stacked, Stacked Bar, Heatmap, and EasyPie/Circle backends are opt-in and resolve as `WebGPU -> WebGL2 -> the visualization's legacy renderer`. WebGPU shares one adapter/device and pipeline cache per SDK; WebGL2 shares one context/program cache per SDK. Capability, unsupported-visualization, initialization/pipeline/render, uncaptured device-error, device/context loss, and stale runtime failures must advance to the next supported backend without leaving a blank canvas. Evidence: `src/chartLibraries/{webgpu,webgl2}/`, `src/sdk/makeChart/filters/makeControllers.js`.
- Shared GPU visualizations own one visible canvas for deterministic pixels and keep semantic legend/toolbox/menu/popover/value/unit surfaces in DOM. Cartesian adapters preserve exact line/area/stack/bar/heatmap payload, ordering, gap, axis, hover, and raster contracts. Heatmap uses public `payload.all`, row-major cells, categorical bucket ranks, and backend-specific analytic cell shaders. EasyPie is the first radial adapter: one analytic draw preserves signed round-capped progress, track, 24 scale ticks, sizing, and colors while its value/unit text remains React DOM. WebGPU draws directly; WebGL2 renders on the shared context and copies the completed exact frame to the visible chart canvas to avoid per-chart context limits. Browser-shaped complete strings use shared Canvas2D shaping and backend-owned bounded atlases. Evidence: `src/chartLibraries/gpu/`, `src/chartLibraries/{webgpu,webgl2}/`.
- Draw shaped atlas strings at their exact integer physical-pixel allocation and snap origins to physical pixels; fractional CSS-size-times-DPR quads blur text through texture resampling. GPU canvases resize immediately through their backend-neutral observer rather than the legacy 200 ms Dygraphs path. Shared GLSL programs must update every uniform with its declared type and arity—stale uniforms leak the previous chart's dimensions across the shared context. Evidence: `src/chartLibraries/gpu/{text,resize.js}`, `src/chartLibraries/webgl2/engine/makeInstancedLayer.js`.
- Payload cells may be scalars, objects, or compact JSON2 arrays described by `payload.point`. Renderer conversion must use the shared point-value semantics rather than coercing cells directly. Evidence: `src/sdk/makeChart/getPointValue.js`, `src/chartLibraries/gpu/visualizations/cartesian/line/data.js`.
- React code that subscribes to chart-UI events must use `useChartUI`; reading `chart.getUI()` once leaves the component subscribed to a destroyed renderer after replacement. Evidence: `src/components/provider/selectors.js`, `src/components/chartContainer.js`.
- The package builds CJS and ES6 distributions. There is no current UMD build script. Evidence: `package.json`.

## Best Practices

- Reuse existing SDK node, attribute, plugin, provider, helper, and chart-library patterns before introducing another abstraction.
- Keep algorithmic work in small pure helpers when it can be tested independently from chart lifecycle and DOM rendering.
- Keep consumers thin: derive state through chart/provider APIs and keep engine-specific behavior inside renderer-facing modules.
- Preserve unsubscribe and destruction paths whenever listeners, timers, observers, SDK nodes, chart UIs, GPU buffers, textures, or device resources are added.
- Report raw data ranges—not display-padded domains—through `yAxisChange`; feeding padded ranges back into unit conversion recursively expands the range and can force renderer fallback.
- Preserve the public chart object and custom `options.ui` overrides when constructing a replacement renderer.
- Validate behavior through both the source package and a real consuming path when a public/deep-import contract changes.
- For GPU measurements, distinguish synchronous submission, queue completion, and frame presentation; prewarm shared runtime/pipelines and report cold startup separately. Software adapters validate correctness only.
- Use short comments only for non-obvious reasons; do not narrate what the code visibly does.

## Bad Practices

- Do not add named imports from `@netdata/charts` without first changing and validating the package entrypoint contract; the current root entry auto-mounts charts.
- Do not store virtualization-persistent UI/data/loading state only in React component state.
- Do not scatter checks such as `if (chartLibrary === ...)` through consumer components when the chart-library seam can own the behavior.
- Do not change payload or query semantics as a side effect of renderer work.
- Do not remove Dygraphs or the fallback path while introducing an internal renderer.
- Do not add dynamic `require()` or body-level imports; project source uses top-level ES imports.

## Workflow Checklist

1. Read the active SOW, relevant spec, and adjacent tests before editing.
2. Identify the affected consumer contract: package path, SDK method, attribute, event, payload, React component, or visible behavior.
3. Find the existing architecture seam and the nearest analogous implementation.
4. Record compatibility, lifecycle, performance, and fallback risks in the active SOW.
5. Make the smallest source change that keeps consumers and unrelated chart types stable.
6. Add behavioral tests using the real chart/provider path.
7. Run focused tests, then the full suite/build when dependencies are available.
8. Exercise Cloud Frontend or Storybook when the change is visual or consumer-facing.
9. Update the consumer-contract spec and affected output/reference skills if the public surface changed.

## Validation Checklist

Before claiming done:

- Focused behavioral tests cover the changed SDK/renderer/component path.
- Listener/timer/observer/chart-node cleanup is exercised where applicable.
- GPU resource sharing, buffer release, runtime failure, export, shared-runtime multi-chart teardown, and device/context-loss fallback are exercised in real browsers when GPU backend code changes.
- Unrelated chart libraries and ordinary charts retain their behavior.
- `yarn test`, `yarn build`, and scoped/repo lint results are recorded accurately when dependencies are available.
- Visual changes are checked in Storybook and in light/dark themes; consuming integration is checked when public behavior is affected.
- The same contract or failure pattern is searched in adjacent chart types and consumers.
- Specs, project skills, and consumer guidance are updated or an evidence-backed reason is recorded.

## Evidence

- `package.json`: package outputs, scripts, and peer contracts.
- `src/index.js`: root auto-mount behavior.
- `src/makeDefaultSDK.js`: default libraries, plugins, and root attributes.
- `src/sdk/`: node, attribute, plugin, and chart lifecycle architecture.
- `src/chartLibraries/gpu/`: backend-neutral exact Cartesian and radial visualizations, payload/range indexing, axes, overlays, interactions, color, and text shaping.
- `src/chartLibraries/webgpu/` and `src/chartLibraries/webgl2/`: backend-specific runtimes, resources, shaders, presentation, and failure handling.
- `benchmarks/time-series-renderers/`: deterministic physical-GPU comparator and production gates.
- `src/components/provider/selectors.js`: reactive attribute/provider hooks.
- `.agents/sow/specs/charts-public-consumer-contract.md`: current consumer contract.
- `netdata/cloud-frontend @ bf2ba8182cff`: verified deep-import consumption and SDK provider integration.

## Update Rules

Update this skill when:

- package entrypoints, supported distributions, default libraries/plugins, or public consumer patterns change;
- a renderer or lifecycle regression exposes a missing workflow check;
- a reviewer or user establishes a new Charts architecture rule;
- Native GPU renderer work establishes a reusable lifecycle, fallback, or benchmark workflow.
