# uPlot design refresh — plan

Goal: make the uPlot renderer (and the non-timeseries libraries) visually stronger than Grafana-class
dashboards, reviewed story by story in Storybook. dygraph stays untouched so both renderers can be
compared side by side.

## Decisions (approved)

| # | Topic | Decision |
|---|---|---|
| 1 | Visual direction | "Live edge": calm, precise base; the one bold element is the live edge (glow on each series' latest point + right-edge value tag) |
| 2 | Series palette | New validated palette, uPlot only. dygraph and other libraries keep `dimensionColors.js` |
| 3 | Dual y-axis | Not built. Different-scale measures go to small multiples or an indexed view |
| 4 | Gauge | Rewrite as a custom gauge (arc, gradient, threshold ticks, sparkline). Rendering tech: open (see below) |
| 5 | New libraries | None. New types build on uPlot and SVG/canvas already in the repo |
| 6 | Order | Work packages 1→6, each shipped as a story reviewed before the next starts |

### Cleanup notes (later)

- Palette split: once uPlot becomes the default, fold the uPlot palette into `dimensionColors.js` and
  drop the per-renderer branch. Also update `drawer/correlate/sparkline.js:70`, which indexes
  `dimensionColors` directly.

## Tokens

- Surfaces: inherited from netdata-ui — light `#F7F8F8` (`blackhaze`), dark `#151818` (`grey25`).
- Grid: horizontal only, low-alpha ink. No vertical grid lines.
- Series palette (validator: all adjacent-pair checks pass in both modes):
  - dark: `#1FA35E #3F84E5 #E0692E #9085E9 #1A9FB3 #D55181 #C98500 #4E9BDC`
  - light: `#00914A #2A70D6 #E0621F #5B4BC4 #0B8AA3 #D14F83 #C08300 #3F8FD0`
  - Red is excluded: reserved for alert status.
  - All-pairs separation fails for 8 hues (amber↔orange, sky↔blue); hover highlight and legend carry
    identity on large charts.
- Marks: 2px lines, area fill ~45% → 0 alpha, surface-coloured ring on the live-edge dot.
- Type: IBM Plex Sans (already `uplot/index.js:30`), tabular numerals for value readouts, 600 for
  big numbers, 400 for labels.

## Work packages

1. Line/area polish — palette, marks, grid, live edge. Before/after story with dygraph toggle.
2. Threshold lines and zones — new horizontal overlay type.
3. Legend table mode — Name / Mean / Last / Min / Max from `viewDimensions.sts`.
4. Stat panel — big number + sparkline (prototype: `showcase.stories.js:454-476`).
5. Gauge rewrite — gradient arc, threshold ticks, embedded sparkline.
6. New chart types — state timeline, bar gauge, histogram.

## Performance guardrails

- Benchmarks on record go up to 100 dimensions (`docs/uplot-migration-progress.md:193-215`); thousands
  of dimensions are unmeasured.
- Every per-series decoration is capped by visible-series count and must not allocate per redraw
  (e.g. cache area gradients per colour and plot height).
- Run `yarn perf:bench:quick` before and after each package that touches the draw path.

## Work package 1 decisions (approved)

| # | Topic | Decision |
|---|---|---|
| 4 | Gauge rendering | SVG only, no canvas fallback |
| 7 | Live-edge tags | Right gutter (56px) |
| 8 | Series cap | Glow + tags for ≤ 8 visible series; above that only the hovered series. `liveEdge: false` turns it off |
| 9 | When | Only while following "now" (relative window, root not paused) |
| 10 | Line fill | `line` stays unfilled; gradient stays on `area` |

## Redesign decisions (approved, supersede the live-edge direction)

Mockups: `src/mockups/` (Storybook "Mockups/Chart card", "Mockups/Redesign").

| # | Topic | Decision |
|---|---|---|
| R1 | Live edge | Removed as a default (duplicates the legend values) |
| R2 | Legend | Chosen by width and series count: below (one line), direct labels (≤ 4 series), side table with Last/Mean/Max (wide or many series), hidden (small tiles) |
| R3 | Hover | Legend becomes the readout when a legend is visible; compact tooltip (sorted, ≤ 6 rows, no empty columns) when it is hidden |
| R4 | Chrome | Actions on hover (filters, fullscreen, more); filter bar folds into one clickable scope line; no floating navigation toolbar; gestures + "Reset zoom" chip |
| R5 | Visual direction | "Readout": number-first panels |

| R6 | Headline | Attention: alert state + offending series; quiet "Within thresholds" otherwise (decided by Claude at the user's request) |
| R7 | Flavour | `designFlavour: "modern"` |
| R8 | uPlot polish | Keep palette, horizontal grid, muted axis labels, tick range fix; remove the live edge |

Constraints (from the user):
- No functionality is lost. Rarely used functions may move behind a menu or panel, but stay reachable.
- No contract changes. cloud-frontend must work as-is or with small changes.
- Goal: help users focus on what matters.

## Work package 1 status: superseded by the redesign (kept uncommitted for reference)

Story: `Charts/uPlot/Design refresh → Line and area` (`src/designRefresh.stories.js`).

Implemented:
- Palette `src/sdk/makeChart/theme/uplotDimensionColors.js`, chosen in `makeDimensions.js` when
  `chartLibrary === "uplot"`; the container colour memo is keyed per palette.
- 2px lines and area edges, area gradient 45% → 0, gradient cached per plot extent.
- Horizontal grid only; no tick marks or axis border.
- Axis labels use the new muted `themeAxisLabelColor` (`#5C6C77` / `#7C8C96`, 5.1:1 on each surface).
- Y labels every ≥ 30px (was 15px); ticks rounded past the scale range are dropped so labels are not
  clipped.
- Live edge: `src/chartLibraries/uplot/liveEdge.js` (halo + glow dot, value tag in the gutter,
  overlap-free tag layout).

Implementation choices to confirm in review:
- The gutter is reserved whenever the live edge is enabled, even when paused/historical or above the
  cap, so the plot width never jumps. Alternative: collapse it when no tags are drawn.
- Live edge is limited to `line` and `area`; `stacked` is excluded (tag position would need the
  stacked top, not the raw value).
- Tag pill uses `themeGridColor`; tag text uses `themeLabelColor`.

Risks:
- If a consumer pauses the root on hover, the live edge disappears while hovering (pause is read from
  the root, `makeNode.js:182-188`). Not observed in this repo; only `play.js:81` removes hover pauses.
- The live-edge tag shows the value without units to fit the gutter.

## Delivery contract (proposed)

- Ship as a new `designFlavour` value (working name `"modern"`). Today only `"minimal"` changes the UI
  (`useIsMinimal`, `provider/selectors.js:675`); `"default"` stays byte-for-byte as it is.
- cloud-frontend already maps its `chartsDesign` user setting to `designFlavour`
  (`cloud-frontend/src/components/sdkProvider/index.js:123`, radio buttons in
  `domains/accounts/components/userProfile/themeSettings.js:48-54`). Its only change: one more radio
  option.
- Unchanged: every attribute, every deep `dist/` import path and export name, `Line` props,
  `toolboxElements` / `leftHeaderElements` / `settingsTabs` (consumer components still render, as
  header actions).

## Function map (today → modern card)

| Function | Today | Modern card |
|---|---|---|
| Status: loading / error / no data | header badges (`status/index.js:15-53`) | same states, in the scope line |
| Reload | logo hover (`status/reload.js`) | More menu: "Reload data" |
| Title, name copy, units | header (`title/index.js:33-54`) | title row; units next to the headline value |
| Toolbox elements (Settings, Fullscreen, consumer ones such as AddToDashboard) | always visible, disabled until focused | header actions, shown on card hover |
| Settings tabs Display / Data / Info / Download | settings modal | More menu entries that open the same tabs |
| Filter bar (all filters, post-aggregation, Reset) | always visible, 1–2 rows | folded into the scope line; click (or the filter action) opens the same `FilterToolbox` |
| Navigation modes Pan / Select / Highlight / Vertical | floating toolbox over the plot | More menu segmented control + existing modifier-drag gestures |
| Zoom in / out, reset zoom | floating toolbox | wheel gesture, "Reset zoom" chip while zoomed, More menu, Alt+Shift+R |
| Hover popover (values, anomaly %, annotation flags, granularity) | large table popover | legend becomes the readout; tooltip only when the legend is hidden; anomaly % and flags shown only when non-empty |
| Legend: toggle, ctrl-click, sort, anomaly bar | footer strip | adaptive legend keeps click / ctrl-click; sort in More menu and table headers; anomaly as a column / bar |
| Latest / hovering / highlight timestamps | footer indicators | time chip on the axis while hovering; highlight range keeps its zoom action |
| Drawer (compare, values, drill down, correlate) | expander | "Compare, drill down, correlate" footer action (tiles: More menu) |
| Overlays: alerts, annotations, anomalies, highlight | plot | plot: alert bands with labelled thresholds, annotation flags, anomaly strip |
| Keyboard: Alt+Shift+F, Alt+Shift+R | focused chart | unchanged, listed next to the menu entries |

## Implementation tracks (designFlavour "modern")

Base: `9f1efaea` (foundation: `useIsModern`, `components/modern/tokens.js`). Each track works in its own
worktree on branch `modern/<track>` and is merged into `feat/uplot-renderer` afterwards.

| Track | Area | Owns |
|---|---|---|
| chrome | header, scope line, hover actions, More menu, attention headline, zoom chip | header, title, status, toolbox, line/chartContentWrapper, line/navigationToolbox |
| legend | adaptive legend, legend as readout, compact tooltip, focus dimming | line/index, footer, legend, popover, indicators, dimensionSort |
| overlays | alert threshold bands, annotation flags, anomaly strip (uPlot) | uplot/overlays, uplot/plotters |
| gauge | SVG gauge | components/gauge, chartLibraries/gauge |
| number | stat panel, rings (easyPie) | number, easyPie |
| donut | donut (d3pie), ranked bars | d3pie, bars |
| table | table, group boxes heat grid | table, groupBoxes |
| dropdown | filter dropdowns | filterToolbox internals |

Every track: gated by the modern flavour, tests prove default/minimal unchanged, no mocks, a `Modern/*`
story, lint clean.

## Status after the overnight run

Everything below is on `feat/uplot-renderer` (not pushed). Full suite: 223 suites, 2378 tests passed
(2 skipped); eslint clean on every changed file; all 21 `Modern/*` stories render with no console errors
in a static Storybook build and were checked visually in light and dark. Quick perf bench (default
flavour, 1000 rows x 20 dims x 10 charts): uPlot/dygraph total task ratio 0.739, single run.

### cloud-frontend integration (morning)

- Required: add a third option to the "Charts design" radio group
  (`src/domains/accounts/components/userProfile/themeSettings.js`), value `"modern"`. The value already
  flows to `designFlavour` (`src/components/sdkProvider/index.js:123`).
- Recommended: load IBM Plex Sans / IBM Plex Sans Condensed (numerals fall back to system-ui otherwise).
- Optional data to unlock more of the design:
  - `overlays` entries `{ type: "threshold", warning, critical }` to draw threshold bands (no data
    source exists in the payload today).
  - `groupBoxesThreshold` (new, default null) to highlight group boxes above a value.

### Additive contract changes (nothing removed or renamed)

- Attributes (all optional, default keeps today's behaviour): `filtersOpen`, `legendLayout`,
  `legendMode`, `focusedDimensionId`, `filterColumnVisibility`, `groupBoxesThreshold`; theme pairs
  `themeAxisLabelColor`, `themeAlertWarning`, `themeAlertCritical`, `themeAlertClear`,
  `themeGroupBoxesScale`.
- Overlay type `threshold` (uPlot, modern only).
- Props: `SettingsContent` accepts optional `initialTab` / `initialIndex`.
- Exports: `Range` from `line/indicators`, `useMetricsByValue` from `filterToolbox/columns`.

### Open decisions

1. Modern sparklines render no header even when `hasHeader` is true (default renders one; consumers
   already pass `hasHeader={false}` for sparklines).
2. The zoom chip shows for any absolute window, including a fixed range picked in the consumer's
   time picker; Reset returns to the last 15 minutes.
3. The attention headline has no per-dimension thresholds in the payload, so it names the raised
   alert and its triggered value, not "load15 above 30".
4. `filterColumnVisibility` is shared by all dropdowns of a chart; alternatives: per dropdown.
5. Focus dimming (hovering a legend entry) is uPlot only.
6. Without a drawer, the one-line legend's "+N more" switches to the side table.
7. Under dygraph, the More-menu anomaly/annotation toggles apply on the next remount (dygraph reads
   them at mount).

### Round 3 decisions (approved 2026-10-01)

| # | Topic | Decision |
|---|---|---|
| T1 | Tiles | As in Mockups/Tiles: rest = title, readout, trend; hover = Fullscreen + More (+ move handle from `toolboxProps.drag` when present) and the scope line; More holds consumer toolbox elements as an icon row, filters, settings, info, reload |
| T2 | Sparkline tiles | `latestValue` readout sits above the trend, shared decimals, unit beside the number |
| T3 | Ring colour | Dimension colour; warning/critical colour only when a threshold is crossed |
| T4 | Live edge | A legend layout ("Live edge" = direct labels + glow on each series' newest point), alongside Bottom and Side; personal choice via `legendLayout`; glow on uPlot under modern only; falls back to the side table above ~8 series |
| T5 | Status | Quiet green dot when all is clear, description on hover; warning/critical: coloured dot + short label, critical most prominent |
| T6 | Highlight chip | One line; date dropped when it is today |
| T7 | Left spacing | Narrower y-axis gutter on uPlot under modern (sized to the labels) |
| T8 | Modern vs renderer | Modern restyles the card on both renderers |

### Known pre-existing issue (not fixed)

- `useChartError` (`provider/selectors.js`) reads the error attribute inside `failFetch`, which
  `makeDataFetch.js` triggers before storing the error, so the default Status badge can miss the first
  error.

### Palette decision (2026-10-01)

One palette for both renderers, in `src/sdk/makeChart/theme/dimensionColors.js` (20 [light, dark]
pairs; length kept at 20 because cloud-frontend indexes positions up to 19). The first 8 are the
validated set; positions 9-20 were searched to pass the same checks for adjacent pairs (no reds,
same hue in both themes, lightness band, chroma floor, 3:1 contrast). Validator: light CVD floor
ΔE 7.4, dark CVD floor ΔE 6.0, normal vision ≥ 15 in both. The per-renderer uPlot palette is removed.
Consumers that pick palette positions for meaning (e.g. cloud-frontend geoMap "mostOffline") change
hue and should move to status colours.
