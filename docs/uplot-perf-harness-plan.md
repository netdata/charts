# uPlot Perf Harness + Renderer-Selection Cleanup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an opt-in, renderer-agnostic performance harness (render-time + heap, HUD overlay, Storybook bench) so the maintainer can measure uPlot vs dygraph on a real dashboard, and collapse renderer selection onto the single `chartLibrary` attribute.

**Architecture:** Time each `render()` at the `makeChart` fan-out seam into a plain module-level registry (never in chart attributes). A self-mounting SDK plugin renders a HUD onto `document.body` when the `perfMonitor` root attribute is on. Renderer selection reads `chartLibrary`, with `chartLibrariesByType` demoted to an optional per-type override that falls back to `chartLibrary`.

**Tech Stack:** JavaScript (no TS), React 19 (automatic JSX, `react-dom/client` `createRoot`), Jest + jsdom, `@testing-library/react`, `@jest/testUtilities` (`makeTestChart`, `renderWithChart`).

## Global Constraints

- No semicolons; double quotes; 2-space indent; 100-char width; ES5 trailing commas; arrow functions.
- ES6 imports at top of file only — never `require()` or dynamic import in a function body.
- **No inline/description comments.** Only real function documentation is allowed.
- Do not create component/JS filenames starting with an uppercase letter.
- **Never mock** — use real imports, real components, real SDK via `@jest/testUtilities`.
- Perf stats live in a module-level registry, **never** in chart attributes (attribute writes trigger renders and corrupt the measurement).
- Test run command: `yarn jest --config ./jest/config.js <path> --collectCoverage=false`.
- Do not commit `src/components/toolbox/settings/numberFormat.js` or its `.test.js` (maintainer's in-flight work).

---

## File Structure

- `src/sdk/makeChart/filters/makeControllers.js` (modify) — renderer-resolution helpers.
- `src/makeDefaultSDK.js` (modify) — empty default map; register the perfMonitor plugin.
- `src/sdk/initialAttributes.js` (modify) — `perfMonitor: false` default.
- `src/index.stories.js` (modify) — drop the story-built map.
- `src/sdk/makeChart/index.js` (modify) — wrap the render fan-out with `timeRender`.
- `src/sdk/plugins/perfMonitor/registry.js` (create) — pure stats registry.
- `src/sdk/plugins/perfMonitor/index.js` (create) — self-mounting HUD plugin.
- `src/components/perf/index.js` (create) — HUD component.
- `src/perf.stories.js` (create) — Storybook bench story.
- Test files colocated: `registry.test.js`, `index.test.js` (plugin), `src/components/perf/index.test.js`, `src/sdk/makeChart/renderPerf.test.js`, plus edits to `makeControllers.test.js`.

---

### Task 1: Renderer selection — `chartLibrary` as the single selector

**Files:**
- Modify: `src/sdk/makeChart/filters/makeControllers.js:122-127`
- Modify: `src/makeDefaultSDK.js:41-48`
- Modify: `src/index.stories.js:17,31`
- Test: `src/sdk/makeChart/filters/makeControllers.test.js:300-313` (rewrite one test, add two)

**Interfaces:**
- Consumes: nothing from other tasks.
- Produces: `getRendererForChartType(chartType) → string` (map entry or, falling back, the chart's `chartLibrary`); `isTimeSeriesRenderer(chartLibrary) → boolean` (true for `"dygraph"`/`"uplot"` or any value present in the map). Default `chartLibrariesByType` is now `{}`.

- [ ] **Step 1: Rewrite the default-map test and add resolution tests**

In `src/sdk/makeChart/filters/makeControllers.test.js`, replace the existing `it("ships a default chartLibrariesByType map from makeDefaultSDK (all dygraph)", ...)` block with:

```js
    it("ships an empty chartLibrariesByType map from makeDefaultSDK", () => {
      const { chart: c } = makeTestChart()

      expect(c.getAttribute("chartLibrariesByType")).toEqual({})
    })

    it("falls back to the chart's chartLibrary when a type is unmapped", () => {
      const { chart: c } = makeTestChart({
        attributes: { chartLibrary: "uplot", chartLibrariesByType: { heatmap: "dygraph" } },
      })
      const ctrl = makeControllers(c)

      expect(ctrl.getRendererForChartType("line")).toBe("uplot")
      expect(ctrl.getRendererForChartType("heatmap")).toBe("dygraph")
    })

    it("recognizes uplot as a time-series renderer with an empty map", () => {
      const { chart: c } = makeTestChart()
      const ctrl = makeControllers(c)

      expect(ctrl.isTimeSeriesRenderer("dygraph")).toBe(true)
      expect(ctrl.isTimeSeriesRenderer("uplot")).toBe(true)
      expect(ctrl.isTimeSeriesRenderer("gauge")).toBe(false)
    })
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `yarn jest --config ./jest/config.js src/sdk/makeChart/filters/makeControllers.test.js --collectCoverage=false`
Expected: FAIL — the empty-map test fails (default map is still enumerated), the fallback test fails (`getRendererForChartType("line")` returns `"dygraph"` not `"uplot"`).

- [ ] **Step 3: Update the resolution helpers**

In `src/sdk/makeChart/filters/makeControllers.js`, replace lines 122-127:

```js
  const timeSeriesRenderers = ["dygraph", "uplot"]

  const getRendererForChartType = chartType =>
    (chart.getAttribute("chartLibrariesByType") || {})[chartType] ||
    chart.getAttribute("chartLibrary")

  const isTimeSeriesRenderer = chartLibrary =>
    timeSeriesRenderers.includes(chartLibrary) ||
    Object.values(chart.getAttribute("chartLibrariesByType") || {}).includes(chartLibrary)
```

- [ ] **Step 4: Empty the default map**

In `src/makeDefaultSDK.js`, replace the enumerated `chartLibrariesByType` block (lines 41-48) with:

```js
      chartLibrariesByType: {},
```

(Keep `chartLibrary: "dygraph",` on line 40.)

- [ ] **Step 5: Drop the story-built map**

In `src/index.stories.js`, delete the `timeSeriesTypes` const (line 17) and the `chartLibrariesByType` line inside `makeSdkWithLibrary` (line 31), leaving:

```js
const makeSdkWithLibrary = (chartLibrary = "dygraph", sdkAttributes = {}) =>
  makeDefaultSDK({
    attributes: {
      chartLibrary,
      ...sdkAttributes,
    },
  })
```

- [ ] **Step 6: Run the affected suites to verify they pass**

Run: `yarn jest --config ./jest/config.js src/sdk/makeChart/filters/makeControllers.test.js src/components/toolbox/chartType.test.js src/components/toolbox/settings/tabs/chartType.test.js --collectCoverage=false`
Expected: PASS. (The toolbox tests still pass because `isTimeSeriesRenderer("uplot")` is now true via the constant set even with an empty map.)

- [ ] **Step 7: Commit**

```bash
git add src/sdk/makeChart/filters/makeControllers.js src/makeDefaultSDK.js src/index.stories.js src/sdk/makeChart/filters/makeControllers.test.js
git commit -m "refactor(charts): chartLibrary is the single renderer selector; chartLibrariesByType is an optional per-type override"
```

---

### Task 2: Perf stats registry (pure module)

**Files:**
- Create: `src/sdk/plugins/perfMonitor/registry.js`
- Test: `src/sdk/plugins/perfMonitor/registry.test.js`

**Interfaces:**
- Produces:
  - `setEnabled(bool)`, `isEnabled() → bool`
  - `record(chartId: string, renderer: string, ms: number)`
  - `timeRender(chartId: string, renderer: string, fn: () => void)` — always calls `fn`; records `fn`'s duration only when enabled.
  - `sampleHeap()` — records one `performance.memory.usedJSHeapSize` sample if available.
  - `snapshot() → { overall: {count,p50,p95,max}, renderers: { [name]: {count,p50,p95,max} }, heap: { current, peak, supported } }`
  - `reset()`

- [ ] **Step 1: Write the failing tests**

Create `src/sdk/plugins/perfMonitor/registry.test.js`:

```js
import {
  setEnabled,
  isEnabled,
  record,
  timeRender,
  snapshot,
  reset,
  sampleHeap,
} from "./registry"

describe("perf registry", () => {
  beforeEach(() => {
    reset()
    setEnabled(false)
  })

  it("records durations and computes per-renderer and overall stats", () => {
    record("c1", "uplot", 10)
    record("c1", "uplot", 20)
    record("c1", "uplot", 30)

    const snap = snapshot()
    expect(snap.overall.count).toBe(3)
    expect(snap.overall.p50).toBe(20)
    expect(snap.overall.max).toBe(30)
    expect(snap.renderers.uplot.count).toBe(3)
  })

  it("clears all samples on reset", () => {
    record("c1", "dygraph", 5)
    reset()
    expect(snapshot().overall.count).toBe(0)
  })

  it("timeRender always calls fn but records only when enabled", () => {
    let calls = 0
    const fn = () => {
      calls++
    }

    timeRender("c1", "uplot", fn)
    expect(calls).toBe(1)
    expect(snapshot().overall.count).toBe(0)

    setEnabled(true)
    timeRender("c1", "uplot", fn)
    expect(calls).toBe(2)
    expect(snapshot().overall.count).toBe(1)
  })

  it("reports heap unsupported when performance.memory is absent", () => {
    sampleHeap()
    expect(snapshot().heap.supported).toBe(false)
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `yarn jest --config ./jest/config.js src/sdk/plugins/perfMonitor/registry.test.js --collectCoverage=false`
Expected: FAIL — cannot resolve `./registry`.

- [ ] **Step 3: Implement the registry**

Create `src/sdk/plugins/perfMonitor/registry.js`:

```js
const MAX_SAMPLES = 500

let enabled = false
const byChart = new Map()
let heapCurrent = null
let heapPeak = null

const getEntry = (chartId, renderer) => {
  let entry = byChart.get(chartId)
  if (!entry) {
    entry = { renderer, durations: [] }
    byChart.set(chartId, entry)
  }
  entry.renderer = renderer
  return entry
}

export const setEnabled = value => {
  enabled = value
}

export const isEnabled = () => enabled

export const record = (chartId, renderer, ms) => {
  const { durations } = getEntry(chartId, renderer)
  durations.push(ms)
  if (durations.length > MAX_SAMPLES) durations.shift()
}

export const timeRender = (chartId, renderer, fn) => {
  if (!enabled) return fn()

  const start = performance.now()
  fn()
  record(chartId, renderer, performance.now() - start)
}

export const sampleHeap = () => {
  const memory = performance.memory
  if (!memory) return

  heapCurrent = memory.usedJSHeapSize
  heapPeak = Math.max(heapPeak ?? 0, heapCurrent)
}

const quantile = (sorted, q) => {
  if (!sorted.length) return 0

  const pos = (sorted.length - 1) * q
  const base = Math.floor(pos)
  const rest = pos - base
  const next = sorted[base + 1]

  return next !== undefined ? sorted[base] + rest * (next - sorted[base]) : sorted[base]
}

const stats = durations => {
  const sorted = [...durations].sort((a, b) => a - b)

  return {
    count: sorted.length,
    p50: quantile(sorted, 0.5),
    p95: quantile(sorted, 0.95),
    max: sorted.length ? sorted[sorted.length - 1] : 0,
  }
}

export const snapshot = () => {
  const all = []
  const byRenderer = {}

  byChart.forEach(({ renderer, durations }) => {
    all.push(...durations)
    byRenderer[renderer] = (byRenderer[renderer] || []).concat(durations)
  })

  return {
    overall: stats(all),
    renderers: Object.fromEntries(
      Object.entries(byRenderer).map(([renderer, durations]) => [renderer, stats(durations)])
    ),
    heap: { current: heapCurrent, peak: heapPeak, supported: !!performance.memory },
  }
}

export const reset = () => {
  byChart.clear()
  heapCurrent = null
  heapPeak = null
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `yarn jest --config ./jest/config.js src/sdk/plugins/perfMonitor/registry.test.js --collectCoverage=false`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add src/sdk/plugins/perfMonitor/registry.js src/sdk/plugins/perfMonitor/registry.test.js
git commit -m "feat(charts): perf stats registry (render-time + heap)"
```

---

### Task 3: Wire the render seam to `timeRender`

**Files:**
- Modify: `src/sdk/makeChart/index.js:2,138-140`
- Test: `src/sdk/makeChart/renderPerf.test.js`

**Interfaces:**
- Consumes: `timeRender(chartId, renderer, fn)`, `setEnabled`, `reset`, `snapshot` from Task 2.
- Produces: every `render()` fan-out is timed and tagged with the chart's `chartLibrary` when the registry is enabled.

- [ ] **Step 1: Write the failing test**

Create `src/sdk/makeChart/renderPerf.test.js`:

```js
import { makeTestChart } from "@jest/testUtilities"
import { setEnabled, reset, snapshot } from "@/sdk/plugins/perfMonitor/registry"

describe("render timing seam", () => {
  beforeEach(() => {
    jest.useFakeTimers()
    reset()
    setEnabled(false)
  })

  afterEach(() => {
    setEnabled(false)
    reset()
    jest.useRealTimers()
  })

  it("records a render sample tagged with the chart's renderer when enabled", () => {
    const { chart } = makeTestChart({ attributes: { chartLibrary: "uplot" } })

    setEnabled(true)
    chart.trigger("render")
    jest.runOnlyPendingTimers()

    const snap = snapshot()
    expect(snap.overall.count).toBeGreaterThanOrEqual(1)
    expect(snap.renderers.uplot.count).toBeGreaterThanOrEqual(1)
  })

  it("does not record when disabled", () => {
    const { chart } = makeTestChart({ attributes: { chartLibrary: "uplot" } })

    chart.trigger("render")
    jest.runOnlyPendingTimers()

    expect(snapshot().overall.count).toBe(0)
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `yarn jest --config ./jest/config.js src/sdk/makeChart/renderPerf.test.js --collectCoverage=false`
Expected: FAIL — `overall.count` is 0 because the seam does not record yet.

- [ ] **Step 3: Wrap the render fan-out**

In `src/sdk/makeChart/index.js`, add the import near the other top-level imports (after line 2):

```js
import { timeRender } from "@/sdk/plugins/perfMonitor/registry"
```

Then replace the `render` definition at lines 138-140:

```js
  const render = executeLatest.add(() =>
    Object.keys(uiInstances).forEach(uiName =>
      timeRender(node.getId(), node.getAttribute("chartLibrary"), () =>
        uiInstances[uiName].render()
      )
    )
  )
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `yarn jest --config ./jest/config.js src/sdk/makeChart/renderPerf.test.js --collectCoverage=false`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add src/sdk/makeChart/index.js src/sdk/makeChart/renderPerf.test.js
git commit -m "feat(charts): time render() at the makeChart seam via perf registry"
```

---

### Task 4: Perf HUD component

**Files:**
- Create: `src/components/perf/index.js`
- Test: `src/components/perf/index.test.js`

**Interfaces:**
- Consumes: `snapshot`, `reset`, `record`, `setEnabled` from Task 2.
- Produces: default-exported `PerfOverlay` React component (no props). Reads the registry on mount and polls every 500ms. Renders `data-testid="perfOverlay"`, per-renderer rows `data-testid="perf-renderer-<name>"`, and `perf-reset`/`perf-copy` buttons.

- [ ] **Step 1: Write the failing test**

Create `src/components/perf/index.test.js`:

```js
import { render, screen } from "@testing-library/react"
import { record, reset, setEnabled } from "@/sdk/plugins/perfMonitor/registry"
import PerfOverlay from "./"

describe("PerfOverlay", () => {
  beforeEach(() => {
    reset()
    setEnabled(true)
  })

  afterEach(() => {
    reset()
    setEnabled(false)
  })

  it("shows seeded registry stats", () => {
    record("c1", "uplot", 12)
    record("c1", "uplot", 8)

    render(<PerfOverlay />)

    expect(screen.getByTestId("perfOverlay")).toBeInTheDocument()
    expect(screen.getByText(/renders: 2/)).toBeInTheDocument()
    expect(screen.getByTestId("perf-renderer-uplot")).toHaveTextContent("uplot: 2")
  })

  it("shows heap n/a when unsupported", () => {
    render(<PerfOverlay />)

    expect(screen.getByText(/heap: n\/a/)).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `yarn jest --config ./jest/config.js src/components/perf/index.test.js --collectCoverage=false`
Expected: FAIL — cannot resolve `./`.

- [ ] **Step 3: Implement the HUD component**

Create `src/components/perf/index.js`:

```js
import { useEffect, useState } from "react"
import { snapshot, reset } from "@/sdk/plugins/perfMonitor/registry"

const boxStyle = {
  position: "fixed",
  top: "8px",
  right: "8px",
  zIndex: 2147483647,
  padding: "8px 10px",
  background: "rgba(0, 0, 0, 0.82)",
  color: "#fff",
  font: "11px/1.5 monospace",
  borderRadius: "4px",
  pointerEvents: "auto",
  minWidth: "200px",
}

const buttonStyle = {
  marginRight: "6px",
  marginTop: "6px",
  font: "11px monospace",
  cursor: "pointer",
}

const ms = n => `${n.toFixed(1)}ms`
const mb = n => (n == null ? "n/a" : `${(n / 1048576).toFixed(1)}MB`)

const PerfOverlay = () => {
  const [snap, setSnap] = useState(snapshot)

  useEffect(() => {
    const id = setInterval(() => setSnap(snapshot()), 500)
    return () => clearInterval(id)
  }, [])

  const { overall, renderers, heap } = snap

  const copy = () => navigator.clipboard?.writeText(JSON.stringify(snapshot(), null, 2))

  return (
    <div style={boxStyle} data-testid="perfOverlay">
      <div>renders: {overall.count}</div>
      <div>
        p50 {ms(overall.p50)} · p95 {ms(overall.p95)} · max {ms(overall.max)}
      </div>
      {Object.entries(renderers).map(([name, s]) => (
        <div key={name} data-testid={`perf-renderer-${name}`}>
          {name}: {s.count} · p95 {ms(s.p95)}
        </div>
      ))}
      <div>heap: {heap.supported ? `${mb(heap.current)} (peak ${mb(heap.peak)})` : "n/a"}</div>
      <button type="button" style={buttonStyle} onClick={reset} data-testid="perf-reset">
        reset
      </button>
      <button type="button" style={buttonStyle} onClick={copy} data-testid="perf-copy">
        copy
      </button>
    </div>
  )
}

export default PerfOverlay
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `yarn jest --config ./jest/config.js src/components/perf/index.test.js --collectCoverage=false`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add src/components/perf/index.js src/components/perf/index.test.js
git commit -m "feat(charts): perf HUD overlay component"
```

---

### Task 5: Self-mounting perfMonitor plugin

**Files:**
- Create: `src/sdk/plugins/perfMonitor/index.js`
- Test: `src/sdk/plugins/perfMonitor/index.test.js`
- Modify: `src/makeDefaultSDK.js` (import + `plugins` map)
- Modify: `src/sdk/initialAttributes.js` (add `perfMonitor: false`)

**Interfaces:**
- Consumes: `PerfOverlay` (Task 4); `setEnabled`, `sampleHeap`, `reset` (Task 2); the plugin contract `sdk => cleanup` and `sdk.getRoot().onAttributeChange(name, handler) → off` (from `makeNode`, mirroring `src/sdk/plugins/play.js`).
- Produces: when root `perfMonitor` is `true`, a `<div data-testid="perfOverlay-root">` appended to `document.body` hosting a React root that renders `PerfOverlay`, the registry enabled, and a 1s heap sampler running; all torn down when `perfMonitor` is `false` or the plugin is unregistered.

- [ ] **Step 1: Write the failing test**

Create `src/sdk/plugins/perfMonitor/index.test.js`:

```js
import { makeTestChart } from "@jest/testUtilities"
import { isEnabled, reset } from "./registry"

describe("perfMonitor plugin", () => {
  afterEach(() => {
    document.body.innerHTML = ""
    reset()
  })

  it("mounts the overlay and enables the registry when perfMonitor turns on, and tears down when off", () => {
    const { sdk } = makeTestChart()

    expect(document.querySelector("[data-testid='perfOverlay-root']")).toBeNull()
    expect(isEnabled()).toBe(false)

    sdk.getRoot().updateAttributes({ perfMonitor: true })

    expect(document.querySelector("[data-testid='perfOverlay-root']")).not.toBeNull()
    expect(isEnabled()).toBe(true)

    sdk.getRoot().updateAttributes({ perfMonitor: false })

    expect(document.querySelector("[data-testid='perfOverlay-root']")).toBeNull()
    expect(isEnabled()).toBe(false)
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `yarn jest --config ./jest/config.js src/sdk/plugins/perfMonitor/index.test.js --collectCoverage=false`
Expected: FAIL — the plugin is not registered, so nothing mounts (`perfOverlay-root` stays null after enabling).

- [ ] **Step 3: Implement the plugin**

Create `src/sdk/plugins/perfMonitor/index.js`:

```js
import { createRoot } from "react-dom/client"
import PerfOverlay from "@/components/perf"
import { setEnabled, sampleHeap, reset } from "./registry"

export default sdk => {
  let container = null
  let root = null
  let heapId = null

  const mount = () => {
    if (container) return

    reset()
    setEnabled(true)
    heapId = setInterval(sampleHeap, 1000)

    container = document.createElement("div")
    container.setAttribute("data-testid", "perfOverlay-root")
    document.body.appendChild(container)

    root = createRoot(container)
    root.render(<PerfOverlay />)
  }

  const unmount = () => {
    setEnabled(false)

    if (heapId) {
      clearInterval(heapId)
      heapId = null
    }
    if (root) {
      root.unmount()
      root = null
    }
    if (container) {
      container.remove()
      container = null
    }
  }

  const off = sdk.getRoot().onAttributeChange("perfMonitor", value => (value ? mount() : unmount()))

  if (sdk.getRoot().getAttribute("perfMonitor")) mount()

  return () => {
    off()
    unmount()
  }
}
```

- [ ] **Step 4: Register the plugin and add the default attribute**

In `src/makeDefaultSDK.js`, add the import after line 19:

```js
import perfMonitor from "./sdk/plugins/perfMonitor"
```

Then add `perfMonitor` to the `plugins` map (after `fullscreen,` on line 36):

```js
      fullscreen,
      perfMonitor,
```

In `src/sdk/initialAttributes.js`, add `perfMonitor: false,` to the exported defaults object (next to `autofetchOnHovering: false,` on line 18):

```js
  autofetchOnHovering: false,
  perfMonitor: false,
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `yarn jest --config ./jest/config.js src/sdk/plugins/perfMonitor/index.test.js --collectCoverage=false`
Expected: PASS (1 test).

- [ ] **Step 6: Run the full suite to confirm no regressions**

Run: `yarn jest --config ./jest/config.js --collectCoverage=false`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/sdk/plugins/perfMonitor/index.js src/sdk/plugins/perfMonitor/index.test.js src/makeDefaultSDK.js src/sdk/initialAttributes.js
git commit -m "feat(charts): self-mounting perfMonitor plugin (HUD on document.body)"
```

---

### Task 6: Storybook perf bench story (visual)

**Files:**
- Create: `src/perf.stories.js`

**Interfaces:**
- Consumes: `makeDefaultSDK`, `Line`, `makeMockPayload`, the `perfMonitor` attribute (Task 5), and `chartLibrary` selection (Task 1).
- Produces: a `Perf/Benchmark` story mounting `count` streaming line charts under one SDK with `perfMonitor: true`; the HUD self-mounts.

> This task has no unit test — Storybook cannot paint in jsdom. Verification is visual by the maintainer (`yarn storybook`). Do not run a dev server on their behalf.

- [ ] **Step 1: Create the story**

Create `src/perf.stories.js`:

```js
import { useMemo } from "react"
import { ThemeProvider } from "styled-components"
import { Flex, DefaultTheme } from "@netdata/netdata-ui"
import Line from "@/components/line"
import makeMockPayload from "@/helpers/makeMockPayload"
import makeDefaultSDK from "./makeDefaultSDK"
import systemLoadLine from "../fixtures/systemLoadLine"

const getChart = makeMockPayload(systemLoadLine[0], { delay: 600 })

export const Benchmark = ({ chartLibrary, count }) => {
  const charts = useMemo(() => {
    const sdk = makeDefaultSDK({ attributes: { chartLibrary, perfMonitor: true } })

    return Array.from({ length: count }, () => {
      const chart = sdk.makeChart({ getChart, attributes: { contextScope: ["system.load"] } })
      sdk.appendChild(chart)
      return chart
    })
  }, [chartLibrary, count])

  return (
    <ThemeProvider theme={DefaultTheme}>
      <Flex flexWrap gap={2}>
        {charts.map(chart => (
          <Line key={chart.getId()} chart={chart} height="200px" width="320px" />
        ))}
      </Flex>
    </ThemeProvider>
  )
}

Benchmark.args = { chartLibrary: "dygraph", count: 25 }
Benchmark.argTypes = {
  chartLibrary: { name: "Chart library", control: "select", options: ["dygraph", "uplot"] },
  count: { name: "Chart count", control: "select", options: [10, 25, 50] },
}

export default {
  title: "Perf/Benchmark",
  component: Benchmark,
  parameters: {
    docs: {
      description: {
        component:
          "Streaming dygraph-vs-uPlot A/B. Set library + count, let it stream ~60s, use the HUD's copy button. The mock ignores requested point counts, so absolute numbers differ from production — compare the dygraph/uPlot ratio under identical settings.",
      },
    },
  },
}
```

- [ ] **Step 2: Verify the build is not broken**

Run: `yarn jest --config ./jest/config.js --collectCoverage=false`
Expected: PASS (the new story file must not break test collection).

- [ ] **Step 3: Commit**

```bash
git add src/perf.stories.js
git commit -m "feat(charts): Storybook perf bench story (streaming N charts, dygraph vs uPlot)"
```

---

## Self-Review

**1. Spec coverage:**
- §1 render-time instrumentation → Task 3 (seam) + Task 2 (registry `record`/`timeRender`). ✓
- §2 heap sampling → Task 2 (`sampleHeap`, `snapshot().heap`) + Task 5 (1s interval). ✓
- §3a registry → Task 2. §3b self-mounting plugin → Task 5. §3c HUD component → Task 4. ✓
- §4 renderer-selection cleanup (empty map, `|| chartLibrary` fallback, `isTimeSeriesRenderer` constant set, story simplification) → Task 1. ✓
- §5 Storybook bench story → Task 6. ✓
- Opt-in model (`perfMonitor` default false; flip via root `chartLibrary`) → Task 5 (`initialAttributes`) + Task 1. ✓
- Constraint "no perf stats in attributes" → registry is a module singleton (Task 2). ✓

**2. Placeholder scan:** No TBD/TODO; every code step shows complete code; commands have expected output. ✓

**3. Type consistency:** `record`, `timeRender`, `snapshot`, `setEnabled`, `isEnabled`, `sampleHeap`, `reset` are defined in Task 2 and consumed with identical signatures in Tasks 3, 4, 5. `snapshot()` shape (`overall`/`renderers`/`heap`) matches the HUD reads in Task 4 and the registry tests in Task 2. `perfOverlay-root` (plugin container) and `perfOverlay` (component root) test ids are distinct and used consistently. ✓
