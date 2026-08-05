# uPlot ↔ dygraph parity — audit worklist & handoff

> Branch `explore/uplot-spike`, rebased on `main` @ `5a69d342` (#232). Written 2026-08-05.
> Companion docs: `docs/uplot-prod-parity-gap-map.md` (older P0/P1/P2 map, now superseded by
> this list for open items), `docs/uplot-migration-progress.md` (history + perf protocol).
>
> **Governing rule (revised 2026-08-05 — supersedes "match dygraph exactly"):** feature parity on
> what is achievable, with **no missing data, information or functionality**. "Looks good" is the
> visual bar, *not* pixel-perfect. **Where uPlot is deliberately better, keep the better version —
> the contract matters more than the resemblance.** Making anything slower, heavier or worse for the
> sake of similarity is wrong. dygraph remains the reference for *what the feature is*:
> `src/chartLibraries/dygraph/**` and `node_modules/dygraphs/`.

## State

- Default renderer is **already flipped to uPlot** (`src/makeDefaultSDK.js:42`) on this branch only.
- Suite green: **185 suites / 1899 passing / 2 skipped**. eslint clean.
- Verify with `yarn jest --config ./jest/config.js <path> --collectCoverage=false` and
  `yarn eslint <files>`. Gate every change on the FULL suite + eslint before committing.
- Perf harness: `yarn perf:bench` (full sweep) / `yarn perf:bench:quick`. See §Perf below.

## Decisions taken by the maintainer (2026-08-05)

| # | Decision | Consequence for this list |
|---|---|---|
| D1 | Land **all of §1–§8**, then the perf sweep and screenshot pairs | Nothing in §1–§8 is deferred; commit per gate |
| D2 | Match dygraph's **geometry, line widths, point markers and bar outlines**, but **keep uPlot's area gradient and filled sparkline** | §6: align widths (line 1.5, area 0.7, stacked edge 0.1), suppress auto point markers, add darkened bar outline, align crosshair dash/colour. **Do not** replace `makeAreaFill`'s gradient with dygraph's flat `fillAlpha 0.2`, and **do not** convert sparklines from fill to stroke. Screenshot pairs will differ on these two by design. |
| D3 | Verify in a **real browser** (Playwright) and run the **full** `yarn perf:bench` | Geometry, click routing, touch and the UNVERIFIED timezone claim are browser-gated, not jsdom-gated |
| D4 | **Grep `cloud-frontend` first** for `getPreceded` / chart-bus `highlightEnd`; implement only what is consumed | §7/§8: evidence-gated, not implemented unconditionally |

Additional standing assumptions: the three click tests that encode the inverted contract
(`uplot/index.test.js:936, :953, :1001`) get **rewritten, not deleted**; the uPlot default flip stays
on this branch and is not merged to `main`.

### D5 — the "better wins" ruling, applied item by item

Resolved by verification, no work needed:

- `getPreceded` and chart-bus `highlightEnd` have **no consumer** in `cloud-frontend/src` (grep, zero
  hits) ⇒ both close as N/A.
- `makeAxisTicks` already dispatches to `makeNumericTicks`, which picks base-1024 multipliers for
  binary units (`src/helpers/ticks/index.js:206-210`, `:141-153`) ⇒ nothing to port.
- Geometry needs no rebuild-on-resize: uPlot re-evaluates `padding` functions and calls
  `axis.size(...)` every convergence cycle (`node_modules/uplot/dist/uPlot.cjs.js:4531-4543`, `:4522`).
- Axis font already matches at 10px (`src/sdk/initialAttributes.js:154`).
- dygraph draws **no** y tick marks (`node_modules/dygraphs/src/plugins/axes.js:184-190`) but does draw
  3px x ticks (`:263-266`) and 1px border lines on both sides.

| Item | Decision | Rationale under D5 |
|---|---|---|
| Top pad | `ceil(fontSize/2)` = **5px** | dygraph's `top:0` only works because its labels are DOM divs clamped by `if (top<0) top=0` (`plugins/axes.js:195-196`); uPlot's canvas label would clip. 5px beats both clipping and uPlot's 17px waste |
| X-axis size | **16**, tickSize 3, gap 3 | dygraph's budget exactly, and its label offset is `y + axisTickSize` (`axes.js:271`) |
| Right pad | **0** | Recovers uPlot's 25px `autoPadSide` (`uPlot.cjs.js:1613`, `:3803-3813`). dygraph's `-5` risks clipping the last label for 5px |
| Sparklines | **no padding at all** | 43% of a sparkline's height is currently lost to chrome it never draws |
| `staticValueRange` | **honour exactly — do NOT pad** | The caller's range is a contract. dygraph padding `[0,1000]` to `[-52.8,1052.8]` silently ignores it. Same ruling applies to `includeZero` never overriding an explicit range |
| `yAxisChange` on axis-less charts | **keep firing** | Drives unit conversion (`src/helpers/unitConversion/index.js:110`); dygraph structurally cannot fire it under `drawAxis:false`. Correct units on sparklines is information gained |
| Pan on pointer-leave | **keep the pan alive** | dygraph ends it (`dygraph/navigation/pan.js:10`); that interrupts a legitimate drag |
| X tick cadence | **no change** | dygraph shows *fewer* labels (4 vs 8 on a 119-min window). Porting its granularity table would be work to become worse |
| Y tick density | keep uPlot's `space`, adopt **only** the nice-step logic | Binary stepping (KiB → 32, not 50) is real quality; dygraph's `pixelsPerLabel:15` just doubles gridline paint |
| Heatmap gridlines | keep at labelled rows | One line per bucket costs 100 strokes at 100 buckets and identifies nothing the labels don't |
| Axis border strokes | **add** | Cheap, and an axis should read as an axis |
| Pan cleanup on teardown | emit `panEnd` on `rebuild`, **clear state directly** on `unmount` | Emitting on unmount would fire `chart.moveX` from a teardown (`sdk/plugins/pan.js:8`) |
| Gap-edge points | **implement** | A lone sample between nulls is invisible today — data loss |
| Anomaly-rate badge | **paint on canvas in the gutter** | Verified feasible: `fire("draw")` (`:4891`) runs with no ambient clip; `drawSeries`' clips are balanced (`:4356-4380`). Falls back to a synced DOM node |
| Pinch-zoom | x-only zoom about the midpoint, reusing the wheel→`moveX` path | Restores missing functionality; dygraph's own model is Dygraph-internal and not portable |
| Render-while-loading | **N/A** | `src/components/line/chartContentWrapper.js:171-173` mounts the canvas only when `!initialLoading` and shows `<Skeleton/>` |
| Series styling | keep the area gradient and filled sparkline; align widths (line 2→1.5, area 1.5→0.7, stacked edge 0.1), bar outlines, crosshair dash/colour | D2 plus D5 |
| Browser evidence | commit one `scripts/parity-probe.mjs` | Makes the geometry table re-runnable |
| Screenshots | side-by-side Storybook story + scratchpad PNGs | Durable, reviewable |
| Cadence | commit **and push** per gate; tick items off in this file | This branch lost finished work once already |

## How this list was produced

Four parallel read-only Opus audits, one per domain (dygraph options surface; interaction model;
data path & value ranges; lifecycle/sizing/overlays). Each compared source on both sides and ran
probes against **real** dygraph and **real** uPlot via `makeTestChart`. Everything below carries
`file:line` evidence. Items marked UNVERIFIED were not reproducible and must be confirmed before
being actioned.

## Already fixed on this branch (do not re-report)

| Commit | Fix |
|---|---|
| `4a66b43a` | uPlot re-derives axis config on unit-conversion change (#232 port; `u.redraw()` was a no-op for cached tick strings) |
| `9cc5dc7c` | stepPlot flip re-resolves the path builder |
| `ff0a78d4` | removed uPlot's cursor-level `hoverChart`/`blurChart` (blurred the synced group at the axis gutter) |
| `674e1bcf` | short-chart plot area no longer collapses (`.u-over` was 0px tall ⇒ dead hover) |
| `491b5f09` | uPlot's native cursor suppressed (was drawing a 2nd vertical line, a horizontal line, and DOM points over ours) |
| `b09e95bc` | **P0** collapsed y-range (constant series) — chart never painted, burned 6169ms per render |
| `18125feb` | y-axis rescales to the window (`getValueRange` `{dygraph:true}` flag); series no longer fade to 30% on hover |

---

# OPEN WORK, in recommended order

## 1. Geometry convergence — THE KEYSTONE (do first)

uPlot reserves **67px** of vertical chrome (`defaultTopPad 17` + `defaultXAxisSize 50`,
`uplot/index.js:27-28`) plus a **25px right pad** (uPlot's `autoPadSide` returns
`round(yAxisOpts.size/2)`, `node_modules/uplot/dist/uPlot.cjs.js:3803-3813`).
dygraph reserves ~16px bottom (`axisLabelFontSize 10 + 2*axisTickSize 3`,
`node_modules/dygraphs/src/plugins/axes.js:57-64`), **top = 0**
(`dygraph-layout.js:81-84`), and right `rightGap: -5` (`dygraph/index.js:126`).

Measured plot areas (800px wide, both renderers, same element):

| element height | dygraph top/height | uPlot top/height | height lost |
|---|---|---|---|
| 400 | 0 / 384 | 17 / 333 | 13% |
| 300 | 0 / 284 | 17 / 233 | 18% |
| 200 | 0 / 184 | 17 / 133 | 28% |
| 120 | 0 / 104 | 17 / 53 | 49% |
| 100 | 0 / 84 | 17 / 33 | 61% |

Horizontal: dygraph `left 74, width 731`; uPlot `left 68, width 707`.

**Fixing this also fixes, for free:**
- **All six overlays draw 17px too high.** They assume the plot origin is `y=0` (true for dygraph)
  and draw `0 → h`: `uplot/overlays/alarm.js:29-30`, `alarmRange.js:42,50-51,60-61`,
  `highlight.js:25,30-31`, `alertTransitions.js:67`, `annotation.js:52,93,96`,
  `point.js:56-57` (its line uses `0→h` while its own dots use `top + valToPos` — internally
  inconsistent). Note `plotters/anomaly.js:38` and `plotters/annotations.js:36` already use
  `self.bbox.top` correctly — that is the right idiom.
- **Sparklines lose 43% of their height** to a top pad they should not have (`getAxes` returns
  `[{show:false},{show:false}]` at `uplot/index.js:326`, but the padding at `:1189` still applies).
- **Exact y-range parity is untestable until this lands** — dygraph's pad ratio is `15/284 = 5.28%`
  vs uPlot's `15/233 = 6.44%`, so every correct range still differs ~1%.

**Also required:** the vertical budget is only computed in `create()` (`:1189`) and `getAxes()`
(`:348`); the resize listener (`:1283-1288`) only calls `u.setSize`. Probe: mount 800×300 then
resize to 40px ⇒ `getPlotArea()` = `{top:17, height:-27}` (dygraph: `{top:0, height:24}`).
**The already-shipped short-chart fix is bypassed on the resize path.**

Target: `padding: [0, -5, null, null]`, x-axis `size ≈ 16` (font-derived), y-axis
`size = yAxisLabelWidth + 6`, no padding at all for sparklines, and recompute on resize.

## 2. Stacking cluster (every stacked chart is wrong today)

- **Stack order is REVERSED.** dygraph accumulates last→first (`dygraph.js:2253`
  `for (seriesIdx = num_series; seriesIdx >= 1; seriesIdx--)`; `divergingStack.js:61` resets on the
  last visible series). uPlot accumulates first→last (`stacking.js:6-30`, `bars/stack.js:9-10`).
  Probe with `a=[10,12] b=[20,18]`: dygraph puts **b** at the bottom, uPlot puts **a**. Bands and
  legend order are upside down. Hidden dims must be skipped *before* choosing the base.
- **Stacked y-range always includes zero.** `stacking.js:54-55` seeds `min=0,max=0` and scans
  bases. dygraph uses stack **ends** only (`divergingStack.js:100-107`) and adds zero only under
  `includeZero || (forceIncludeZero && dims>1 && selectedLegendDimensions.length>1)`
  (`dygraph/index.js:386-388`). Probe (a=10–12, b=18–22): dygraph `[17.2, 33.8]`, uPlot `[-2.1, 35.1]`.
- **`staticValueRange` ignored for `chartType:"stacked"`** — `uplot/index.js:268-271` returns the
  stack range before checking it. Probe with `[0,1000]`: dygraph `[-52.8, 1052.8]`, uPlot `[-25, 414]`.
- **Bars use a different algorithm.** `getBarValueRange` (`uplot/index.js:218-246`) always forces
  zero and pads ×1.05; dygraph uses data extremes (multiBar → `default` options, no
  `forceIncludeZero`) or stack ends, then `yRangePad:15`, and pads `staticValueRange` too.
  Probe: multiBar dygraph `[-5.3, 315.3]` vs uPlot `[0, 315]`.
- **stackedBar loses sign separation.** `bars/stack.js:10` uses one accumulator
  (`accum[idx] += +v`, and `+null`→0, `+NaN` poisons it); dygraph splits positive/negative
  (`divergingStack.js:92`). Mixed-sign bars overlap instead of diverging. Fix by reusing
  `stacking.js#getStackBounds`, which already splits signs and guards non-finite.

## 3. Pan-state stranding (HIGH — permanent freeze)

`panEnd` lives only in the `document mouseup` handler (`uplot/index.js:937-944`), which
`detachNavigation()` removes (`:1158-1159, :1169`). Every `rebuild()` and `unmount()` calls it.
Probe A: mousedown+mousemove, then `chart.updateAttribute("theme","dark")`, then mouseup ⇒ only
`panStart` fired, `panning === true` stuck. Probe B: unmount mid-pan ⇒ `panning:true`; remount ⇒
`getXAxisRange() === null` — **the chart never renders again** (`render()` bails on `panning`,
`:1246`). `sdk/plugins/pan.js:5` also leaves `enabledHover:false`.
Note: **this got easier to hit** because `stepPlot` and `unitsConversion*` now trigger `rebuild`.
Fix: on `destroyChart()`/`unmount()`, terminate any active gesture (emit the end event, or at
minimum clear `panning`/`highlighting`/`xRangeOverride`) before detaching.
dygraph also ends a pan on `mouseout` (`navigation/pan.js:10`) — uPlot does not (P7 below).

## 4. Click semantics (HIGH — inverted today)

- **Click-to-annotate is inverted.** With the shipped default `navigation:"pan"`, clicking a uPlot
  chart does **nothing**; with shift/alt (select/highlight) it creates a **spurious** annotation
  dygraph never creates. Cause: `over.addEventListener("mousedown", onDown)` (`:1138`) runs before
  `onDownTrack` (`:1139`), and `sdk/plugins/pan.js:2-6` sets `enabledHover:false` synchronously
  inside `onDown`, so `onUpTrack`'s `enabledHover` check reads the wrong value.
  dygraph routes clicks only through `endPan` (`dygraph-interaction-model.js:236, 303-361`).
  Fix: gate `onUpTrack` on `navigation === "pan"`, and capture hover-enabled state before `onDown`.
  **This inverts existing tests** at `uplot/index.test.js:936, :953, :1001`, which encode the wrong
  contract.
- **Wrong dimension + unsnapped timestamp.** `uplot/index.js:998` always uses
  `getVisibleDimensionIds()[0]`; dygraph picks the closest series / ANNOTATIONS / ANOMALY_RATE band
  (`dygraph/hoverX.js:132-148`). Timestamp: dygraph snaps to a row (`g.lastx_`), uPlot uses raw
  `posToVal` (`:994`). Fix: reuse the existing `getHoverDimension(u)` (`uplot/hover.js:115-132`)
  and snap via `chart.getClosestRow`.

## 5. Axis rendering

- **y-axis ticker bypassed for non-duration axes.** dygraph always installs `numericTicker`
  (`dygraph/index.js:282-285`) with `pixelsPerLabel:15` (`:407`), which selects **binary**
  multipliers (base 1024) for KiB/MiB (`helpers/ticks/index.js:142-152`). uPlot only uses
  `makeAxisTicks` when `isDurationAxis` (`uplot/index.js:384-393`), otherwise uPlot's default
  `space:30`. Probe: KiB ⇒ dygraph step **32**, uPlot step **50**; and roughly half the gridlines
  everywhere.
- **No axis baseline strokes.** dygraph draws a 1px `axisLineColor` line down the left and along
  the bottom (`dygraph/index.js:113, 418`; `plugins/axes.js:231-237, 289-296`). uPlot:
  `axes[].border.show === false`. Fix: `border: { show: true, stroke: gridColor, width: 1 }`.
- **Heatmap**: range unpadded (`getHeatmapValueRange` `:196-201` bypasses `padYRange`) so the bottom
  row is half-clipped; and gridlines only at labelled rows — dygraph draws one per bucket
  (`tickers/heatmap.js:13-16`).
- **`includeZero` applied on top of an explicit range.** `uplot/index.js:279-282` applies it after
  `rangeMin` is taken; dygraph applies it only while computing auto extremes
  (`dygraph.js:2555-2558`) and then overwrites with the user range (`:2592-2596`). Probe
  (`includeZero:true`, `staticValueRange:[50,100]`): dygraph `[47.4, 102.6]`, uPlot `[-6.4, 106.4]`.
- **`yAxisChange` fires when the y-axis is disabled.** dygraph's trigger lives inside the axis
  label formatter, which never runs with `drawAxis:false`. uPlot's `fireYAxisChange` is an
  unconditional draw hook (`:1202`). It drives unit conversion, so units can change on axis-less
  charts.
- **x-axis tick cadence differs**: dygraph `pixelsPerLabel:70` + its granularity table vs uPlot
  `space:80` + `timeIncrs`. 119-min window ⇒ dygraph 4 labels, uPlot 8.

## 6. Series styling

- **area**: dygraph flat `fillAlpha 0.2` under a **0.7px** line (`dygraph/index.js:250-251, 306`);
  uPlot a top→bottom gradient (`makeAreaFill`, `:67-73`, `areaGradientTopAlpha "59"`) under a
  **1.5px** line. Line width also differs for `line` (dygraph 1.5 vs uPlot 2) and stacked edges
  (dygraph `strokeWidth 0.1` vs uPlot `devicePixelRatio`, `:468`).
- **sparkline**: dygraph *strokes* (fillGraph stays false, `strokeWidth:0` renders as a 1px line);
  uPlot *fills* with a solid colour (`:177-179`). Probe draw ops: dygraph `{stroke:6, fill:0}`,
  uPlot `{fill:3, stroke:0}`. **Confirm the intended look with the maintainer before changing.**
- **bars have no darkened outline**: dygraph `strokeRect` with `darkenColor`
  (`plotters/multiColumnBar.js:20,31`, `plotters/stackedBar.js:39,50`); uPlot only `fillRect`
  (`:559, :588`).
- **click crosshair style**: dygraph click = `themeNetdata` + dash `[2,2]`, hover = `themeCrosshair`
  + `[5,5]` (`dygraph/crosshair.js:2-11`). uPlot uses `themeCrosshair` solid for click and `[4,4]`
  for hover (`:690-691`).
- **point markers**: uPlot auto-shows a dot per sample on sparse data (uPlot's density default);
  dygraph never does for `chartType:"line"`. Conversely dygraph draws **gap-edge** points on
  `area`/`stepPlot` (`drawGapEdgePoints:true`, `dygraph/index.js:117`) and uPlot draws none, so a
  lone sample between nulls is invisible. Fix: `points:{show:false}` for line/area, plus an
  explicit gap-edge `points.filter` if that parity is wanted.

## 7. Lifecycle hygiene

- **`mount()` is not idempotent while loading.** `if (u) return` (`:1268`) never fires because `u`
  stays null when `empty && !loaded`. Probe: two mounts ⇒ `mountChartUI` 2×, ResizeObserver
  `observe:2 / disconnect:1`; after one unmount the orphaned `theme` listener throws
  `Cannot read properties of null (reading 'classList')` at `:1312` — inside a `Set.forEach`, so
  **every later theme listener on that chart is skipped**. Fix: guard on `element`, null-guard the
  theme handler.
- **`unmount()` on a never-mounted instance fires `unmountChartUI`** (dygraph guards with
  `if (!dygraph) return`, `:481`). Reachable via `makeControllers.js:144,153,337`.
- **Nothing renders while loading**: dygraph always constructs with `[[0]]`/`["X"]`
  (`dygraph/index.js:63-69`); uPlot bails (`:1179`) so `overlays/proceeded.js:5` never emits and the
  loading/error box never appears. **Note:** in the normal app path `chartContentWrapper.js:171-173`
  only mounts `ChartContainer` when `!initialLoading`, so this may be unreachable in production —
  verify before fixing.
- **Empty/out-of-limits charts** get only `drawClear`+`setCursor` hooks (`:1195-1196`), so
  drag-select yields `highlightEnd:null` and `yAxisChange` never fires.
- **`getPreceded` missing** from uPlot's surface (`dygraph/index.js:522-532`). No in-repo caller;
  check `cloud-frontend` before closing as N/A.
- **`getChartHeight()` fallback** differs: dygraph `100`, uPlot `offsetHeight`/300. Feeds
  `overlays/latestValue.js:27` text sizing.
- `render()` calls `chartUI.render()` at `:1248` *before* it can `return false` at `:1253`, so a
  declined frame can still be marked clean. dygraph marks last (`:517`). Only reachable pre-load.

## 8. Interaction odds and ends

- **Pinch-zoom missing** — only `touches[0]` is used (`:1011-1044`), so a two-finger pinch is
  misread as a pan. dygraph delegates to Dygraph's touch model with `touchDirections {x:true,y:false}`
  (`navigation/generic.js:104-119`).
- **Touch events not `preventDefault`ed** except `touchmove` (`:1033`), so every tap also runs the
  synthetic mouse path (and a double-tap resets twice). dygraph prevents all three on the element
  (`dygraph/index.js:142-150`).
- **`highlightHover` fires per pixel** — 20 events per 20px sweep vs dygraph's 1. dygraph dedupes on
  row change (`hoverX.js:82`) plus a 5px dead zone (`:150-152`).
- **Missing chart-level `highlightEnd`** — dygraph fires on both buses (`navigation/select.js:62-63`),
  uPlot only on the sdk bus (`:847`). No in-repo consumer; `cloud-frontend` may have one.
- **Double-click resets even when `enabledNavigation:false`** (`:954` always attached; dygraph
  registers it only while navigation is enabled).
- **Shift/Alt+wheel over the gutter swallows the scroll** without zooming — `preventDefault()` at
  `:862` runs before the `left < 0` bail at `:866-867`.
- **Pan does not end when the pointer leaves the chart** (dygraph: `navigation/pan.js:10`).
- Wheel debounce 300ms vs dygraph 500ms; no `stopPropagation` (dygraph has it,
  `navigation/generic.js:50`). Click dead zone 5px latched vs dygraph 2px measured at mouseup.

## Divergences where uPlot is BETTER — record, do not "fix"

- Right-click + modifier does not hijack navigation (dygraph has no button filter).
- Mouseup outside ends a selection (dygraph leaves `highlighting:true`/`enabledHover:false` stuck).
- The chart stays drawn during a drag-select (dygraph blanks the canvas every mousemove,
  `navigation/select.js:38`).
- Navigation restore is document-scoped and `prevNavigation` survives nested switches.

## UNVERIFIED — confirm before acting

- **Timezone change leaves uPlot's x-labels stale.** Mechanism is plausible (`u.redraw()` sets
  `shouldConvergeSize=false`, so `axis._values` is never rebuilt — the same hazard fixed for
  `unitsConversionBase`), but in jsdom **neither** renderer refreshed its labels, so no divergence
  was demonstrated. Needs a browser check.
- `logscale` is never set anywhere in `src/` — treated as N/A.

---

# Still owed (non-audit)

1. **Two deferrals the maintainer asked for** (tasks #2/#3): port dygraph's stacked-area per-pixel
   point reduction (`dygraph/plotters/stackedArea.js:73-115` — note it must respect the corrected
   stack order from §2), and the anomaly-rate y-axis badge (`tickers/numeric.js:62`, injected as
   SVG into an HTML axis label; uPlot paints axes on canvas so this needs a Path2D in the gutter or
   a resynced DOM node).
2. **Authoritative perf sweep.** Harness is committed and both hover scenarios work. The last sweep
   was stopped at 55/240 because it measured a pre-fix build and geometry work will invalidate it.
   Re-run `yarn perf:bench` once §1–§2 land. Prior valid result (idle only, render-count matched):
   uPlot totals **0.52–0.96×** dygraph, margin narrowing toward parity as dimension count grows;
   **3.7× cheaper per render on stacked**. Earlier hover numbers were **retracted** — they measured
   uPlot doing nothing (0px plot area, 0 hoverX writes).
3. **Screenshot pairs** (task #5) for maintainer visual review.
4. **Real-dashboard measurement** — `yarn to-cloud` + the protocol in
   `docs/uplot-migration-progress.md`. Maintainer's environment.

# Session gotchas worth keeping

- **Never leave verified work uncommitted.** An out-of-session `git reset` + branch switch wiped a
  finished, green change once; only the commit would have saved it. Commit immediately after each
  gate, then push.
- **Don't rebuild Storybook while a sweep is running** — `perf-bench.mjs` serves `storybook-static`
  from disk and a rebuild swaps files mid-measurement.
- **Subagents stalled or no-op'd ~5 times** (watchdog at 600s, transient API 529s). For small,
  fully-specified changes it is faster to implement directly. Give agents the already-fixed list so
  they don't re-report.
- **jsdom cannot settle geometry or visibility.** Anything about layout, pointer hit-testing or
  paint must be verified in a real browser (Playwright is now a devDependency; probe scripts pattern
  is in the session scratchpad — serve `storybook-static`, open `iframe.html?id=perf-benchmark--benchmark&args=...`).
- `makeMockPayload` emits `data.length` rows and ignores the requested point count; the shared
  fixture is only 231 rows × 3 dims. The perf story now generates synthetic payloads sized by
  `rows`/`dims` args.
- Hover **disables autofetch by default** (`autofetchOnHovering:false` ⇒ `play.js` clears the render
  tick), so "hover renders" are 0 for both renderers unless the story opts in.
