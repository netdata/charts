# SRE Exploration Audit — @netdata/charts

**Date:** 2026-07-30
**Branch:** `explore/uplot-spike`
**Method:** 7 parallel dedicated audit agents, one per domain. Every finding is backed by a `file:line` citation read from the working tree. Items an agent could not confirm end-to-end are marked **UNVERIFIED**. Severities are as rated by each domain agent; the "Fix-first" and "Quick wins" sections re-rank by real user/operational impact × effort.

Effort key: **S** = <½ day · **M** = 1–2 days · **L** = multi-day.

---

## Executive summary

The SDK is architecturally strong: a lightweight attribute event-bus, coalesced renders (`makeExecuteLatest`), memoized date windows, cached closest-row lookups, and largely symmetric mount/unmount teardown. The chart shell (header, settings drawer, hover popover, legend, navigation, annotations) is deep and genuinely well-built, and the dygraph→uPlot migration has reached broad functional parity with the old gap-map superseded.

The problems are concentrated in four bands:

1. **Correctness bugs users hit today** — a filter-sort attribute collision, a "reset zoom" that jumps to a wrong 15-minute window, flat/constant-value series rendering blank on uPlot, and no React error boundary anywhere.
2. **Reliability gaps** — the primary chart fetch has no client-side timeout (a hung request wedges live updates), and a malformed payload throws uncaught inside an untry/catch'd `setTimeout`, permanently stranding a chart in `loading:true`. The robust, validated `dataQuery` transport that solves both exists but is not wired to the chart hot path.
3. **Operational/quality guardrails** — CI cannot fail a PR (no `pull_request` trigger, `continue-on-error: true`, no lint step), a critical render-path dependency (`lodash`) is undeclared, and the no-mock rule is violated on the default production renderer.
4. **Design & accessibility baseline** — the default series palette is Google Charts' stock palette verbatim (with a duplicate color), light/dark theming has real gaps, and accessibility is weak across the board (mouse-only interaction, unlabeled icon buttons, no text alternative for canvas charts).

**Is the UI amazing?** Not yet — **competent, not amazing.** Craft is clearly *possible* (the hover tooltip and `showcase.stories.js` are Grafana/Datadog-tier) but it is not the baseline. See the UI verdict section.

---

## Cross-cutting themes (deduplicated across agents)

| Theme | Hit by | Consolidated action |
|---|---|---|
| Robust `dataQuery` path exists but chart hot path uses a weaker one (no timeout, partial error-key handling) | SDK #1, #4, #14 | Converge chart fetch onto validated transport, or at minimum adopt its timeout + dual error-key handling |
| Two charting engines (`dygraphs` + `uplot`) shipped simultaneously | Perf #7, Testing #10 | Track dygraphs removal as an explicit exit criterion post-flip |
| d3pie imports the full `d3` meta-package for one vendored file | Perf #6, Testing #9 | Replace with targeted submodule imports; drop `d3` umbrella dep |
| Keyboard focus ring missing / merged with hover | A11y #9, Visual #7 | Give `:focus-visible` its own ring on the shared icon `Button` |
| `moveXDebounced` not cancelled on uPlot unmount | Charts #4, Perf note | `moveXDebounced.cancel()` in `unmount`/`destroyChart` |
| Canvas charts + interactions are mouse-only, no a11y fallback | A11y #1/#2, Components #7 (groupBoxes) | Focusable containers, keyboard entry to `focus`, `role="img"`+`aria-label` |
| Loading skeleton inconsistent across tile types | Components #6/#16, Visual note | Reuse the existing `Skeleton` pattern on number/bars/table |
| Commented-out / dead feature scaffolding left in `main` | Components #6/#14/#15, Testing #16 | Finish or delete (Table actions, drawer Point tab, `Config`, dead attrs) |

---

## Fix-first (highest impact — do these before flipping the default renderer)

