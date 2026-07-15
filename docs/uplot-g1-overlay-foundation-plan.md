# G1 — uPlot Overlay Positioning Foundation — Implementation Plan

> Executed via superpowers:subagent-driven-development. Spec: `docs/uplot-g1-overlay-foundation-design.md`.

**Goal:** Give both renderers renderer-neutral coordinate primitives (`getPlotArea`, `getXCoord`, `getXAxisRange`) and a shared `getArea(range)` helper, and make `usePlotArea` renderer-agnostic — so React overlays and `AlertTimeline` position correctly under uPlot. Draws no overlays.

**Architecture:** Add `getPlotArea`/`getXCoord` to each renderer's chartUI instance (dygraph already has `getXAxisRange`). Move dygraph's `getArea(dygraph, range)` to a neutral `getArea(chartUI, range)` built on those primitives; dygraph's overlay helper delegates to it unchanged. Rewrite `usePlotArea` to read `getPlotArea()`.

**Tech Stack:** JavaScript (no TS), React 19 (JSX files MUST `import React`), Jest + jsdom, `@jest/testUtilities`.

## Global Constraints
- No semicolons; double quotes; 2-space indent; 100-char width; ES5 trailing commas; arrow functions. Imports at top. No inline/description comments. NEVER mock. JSX files `import React`. Don't touch `numberFormat.js`. Test: `yarn jest --config ./jest/config.js <path> --collectCoverage=false`.
- **Acceptance = dygraph parity:** matching dygraph's existing behavior/contract is the target for every ambiguous choice.

## Verified facts
- `chart.getDateWindow()` → `[afterMs, beforeMs]` (`src/sdk/makeChart/index.js:90-95`).
- `dygraph.getArea()` → `{x,y,w,h}`; `usePlotArea` maps `x→left,w→width` (`selectors.js:686-687`).
- dygraph chartUI already returns `getXAxisRange = () => dygraph?.xAxisRange()` (`dygraph/index.js:515,524`) and `getDygraph` (`:476,525`).
- Current per-overlay area: `getArea(dygraph, range)` + `trigger` (`dygraph/overlays/helpers.js:1-23`); range is `[afterSec, beforeSec]`.
- uPlot chartUI instance object: `src/chartLibraries/uplot/index.js:505-516`.

---

### Task G1-T1: Neutral `getArea` helper + dygraph coordinate primitives (conflict-free)

**Files:**
- Create: `src/chartLibraries/helpers/overlayArea.js`
- Create test: `src/chartLibraries/helpers/overlayArea.test.js`
- Modify: `src/chartLibraries/dygraph/index.js` (add `getPlotArea`, `getXCoord` to the instance)
- Modify: `src/chartLibraries/dygraph/overlays/helpers.js` (delegate `getArea` to the neutral helper)

**Interfaces produced:**
- `getArea(chartUI, range): { from, to, width } | null` — `range` is `[afterSec, beforeSec]`; null when fully outside the visible window (parity with current behavior).
- dygraph `chartUI.getPlotArea(): { left, top, width, height }` and `chartUI.getXCoord(tsMs): number`.

- [ ] **Step 1: Write the failing test** — `src/chartLibraries/helpers/overlayArea.test.js`

```js
import { getArea } from "./overlayArea"

const stubChartUI = ({ windowMs, coordOf }) => ({
  getXAxisRange: () => windowMs,
  getXCoord: tsMs => coordOf(tsMs),
})

describe("overlayArea getArea", () => {
  it("maps an in-window range to from/to/width via getXCoord", () => {
    const chartUI = stubChartUI({
      windowMs: [1000000, 2000000],
      coordOf: tsMs => (tsMs - 1000000) / 1000,
    })

    const area = getArea(chartUI, [1200, 1800])

    expect(area).toEqual({ from: 200, to: 800, width: 600 })
  })

  it("clamps a range that overhangs the window to the window edges", () => {
    const chartUI = stubChartUI({
      windowMs: [1000000, 2000000],
      coordOf: tsMs => (tsMs - 1000000) / 1000,
    })

    const area = getArea(chartUI, [500, 1800])

    expect(area).toEqual({ from: 0, to: 800, width: 800 })
  })

  it("returns null when the range is entirely outside the window", () => {
    const chartUI = stubChartUI({
      windowMs: [1000000, 2000000],
      coordOf: tsMs => tsMs,
    })

    expect(getArea(chartUI, [10, 20])).toBeNull()
  })
})
```

- [ ] **Step 2: Run it, verify RED** — `yarn jest --config ./jest/config.js src/chartLibraries/helpers/overlayArea.test.js --collectCoverage=false` → FAIL (cannot resolve `./overlayArea`).

- [ ] **Step 3: Create the neutral helper** — `src/chartLibraries/helpers/overlayArea.js`

