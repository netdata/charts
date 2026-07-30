# Charts Public And Consumer Contract

## Purpose

Record the current package behavior that source changes must preserve for `@netdata/charts` consumers. This spec describes current reality; proposed migrations belong in SOWs.

## Package Shape

- Package name: `@netdata/charts`.
- `main` resolves to `dist/index.js`.
- `module` resolves to `dist/es6/index.js`.
- Published files are under `dist/`.
- The build produces CommonJS and ES6 module trees through `build:cjs` and `build:es6`.
- There is no current UMD build script or UMD distribution contract.
- There is no `exports` map.

Evidence: `package.json`, `babel.config.js`.

## Root Entrypoint And Imports

`src/index.js` is a browser auto-mount entrypoint. On `DOMContentLoaded`, it creates the default SDK, parses chart declarations from the DOM, and mounts chart nodes. It does not re-export named React components, hooks, SDK helpers, or chart libraries.

Consequences:

- Consumers must not assume `import { Line } from "@netdata/charts"` works.
- Existing consumers import source-shaped modules through deep paths under `@netdata/charts/dist/...`.
- Those deep paths are a de facto compatibility surface because the package has no dedicated public barrel or `exports` map.
- Changing source paths, default/named exports, or generated file layout requires consuming-repository validation and corresponding consumer guidance updates.

Evidence:

- `src/index.js`
- `netdata/cloud-frontend @ bf2ba8182cff`
  - verified use of deep imports under `@netdata/charts/dist/`.

## Peer Contract

Consumers provide:

- `@netdata/netdata-ui >=5.4.17`
- `react >=18.2.0`
- `react-dom >=18.2.0`
- `styled-components >=5.3.9`

The development environment currently uses React 19 and styled-components 6, but the package peer contract remains the ranges above.

Evidence: `package.json`.

## SDK Model

The package has three cooperating layers:

1. SDK root: owns global attributes, node hierarchy, registered chart libraries, registered plugins, and shared events.
2. Chart instance: an SDK node with chart-scoped attributes, data fetching, payload/dimension helpers, lifecycle, and events.
3. React presentation: chart components and provider hooks that subscribe to a chart instance.

`makeDefaultSDK` is the consumer-facing configured factory. It currently registers these chart libraries:

- `dygraph`
- `webgpu`
- `webgl2`
- `easypiechart`
- `gauge`
- `groupBoxes`
- `number`
- `d3pie`
- `bars`
- `table`

`webgpu` and `webgl2` are internal opt-in visualization renderers. No default renderer map selects either one. They currently implement ordinary `line`, unstacked `area`, grouped `multiBar`, diverging `stacked`, and `stackedBar` through one shared visualization/data/interaction model. Area adds exact per-pair baseline trapezoids in reverse fill order before straight/step strokes. Stacked builds independent positive/negative base/end bands in reverse dimension order and resolves hover against the signed band under the pointer. Multi Column draws zero-baseline bars with the legacy visible-series grouping, first-pair width, historical overlap offsets, opaque fill, and subpixel border. Stacked Bar reuses exact diverging bands and draws one centered bar per finite source value with its legacy pixel-snapped width, opaque fill, and subpixel border. Null gaps discard touching line/fill pairs and omit null bars. When WebGPU is preferred, unsupported capability/visualization or initialization/pipeline/render/device failure resolves through WebGL2 when available, then the visualization's legacy renderer. WebGL2 initialization/render/context-loss failure resolves to the legacy renderer. Registration does not make either GPU backend a default or claim parity for other visualization families.

It registers these plugins in order:

1. `move`
2. `hover`
3. `pan`
4. `highlight`
5. `select`
6. `selectVertical`
7. `play`
8. `annotationSync`
9. `fullscreen`

Default root attributes include:

- `_v: "v3"`
- `chartLibrary: "dygraph"`
- `navigation: "pan"`
- `after: -900`
- `overlays.proceeded.type: "proceeded"`

Evidence: `src/makeDefaultSDK.js`, `src/sdk/`.

## Attribute And State Contract

