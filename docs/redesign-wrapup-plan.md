# Redesign wrap-up plan

Working list for closing the redesign branch (`feat/uplot-renderer`) and the cloud-frontend rollout.
Each item is fixed one at a time and checked off with its commit.

Status: `[ ]` todo · `[x]` done · `[-]` dropped / deferred · `[?]` verify first

Sources: four internal reviews (logic parity, cleanup, missing work, tests) on 2026-10-02 and the
external audit `docs/sre-exploration-audit.md` (2026-07-30, branch `explore/uplot-spike`; findings
must be re-verified on the current branch before fixing).

## A. Logic parity with main

Modern design (charts):

- [x] A1 Gauge unit disagrees with per-value scaled value — `modern/gauge/index.js:140,145`
- [x] A2 Tooltip lists dimensions hidden in the legend — `modern/legend/tooltip.js:114`
- [x] A3 Tooltip caps heatmaps at 6 rows (default shows all buckets) — `modern/legend/tooltip.js`
- [x] A4 Filter Reset keeps the edited selection — `filterToolbox/modern/dropdown.js`
- [x] A5 Donut sorts by value and keeps top 5 (d3pie: label-asc + small-segment grouping) — `modern/donut/getDonutData.js:38-55`
- [x] A6 Tile readout falls back to another dimension when the requested one is hidden — `modern/tile/readout.js`

uPlot renderer (opt-in):

- [x] A7 Stacked charts ignore `valueRange` — `uplot/index.js:382-383`
- [x] A8 Bar charts ignore `valueRange` / `includeZero`; static ranges unpadded — `uplot/index.js:377`
- [x] A9 Hover dots on stacked charts at raw value, not stack top — `uplot/index.js:833-837` (audit A2)
- [x] A10 Crosshair not snapped to a data row — `uplot/index.js:551`
- [x] A11 Root-level renderer change only reaches charts on chart-type change — `sdk/makeChart/timeSeriesRenderer.js:23`

## B. Scope decisions

- [x] B1 New palette applies to every chart (default + dygraph). Kept (palette C).
- [x] B2 geoMap cluster colours pinned to the old hex values — `cloud geoMap/constants.js`
- [x] B3 New Modern-only features (More menu toggles, Reload data, Show all dimensions, extra sorts, hidden filter columns). Confirmed.
- [x] B4 Shared chart.js theme (rollout decision 3): `cloud lib/chartjs/theme.js`, merged under each chart's own options in all Chart.js consumers; visual only, for everyone. Open: dark tooltip charts (billing, billingAtc, insights).
- [x] B5 Verified: a renderer toggle wrote `chartLibrary` into card state via spread propagation. Fixed: dygraph↔uplot swaps are not persisted — `cloud dashboards/spread/useSpreadPropagation.js`

## C. Cleanup (no behaviour change)

- [x] C1 Dead code in charts: `getContextUnitAttributes` + `max`/`sampleId` (`modern/table/scale.js`), `AttentionPill` + pill-ink helpers/tests, `badgeSize`, donut `formatWithUnit`, gauge `dotColor` + eslint-disable, redundant `isAnomalous` check, inline column/rate loop in `uplot/plotters/anomaly.js`
- [x] C2 Stale text: table story caption, mockups' 2% noise floor, `traceColor.js` comment
- [x] C3 cloud: single "Last 24 hours" default in the alert table change
- [x] C4 Plan doc `docs/uplot-design-refresh-plan.md`: mark superseded / reverted / deferred and record later decisions
- [x] C5 Test-only payload helpers shipped in dist (`makeWavePayload`, `makeTablePayload`, `makeHeatPayload`). Moved to `fixtures/`.

## D. Tests (high value only)