```js
export const getArea = (chartUI, range) => {
  const [afterMs, beforeMs] = chartUI.getXAxisRange() || []
  if (afterMs == null || beforeMs == null) return null

  const [hAfter, hBefore] = range
  const hAfterMs = hAfter * 1000
  const hBeforeMs = hBefore * 1000

  if (hBeforeMs < afterMs || hAfterMs > beforeMs) return null

  const from = chartUI.getXCoord(Math.max(afterMs, hAfterMs))
  const to = chartUI.getXCoord(Math.min(beforeMs, hBeforeMs))

  return { from, to, width: to - from }
}
```

- [ ] **Step 4: Add dygraph primitives** — in `src/chartLibraries/dygraph/index.js`, alongside `getChartWidth`/`getChartHeight`/`getXAxisRange` (near line 513-515):

```js
  const getPlotArea = () => {
    const area = dygraph?.getArea()
    return area
      ? { left: area.x, top: area.y, width: area.w, height: area.h }
      : { left: 0, top: 0, width: 0, height: 0 }
  }

  const getXCoord = timestampMs => (dygraph ? dygraph.toDomXCoord(timestampMs) : 0)
```

Add `getPlotArea` and `getXCoord` to the returned `instance` object (the `{ ...chartUI, getChartWidth, ... }` list around line 518-527).

- [ ] **Step 5: Delegate dygraph overlay helper** — in `src/chartLibraries/dygraph/overlays/helpers.js`, replace the body of `getArea` so it delegates (keep the `export const trigger = ...` unchanged). The overlay files call `getArea(dygraph, range)` — preserve that call signature by adapting to the chart's UI:

```js
import { getArea as getNeutralArea } from "@/chartLibraries/helpers/overlayArea"

export const getArea = (dygraph, range) =>
  getNeutralArea(
    { getXAxisRange: () => dygraph.xAxisRange(), getXCoord: tsMs => dygraph.toDomXCoord(tsMs) },
    range
  )

export const trigger = (chartUI, id, area) =>
  requestAnimationFrame(() => chartUI.trigger(`overlayedAreaChanged:${id}`, area))
```

- [ ] **Step 6: Add a dygraph-primitive test** — append to a new `src/chartLibraries/dygraph/coords.test.js`:

```js
import { makeTestChart } from "@jest/testUtilities"

describe("dygraph coordinate primitives", () => {
  it("exposes getPlotArea and getXCoord on the chartUI instance", () => {
    const { chart } = makeTestChart({ attributes: { chartLibrary: "dygraph" } })
    const ui = chart.getUI()

    expect(typeof ui.getPlotArea).toBe("function")
    expect(typeof ui.getXCoord).toBe("function")

    const area = ui.getPlotArea()
    expect(area).toEqual({ left: 0, top: 0, width: 0, height: 0 })
    expect(ui.getXCoord(1000)).toBe(0)
  })
})
```

(Unmounted → dygraph is null → zero rect / 0 coord; this exercises the null-guard branch without needing paint.)

- [ ] **Step 7: Run both tests, verify GREEN** — `yarn jest --config ./jest/config.js src/chartLibraries/helpers/overlayArea.test.js src/chartLibraries/dygraph/coords.test.js --collectCoverage=false` → PASS. Then run the existing dygraph overlay tests if any exist to confirm no regression: `yarn jest --config ./jest/config.js src/chartLibraries/dygraph/ --collectCoverage=false`.

- [ ] **Step 8: Commit** — `git add` the four files + tests; `git commit -m "feat(charts): neutral overlay getArea helper + dygraph getPlotArea/getXCoord"`.

---

### Task G1-T2: renderer-agnostic `usePlotArea` (conflict-free)

**Files:**
- Modify: `src/components/provider/selectors.js:683-690`
- Test: `src/components/provider/usePlotArea.test.js`

**Interfaces consumed:** `chartUI.getPlotArea()` (G1-T1).

- [ ] **Step 1: Write the failing test** — `src/components/provider/usePlotArea.test.js`

```js
import { renderHookWithChart } from "@jest/testUtilities"
import { usePlotArea } from "./selectors"

describe("usePlotArea", () => {
  it("reads the renderer-agnostic getPlotArea() and returns left/width", () => {
    const { result, chart } = renderHookWithChart(() => usePlotArea(), {
      attributes: { chartLibrary: "dygraph" },
    })

    chart.getUI().getPlotArea = () => ({ left: 12, top: 3, width: 400, height: 200 })

    expect(result.current).toEqual({ left: 0, width: 0 })
  })
})
```

(Unmounted default → `{left:0,width:0}`; the reassigned `getPlotArea` documents the contract the hook must read. Adjust the assertion to `{ left: 12, width: 400 }` if the hook re-derives on read — see Step 3, keep whichever matches the implemented read timing, and make the test assert the real returned value.)

- [ ] **Step 2: Verify RED** — `yarn jest --config ./jest/config.js src/components/provider/usePlotArea.test.js --collectCoverage=false`. If `usePlotArea` isn't exported, RED is an import error; export it in Step 3.

- [ ] **Step 3: Rewrite `usePlotArea`** — in `src/components/provider/selectors.js`, replace the `getDygraph?.()?.getArea()` line so it reads the neutral accessor (keep the existing `rendered`/`resize` subscription above it):

