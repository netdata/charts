# uPlot Phase 0 — Renderer/Type Decoupling Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the Netdata time-series renderer configurable per chart type so uPlot (or any future renderer) can be selected in-app without breaking the toolbox, while dygraph stays the default for every type.

**Architecture:** Add an SDK attribute `chartLibrariesByType` (chartType → renderer library) plus two chart helpers (`getRendererForChartType`, `isTimeSeriesRenderer`) on `makeControllers`. `updateChartTypeAttribute` resolves the renderer from the map instead of the literal `"dygraph"`; the two chart-type UI components decide whether to display the chart *type* or the *library* via `isTimeSeriesRenderer` and guard their `find` lookups so an unmapped value never throws.

**Tech Stack:** React 19, styled-components 6, @netdata/netdata-ui; Jest + @testing-library/react (jsdom); `@jest/testUtilities` (`makeTestChart`, `renderWithChart`).

**Spec:** `docs/uplot-migration-design.md`. Background: `docs/charting-library-exploration.md`.

> **Status (2026-07-14): implemented inline on branch `explore/uplot-spike` (uncommitted).**
> Full suite 142 suites / 1366 passing / 0 failing; lint clean. Deviations from the draft below,
> chosen during implementation and reflected in the code:
> - Tests use **`table`** (an already-registered library) as the stand-in renderer, **not** the
>   spike `uplot` — Phase 0 does not depend on the spike.
> - The toolbox `ChartType` button is icon-only (its `title` becomes a hover tooltip via
>   `withTooltip`), so its test proves the fix via **no-throw**; the positive selected-label proof
>   lives in the **settings** `ChartType` test (react-select renders the label as text) and in the
>   controller resolution tests.
> - **Initial/auto-selection boundary:** `chartType` is payload-driven (set post-fetch in
>   `makeDataFetch.js:121`), so *auto*-applying the map at initial render would require reacting to
>   payload-driven `chartType` changes and rebuilding the UI. That is **deferred to the
>   "flip the default" step at the end of Phase A** (it needs uPlot parity first). Phase 0 delivers
>   selection via the type toggle and explicit `chartLibrary`, which is what dev/test/stories need.

## Global Constraints

- No semicolons; double quotes; 2-space indent; 100-col width; ES5 trailing commas; arrow functions.
- No descriptive inline comments (only real function docs). Lowercase JS filenames.
- Tests never mock netdata-ui/providers/components; use real imports + `makeTestChart`/`renderWithChart`.
- No new runtime dependencies in Phase 0.
- Run tests with: `yarn jest --config ./jest/config.js <path> --collectCoverage=false`.
- dygraph remains the default renderer for every chart type after Phase 0.

---

### Task 1: Renderer map + resolver helpers

**Files:**
- Modify: `src/makeDefaultSDK.js` (attributes block, ~line 39)
- Modify: `src/sdk/makeChart/filters/makeControllers.js` (add helpers near the `chartLibraries` map at line 111; add to return object at ~line 345)
- Test: `src/sdk/makeChart/filters/makeControllers.test.js`

**Interfaces:**
- Produces: `getRendererForChartType(chartType: string) => string` and `isTimeSeriesRenderer(chartLibrary: string) => boolean` on the controllers object (and therefore on the chart node, spread at `makeChart/index.js:423`).
- Consumes: `chart.getAttribute("chartLibrariesByType")` (a `{ [chartType]: library }` map).

- [ ] **Step 1: Write the failing test**

Add to `src/sdk/makeChart/filters/makeControllers.test.js`:

```js
describe("renderer resolution", () => {
  it("resolves the configured renderer for a chart type, defaulting to dygraph", () => {
    const { chart: c } = makeTestChart({
      attributes: { chartLibrariesByType: { line: "table", heatmap: "dygraph" } },
    })
    const ctrl = makeControllers(c)

    expect(ctrl.getRendererForChartType("line")).toBe("table")
    expect(ctrl.getRendererForChartType("heatmap")).toBe("dygraph")
    expect(ctrl.getRendererForChartType("area")).toBe("dygraph")
  })

  it("identifies which libraries are time-series renderers", () => {
    const { chart: c } = makeTestChart({
      attributes: { chartLibrariesByType: { line: "table" } },
    })
    const ctrl = makeControllers(c)

    expect(ctrl.isTimeSeriesRenderer("dygraph")).toBe(true)
    expect(ctrl.isTimeSeriesRenderer("table")).toBe(true)
    expect(ctrl.isTimeSeriesRenderer("gauge")).toBe(false)
  })

  it("ships a default chartLibrariesByType map from makeDefaultSDK (all dygraph)", () => {
    const { chart: c } = makeTestChart()

    expect(c.getAttribute("chartLibrariesByType")).toEqual({
      line: "dygraph",
      stacked: "dygraph",
      area: "dygraph",
      stackedBar: "dygraph",
      multiBar: "dygraph",
      heatmap: "dygraph",
    })
  })
})
```

