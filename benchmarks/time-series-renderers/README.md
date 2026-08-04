# Time-series renderer benchmark

This task-specific comparator measures legacy renderers and selected production GPU backends from the same checkout with identical deterministic Cartesian and radial data. It covers Line, Area, Multi Column, diverging Stacked, Stacked Bar, Heatmap, EasyPie/Circle, Gauge, and D3 Pie. WebGPU is preferred; WebGL2 is the accelerated compatibility fallback.

## Run

Prerequisites:

- Chromium at `/usr/bin/chromium`, or set `CHROMIUM_EXECUTABLE`.
- The pinned `playwright-core` development dependency installed with `yarn install`.
- A physical WebGPU adapter for performance results.

```bash
BENCHMARK_HEADED=1 yarn benchmark:time-series
```

When Chromium needs a particular Linux display backend to expose the hardware adapter:

```bash
BENCHMARK_HEADED=1 CHROMIUM_OZONE_PLATFORM=wayland yarn benchmark:time-series
```

Evaluate WebGL2 on the browser's normal physical graphics path:

```bash
BENCHMARK_HEADED=1 BENCHMARK_RENDERERS=webgl2 yarn benchmark:time-series
```

Compare both GPU candidates in one browser run. The harness keeps one context, one window, and the same page for the entire suite; resets navigate that page without closing or replacing it:

```bash
BENCHMARK_HEADED=1 BENCHMARK_RENDERERS=webgpu,webgl2 \
  CHROMIUM_OZONE_PLATFORM=wayland yarn benchmark:time-series
```

Measure Area, Multi Column, Stacked, or Stacked Bar against Dygraphs while retaining all implemented visualization correctness checks:

```bash
BENCHMARK_HEADED=1 BENCHMARK_VISUALIZATION=area \
  BENCHMARK_RENDERERS=webgpu,webgl2 CHROMIUM_OZONE_PLATFORM=wayland \
  yarn benchmark:time-series

BENCHMARK_HEADED=1 BENCHMARK_VISUALIZATION=multiBar \
  BENCHMARK_RENDERERS=webgpu,webgl2 CHROMIUM_OZONE_PLATFORM=wayland \
  yarn benchmark:time-series

BENCHMARK_HEADED=1 BENCHMARK_VISUALIZATION=stacked \
  BENCHMARK_RENDERERS=webgpu,webgl2 CHROMIUM_OZONE_PLATFORM=wayland \
  yarn benchmark:time-series

BENCHMARK_HEADED=1 BENCHMARK_VISUALIZATION=stackedBar \
  BENCHMARK_RENDERERS=webgpu,webgl2 CHROMIUM_OZONE_PLATFORM=wayland \
  yarn benchmark:time-series
```

Run only radial parity and fallback checks, without Cartesian performance workloads:

```bash
BENCHMARK_HEADED=1 BENCHMARK_RADIAL_ONLY=1 \
  BENCHMARK_RENDERERS=webgpu,webgl2 CHROMIUM_OZONE_PLATFORM=wayland \
  yarn benchmark:time-series
```

Headless Chromium can run correctness without enforcing physical performance gates:

```bash
BENCHMARK_CORRECTNESS_ONLY=1 BENCHMARK_RENDERERS=webgl2 \
  yarn benchmark:time-series
```

A software WebGPU adapter may be requested explicitly when the installed Chromium exposes one:

```bash
BENCHMARK_CORRECTNESS_ONLY=1 WEBGPU_SOFTWARE=1 \
  yarn benchmark:time-series
```

Software-adapter results are correctness evidence only and are never valid performance evidence.

The command prints JSON and exits non-zero unless every selected GPU candidate reaches both feasibility gates:

- 100,000 values: prewarmed mount and update present within one measured display frame, GPU work completes within that budget, and synchronous/main-thread work is at least 3x lower than Dygraphs.
- 1,000,000 values: median prewarmed frame-settled mount and repeated full-data updates are at least 5x faster than Dygraphs.
- Each GPU workload exports a non-empty PNG data URL and mounts, updates, and tears down four charts without leaking WebGPU runtime leases or WebGL2 contexts.

Both GPU backends use the same production visualization/data/interaction model, including precision-normalized values, exact null gaps, line step/smooth geometry, Area baseline trapezoids, Multi Column grouped rectangles, diverging Stacked base/end bands, Stacked Bar rectangles, Heatmap cells, analytic EasyPie and Gauge geometry, D3 Pie wedges, axes, text, overlays, and interactions. Filled-line correctness requires one exact band per adjacent source pair, a fully empty null-gap band, and distinct regular/step pixels. Multi Column and Stacked Bar require one instance per source value, exact null omission, and no response to line step mode. Pixel probes require Dygraphs RGBA parity for Area reverse overlap/baseline behavior, Multi Column historical grouped overlap and visibility reflow, Stacked reverse-order positive/negative bands, and Stacked Bar range, width, fill, subpixel border, and empty pixels. WebGL2 owns only its GLSL shaders, textures/buffers, shared context/program runtime, presentation surface, and context-loss handling.

The one-frame gate allows 25% browser scheduling tolerance around the measured refresh interval. A frame-settled ratio is not used when both renderers already present on the same refresh boundary. Cold adapter/device initialization and first pipeline creation are reported separately.

## Method

- Canvas: 1600x500 CSS pixels at device-pixel ratio 1.
- Workloads: 100 dimensions x 1,000 points and 1,000 dimensions x 1,000 points.
- Geometry: every visible series and adjacent pair; Area and Stacked add one exact fill band per pair, while Multi Column and Stacked Bar add one exact rectangle per source value; no LOD, sampling, or aggregation.
- Data: two pre-generated deterministic row-major revisions, alternated during updates.
- Samples: 3 mounts, 2 warm-up updates, 10 measured updates, 3 seconds of sustained updates, and one four-chart shared-runtime lifecycle.
- Timing: synchronous adapter time, GPU queue completion, measured display refresh interval, and wall time through the next animation frame.
- Memory: Chromium heap before mounting, sampled peak, post-teardown retained delta, and allocated GPU buffer bytes.
- Browser task, script, and layout durations are collected through the Chromium DevTools protocol.
- WebGL2 uses one SDK-owned context/program cache and copies each completed shared-context frame into the chart's visible canvas. Its reported buffer bytes cover per-chart value/color textures and primitive buffers.

This benchmark is not production instrumentation and is not included in package distributions.