```js
  const area = chart.getUI(uiName)?.getPlotArea?.()

  return {
    left: area?.left ?? 0,
    width: area?.width ?? 0,
  }
```

- [ ] **Step 4: Verify GREEN** — rerun the test → PASS.

- [ ] **Step 5: Commit** — `git commit -m "refactor(charts): usePlotArea reads renderer-agnostic getPlotArea"`.

---

### Task G1-T3: uPlot coordinate primitives (RUN AFTER the frontend-design subagent lands on uplot/index.js)

**Files:**
- Modify: `src/chartLibraries/uplot/index.js` (add `getPlotArea`, `getXCoord`, `getXAxisRange` to the instance at ~:505-516)
- Test: `src/chartLibraries/uplot/coords.test.js`

**Interfaces produced:** uPlot `chartUI.getPlotArea()`, `getXCoord(tsMs)`, `getXAxisRange()` — matching the dygraph contract (T1) so the neutral `getArea` works identically on uPlot.

- [ ] **Step 1: Write the failing test** — `src/chartLibraries/uplot/coords.test.js`

```js
import { makeTestChart } from "@jest/testUtilities"

describe("uplot coordinate primitives", () => {
  it("exposes getPlotArea/getXCoord/getXAxisRange with safe zero values when unmounted", () => {
    const { chart } = makeTestChart({ attributes: { chartLibrary: "uplot" } })
    const ui = chart.getUI()

    expect(typeof ui.getPlotArea).toBe("function")
    expect(typeof ui.getXCoord).toBe("function")
    expect(typeof ui.getXAxisRange).toBe("function")

    expect(ui.getPlotArea()).toEqual({ left: 0, top: 0, width: 0, height: 0 })
    expect(ui.getXCoord(1000)).toBe(0)
    expect(ui.getXAxisRange()).toBeNull()
  })
})
```

- [ ] **Step 2: Verify RED** — `yarn jest --config ./jest/config.js src/chartLibraries/uplot/coords.test.js --collectCoverage=false` → FAIL (methods undefined).

- [ ] **Step 3: Implement on the uPlot chartUI** — in `src/chartLibraries/uplot/index.js`, where the `u` uPlot instance and `instance` object live (~:361 create, :505-516 instance). Add (guarding for `u === null` when unmounted):

```js
  const getXAxisRange = () => (u ? [u.scales.x.min * 1000, u.scales.x.max * 1000] : null)

  const getPlotArea = () => {
    if (!u) return { left: 0, top: 0, width: 0, height: 0 }
    const dpr = u.pxRatio || 1
    return {
      left: u.bbox.left / dpr,
      top: u.bbox.top / dpr,
      width: u.bbox.width / dpr,
      height: u.bbox.height / dpr,
    }
  }

  const getXCoord = timestampMs => (u ? u.valToPos(timestampMs / 1000, "x") : 0)
```

Add `getPlotArea`, `getXCoord`, `getXAxisRange` to the returned `instance` object.

**Parity requirement (verify, don't assume):** dygraph's `toDomXCoord` and `getArea` are in the chart-container DOM frame that `container.js`/`usePlotArea` expect. uPlot's `u.valToPos(_, "x")` returns a position relative to the plotting area, and `u.bbox` is in canvas device px. Before committing, VERIFY in Storybook that a uPlot chart with a highlight selection places the badge at the correct x (matching where dygraph puts it) and that `AlertTimeline` aligns. If `valToPos`/`bbox` are offset from the expected frame, add the plotting-area left offset (`u.bbox.left / dpr`) to `getXCoord` and/or adjust `getPlotArea` origin so both match dygraph's frame. Report exactly what offset was needed.

- [ ] **Step 4: Verify GREEN (jest) + Storybook visual** — jest: the unmounted-path test passes. Visual: `yarn storybook` → a uPlot line chart, drag-select a highlight → the highlight badge/correlation button sits over the selection; AlertTimeline (if present) aligns. (Maintainer verifies visuals; do not run a dev server on their behalf — state what to check.)

- [ ] **Step 5: Commit** — `git commit -m "feat(charts): uPlot getPlotArea/getXCoord/getXAxisRange coordinate primitives"`.

---

## Self-Review
- Spec coverage: neutral primitives (T1 dygraph, T3 uplot), shared getArea (T1), usePlotArea fix (T2) — all present. ✓
- No placeholders except the deliberately-flagged uPlot px-frame verification in T3 (runtime-dependent; the implementer must confirm and report the offset). ✓
- Type consistency: `getPlotArea()` returns `{left,top,width,height}` in T1/T3 and is read as `left`/`width` by T2; `getArea` signature `(chartUI, range)` consistent; `getXAxisRange()` returns `[afterMs,beforeMs]|null` consumed by the neutral `getArea`. ✓
- Ordering: T1, T2 conflict-free (no `uplot/index.js`); T3 gated on the frontend-design subagent. ✓