This last test fails until Step 3 adds the default map — Task 1's helper tests alone would pass
even with the map omitted, so this asserts the default actually exists.

- [ ] **Step 2: Run test to verify it fails**

Run: `yarn jest --config ./jest/config.js src/sdk/makeChart/filters/makeControllers.test.js --collectCoverage=false`
Expected: FAIL — `c.getRendererForChartType is not a function`.

- [ ] **Step 3: Add the default map to `src/makeDefaultSDK.js`**

In the `attributes` object, insert the following block on the line **immediately below** the
existing `chartLibrary: "dygraph",` line (do **not** duplicate that line):

```js
      chartLibrariesByType: {
        line: "dygraph",
        stacked: "dygraph",
        area: "dygraph",
        stackedBar: "dygraph",
        multiBar: "dygraph",
        heatmap: "dygraph",
      },
```

Note: attribute overrides are **shallow-merged** (`makeDefaultSDK.js` spreads `...attributes`;
`sdk/index.js:19` spreads `...defaultAttributes`). Passing `chartLibrariesByType: { line: "uplot" }`
therefore **replaces** this whole map — omitted types resolve to `"dygraph"` via
`getRendererForChartType`'s fallback, so a partial override is safe but is a replace, not a
deep-merge. To keep other entries explicitly, spread the default in the override.

- [ ] **Step 4: Add the helpers in `src/sdk/makeChart/filters/makeControllers.js`**

Immediately after the `chartLibraries` object (ends line 120) add:

```js
  const getRendererForChartType = chartType =>
    (chart.getAttribute("chartLibrariesByType") || {})[chartType] || "dygraph"

  const isTimeSeriesRenderer = chartLibrary =>
    chartLibrary === "dygraph" ||
    Object.values(chart.getAttribute("chartLibrariesByType") || {}).includes(chartLibrary)
```

Then add both to the returned object (the `return { ... }` near line 345), e.g. after `updateChartTypeAttribute,`:

```js
    updateChartTypeAttribute,
    getRendererForChartType,
    isTimeSeriesRenderer,
```

- [ ] **Step 5: Run test to verify it passes**