1. **Filter-sort collision corrupts Nodes ↔ Dimensions sort** — `src/components/filterToolbox/dimensions.js:52` binds to `nodesSortBy`; the intended `dimensionsSortBy` (`initialAttributes.js:162`) is never read. *(Components #1 · P0 · S · quick win)*
2. **"Reset zoom" jumps to a hard-coded 15-min window** — `src/sdk/makeNode.js:169-176` calls `moveX(-900)`; initial range isn't pristine-tracked, and `navigationToolbox/index.js:50` mis-enables via `disabled={after === -900}`. *(Components #2 · P0 · S · quick win)*
3. **Flat/constant-value series render blank on uPlot** — `src/chartLibraries/uplot/index.js:86-97` `padYRange` returns a zero span; uPlot then divides by zero → `NaN` pixel positions. dygraph is handed `[null,null]` and self-expands. Common Netdata case (idle CPU, zero errors). *(Charts #1 · P1 · S · quick win)*
4. **No client-side fetch timeout on the chart hot path** — `src/sdk/makeChart/api/fetchAgentData.js:11-14` / `fetchCloudData.js:11-14` omit `timeoutMs`; a hung request never rejects, autofetch bails (`makeChart/index.js:112`), backoff never engages. *(SDK #1 · P1 · S · quick win)*
5. **Malformed payload permanently wedges a chart** — `src/sdk/makeChart/camelizePayload.js:207-209` unguarded node lookup throws inside the untry/catch'd `setTimeout` in `makeDataFetch.js:127-180` → stuck `loading:true`. *(SDK #2 · P1 · S · quick win)*
6. **No React error boundary anywhere** — `grep` for ErrorBoundary/componentDidCatch/getDerivedStateFromError = 0. A render throw in a chart lib propagates to the host dashboard. *(Components #3 · P0 · M)*
7. **CI cannot fail a PR** — `.github/workflows/tests.yml` has no `pull_request` trigger, runs tests with `continue-on-error: true`, and never runs `yarn lint`. *(Testing #2 · P0 · S · quick win)*
8. **Phantom `lodash` dependency** — imported in `src/sdk/makeChart/makeDimensions.js:12-13` (+4 files) but absent from `package.json`; works only via transitive hoisting. *(Testing #3 · P0 · S · quick win)*
9. **uPlot hover redraw recomputes full-series geometry per mouse-move, fanned across every synced chart** — `src/sdk/plugins/hover.js:3-6` updates `hoverX` on every synced chart → `uplot/index.js:1215` `u.redraw()` re-fires `drawStacked`/`drawHeatmap`/`drawBars` (each rebuilds stack bounds / a d3 scale / bar stacks). Amplified by a selector layer with no value bail-out (`provider/selectors.js:23-31`). *(Perf #1 · P0 for uPlot path · M; partial quick win: memoize `makeGetColor` + `stackBounds`)*
10. **No-mock rule violated on the default production engine** — `src/chartLibraries/dygraph/index.test.js:16` fully mocks `dygraphs`; `src/mount.test.js:6-7` mocks `react-dom/client` + `Line`. *(Testing #1/#4 · P0/P1 · M/S)*

---

## Quick-wins hit-list (S effort, high value — safe to batch)

**Correctness / reliability**
- Filter-sort collision one-liner (`dimensions.js:52` → `dimensionsSortBy`). *(Components #1)*
- Reset-zoom to pristine range instead of `-900`. *(Components #2)*
- `padYRange` flat-series guard + unit test. *(Charts #1)*
- Thread a fetch timeout into `fetchChartData`. *(SDK #1)*
- Guard `camelizePayload` node lookup + wrap `doneFetch` transform in try/catch → `failFetch`. *(SDK #2)*
- Recognize `errorMessage`-only payloads in `makeDataFetch.js:263`. *(SDK #4)*
- `makeListeners.trigger` once-handling bug — delete from both sets in place, don't reassign to `forEach` return. *(SDK #3)*
- `makeKeyboardListener` unregister-by-identity instead of stale captured index. *(SDK #7)*
- `parseDOM.js:24-29` — `return JSON.parse(value)` on success. *(SDK #8)*
- `makeContainer.removeChild` emits wrong node/type. *(SDK #6)*
- `moveXDebounced.cancel()` on uPlot unmount. *(Charts #4 / Perf note)*
- Cancel the `setTimeout(forceUpdate, 300)` in `useOnResize`/`usePlotArea` on teardown. *(Perf #8)*
- Symmetric dygraph touch-listener removal in `unmount()`. *(Perf #9)*

**Dependencies / build / docs**
- Add `pull_request` trigger, drop `continue-on-error`, add `yarn lint` to CI. *(Testing #2)*
- Declare `lodash`, `@testing-library/user-event`, `scheduler` (or replace `unstable_shouldYield`). *(Testing #3/#11)*
- Remove dead devDeps `babel-eslint`, `raw-loader`, `sass-loader`. *(Testing #12)*
- Fix Storybook config's 3 missing loaders (add or delete rules). *(Testing #7)*
- Fix CLAUDE.md/AGENTS.md "1% coverage" claim → actual 50/40/47/50. *(Testing #8)*
- Archive the 16 stale `docs/uplot-*.md` phase plans. *(Testing #15)*
- Add `groupBoxes` render-path test. *(Testing #6)*
- `mount.test.js` — real `createRoot` + real `Line`. *(Testing #4)*

**UX**
- Enable `hasSearch` on the six primary filter dropdowns (`dropdownTable.js:214`). *(Components #8)*
- Loading indicator in Compare/DrillDown drawers (the `loading` value is currently discarded). *(Components #4)*
- ESC-to-exit fullscreen + persistent exit affordance. *(Components #10)*
- Inline validation on the custom compare-period form (silent no-op today). *(Components #12)*
- Error-badge truncation + `title` for long messages. *(Components #17)*
- Loading skeleton on number/bars tiles. *(Components #16)*
- Remove dead attributes (`hasYlabel`, `toolboxProps`, `compareData`) + commented scaffolding. *(Components #14/#15)*
- Floating filter toolbox: low-but-nonzero opacity instead of fully hidden. *(Components #11)*

**Design / a11y**
- Forward `aria-label={title}` in `withTooltip` — labels ~32 icon buttons in one edit. *(A11y #3)*
- `role="img"` + `aria-label` on `chartContainer.js`. *(A11y #1 partial)*
- `:focus-visible` ring on the shared icon `Button`. *(A11y #9 / Visual #7)*
- Wrap infinite animations in `prefers-reduced-motion`. *(A11y #8)*
- Chart title as heading + `aria-labelledby`. *(A11y #5)*
- Fix `tabindex="-1"` → `tabIndex={-1}` in `dropdownTable.js:77`. *(A11y #7 partial)*
- `font-variant-numeric: tabular-nums` on the live `Value` component (stops digit jitter). *(Visual #6)*
- Replace hardcoded light-mode shadow with `getColor("themeShadow")` in hover popover + groupBox popover. *(Visual #3)*
- De-duplicate the palette (`dimensionColors.js:8` vs `:21`) and tune warning/error dark-mode variants. *(Visual #2/#4)*
- Nudge dark-mode grid color lighter for hairline parity. *(Visual #5)*
- Replace raw inline styles in `index.stories.js:590/632/639` with design-system text. *(Visual #8)*

---

## Full findings by domain

### A. Chart libraries & parity (Opus)

- **A1 · P1 · S · quick win — Flat/constant-value series render blank on uPlot.** `uplot/index.js:86-97` (`padYRange` zero-span bail), `:269-278` (y-scale range), `initialAttributes.js:37-41` (`includeZero` not defaulted); uPlot applies custom range verbatim with no equal-extreme guard (`uPlot.esm.js:3008-3009`). Fix: expand around the value (`uPlot.rangeNum` or ±5%).
- **A2 · P2 · S–M · quick win — Synced hover dots draw at raw values on stacked/stackedBar.** `uplot/index.js:624-664` plots raw per-dim value; only `heatmap` early-returns. Fix: use stacked bounds / `stack()` tops per chartType.
- **A3 · P2 · S · quick win — `bars/index.js` is byte-for-byte identical to `number/index.js`.** Both registered separately (`makeDefaultSDK.js:26`). Fix: re-export or extract a shared value-chart factory.
- **A4 · P2 · S · quick win — `moveXDebounced` not cancelled on unmount.** `uplot/index.js:791-794`, cancelled on pan start but not in `unmount` (`:1239-1247`); a pan/wheel ending <300ms before unmount fires `chart.moveX` post-destroy.
- **A5 · P2 · M (only if productized) — Log-scale exists only in dygraph, currently unreachable.** `dygraph/reusableLineDataHandler.js:8-13`; no code sets `logscale` (dead capability). If productized, build on uPlot `scales.y.distr=3`.
- **A6 · P2 · S · quick win — X-axis midnight→date switch uses browser-local time, not chart timezone.** `makeIntls.js:59-62` uses `date.getHours()` local getters while labels format with configured `timeZone`. Shared bug (both renderers); verify DST edges.
- **A7 · P2 · n/a — Documented deferrals confirmed accurate** (not new gaps): stacked-area per-pixel point reduction (perf-only), anomaly-rate y-axis SVG hexagon badge (cosmetic). Leave deferred.
- Verified NOT problems: heatmap on uPlot implemented; bar negatives no longer clipped; nearest-series hover implemented; diverging stacking correct; empty/single-point paths safe. **UNVERIFIED:** did not run the suite; "1575 passing" and perf ratios taken from docs at face value.

### B. SDK core, data pipeline & plugins (Opus)

- **B1 · P1 · S · quick win — No client-side timeout on primary fetch.** `fetchAgentData.js:11-14` / `fetchCloudData.js:11-14`; transport skips timeout when `timeoutMs` absent (`transport.js:25`). Hung request → `loading` stuck true, autofetch bails (`makeChart/index.js:112`), backoff never runs.
- **B2 · P1 · S · quick win — Malformed payload crashes transform, wedges chart.** `camelizePayload.js:207,209` unguarded `nodes[nodesIndexes[i.ni]]`; thrown inside untry/catch'd `setTimeout` (`makeDataFetch.js:127-180`).
- **B3 · P2 · S · quick win — `makeListeners.trigger` detaches all regular listeners for any event with a `once` listener.** `makeListeners/index.js:44-47` reassigns map entry to `forEach` return (`undefined`). Latent (fires on `"loaded"`) but wrong.
- **B4 · P2 · S · quick win — Error path ignores `errorMessage`-only payloads.** `makeDataFetch.js:263` checks only `errorMsgKey`; real server message discarded → generic "Something went wrong".
- **B5 · P2 · S · quick win — `deepMerge` is broken** (`deepMerge/index.js:12-26` no return; array branch merges element against itself). No production consumers; fix or delete.
- **B6 · P2 · S · quick win — `makeContainer.removeChild` emits wrong node & type.** `makeContainer.js:16-22` fires with container node, always `"containerRemoved"`. Latent (no consumers).
- **B7 · P2 · S · quick win — `makeKeyboardListener` unregister splices by stale captured index.** `makeKeyboardListener/index.js:42-44`. Remove by identity / use a Set.
- **B8 · P2 · S · quick win — `parseDOM` parses JSON then discards it.** `parseDOM.js:24-29`; array/object `data-*` stay raw strings.
- **B9 · P2 · M — Pan/select/highlight leave `enabledHover:false` if end event missed.** `pan.js:5,12`; `makeChartUI.unmount` (`makeChartUI.js:56-65`) removes handlers without firing `panEnd`; state persists across virtualization. Reset transient interaction attrs on unmount. **UNVERIFIED** end-to-end race; missing safety-reset is verified.
- **B10 · P2 · S · quick win (listener try/catch) — No error isolation in event dispatch; sync request-build errors bypass `.catch(failFetch)`.** `makeListeners/index.js:39`; `fetchAgentData.js:6-9` sync `buildDataRequest` throw escapes the promise catch.
- **B11 · P2 · S · quick win — `loading` flickers false while replacement fetch in flight.** `makeDataFetch.js:283/311/209-211`; clear `loading` on abort only if the aborted controller is still current.
- **B12 · P2 · S · quick win — `deepEqual` drops `omit/keep` options on recursion.** `deepEqual/index.js:32`; confirm intent (used by pristine/controllers/dimensions).
- **B13 · P2 · S · quick win — `makeExecuteLatest` accumulates fired timeout ids.** `makeExecuteLatest/index.js:6-13`; `ids.delete(id)` at callback start.
- **B14 · P2 · L — Validated `dataQuery` pipeline not wired to chart hot path.** `dataQuery/index.js` has zero in-repo consumers of `queryData`; chart path is the weaker, diverged one. Converge or adopt its timeout + dual error handling. Verify external consumers before deleting.
- Handled well (verified): `perfMonitor`, `play.js`, `makeResizeObserver`, validated `transport.js`, `makeIntls` fallback, end-to-end `error` state.

### C. Components, interactions & UX (Sonnet)

- **C1 · P0 · S · quick win — Dimensions filter sort wired to `nodesSortBy`.** `filterToolbox/dimensions.js:52`; `dimensionsSortBy` never read.
- **C2 · P0 · S · quick win — "Reset zoom" hard-codes `moveX(-900)`.** `makeNode.js:169-176`; not pristine-tracked; `navigationToolbox/index.js:50` mis-enables.
- **C3 · P0 · M — No React error boundary.** Wrap each tile (`withChart`/`withTile`) in a per-chart error boundary.
- **C4 · P1 · S · quick win — Compare/DrillDown drawers: no loading feedback.** `compare/index.js:180` discards `loading`; `compareLoading` set but never read; DrillDown uses `loading` only to suppress empty state. Correlate does it right.
- **C5 · P1 · M — `anomalyIcon` + `alertTimeline` built but unregistered.** Not in `makeDefaultSDK.js:26`; only referenced by tests/stories. Register or remove.
- **C6 · P1 · M — Table row selection/bulk/row actions scaffolded but commented out.** `table/index.js:60-82`; no pagination/virtualization for large sets; no loading skeleton.
- **C7 · P1 · M (empty-state S) — groupBoxes: no empty/error state, mouse-only.** `groupBoxes.js:89`; canvas (`groupBox.js:101`) wires only mouse events (`events.js:54-55`); no ARIA/keyboard.
- **C8 · P1 · S · quick win — Search disabled on all six primary filter dropdowns.** `dropdownTable.js:214` `hasSearch={false}`; capability used in `hostLabelsFilter.js:159`.
- **C9 · P1 · M — `withDeferredMount` doesn't defer.** `withDeferredMount.js:5`; no component passes `isVisible`, no IntersectionObserver. Wire an observer or rename/document.
- **C10 · P1 · S · quick win — Fullscreen is a CSS overlay, not the Fullscreen API.** `withFullscreen.js:5-17`; no `requestFullscreen`/ESC handler.
- **C11 · P1 · S · quick win — Floating filter toolbox invisible + non-interactive until hover.** `filtersContainer.js:6-21,38`.
- **C12 · P1 · S · quick win — Custom compare-period form fails silently on invalid input.** `customPeriodForm.js:41,44`.
- **C13 · P2 · S · quick win — `Details` panel never renders built `ChartType` row; no self-close.** `details/index.js`; `details/chartType.js` unused.
- **C14 · P2 · S · quick win — Dead attributes + half-shipped `Config` modal.** `hasYlabel`/`toolboxProps`/`compareData` (`initialAttributes.js:149/245/317`); `filters.js:17` commented `Config` import.
- **C15 · P2 · S · quick win — Commented-out JSX in drawer** (Point tab `drawer/header/index.js:82-87`; dimensions-drawer BarsChart/columns).
- **C16 · P2 · S · quick win — number/bars tiles show no loading skeleton** (unlike gauge/d3pie/easyPie).
- **C17 · P2 · S · quick win — Error badge has no truncation for long messages.** `status/index.js:28-34` + `line/badge.js:32-35`; header is fixed `25px`.
- **C18 · P2 · S · quick win — Standalone Information/Download/ChartType toolbox buttons excluded from default `toolboxElements`.** `initialAttributes.js:244`. Low impact (Settings covers it).

### D. Visual design quality (Sonnet)

- **D1 · P0 · M — Default series palette is Google Charts' stock palette verbatim.** `dimensionColors.js:1-22`. Commission a bespoke palette anchored to brand green (`#00AB44`). Single highest-value "does this look designed" change.
- **D2 · P1 · S · quick win — Palette has an exact duplicate color** (`dimensionColors.js:8` `#3B3EAC` vs `:21` `#3B3EAC`) and one entry with identical light/dark (`:20`).
- **D3 · P1 · S · quick win — Hover-tooltip + groupBox popover shadows hardcode the light-mode shadow.** `line/popover/dimensions.js:23-25`, `groupBoxes/popover/labels.js:17-19`; use `getColor("themeShadow")` (as `withTile.js:103,118` does).
- **D4 · P2 · S · quick win — Warning/error backgrounds have zero light/dark adaptation.** `initialAttributes.js:222-223`.
- **D5 · P2 · S · quick win — Dark-mode gridlines have ~⅓ the separation of light-mode.** Computed 1.24:1 (light) vs 1.08:1 (dark) from `initialAttributes.js:199` vs `:220`. Derived from source hex, not a pixel observation.
- **D6 · P1 · S · quick win — Live numbers not tabular-nums.** `line/dimensions/value.js:5-7`; `showcase.stories.js:312-317` proves the team knows the technique. Fixes digit jitter each tick.
- **D7 · P1 · S · quick win — Focus deliberately merged with hover, outline removed.** `download.js:27-31` (only `:focus-visible` in the repo); icon `Button` (`icon/button.js:12-56`) has no focus style.
- **D8 · P2 · S · quick win — Flagship story uses raw inline styles.** `index.stories.js:590/632/639` hardcode `#666`/`#888`, won't follow the theme toolbar.
- **D9 · P2 · M — Bars render as flat rectangles while areas/gauge get gradients.** `dygraph/plotters/multiColumnBar.js:30` vs `uplot/index.js:63-69` / `gauge/index.js:8-26`.
- Worth preserving (verified): hover tooltip density (`line/popover/dimension.js:25-31`), bespoke `showcase.stories.js`, per-theme series colors (`makeDimensions.js:342-343`), pulsing sparkline skeleton, rounded legend swatches. **UNVERIFIED:** rendered text sizes (defined in sibling netdata-ui) and whether the icon Button inherits a focus ring from a global reset.

### E. Accessibility (Opus)

Repo-wide: only **6 `aria-*`, 2 `role=`, 1 `tabIndex`, 0 `alt=`, 0 `aria-live`, 0 `prefers-reduced-motion`** in `src/` (excl. tests).

- **E1 · P0 · L (partial S) — Canvas charts expose no text alternative / accessible name.** `grep` over `chartLibraries/` = 0 aria/role; `chartContainer.js:14-23` bare div; `gauge/index.js:152` naked canvas. Add `role="img"`+`aria-label` (pattern exists at `correlate/sparklineCanvas.js:101-102`); offer data-table fallback + `aria-live`.
- **E2 · P0 · L — Interactions entirely mouse-gated.** `focused` set only by mouse (`useHover.js:36-37`, `line/index.js:25-35`); toolbox mounts only on hover (`chartContentWrapper.js:174`); header buttons disabled off-hover (`toolbox/index.js:24`); keyboard shortcuts only register while focused (`makeChart/index.js:315-318`). Make container `tabIndex={0}`, set `focused` on DOM focus.
- **E3 · P0 · S · quick win — Icon-only buttons have no accessible name.** `tooltip/index.js:34-39` swallows `title`, never forwards `aria-label`; ~32 icon buttons affected. Forward `aria-label={title}` in `withTooltip`.
- **E4 · P1 · M — Drawer is not a dialog.** `drawer/index.js:28-48` — no `role`/`aria-modal`/focus trap/Escape.
- **E5 · P1 · S · quick win — Chart title not a heading, not associated with chart.** `title/index.js:33-35`. Heading + `aria-labelledby`.
- **E6 · P1 · M — Alert timeline / series / anomaly convey status by color alone.** `alertTimeline/index.js:109-112,185-203` (mouse-only too); `anomalyIcon/index.js:8-17`; legend swatch `aria-hidden` (`dimensions.js:124`).
- **E7 · P1 · M (casing fix S) — Broken filter listbox ARIA.** `dropdownTable.js:72,77` lowercase `tabindex`, no `role="option"` children.
- **E8 · P2 · S · quick win — No `prefers-reduced-motion` for pervasive infinite animations** (d3pie/easyPie/logo/reload/skeleton/alert pulse/gauge/groupBoxes/anomaly).
- **E9 · P2 · S · quick win — Icon buttons have no visible focus indicator.** `icon/button.js:43-55` hover only.
- **E10 · P2 · S · quick win — No live region for dynamic values.** `grep aria-live` = 0.
- Good patterns to reuse: `sparklineCanvas.js:101-102`, `thresholdRow.js:64`.

### F. Performance & reliability (Opus)

- **F1 · P0 (uPlot path) · M (partial quick win) — Hover redraw recomputes full-series geometry per mouse-move × every synced chart.** `hover.js:3-6` → `uplot/index.js:1215` `u.redraw()` re-fires draw hooks (`:1136-1144`); `drawStacked` (`:438-466`, `stacking.js:1-31`), `drawHeatmap` (`:468-506`, rebuilds a d3 scale each draw), `drawBars` (`:577-597`, re-`stack()`). `hover.js:6` passes fresh `[x,y]` so the `prevValue` guard never dedupes. Fix: overlay crosshair, cache `stackBounds`/`makeGetColor`, dedupe `hoverX`.
- **F2 · P1 · S · quick win — `getPayloadDimensionIds()` allocates a new array each call, ~16×/uPlot draw.** `makeDimensions.js:34-40`. Cache like `getVisibleDimensionIds` (`:257`).
- **F3 · P1 · M (primitive guard S) — Selector layer force-updates with no value bail-out.** `provider/selectors.js:23-31` (`useAttributeValue`), `:600-629` (`useValue` on `hoverX`), `:523-529` (`calculateStats` full scan for window/highlight). Hover re-renders every legend cell of every synced chart. Add `Object.is` ref guard.
- **F4 · P1 · L — Full O(rows×dims) dataset copy each autofetch tick + second transpose per uPlot render.** `camelizePayload.js:48-72` (retains raw `all` too), `makeDataFetch.js:124-140`, `uplot/index.js:113-134`. Feed columnar / append tail incrementally.
- **F5 · P2 · M — dygraph rebuilds all option objects each render tick.** `dygraph/index.js:496-517,339-411,469-476`. uPlot better but `selectedLegendDimensions` triggers full teardown+recreate (`:1219`); prefer per-series `show` toggle.
- **F6 · P2 · S–M · quick win — d3pie imports full `d3`.** `d3pie/library.js:1`; `package.json:85-86` has both `d3` + `d3-scale`.
- **F7 · P2 · L — dygraphs + uplot + html2canvas + jspdf all shipped.** `package.json:83-95`. Plan dygraphs removal post-parity; export deps large (code-split at consumer/build layer since in-body dynamic import is forbidden).
- **F8 · P2 · S · quick win — `useOnResize`/`usePlotArea` schedule `setTimeout(forceUpdate,300)` with no clear.** `selectors.js:235-240,677`. Low impact (React no-ops), latent.
- **F9 · P2 · S · quick win — dygraph touch listeners added in `mount()` not removed in `unmount()`.** `dygraph/index.js:142-150` vs `:478-492`. **UNVERIFIED** accumulation (depends on same-element remount).
- Correct (verified): uPlot navigation cleanup, ResizeObserver helper, many timers/observers with cleanup, one-shot overlay rAF. Minor: `moveXDebounced` not cancelled (= A4); `getMemKey` never invalidates on colors empty→set.

### G. Testing, build & code health (Sonnet)

- **G1 · P0 · M — Default engine tested against a fully mocked `dygraphs`.** `dygraph/index.test.js:16`.
- **G2 · P0 · S · quick win — CI can't fail a PR.** `.github/workflows/tests.yml` no `pull_request`, `continue-on-error:true`, no lint.
- **G3 · P0 · S · quick win — Phantom `lodash` dep.** `makeDimensions.js:12-13` +4 files; not in `package.json`.
- **G4 · P1 · S · quick win — `mount.js` tested with everything mocked.** `mount.test.js:6-7`.
- **G5 · P1 · M — Cross-chart sync plugins have zero coverage** (`annotationSync`/`hover`/`pan`/`highlight`), registered by default.
- **G6 · P1 · S · quick win — `groupBoxes` render path untested.**
- **G7 · P1 · S · quick win — Storybook config references 3 uninstalled loaders** (`url-loader`/`html-loader`/`markdown-loader`). Latent.
- **G8 · P1 · S · quick win — Docs claim "1% coverage" but jest enforces 50/40/47/50.** `AGENTS.md:95`/`CLAUDE.md:95` vs `jest/config.js:24-29`.
- **G9 · P2 · M — Full `d3` for one vendored file** (= F6). `d3pie/library.js:1`.
- **G10 · P2 · L — Two charting engines in `dependencies`** (= F7). Track dygraphs exit criterion.
- **G11 · P2 · S · quick win — Phantom `scheduler` + `@testing-library/user-event`.** `groupBoxes/drawBoxes.js:2` (`unstable_shouldYield`), `useEffectWithTransition.js:8`, story test.
- **G12 · P2 · S · quick win — Unused devDeps** `babel-eslint`, `raw-loader`, `sass-loader`.
- **G13 · P2 · L — Zero type-checking** (no TS/tsconfig, no PropTypes, `react/prop-types:off`). Consider JSDoc + `checkJs`.
- **G14 · P2 · M — Peer ranges span two majors** (`styled-components >=5.3.9`, `react >=18.2.0`) but only 6/19 tested. Narrow or add a floor matrix.
- **G15 · P2 · S · quick win — 18 uplot docs; 16 stale since mid-July.** Archive.
- **G16 · P2 · S · quick win — Dead commented props in table/dimensions/dropdownTable** (= C6/C15).
- **G17 · P2 · S — Minor TODOs / stray comment in vendored d3pie** + `filters.js:17`.
- **G18 · P2 · informational — `dygraphs` upstream dormant 2023→Jul 2026** (2.2.1 installed; 2.2.2 released 2026-07-27). Monitor.

---

## Suggested sequencing

**Sprint 1 — correctness + guardrails (mostly S):** C1, C2, A1, B1, B2, B4, G2, G3, G8 + batch the SDK infra quick-wins (B3/B6/B7/B8/B11/B13). Land before flipping the default renderer.

**Sprint 2 — reliability + perf on the migration target:** C3 (error boundary), F1/F2/F3 cluster (uPlot hover perf), B9 (interaction-state reset on unmount), A2/A4.

**Sprint 3 — a11y baseline:** E3 (one edit, huge reach), E1/E5/E9/E10, E8, D7 (focus ring).

**Sprint 4 — design uplift:** D1 (bespoke palette) + D2/D3/D4/D5/D6, then D9.

**Continuous — test/dep hygiene:** G1/G4/G5/G6 coverage, G7/G11/G12 deps, G15 doc cleanup; track G10/F7 (dygraphs removal) and G13/G14 as larger initiatives.

## Known/deferred (not re-flagged as gaps)
- Stacked-area per-pixel point reduction (perf-only) and anomaly-rate y-axis SVG hexagon badge (cosmetic) — legitimately deferred per `docs/uplot-prod-parity-gap-map.md`.
- The old `docs/uplot-parity-gap-map.md` (G4/G5/G6) is **superseded** — heatmap, bar negatives, and nearest-series hover are all closed in current code.
