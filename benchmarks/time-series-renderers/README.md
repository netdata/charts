# Time-series renderer benchmark

This task-specific comparator measures the current Dygraphs line renderer and the native WebGPU prototype from the same checkout with identical deterministic data.

## Run

Prerequisites:

- Chromium at `/usr/bin/chromium`, or set `CHROMIUM_EXECUTABLE`.
- The `playwright` Node package available to Node's module resolver.
- A physical WebGPU adapter for performance results.

```bash
BENCHMARK_HEADED=1 yarn benchmark:time-series
```

Headless Chromium can run correctness checks with its software adapter:

```bash
WEBGPU_SOFTWARE=1 yarn benchmark:time-series
```

Software-adapter results are not valid performance evidence.

The command prints JSON and exits non-zero unless WebGPU reaches both feasibility gates:

- 100,000 values: prewarmed mount and update present within one measured display frame, GPU work completes within that budget, and synchronous/main-thread work is at least 3x lower than Dygraphs.
- 1,000,000 values: median prewarmed frame-settled mount and repeated full-data updates are at least 5x faster than Dygraphs.

The one-frame gate allows 25% browser scheduling tolerance around the measured refresh interval. A frame-settled ratio is not used when both renderers already present on the same refresh boundary. Cold adapter/device initialization and first pipeline creation are reported separately.

## Method

- Canvas: 1600x500 CSS pixels at device-pixel ratio 1.
- Workloads: 100 dimensions x 1,000 points and 1,000 dimensions x 1,000 points.
- Geometry: every visible series and adjacent pair; no LOD, sampling, or aggregation.
- Data: two pre-generated deterministic row-major revisions, alternated during updates.
- Samples: 3 mounts, 2 warm-up updates, 10 measured updates, and 3 seconds of sustained updates.
- Timing: synchronous adapter time, GPU queue completion, measured display refresh interval, and wall time through the next animation frame.
- Memory: Chromium heap before mounting, sampled peak, post-teardown retained delta, and allocated GPU buffer bytes.
- Browser task, script, and layout durations are collected through the Chromium DevTools protocol.

This benchmark is not production instrumentation and is not included in package distributions.