Run: `yarn jest --config ./jest/config.js src/sdk/makeChart/filters/makeControllers.test.js --collectCoverage=false`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/makeDefaultSDK.js src/sdk/makeChart/filters/makeControllers.js src/sdk/makeChart/filters/makeControllers.test.js
git commit -m "feat(charts): add per-chart-type renderer map and resolver helpers"
```

---

### Task 2: `updateChartTypeAttribute` resolves the mapped renderer

**Files:**
- Modify: `src/sdk/makeChart/filters/makeControllers.js:122-144` (`updateChartTypeAttribute`)
- Test: `src/sdk/makeChart/filters/makeControllers.test.js`

**Interfaces:**
- Consumes: `getRendererForChartType` (Task 1).
- Behavior: for a time-series chart type, sets `chartLibrary` to the resolved renderer and `chartType` to the selection; rebuilds the UI only when the renderer actually changed.

- [ ] **Step 1: Write the failing test**

Add to `src/sdk/makeChart/filters/makeControllers.test.js`:

```js
describe("updateChartTypeAttribute renderer resolution", () => {
  it("uses the configured renderer for a time-series chart type", () => {
    const { chart: c } = makeTestChart({
      attributes: { chartLibrariesByType: { line: "table" } },
    })
    const ctrl = makeControllers(c)

    ctrl.updateChartTypeAttribute("line")

    expect(c.getAttribute("chartLibrary")).toBe("table")
    expect(c.getAttribute("chartType")).toBe("line")
  })

  it("defaults an unmapped time-series type to dygraph", () => {
    const { chart: c } = makeTestChart()
    const ctrl = makeControllers(c)

    ctrl.updateChartTypeAttribute("area")

    expect(c.getAttribute("chartLibrary")).toBe("dygraph")
    expect(c.getAttribute("chartType")).toBe("area")
  })

  it("rebuilds the chart UI when the renderer changes", () => {
    const { chart: c } = makeTestChart({
      attributes: { chartLibrariesByType: { line: "table" } },
    })
    const ctrl = makeControllers(c)

    const before = c.getUI()
    ctrl.updateChartTypeAttribute("line")

    expect(c.getUI()).not.toBe(before)
  })

  it("keeps the same chart UI when switching types that share a renderer", () => {
    const { chart: c } = makeTestChart({ attributes: { chartType: "line" } })
    const ctrl = makeControllers(c)

    const before = c.getUI()
    ctrl.updateChartTypeAttribute("area")

    expect(c.getUI()).toBe(before)
  })
})
```

(`table` is an already-registered library used as a stand-in renderer — the point is that a
time-series chart type resolves to a configured library and the UI rebuilds on renderer change.)

Use an already-registered library as the stand-in renderer (`table`) so Phase 0 does not depend on
the uncommitted spike — no extra import or `addUI` is needed; `table` is in the default `ui` map.
Component tests (Tasks 3–4) can set `chartLibrary` to the plain string `"uplot"` after creation
(the components never mount a UI, so no library needs registering).

- [ ] **Step 2: Run test to verify it fails**

Run: `yarn jest --config ./jest/config.js src/sdk/makeChart/filters/makeControllers.test.js --collectCoverage=false`
Expected: FAIL — `chartLibrary` is `"dygraph"`, expected `"table"`.

- [ ] **Step 3: Update `updateChartTypeAttribute`**

Replace the `if (!chartLibraries[selected]) { ... }` branch (lines 126-135) with:

```js
    if (!chartLibraries[selected]) {
      const nextChartLibrary = getRendererForChartType(selected)
      chart.updateAttributes({
        chartLibrary: nextChartLibrary,
        chartType: selected,
        processing: true,
      })
      if (prevChartLibrary !== nextChartLibrary) {
        chart.getUI().unmount()
        chart.setUI({ ...chart.sdk.makeChartUI(chart), ...(chart.ui || {}) }, "default")
      }
    } else {
```

(The `else` branch and everything after line 144 stay unchanged.)

- [ ] **Step 4: Run test to verify it passes**

Run: `yarn jest --config ./jest/config.js src/sdk/makeChart/filters/makeControllers.test.js --collectCoverage=false`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/sdk/makeChart/filters/makeControllers.js src/sdk/makeChart/filters/makeControllers.test.js
git commit -m "feat(charts): resolve time-series renderer from chartLibrariesByType on type change"
```

---

### Task 3: Toolbox `ChartType` uses `isTimeSeriesRenderer` and cannot throw

**Files:**
- Modify: `src/components/toolbox/chartType.js:131-136`
- Test: `src/components/toolbox/chartType.test.js`

**Interfaces:**
- Consumes: `chart.isTimeSeriesRenderer` (Task 1).

- [ ] **Step 1: Write the failing test**

Add to `src/components/toolbox/chartType.test.js`:

```js
it("does not throw when the time-series renderer is non-dygraph", () => {
  const { chart } = makeTestChart({
    attributes: { chartLibrariesByType: { line: "uplot" } },
  })
  chart.updateAttributes({ chartLibrary: "uplot", chartType: "line" })

  expect(() => renderWithChart(<ChartType disabled={false} />, { chart })).not.toThrow()
  expect(screen.getByTestId("chartHeaderToolbox-chartType")).toBeInTheDocument()
})
```

The toolbox button is icon-only (`title` becomes a hover tooltip via `withTooltip`, and the jest
svg transform renders every icon identically), so **no-throw is the meaningful proof here** — the
old code threw on the `items.find(...)` destructure. The positive selected-label proof lives in
Task 4 (settings, react-select renders the label as text) and in Task 1's resolution tests.

- [ ] **Step 2: Run test to verify it fails**

Run: `yarn jest --config ./jest/config.js src/components/toolbox/chartType.test.js --collectCoverage=false`
Expected: FAIL — `TypeError: Cannot destructure property 'label' of ... as it is undefined` (`items.find` returns `undefined` for value `"uplot"`).

- [ ] **Step 3: Update the component**

In `src/components/toolbox/chartType.js`, replace lines 131 and 133 and 136:

```js
  const chartLibrary = useAttributeValue("chartLibrary") || "dygraph"
  const chartType = useAttributeValue("chartType") || "line"
  const value = chart.isTimeSeriesRenderer(chartLibrary) ? chartType : chartLibrary

  const items = useItems(chart)
  const { label, svg } = items.find(({ value: v }) => v === value) || {}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `yarn jest --config ./jest/config.js src/components/toolbox/chartType.test.js --collectCoverage=false`
Expected: PASS (all existing tests in the file still pass).

- [ ] **Step 5: Commit**

```bash
git add src/components/toolbox/chartType.js src/components/toolbox/chartType.test.js
git commit -m "fix(charts): toolbox ChartType resolves renderer via isTimeSeriesRenderer"
```

---

### Task 4: Settings `ChartType` uses `isTimeSeriesRenderer`

**Files:**
- Modify: `src/components/toolbox/settings/tabs/chartType.js:142-148`
- Test: `src/components/toolbox/settings/tabs/chartType.test.js` (create if absent)

**Interfaces:**
- Consumes: `chart.isTimeSeriesRenderer` (Task 1).

- [ ] **Step 1: Write the failing test**

Create `src/components/toolbox/settings/tabs/chartType.test.js`:

```js
import React from "react"
import { screen } from "@testing-library/react"
import "@testing-library/jest-dom"
import { renderWithChart, makeTestChart } from "@jest/testUtilities"
import ChartType from "./chartType"

describe("settings ChartType", () => {
  it("shows the chart type as the selected value for the dygraph renderer", () => {
    const { chart } = makeTestChart({
      attributes: { chartLibrary: "dygraph", chartType: "area" },
    })

    renderWithChart(<ChartType />, { chart })

    expect(screen.getByText("Area")).toBeInTheDocument()
  })

  it("resolves to the chart type when the time-series renderer is non-dygraph", () => {
    const { chart } = makeTestChart({
      attributes: { chartLibrariesByType: { line: "uplot" } },
    })
    chart.updateAttributes({ chartLibrary: "uplot", chartType: "line" })

    renderWithChart(<ChartType />, { chart })

    expect(screen.getByText("Line")).toBeInTheDocument()
  })
})
```

react-select renders the selected value's label as text, so `getByText("Line")` is a real
selection assertion (unlike the icon-only toolbox button). With the old `=== "dygraph"` code the
second test's selection resolves wrong (`value` is `"uplot"`, `current` falls back to `options[0]`
= Line by coincidence); the fix makes it resolve `value` to the chart type deterministically.

- [ ] **Step 3: Update the component**

In `src/components/toolbox/settings/tabs/chartType.js`, replace line 144:

```js
  const value = chart.isTimeSeriesRenderer(chartLibrary) ? chartType : chartLibrary
```

- [ ] **Step 4: Run test to verify it passes**

Run: `yarn jest --config ./jest/config.js src/components/toolbox/settings/tabs/chartType.test.js --collectCoverage=false`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/toolbox/settings/tabs/chartType.js src/components/toolbox/settings/tabs/chartType.test.js
git commit -m "fix(charts): settings ChartType resolves renderer via isTimeSeriesRenderer"
```

---

### Task 5: Full-suite + lint gate

**Files:** none (verification only).

- [ ] **Step 1: Run the full test suite**

Run: `yarn jest --config ./jest/config.js --collectCoverage=false`
Expected: all suites pass (baseline 141 suites / 1356 passing before this plan; new tests add to that).

- [ ] **Step 2: Lint the changed files**

Run: `yarn eslint src/makeDefaultSDK.js 'src/sdk/makeChart/filters/*.js' 'src/components/toolbox/**/*.js'`
Expected: no errors.

- [ ] **Step 3: Commit any lint fixes (if needed)**

```bash
git add -A
git commit -m "chore(charts): lint fixes for phase 0"
```

---

## Post-plan: enabling uPlot line charts (manual verification, not part of Phase 0 commits)

With Phase 0 merged, a consumer/story enables uPlot for line charts by registering it and setting
the map — no product-code edits:

```js
const sdk = makeDefaultSDK({ attributes: { chartLibrariesByType: { line: "uplot" } } })
sdk.addUI("uplot", uplot)
```

Verify in Storybook against the scenario checklist in `docs/charting-library-exploration.md` §7.

## Scope: selection plumbing only

Phase 0 **does not render uPlot** — dygraph stays the default renderer for every chart type. It
only decouples renderer *selection* so a consumer can point a chart type at a different renderer.
Two rendering concerns are therefore explicitly **Phase A**, not Phase 0:

- **uPlot's own stylesheet is functional, not cosmetic.** `uplot/dist/uPlot.min.css` drives the
  `.uplot` layout, overlay/cursor positioning and axis DOM; uPlot will not lay out correctly
  without it. Phase A must decide how that CSS ships (bundled by the library vs imported by the
  consumer). Today only the spike story imports it.
- The `chartContentWrapper.js:14` map is a **netdata-side** CSS-class hook keyed by
  `chartLibrary` (with a `|| ""` fallback) — separate from uPlot's stylesheet; it needs a `uplot`
  entry in Phase A when uPlot renders in-app.

## Self-review notes

- **Spec coverage:** Phase 0 design items (map, resolver, `updateChartTypeAttribute`, both
  components, guards) each map to Task 1–4, and the default-map + UI-identity behaviors are
  asserted in Tasks 1–2.
- **Type consistency:** `getRendererForChartType`/`isTimeSeriesRenderer` names are used
  identically in Tasks 1–4.
- **Deferred to Phase A:** all uPlot feature parity (rendering modes, overlays, navigation,
  ranges, unit/timezone reactions, perf measurement, flipping the default).
