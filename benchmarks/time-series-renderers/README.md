# Time-series renderer benchmark

This task-specific comparator measures the current Dygraphs line renderer and selected native GPU candidates from the same checkout with identical deterministic data. WebGPU uses the production opt-in adapter. WebGL2 uses an isolated exact line-kernel feasibility backend and is not registered as a production renderer.

## Run

Prerequisites:

- Chromium at `/usr/bin/chromium`, or set `CHROMIUM_EXECUTABLE`.
- The `playwright` Node package available to Node's module resolver.
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

Compare both GPU candidates in one browser run:

```bash
BENCHMARK_HEADED=1 BENCHMARK_RENDERERS=webgpu,webgl2 \
  CHROMIUM_OZONE_PLATFORM=wayland yarn benchmark:time-series
```

Headless Chromium can run correctness checks with its software adapter:

```bash
WEBGPU_SOFTWARE=1 yarn benchmark:time-series
```

Software-adapter results are not valid performance evidence.

The command prints JSON and exits non-zero unless every selected GPU candidate reaches both feasibility gates:

- 100,000 values: prewarmed mount and update present within one measured display frame, GPU work completes within that budget, and synchronous/main-thread work is at least 3x lower than Dygraphs.
- 1,000,000 values: median prewarmed frame-settled mount and repeated full-data updates are at least 5x faster than Dygraphs.
- Each GPU workload exports a non-empty PNG data URL and mounts, updates, and tears down four charts without leaking WebGPU runtime leases or WebGL2 contexts.

The WebGL2 feasibility backend ports the exact precision-normalized values, null gaps, step segments, monotonic smooth controls, screen-error-bounded tessellation, thick-line antialiasing, and deterministic colors. It intentionally excludes production axes, text, overlays, and interaction routing; passing proves the line kernel is worth integrating, not production parity.

The one-frame gate allows 25% browser scheduling tolerance around the measured refresh interval. A frame-settled ratio is not used when both renderers already present on the same refresh boundary. Cold adapter/device initialization and first pipeline creation are reported separately.

## Method

- Canvas: 1600x500 CSS pixels at device-pixel ratio 1.
- Workloads: 100 dimensions x 1,000 points and 1,000 dimensions x 1,000 points.
- Geometry: every visible series and adjacent pair; no LOD, sampling, or aggregation.
- Data: two pre-generated deterministic row-major revisions, alternated during updates.
- Samples: 3 mounts, 2 warm-up updates, 10 measured updates, 3 seconds of sustained updates, and one four-chart shared-runtime lifecycle.
- Timing: synchronous adapter time, GPU queue completion, measured display refresh interval, and wall time through the next animation frame.
- Memory: Chromium heap before mounting, sampled peak, post-teardown retained delta, and allocated GPU buffer bytes.
- Browser task, script, and layout durations are collected through the Chromium DevTools protocol.
- WebGL2 completion uses `gl.finish()`; its reported buffer bytes cover uploaded value/color textures.

This benchmark is not production instrumentation and is not included in package distributions.