- [x] D1 Fix tests that cannot fail: `usePlotArea.test.js`, `chartContentWrapper.test.js:55-63`
- [x] D2 Readout keeps one size while hovering (tile + number)
- [x] D3 Sub-1% anomaly shows; calm window has no badge (literal colours)
- [x] D4 uPlot reuses the instance on refresh; rebuilds only when needed
- [x] D5 Modern readouts compared against the real default chart text
- [x] D6 cloud: alert card period ms→s via the real table
- [x] D7 Flaky modern table tests: the mock payload rotates rows by `Date.now()`, so paired renders got different data; tests now use a fixed window (and match rows by `data-id`) — 8 clean runs

## H. Skeletons

- [x] H1 B2 "Horizon" static skeletons for line, gauge (default + modern), easyPie, d3pie, groupBoxes — `components/skeleton`; slow-load colour shift kept
- [x] H2 Modern uPlot anomaly badge: HTML badge in the peak colour (pill with peak on wide plots), summary tooltip, spotlight on hover, click opens Correlate for the whole window (only when the drawer is available) — `modern/anomalyBadge.js`, `uplot/plotters/anomaly.js`

## E. Release

- [ ] E1 Charts release + cloud-frontend version bump (`drag.js` imports a branch-only module; `package.json` pins `^6.12.16`)

## F. External audit (verify on current branch first)

Correctness / reliability:

- [x] F1 Dimensions filter sort bound to `nodesSortBy` — `filterToolbox/dimensions.js:52` (audit C1)
- [x] F2 (reset returns to the last live window via `liveAfter`, fallback -900) Reset zoom hard-codes `moveX(-900)` — `sdk/makeNode.js:169-176` (audit C2)
- [-] F3 (already fixed or not applicable) Flat series render blank on uPlot (`padYRange` zero span) — `uplot/index.js` (audit A1)
- [-] F4 (deferred) No client-side fetch timeout — `fetchAgentData.js`, `fetchCloudData.js` (audit B1)
- [x] F5 Malformed payload wedges a chart — `camelizePayload.js:207-209`, `makeDataFetch.js` (audit B2)
- [x] F6 (cloud `src/charts/index.js` wraps every chart in `CrashBoundary size="inline"`; import cycle broken by importing `TimeseriesDummyChart` directly) No React error boundary per chart (audit C3)
- [x] F7 `errorMessage`-only payloads ignored — `makeDataFetch.js` (audit B4)
- [x] F8 `makeListeners.trigger` once-handling bug (audit B3)
- [x] F9 `makeKeyboardListener` unregister by stale index (audit B7)
- [x] F10 `parseDOM` discards parsed JSON (audit B8)
- [x] F11 `makeContainer.removeChild` emits wrong node/type (audit B6)
- [x] F12 `moveXDebounced` not cancelled on uPlot unmount (audit A4)
- [x] F13 `setTimeout(forceUpdate, 300)` not cleared in `useOnResize`/`usePlotArea` (audit F8)
- [x] F14 dygraph touch listeners not removed on unmount (audit F9)
- [-] F15 (deferred) Interaction state (`enabledHover`) not reset on unmount (audit B9)
- [x] F16 `loading` flickers during replacement fetch (audit B11)
- [-] F17 (already fixed or not applicable) `makeExecuteLatest` keeps fired timeout ids (audit B13)
- [-] F18 (already fixed or not applicable) `deepEqual` drops options on recursion (audit B12)

Performance (uPlot path):

- [-] F19 (already fixed or not applicable) Hover redraw recomputes geometry per mouse move across synced charts (audit F1)
- [x] F20 (returns the payload ids without copying; no caller mutates them) `getPayloadDimensionIds()` allocates per call (audit F2)
- [-] F21 (already fixed or not applicable) Selector layer re-renders with no value bail-out (audit F3)

Build / dependencies / CI:

- [-] F22 (separate PR) CI cannot fail a PR (no `pull_request`, `continue-on-error`, no lint) (audit G2)
- [x] F23 Undeclared deps: `lodash`, `scheduler`, `@testing-library/user-event` (audit G3/G11)
- [x] F24 Unused devDeps `babel-eslint`, `raw-loader`, `sass-loader` (audit G12)
- [x] F25 Storybook config references uninstalled loaders (audit G7)
- [x] F26 Docs claim 1% coverage; jest enforces 50/40/47/50 (audit G8)
- [x] F27 (19 plans deleted; `uplot-design-refresh-plan.md` kept, still referenced) Archive stale `docs/uplot-*.md` plans (audit G15)

