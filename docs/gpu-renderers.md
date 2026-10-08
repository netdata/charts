# GPU renderer architecture

## Purpose

The GPU engine accelerates deterministic chart pixels without changing the chart API, React component tree, payload semantics, interactions, or public chart identity. WebGPU is preferred internally, WebGL2 is the accelerated compatibility backend, and each visualization's existing implementation is the final fallback.

GPU rendering remains disabled by default while browser and device validation is incomplete.

## Consumer contract

Rendering backend selection is private:

- `chartLibrary` retains its established value such as `dygraph`, `gauge`, `d3pie`, or `easypiechart`.
- A caller renders the same React component regardless of the active backend.
- Backend initialization, replacement, loss, and fallback never require caller dispatch or subscription.
- `ChartContainer` follows internal `chartUIChanged` events and remounts the replacement adapter on the existing element.
- Payloads, timestamps, chart types, attributes, events, exports, and interactions retain their existing meaning.

`makeDefaultSDK({ acceleratedRendering: true })` is the temporary rollout-level opt-in. It expresses a policy, not a backend choice. Backend forcing through `rendererPolicy` exists for tests and benchmark isolation and is not a consumer API.

## Code map

```text
src/chartLibraries/gpu/
  engine/                 shared renderer lifecycle
  text/                   browser-shaped text and bounded cache policy
  visualizations/         backend-neutral data, geometry, axes, interactions

src/chartLibraries/webgpu/
  engine/                 device, pipeline, shared-resource, surface ownership
  primitives/             WebGPU rectangle and circle layers
  text/                   shared WebGPU text atlas and sprite layer
  visualizations/         WebGPU resources, kernels, and WGSL

src/chartLibraries/webgl2/
  engine/                 shared context, programs, resources, surfaces, uniforms
  primitives/             WebGL2 primitive layers
  text/                   runtime-shared WebGL2 text atlas and sprite layer
  visualizations/         WebGL2 resources, kernels, and GLSL

src/sdk/makeChart/renderers/
  metadata.js             canonical visualization/public/legacy metadata
  makeController.js       private selection, active state, fallback, replacement
```

The neutral `gpu` layer must not import either backend. Backends must not import one another. Existing renderers must not depend on GPU code.

## Ownership

- One chart owns one visible canvas while an accelerated backend is active.
- One SDK owns the shared WebGPU runtime and one shared WebGL2 context.
- Runtime resources such as pipelines, programs, and text atlases are destroyed by the runtime after its idle lease expires.
- Per-chart surfaces, textures, buffers, and layers are destroyed by the chart adapter.
- Asynchronous initialization is generation-checked so an unmounted chart cannot attach late resources.
- A stale React container unmounts an adapter only when that adapter still owns the same DOM element.

WebGPU presents directly to the visible canvas. WebGL2 renders through the SDK-owned shared context and copies the completed frame to the chart's visible Canvas2D surface.

## Renderer contract

A backend registry maps a semantic visualization ID to a visualization factory. The shared renderer lifecycle expects the visualization to provide:

- `mount({ render, canvas })`
- `unmount()`
- `createResources(runtime, canvas)`
- `attachResources(resources)`
- `render({ width, height, dpr })`

Optional geometry, queue, resource, and draw-stat methods are forwarded by the renderer adapter. Backend resources expose `destroy()` and backend-specific drawing methods consumed only by their surface.

## Fallback

The private chain is:

```text
WebGPU -> WebGL2 -> visualization-specific legacy implementation
```

Fallback is allowed only for unsupported capability/configuration, initialization or shader/pipeline failure, uncaptured GPU errors, device loss, context loss, or rendering failure. Frame duration never changes the backend.

A fallback replaces only the package-owned chart UI. Public `chartLibrary`, visualization identity, and the caller's React component remain unchanged.

Optional diagnostics are available through `chart.getRendererState()` and `sdk.getRendererDiagnostics()`. They are for debugging and validation; rendering must never depend on a consumer reading them.

## Adding a visualization

1. Add or verify its canonical metadata in `sdk/makeChart/renderers/metadata.js`.
2. Implement exact backend-neutral data, frame, interaction, range, and visual semantics under `chartLibraries/gpu/visualizations/`.
3. Add backend resource factories, kernels, and shaders independently to WebGPU and WebGL2.
4. Register the visualization in both backend registries only after each backend is complete.
5. Add pure model tests without mocks.
6. Add real-browser rendering, export, lifecycle, and fallback validation.
7. Add the visualization to the deterministic Storybook renderer gallery.
8. Validate the installed package against unmodified consumer source.

Do not add speculative primitives or empty adapters. Do not sample, aggregate, or approximate source data.

## Validation

Every change to the GPU engine must pass:

- Jest and repository-configured ESLint
- CommonJS and ES6 builds
- Storybook, including the renderer gallery
- headless real-browser WebGL2 correctness for every visualization
- physical WebGPU and WebGL2 parity, export, update, multi-chart, teardown, and forced-loss checks
- unmodified Cloud Frontend build and installed-dashboard testing

`benchmarks/time-series-renderers/` owns browser correctness and physical performance evidence. Software adapters provide correctness evidence only; physical adapters are mandatory for performance claims.