- Chart and root attributes are the durable state mechanism for SDK behavior and React subscriptions.
- `chart.updateAttribute` and `chart.updateAttributes` are the normal mutation paths.
- Provider hooks such as `useAttributeValue` subscribe to attribute changes and re-render consumers.
- State that must survive component unmount/remount or virtualization belongs in chart attributes rather than component-local React state.
- Event, listener, activation, deactivation, fetch, render, and destruction behavior are lifecycle contracts; changes require cleanup and remount validation.
- Visualization identity is independent of the active renderer. `chart.getVisualizationType()` may expose semantic visualization identity, but consumers must never need the active backend to select or keep a React component mounted.
- Public `chartLibrary` retains its established consumer/component identity and must never change to `webgpu` or `webgl2`. Requested and active backend, health, fallback reason, and recovery state are private renderer-controller state rather than public chart attributes.
- Backend preference is SDK-internal rollout/test policy. Existing defaults and unavailable accelerated backends resolve to each visualization's legacy implementation without changing consumer dispatch.
- A renderer may declare visualization/capability support and a private fallback backend. Routing resolves the supported chain before construction, and runtime fallback replaces only the package-owned mounted chart UI. The accelerated chain is `WebGPU -> WebGL2 -> visualization-specific legacy`; each backend may be skipped or lost without changing public `chartLibrary`, visualization identity, or the caller's React tree.
- Renderer reconciliation happens after parent attributes are inherited and after the first payload supplies `chartType`. User-facing chart-type controls and consuming React dispatch retain their established contract and do not use internal renderer names.
- Replacing a mounted chart UI preserves its DOM mount, custom UI overrides, chart identity, and renderer-bound package subscriptions. The package-owned `ChartContainer` follows `chartUIChanged`; external consumers are not required to subscribe to renderer replacement.

Evidence: `src/sdk/`, `src/components/provider/`, `src/components/chartContainer.js`, `AGENTS.md`.

## Data And Time Contract

- Existing payload and query semantics are compatibility surfaces.
- SDK `after` and `before` values use Unix seconds. Negative `after` values represent relative windows; payload row timestamps use Unix milliseconds.
- Data cells may be scalar values, objects, or compact JSON2 arrays indexed through the payload's `point` schema. Renderers must preserve the value extraction semantics in `src/sdk/makeChart/getPointValue.js`.
- Dimension identifiers, order, visibility, values, units, nulls, gaps, and corrected-history behavior affect renderers and consumers.
- Renderer changes must not silently alter API requests, payload interpretation, dimension selection, or synchronization behavior.

Evidence: `src/sdk/makeChart/`, `src/sdk/plugins/`, `.agents/sow/done/SOW-0002-20260727-native-gpu-renderer-prototype.md`.

## Visual And Interaction Contract

Publicly observable behavior includes:

- chart values, dimensions, ordering, colors, units, ranges, nulls, and gaps;
- live updates and corrected history;
- visibility, focus, legend, filter, and dimension controls;
- synchronized hover, pan, zoom, selection, reset, touch, click, and keyboard behavior;
- alerts, anomalies, annotations, overlays, tooltips, and crosshairs;
- time zones, unit conversion, stacking, diverging values, and heatmap behavior;
- loading, empty, error, pause/play, remount, and destruction states.

An internal renderer change does not permit a visible or consumer-facing contract change unless a SOW explicitly defines and validates that change.

The opt-in GPU Line, Area, Multi Column, Stacked, and Stacked Bar renderers own one visible plot canvas per chart for grid, axes, browser-shaped text, series, gap markers, data decorations, renderer overlays, crosshairs, and selections. WebGPU renders directly to that canvas. WebGL2 renders through one SDK-owned shared context/program cache and copies the exact completed frame to the chart's visible canvas, avoiding per-chart WebGL context limits. Existing semantic and interactive React surfaces—including legend, toolbox, menus, processing state, and popovers—remain DOM-owned. This placement is internal and does not change payloads, public attributes, events, exports, consumer component selection, or require consumer awareness of backend selection and fallback.

## Distribution And Consumer Validation

When a change affects package shape, deep imports, SDK defaults, attributes, components, hooks, or visible behavior:

1. Build both CJS and ES6 outputs.
2. Verify the generated path/export shape.
3. Run focused and full Charts tests.
4. Copy the built package into a real Cloud Frontend checkout with `yarn to-cloud` when integration is required.
5. Build or run the consuming application and exercise the affected path.
6. Update affected consumer/reference skills in the consuming repository or record why they remain accurate.

## Source Authority

Current Charts source and package configuration are authoritative. Consumer skills and examples are useful evidence but may lag behind source. If they disagree:

1. verify source and real consumer usage;
2. record the discrepancy in the active SOW;
3. fix the owning artifact in the same work when it is in scope, or create a real tracked follow-up;
4. never copy stale consumer guidance back into source-project rules unchanged.

## Update Triggers

Update this spec when any of these change:

- package entrypoints, exports map, published files, or distribution formats;
- peer dependency support;
- default chart libraries, plugins, or root attributes;
- public/de facto deep-import paths or export shapes;
- SDK/chart attribute, event, lifecycle, payload, query, time, or interaction semantics;
- supported renderers or fallback guarantees;
- consumer integration requirements.