UX / accessibility / visual:

- [x] F28 Compare / DrillDown drawers show no loading state (audit C4)
- [-] F29 (already fixed or not applicable) Search disabled on primary filter dropdowns (audit C8)
- [x] F30 Fullscreen has no Esc exit (audit C10)
- [x] F31 Custom compare period form fails silently (audit C12)
- [-] F32 (default flavour unchanged) Error badge does not truncate long messages (audit C17)
- [x] F33 Icon buttons have no accessible name (`withTooltip` drops `aria-label`) (audit E3)
- [x] F34 No visible focus ring on icon buttons (audit E9 / D7)
- [x] F35 (shared `helpers/reducedMotion`; skeleton redesign in `Mockups/Skeletons`) No `prefers-reduced-motion` for infinite animations (audit E8)
- [-] F36 (deferred) Canvas charts have no `role="img"` / `aria-label` (audit E1 partial)
- [x] F37 Hover popover / groupBox popover hardcode light-mode shadow (audit D3)
- [-] F38 (default flavour unchanged) Live values not tabular-nums in the default legend (audit D6)
- [x] F39 (removed `hasYlabel` incl. cloud `nodes/useCharts.js`, `compareData`, Point tab; `toolboxProps` is in use and stays) Dead attributes and commented scaffolding (`hasYlabel`, `toolboxProps`, `compareData`, drawer Point tab) (audit C14/C15)

Already addressed by the redesign (confirm and close): audit D1/D2 palette (replaced), audit A2 (= A9).

## G. External review (2026-10-02)

Redesign items:

- [x] G1 Attention can mix alerts: highest severity from summary/overlay, but value and time from any raised overlay; value formatting bypasses the shared readout — `modern/header/getAttention.js:70`, `modern/header/attention.js:26`
- [x] G2 (cited instances fixed; full modern pass pending decision: 45 `$` props and 56 raw styled elements in `src/components/modern` vs 5 and 9 on main) netdata-ui rule violations in modern UI: raw button with px radius/padding (`modern/header/moreMenu.js:59`), raw elements and px spacing (`modern/bars/index.js:35`), fixed RGB ramps (`modern/anomaly.js:6`), transient `$resizing` prop (`cloud charts/dashboard/item.js:26`), CSS radius instead of `round` (`cloud dashboards/components/cards/container.js:10`). Route through the design system; add tokens where missing.
- [x] G3 Duplicated left-element/status transform in `modern/header/index.js:13` and `modern/tile/index.js:25`; donut `formatWithUnit` (= C1)
- [x] G4 Each uPlot chart adds document mouse listeners and a mouseup timer — `uplot/index.js:1427,1435`. Share one listener.

User's navigation WIP (not redesign; listed so it is not lost):

- [-] G5 Navigation code and tests disagree: `useMenu.js:66` vs `taxonomies.test.js:66`, `sidebar/rail.js:246` vs `sidebar/index.test.js:138`, `menu/footerWidgets.js:60` vs `footerWidgets.test.js:5`
- [-] G6 Rail icon entries lost hover tooltips — `sidebar/rail.js:51` (README expects tooltips)
- [-] G7 `SpaceSortableRow` repeats `SortableSpaceLabel` — `sidebar/header/spaceSortableRow.js:11`

Larger initiatives, out of scope for this wrap-up: audit B14 (dataQuery convergence), F4 (columnar
payload), F7/G10 (drop dygraphs), G1/G4/G5 (test coverage of mocked engine / sync plugins), G13
(type checking), G14 (peer range matrix), E2/E4/E6/E7 (keyboard, dialog, colour-only status, listbox ARIA).
