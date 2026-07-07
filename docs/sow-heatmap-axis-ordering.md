# SOW: Heatmap Y-Axis Bucket Ordering and Label Scaling

## Requirements (Purpose)

Heatmap charts in `@netdata/charts` render histogram buckets on the y-axis. The
current implementation trusts the dimension payload order blindly, which breaks
when the Netdata agent appends a new bucket at runtime (e.g. user adds bucket
`3` to `1, 2, 5, 10` → agent stores `1, 2, 5, 10, +Inf, 3` → `3` renders at the
bottom, below `+Inf`).

This SOW delivers:
1. **Correct, robust bucket ordering** — numeric sort by bucket value,
   `+Inf` last, with a safe fallback to payload order when values are not
   purely numeric.
2. **Humanized y-axis labels** — for automated dashboards where no unit
   metadata exists for the bucket boundaries, format labels using sensible
   defaults inferred from the bucket values themselves (binary vs SI scaling).

The solution must be **fit for purpose** for Netdata's automated dashboards:
no per-chart configuration required, sensible defaults for the common
histogram sources (Prometheus, OpenTelemetry), and zero regressions for
non-numeric heatmaps.

## Background and Context

### Current behavior (the bug)

- `getDimensionIndex(id)` returns the **raw payload index**
  (`src/sdk/makeChart/makeDimensions.js:202,229`).
- The heatmap plotter draws row N at the payload index
  (`src/chartLibraries/dygraph/plotters/heatmap.js:27,41`).
- The heatmap ticker emits one tick per index
  (`src/chartLibraries/dygraph/tickers/heatmap.js:12-14`).
- `onHoverSortDimensions` forces `default` sort for heatmaps
  (`src/sdk/makeChart/makeDimensions.js:164-165`), but this only affects
  legend/visibility — the plotter ignores `sortedDimensionIds` and reads
  `getDimensionIndex` directly.

### Root cause

The Netdata agent (OTel plugin) re-sorts and re-emits the chart definition
when dimensions change
(`netdata/src/crates/netdata-otel/otel-plugin/src/chart.rs:382-385`), but the
agent core stores dimensions in an ordered dict and SQLite **at insertion
position** — it does not reorder on update. A runtime-added bucket lands after
the existing `+Inf`. The frontend faithfully renders that broken order.

### Bucket value format (verified)

The live Prometheus API payload for `prometheus.vllm.request_prefill_time`
exposes `view.dimensions.ids` and `view.dimensions.names` as pure numeric
strings or the literal `+Inf`:

```
+Inf, 0.3, 0.5, 0.8, 1, 1.5, 10, 120, 15, 1920, 2, 2.5, ...
```

The Prometheus collector starts from Prometheus bucket series
`<metric>_bucket{le="<bound>"}` (`netdata/src/go/pkg/prometheus/parse.go:292`),
then strips `_bucket` and `le` into typed histogram bounds
(`netdata/src/go/pkg/prometheus/assemble.go:190-205`). Netdata's metrix layer
can flatten histograms back to `_bucket{le="<bound>"}`
(`netdata/src/go/pkg/metrix/reader.go:249-256`), and chartengine autogen can
use internal names like `bucket_1`
(`netdata/src/go/plugin/framework/chartengine/autogen.go:291`). Therefore the
frontend must support both pure numeric bucket IDs and prefixed bucket IDs, with
pure numeric IDs treated as the primary production shape.

The OTel plugin emits dimension names as pure numeric strings or the literal
`+Inf` (`netdata/src/crates/netdata-otel/otel-plugin/src/metrics_service.rs:207-214`):

```
0.005, 0.01, 0.025, ..., 5, 10, +Inf
```

No units, no arbitrary strings. The frontend regex
`(.+)_(\d+?\.?(\d+)?|\+[Ii]nf)$` (`src/helpers/heatmap.js:19`) requires a
prefix; for OTel heatmaps the chart type is set directly
(`ChartType::Heatmap` at `metrics_service.rs:187`), bypassing regex detection.

### Existing unit scaling infrastructure (verified, must be reused)

The codebase has a mature unit scaling system. **This SOW reuses it, does not
reinvent it.**

- `src/helpers/units/scalableUnits.js` — canonical prefix tables (pure data,
  no chart deps):
  - `binary`: `["1", "Ki", "Mi", "Gi", "Ti"]` (1024-based)
  - `num`: `["y","z","a","f","p","n","u","m","1","k","M","G","T","P","E","Z","Y"]` (full SI, 1000-based)
  - `decimal`: `["1", "K", "M", "B", "T"]`
  - `chronos`: `["ns", "us", "ms", "s", "m", "h", "d", "mo", "y"]`
  - `bit`: `["1", "k", "M", "G", "T", "P", "E", "Z", "Y"]`
- `src/helpers/units/all.js` — 4000+ lines of unit configs with flags
  (`is_scalable`, `is_metric`, `is_binary`, `is_chronos`, `is_bit`).
- `src/helpers/units/index.js` — `getScales(unit)` dispatches to the right
  table based on unit flags; `getUnitConfig`, `getUnitsString`.
- `src/helpers/unitConversion/getConversionUnits.js` —
  `getConversionAttributes(chart, unit, {min, max})` picks ONE prefix for a
  chart axis based on the min/max delta (magnitude-based).
- `src/sdk/makeChart/index.js:138` — `getConvertedValue` ties conversion +
  `Intl.NumberFormat` together.

**Gap (why we can't call the existing system directly):** The existing
conversion is **axis-wide** — it picks ONE prefix per chart based on the
min/max range, then applies that prefix to all values on that axis. Heatmap
tick labels need **per-value** formatting: each bucket is a different value
(`0.005`, `0.01`, `0.025`, ..., `10`, `+Inf`) and must be independently scaled
(`0.005 → "5m"`, `10 → "10"`, `1024 → "1Ki"`). Axis-wide scaling would leave
Prom-default buckets (delta ~10) with no prefix at all — defeating the purpose.

**What we reuse:** the `scalableUnits` prefix tables (canonical definitions —
what "Ki" means = 1024, what "m" means = 0.001). **What is genuinely new:**
per-value formatting math (pick prefix per value from the table, divide,
round, format), and the value-inference layer (binary vs SI detection).

### Industry reference

Grafana's heatmap (`public/app/plugins/panel/heatmap/fields.ts:142-148`,
`calculateHeatmap/heatmap.ts:72-74,99-101,333`):
- Numeric sort with `+Inf` → `Infinity`, fallback to payload order if any
  non-numeric.
- Label formatting is **config-driven** via the chart's unit (bytes → IEC,
  short → SI). Grafana does **not** infer from values — but Grafana has
  per-panel configuration. Netdata has automated dashboards and must infer.

### Constraints

- Bucket boundaries carry **no unit metadata**. The chart's `units` attribute
  describes the cell values (e.g. `requests/s`), not the y-axis quantity.
- The histogram's actual quantity (latency, size, etc.) is unknowable from
  metadata — it must be inferred from the values for humanized labels.
- Must not break non-numeric heatmaps (categorical dimensions, mixed sources).

## Decisions (Locked)

All decisions below were discussed and confirmed before this SOW was written.

### Decision 1: Fix lives in the frontend

- **A.** Frontend numeric sort in `makeDimensions` — **CHOSEN**.
- B. Core agent presentation sort at API boundary (follow-up, separate work).
- C. Core agent storage reorder — rejected (infeasible: RRD historical pages +
  streaming + SQLite migration).

**Rationale:** The frontend is the last hop and the only way to be robust
against every upstream source (agent, Prom remote-write, future collectors).
The agent bug is tracked separately; the frontend must defend regardless.

### Decision 2: Sort fallback rule

Parse with strict digits+dot. If any value (except `+Inf`) is non-numeric,
fall back to payload order.

- Pure numbers (`0.005`, `5`, `10000`) → numeric sort.
- `+Inf` / `+inf` → sort to end (as `Infinity`).
- Anything non-numeric (`5ms`, `low`, `5e3`, `0x10`, empty) → `NaN` →
  fallback to payload order for the whole chart.

### Decision 3: `+Inf` handling

`+Inf` always sorts to the end and always renders as the literal `"+Inf"`,
regardless of scale. Matches OTel plugin convention
(`netdata/.../output.rs:117`).

### Decision 4: Label scaling — value-inferred, reuse existing tables

Three rules, applied in order:

1. If all values except `+Inf` are purely numeric → sort numerically.
2. If all numeric values **> 1** are power-of-2 → use the **binary** scale
   table (`scalableUnits.binary`: `Ki`, `Mi`, `Gi`, ...).
3. Otherwise → use the **num** (SI) scale table (`scalableUnits.num`: `m`,
   `k`, `M`, `G`, ...).

**Power-of-2 scope: only values > 1.** Sub-1 fractional values like `0.25`,
`0.5` are excluded from the power-of-2 check (they are valid in latency
histograms and must not trigger binary scaling). Confirmed by user.

**Reuse, not reinvention:** the prefix tables (`scalableUnits.binary`,
`scalableUnits.num`) are imported from the existing
`src/helpers/units/scalableUnits.js`. The per-value formatting math is new
(because the existing system is axis-wide, not per-value), but it reads from
the canonical tables — single source of truth for what each prefix means.

**Why value-based inference:** Netdata has automated dashboards and no unit
metadata for bucket boundaries. Value-based inference is the only viable path.
This diverges from Grafana (which uses config) because Netdata's UX contract
is different (zero-config dashboards).

### Decision 5: Isolated algorithm module

The entire ordering + scaling algorithm must live in one pure, standalone
module. It imports only `scalableUnits` (pure data) from the existing codebase
— no chart, dygraph, SDK, or provider imports. All consumers import from it
and contain no algorithm logic themselves.

## Algorithm Specification

### Pure module: `src/helpers/heatmapScale.js`

All functions are pure. No side effects, no `this`, no I/O, no chart access.
Imports ONLY `scalableUnits` from `@/helpers/units/scalableUnits` (pure data
tables — no chart/dygraph/SDK dependencies).

#### Parsing

```
parseHeatmapValue(str)
  Input:  string | null | undefined
  Output: number | NaN
  Rules:
    - "+Inf" or "+inf" (case-insensitive on "inf") → Infinity
    - matches /^\d*\.?\d+$/ → parseFloat result
    - everything else (5ms, 5e3, 0x10, "", null, undefined, "abc") → NaN
```

Strict regex `^\d*\.?\d+$` rejects scientific notation and units. This matches
the agent's emission format (Display::<f64> of f64 boundaries, or literal
"+Inf").

#### Detection

```
isHeatmapNumeric(values)
  Input:  string[] (dimension IDs, e.g. ["0.005", "0.01", "+Inf"])
  Output: boolean
  Rule:   true iff every value except "+Inf"/"+inf" parses to a finite number
          (NaN → false). "+Inf" alone is allowed.

isHeatmapBinary(values)
  Input:  string[] (assumed already numeric — caller checks isHeatmapNumeric)
  Output: boolean
  Rule:   true iff every finite value > 1 is an integer power of 2
          (n > 0 && Number.isInteger(n) && (n & (n-1)) === 0)
          Values <= 1 and +Inf are ignored by this check.
```

#### Scale selection

```
detectHeatmapScale(values)
  Input:  string[]
  Output: "binary" | "num" | null
  Rule:
    - null   if !isHeatmapNumeric(values)  (caller falls back to payload order)
    - "binary" if isHeatmapBinary(values)  → maps to scalableUnits.binary
    - "num"    otherwise                   → maps to scalableUnits.num
```

The output keys (`"binary"`, `"num"`) match the keys in
`scalableUnits` directly — no translation layer needed.

#### Sorting

```
sortHeatmapValues(values)
  Input:  string[]
  Output: string[] | null
  Rule:
    - null  if !isHeatmapNumeric(values)  (caller falls back to payload order)
    - otherwise, returns a NEW array sorted ascending by parseHeatmapValue,
      with "+Inf"/"+inf" always last. Stable sort. Input array untouched.
    - Original strings preserved in output (case of "+inf" not normalized).
```

#### Per-value formatting (new math, existing tables)

```
formatScaledValue(value, scale)
  Input:  value: number (finite, >= 0)
          scale: "binary" | "num"
  Output: string
  Rule:
    - Looks up scalableUnits[scale] for the prefix table.
    - Finds the largest prefix divisor where value / divisor >= 1
      (or the raw value if none fits — small values stay raw).
    - Divides, formats with up to 2 significant decimals, strips trailing
      zeros, appends the prefix symbol (e.g. " Ki", " m", " k").
    - Examples (scale="num"):  0.005 → "5m", 1500 → "1.5k", 1000000 → "1M"
    - Examples (scale="binary"): 1024 → "1Ki", 1536 → "1.5Ki", 1048576 → "1Mi"
    - Value 0 → "0".

formatHeatmapLabel(str, scale)
  Input:  str: string (the raw dimension label, e.g. "0.005" or "+Inf")
          scale: "binary" | "num" | null
  Output: string
  Rule:
    - "+Inf"/"+inf" → "+Inf" (always, regardless of scale)
    - null scale     → str as-is (fallback path — no inference)
    - "binary"/"num" → parse + formatScaledValue(parseHeatmapValue(str), scale)
    - unparseable     → str as-is (defensive passthrough)
```

### Integration: thin consumers

Consumers contain **no algorithm logic** — they call the module.

#### `src/sdk/makeChart/makeDimensions.js`

In `updateDimensions()`, after heatmap detection, compute and store:

- `heatmapSortedIds` — `sortHeatmapValues(dimensionIds)` (may be `null`)
- `heatmapScale` — `detectHeatmapScale(dimensionIds)` (may be `null`)

Expose (read-only getters, no reactivity needed beyond existing
`dimensionChanged` trigger):

- `chart.getHeatmapSortedIds()` → `string[] | null`
- `chart.getHeatmapScale()` → `"binary" | "num" | null`
- `chart.getHeatmapYIndex(id)` → position in `heatmapSortedIds`, else payload
  index via `getDimensionIndex(id)` when `heatmapSortedIds` is `null`.

**Critical:** `getDimensionIndex`, `dimensionsById`, and all data-access
methods (`getRowDimensionValue`, `getDimensionName`, `getDimensionUnit`, etc.)
remain **unchanged** — they keep returning payload index. The heatmap y-index
is a separate concept used only for rendering position.

#### `src/chartLibraries/dygraph/plotters/heatmap.js`

Switch the y-position source:
- Before: `const index = chartUI.chart.getDimensionIndex(seriesName)`
- After:  `const index = chartUI.chart.getHeatmapYIndex(seriesName)`

Value lookup changes to use `seriesName` directly (not `dimensionIds[index]`),
removing the fragile indirection.

#### `src/chartLibraries/dygraph/tickers/heatmap.js`

Receive `sortedIds` and `scale` (passed from `index.js`). Format each label
via `formatHeatmapLabel(withoutPrefix(id), scale)`. Tick positions (index-based)
are unchanged.

#### `src/chartLibraries/dygraph/index.js:333`

Pass `heatmapSortedIds` (or fall back to `getVisibleDimensionIds`) and
`heatmapScale` into the ticker options.

## File Changes Summary

| File | Change |
|---|---|
| `src/helpers/heatmapScale.js` | **NEW** — pure algorithm module (imports `scalableUnits` only) |
| `src/helpers/heatmapScale.test.js` | **NEW** — exhaustive unit tests |
| `src/sdk/makeChart/makeDimensions.js` | compute + expose sorted IDs, scale, y-index |
| `src/sdk/makeChart/makeDimensions.test.js` | tests for new getters and update path |
| `src/chartLibraries/dygraph/plotters/heatmap.js` | use `getHeatmapYIndex` |
| `src/chartLibraries/dygraph/plotters/heatmap.test.js` | update tests for sorted positions |
| `src/chartLibraries/dygraph/tickers/heatmap.js` | format labels via `formatHeatmapLabel` |
| `src/chartLibraries/dygraph/tickers/heatmap.test.js` | tests for formatted labels |
| `src/chartLibraries/dygraph/index.js` | pass sorted IDs + scale to ticker |

## Test Plan

### Pure module tests (`heatmapScale.test.js`)

Exhaustive, isolated. **No mocks, no chart, no dygraph** (per AGENTS.md
testing rules). Pure function input/output assertions.

**`parseHeatmapValue`:**
- Integers: `"0"` → `0`, `"5"` → `5`, `"10000"` → `10000`
- Decimals: `"0.005"` → `0.005`, `"2.5"` → `2.5`, `".5"` → `0.5`
- `"5."` (trailing dot) → `NaN` (regex `\d+` requires digits after dot)
- `+Inf` variants: `"+Inf"` → `Infinity`, `"+inf"` → `Infinity`, `"-Inf"` → `NaN`, `"Inf"` → `NaN` (no leading +)
- Rejected (→ `NaN`): `"5ms"`, `"5e3"`, `"0x10"`, `"abc"`, `""`, `null`, `undefined`, `" "`, `"+5"`, `"-5"`, `"1,000"`

**`isHeatmapNumeric`:**
- `["0.005", "0.01", "+Inf"]` → `true`
- `["1", "2", "5", "10", "+Inf"]` → `true`
- `["5ms", "1", "+Inf"]` → `false`
- `["+Inf"]` → `true` (single +Inf is valid)
- `[]` → `true` (vacuous — caller handles empty)
- `["0", "5", "10"]` → `true` (zero is numeric)

**`isHeatmapBinary`:**
- `["1024", "2048", "4096", "+Inf"]` → `true`
- `["1", "2", "4", "8"]` → `true`
- `["0.25", "0.5", "1", "2", "4"]` → `true` (sub-1 fractions ignored by the >1 rule)
- `["0", "5", "10"]` → `false` (5 and 10 are not powers of 2)
- `["1000", "2000"]` → `false`
- `["3", "5", "+Inf"]` → `false`

**`detectHeatmapScale`:**
- `["1024", "2048", "+Inf"]` → `"binary"`
- `["0.005", "0.01", "+Inf"]` → `"num"` (no values > 1, vacuously not binary, falls to SI)
- `["0", "5", "10", "+Inf"]` → `"num"`
- `["5ms", "1"]` → `null` (not numeric)
- `[]` → `null` (no data → no inference)

**`sortHeatmapValues`:**
- `["5", "1", "10", "+Inf"]` → `["1", "5", "10", "+Inf"]`
- `["10", "+Inf", "1", "5"]` → `["1", "5", "10", "+Inf"]`
- `["0.25", "0.005", "1", "+Inf"]` → `["0.005", "0.25", "1", "+Inf"]`
- Input array not mutated (verify reference inequality)
- `["5ms", "1"]` → `null`
- `["+inf", "1"]` (lowercase) → `["1", "+inf"]` (preserve original string)
- Empty `[]` → `[]`

**`formatScaledValue`:**
- SI (`"num"`): `0.005` → `"5m"`, `0.001` → `"1m"`, `500` → `"500"`, `1000` → `"1k"`, `1500` → `"1.5k"`, `1000000` → `"1M"`, `0` → `"0"`
- Binary (`"binary"`): `500` → `"500"`, `1023` → `"1023"`, `1024` → `"1Ki"`, `1536` → `"1.5Ki"`, `1048576` → `"1Mi"`, `0` → `"0"`
- Trailing zero stripping: `1.50k` → `"1.5k"`, `1.00k` → `"1k"`

**`formatHeatmapLabel`:**
- `("+Inf", "num")` → `"+Inf"`
- `("+Inf", "binary")` → `"+Inf"`
- `("+Inf", null)` → `"+Inf"`
- `("0.005", "num")` → `"5m"`
- `("1024", "binary")` → `"1Ki"`
- `("5ms", "num")` → `"5ms"` (unparseable, defensive passthrough)
- `("0.005", null)` → `"0.005"` (fallback, raw)

### Required source-shape fixtures

- Live Prometheus-style payload: pure numeric IDs/names plus `+Inf`, including
  lexically broken order such as `["10", "120", "15", "1920", "2"]`.
- OTel-style payload: pure `explicit_bounds` strings plus final `+Inf`.
- Compatibility payload: prefixed bucket IDs such as `bucket_1`, `bucket_2`,
  `bucket_+Inf`, because Netdata chartengine can still generate internal
  prefixed dimension names.
- Fallback payload: any non-numeric bucket value preserves payload order.

### Integration tests

**`makeDimensions.test.js`:**
- Heatmap with numeric buckets → `getHeatmapSortedIds()` returns ascending,
  `getHeatmapScale()` returns `"num"` or `"binary"` correctly.
- Heatmap with non-numeric bucket → `getHeatmapSortedIds()` returns `null`,
  `getHeatmapScale()` returns `null`.
- `getHeatmapYIndex` returns sorted position when sorted, payload index when
  `null`.
- Runtime-added bucket (simulate by appending to `dimensionIds` and calling
  `updateDimensions`) → sorted order reflects new bucket correctly.

**`plotters/heatmap.test.js`:**
- Render with out-of-order numeric buckets → verify rows drawn at sorted
  y-positions (not payload positions).
- Render with non-numeric buckets → verify fallback to payload order (existing
  behavior preserved).

**`tickers/heatmap.test.js`:**
- Ticker with `"num"` scale → labels formatted with SI prefixes from
  `scalableUnits.num`.
- Ticker with `"binary"` scale → labels formatted with binary prefixes from
  `scalableUnits.binary`.
- Ticker with `null` scale → labels via `withoutPrefix` (existing behavior).
- `+Inf` always renders as `"+Inf"`.

### Testing rules (per AGENTS.md)

- **No mocks.** Real imports, real chart via `makeTestChart`.
- Existing tests must still pass (zero regressions).
- Use `makeTestChart` from `@jest/testUtilities` for integration tests.

## Acceptance Criteria

1. **Bug fixed:** runtime-added bucket renders in correct numeric position,
   not at the bottom. Verified by a test that simulates
   `["1", "2", "5", "10", "+Inf"]` then appends `"3"` and re-renders.
2. **Fallback preserved:** non-numeric heatmap dimensions fall back to payload
   order. Zero behavior change for categorical/mixed heatmaps.
3. **Labels scaled:** binary buckets render with `Ki/Mi/Gi` (from
   `scalableUnits.binary`), SI buckets with `m/k/M/G` (from
   `scalableUnits.num`), per the locked rules.
4. **`+Inf` always last and always labeled `"+Inf"`.**
5. **Pure module isolated:** `heatmapScale.js` imports only
   `scalableUnits` (pure data). No chart, dygraph, SDK, or provider imports.
   Independently unit-testable.
6. **Reuses existing infrastructure:** prefix tables come from
   `scalableUnits.js`, not invented. Per-value formatting is new (documented
   gap — existing system is axis-wide).
7. **No regressions:** all existing heatmap tests pass unchanged.
8. **Code style:** no semicolons, double quotes, 2-space indent, ES5 trailing
   commas — matches repo conventions.
9. **Lint and tests pass:** `yarn lint`, `yarn test`.

## Out of Scope

- Y-axis numeric scaling (linear/log/symlog row heights) — separate feature,
  not part of this bug fix. Current ordinal (equal-height) layout preserved.
- Core agent storage reorder — rejected (infeasible). Tracked separately.
- Per-chart unit configuration for bucket labels — Netdata is zero-config;
  value inference is the chosen path.
- X-axis changes — only y-axis (bucket axis) is in scope.
- Refactoring the existing axis-wide conversion system to support per-value
  formatting — would be a cross-cutting change affecting all charts. The
  per-value formatting here is heatmap-specific and isolated.

## Formatting Decisions (Locked)

1. SI micro prefix (`u` in the table) — values < 0.001 (e.g. `0.0001`) format
   with the existing `scalableUnits.num` table, e.g. `"100u"`.
2. Prefix spacing — compact labels are chosen: `"5m"`, `"1.5k"`, `"1Mi"`.
   This is shorter and fits better in narrow y-axis space. Confirmed by user.
3. Decimal count — up to 2 decimal places, stripping trailing zeros.

## Follow-up Scope: Live Heatmap X-Axis Synchronization

### User-approved decision

**Decision:** A — test-first surgical fix.

The user reported that in PLAY mode the x-axis and heatmap sometimes advance
on alternating seconds:

- PLAY tick advances the x-axis by one second while the heatmap stays in place.
- Fetch completion advances the heatmap by one second while the x-axis stays in
  place.
- The effect can alternate on odd/even seconds or catch up within the same
  second depending on fetch timing.

### Evidence

- PLAY mode updates `root.fetchAt` from `Date.now()` and triggers render once
  per second (`src/sdk/plugins/play.js`).
- `chart.getDateWindow()` uses `root.fetchAt` for relative live windows
  (`src/sdk/makeChart/index.js`).
- API payload windows use `fetchStartedAt`, rounded with
  `Math.ceil(fetchStartedAt / 1000)` (`src/sdk/makeChart/api/helpers.js`).
- Successful fetch processing is deferred with `setTimeout(..., 0)` before it
  triggers render (`src/sdk/makeChart/makeDataFetch.js`).
- Heatmap cell x positions come from payload row timestamps, copied through
  `camelizePayload.js` and rendered by the Dygraph heatmap plotter.

### Working theory

The heatmap renderer itself is not asynchronous. The visible dancing is caused
by two different live clocks:

- x-axis clock: `root.fetchAt`
- payload clock: `fetchStartedAt` rounded to seconds

These clocks can diverge by about one second. Heatmaps make the mismatch
obvious because they render hard-edged cells across the full plot area.

### Requirements

- Add a failing test that reproduces the one-second divergence before changing
  implementation.
- Apply the smallest fix that makes live relative date windows and fetched
  payload windows use the same effective timestamp.
- Preserve absolute windows (`after > 0`) and hover/frozen rendered windows.
- Keep the change global only if necessary; do not add a heatmap-only timing
  workaround unless the source-level evidence requires it.

### Implementation

- Added `liveAnchor` as a chart attribute. `chart.getDateWindow()` uses it for
  live relative windows when present, instead of advancing from the root
  `fetchAt` clock between payload updates.
- Extracted `getLiveFetchBefore()` from the API payload helper so API payload
  windows and chart render windows share the same live anchor calculation.
- Bound the live anchor to the specific fetch response closure. This avoids a
  race where a second fetch with different attributes could otherwise affect a
  queued `doneFetch()` callback from a previous response.
- Preserved absolute windows and `viewUpdateEvery` windows that the API keeps
  relative (`before: 0`).

### Verification

- Added a regression test proving `getDateWindow()` stays anchored while
  `root.fetchAt` advances between payload updates.
- Added helper tests for live relative, hover-rendered, absolute, and
  `viewUpdateEvery` request windows.
- Added fetch lifecycle tests proving successful fetches store the same live
  request anchor used by the API payload window.
- Added an async race test proving queued fetch responses keep their own live
  anchor when another fetch starts before the queued callback runs.
- Passed focused SDK tests:
  `yarn test src/sdk/makeChart/index.test.js src/sdk/makeChart/makeDataFetch.test.js src/sdk/makeChart/api/helpers.test.js --coverage=false --runInBand`
- Passed focused heatmap/dygraph tests:
  `yarn test src/helpers/heatmapScale.test.js src/sdk/makeChart/makeDimensions.test.js src/chartLibraries/dygraph/plotters/heatmap.test.js src/chartLibraries/dygraph/tickers/heatmap.test.js src/chartLibraries/dygraph/index.test.js src/sdk/makeChart/index.test.js src/sdk/makeChart/makeDataFetch.test.js src/sdk/makeChart/api/helpers.test.js --coverage=false --runInBand`
- Passed full tests:
  `yarn test --coverage=false --runInBand`
- Passed build:
  `yarn build`
- Passed package copy to cloud-frontend:
  `yarn to-cloud`
- Passed cloud-frontend consuming build after the copy:
  `ENV=production yarn build:dev` from `../cloud-frontend`
- Passed scoped lint on changed source/test files:
  `./node_modules/.bin/eslint src/sdk/initialAttributes.js src/sdk/makeChart/api/helpers.js src/sdk/makeChart/api/helpers.test.js src/sdk/makeChart/index.js src/sdk/makeChart/index.test.js src/sdk/makeChart/makeDataFetch.js src/sdk/makeChart/makeDataFetch.test.js`
- Repo-wide lint was also checked with `yarn lint`; it still fails on
  unrelated existing errors outside this change.

## Follow-up Scope: Heatmap Nonzero API Option

### User-approved requirement

The `nonzero` API option must not be sent for heatmaps. The option removes
dimensions that contain only zero values, but heatmaps depend on all bucket
dimensions being present. When `nonzero` is applied to heatmap data, the chart
can collapse into a single remaining bucket.

### Evidence

- `eliminateZeroDimensions` defaults to true
  (`src/sdk/initialAttributes.js`).
- `getChartURLOptions()` currently adds `nonzero` for all non-table chart
  libraries (`src/sdk/makeChart/api/helpers.js`).
- Heatmaps are rendered through the dygraph chart library, so the existing
  `chartLibrary !== "table"` guard still allows `nonzero` for heatmaps.

### Requirements

- Keep `nonzero` for normal non-table, non-heatmap charts.
- Keep excluding `nonzero` for table charts.
- Exclude `nonzero` when `chartType` is `heatmap`.
- Exclude `nonzero` when `selectedChartType` is `heatmap`, so explicit heatmap
  state is protected before the rendered chart type catches up.

### Implementation

- `getChartURLOptions()` now computes an effective chart type from
  `selectedChartType || chartType`.
- `nonzero` is only added when zero-dimension elimination is enabled and the
  chart is neither a table nor a heatmap.

### Verification

- Added failing-first tests proving `nonzero` was still present for
  `chartType: "heatmap"` and `selectedChartType: "heatmap"`.
- Passed helper regression tests:
  `yarn test src/sdk/makeChart/api/helpers.test.js --coverage=false --runInBand`
- Passed focused API and heatmap tests:
  `yarn test src/sdk/makeChart/api src/helpers/heatmap.test.js src/helpers/heatmapScale.test.js src/sdk/makeChart/makeDimensions.test.js src/chartLibraries/dygraph/plotters/heatmap.test.js src/chartLibraries/dygraph/tickers/heatmap.test.js src/chartLibraries/dygraph/index.test.js --coverage=false --runInBand`
- Passed full tests:
  `yarn test --coverage=false --runInBand`
- Passed build:
  `yarn build`
- Passed scoped lint on changed source/test files:
  `./node_modules/.bin/eslint src/sdk/makeChart/api/helpers.js src/sdk/makeChart/api/helpers.test.js`
- Passed package copy to cloud-frontend:
  `yarn to-cloud`
- Passed cloud-frontend consuming build after the copy:
  `ENV=production yarn build:dev` from `../cloud-frontend`
- Repo-wide lint was checked with `yarn lint`; it still fails on unrelated
  existing errors outside this change.

## Follow-up Scope: Heatmap Popover Axis Order

### User-approved requirement

Heatmap popovers must not be value sorted. Value sorting is misleading for
bucketed heatmaps because the popover order stops matching the bucket scale.
Heatmap popovers must use the same bucket ordering and label formatting model
as the heatmap y-axis, including the 5 + 1 + 1 zero-edge crop. Cropping is
necessary because bucket counts can be large and the popover must stay readable.

Non-heatmap popovers must not be affected.

### Evidence

- The generic line popover requests `valueDesc` for normal value rows.
- Heatmaps need bucket-scale ordering, not value ranking, because each row is a
  bucket boundary on the y-axis scale.
- `chart.getVisibleHeatmapIds()` applies `cropHeatmapZeroEdges()` and is the
  list already used by the rendered heatmap y-axis.
- The base heatmap id list can be too large for popovers when many buckets are
  present.
- Heatmap label formatting is already centralized through
  `chart.getDimensionName()` after the prior label-formatting change.

### Requirements

- Heatmap popovers must ignore requested value/anomaly/annotation sort methods.
- Heatmap popovers must return cropped heatmap bucket order:
  numeric bucket order when available, otherwise normal visible dimension order,
  after applying the 5 + 1 + 1 zero-edge crop.
- Heatmap labels must remain scaled exactly like y-axis labels.
- Non-heatmap `onHoverSortDimensions()` behavior must remain unchanged.

### Implementation

- `src/sdk/makeChart/makeDimensions.js` now returns
  `chart.getVisibleHeatmapIds()` directly for heatmap hover popovers.
- This means heatmap popovers ignore the generic line-popover `valueDesc`
  request and stay in bucket-scale order.
- Because `chart.getVisibleHeatmapIds()` is the cropped heatmap list, heatmap
  popovers stay decluttered when the source has many buckets.
- Non-heatmap popovers still call the existing requested sort method with
  `chart.getVisibleDimensionIds()`.
- Scaled heatmap label formatting remains in `chart.getDimensionName()`.

### Verification

- Updated regression tests proving:
  - heatmap popovers ignore `valueDesc`;
  - heatmap popovers use cropped y-axis bucket order;
  - non-heatmap popovers remain value-sorted.
- Passed focused makeDimensions tests:
  `yarn test src/sdk/makeChart/makeDimensions.test.js --coverage=false --runInBand`
- Passed broader heatmap/chart tests:
  `yarn test src/sdk/makeChart/makeDimensions.test.js src/helpers/heatmap.test.js src/helpers/heatmapScale.test.js src/chartLibraries/dygraph/hoverX.test.js src/chartLibraries/dygraph/plotters/heatmap.test.js src/chartLibraries/dygraph/tickers/heatmap.test.js src/chartLibraries/dygraph/index.test.js --coverage=false --runInBand`
- Passed full tests:
  `yarn test --coverage=false --runInBand`
- Passed build:
  `yarn build`
- Passed scoped lint on changed source/test files:
  `./node_modules/.bin/eslint src/sdk/makeChart/makeDimensions.js src/sdk/makeChart/makeDimensions.test.js src/chartLibraries/dygraph/hoverX.js src/chartLibraries/dygraph/hoverX.test.js src/chartLibraries/dygraph/plotters/heatmap.js src/chartLibraries/dygraph/plotters/heatmap.test.js`
- Passed package copy to cloud-frontend:
  `yarn to-cloud`
- Passed cloud-frontend rebuild and install:
  `sudo ./agent.sh`
- Passed cloud-frontend final install copy:
  `sudo ./agent.sh install`
- Repo-wide lint was checked with `yarn lint`; it still fails on unrelated
  existing errors outside this change.

## Follow-up Scope: Heatmap Popover List Windowing

### User-approved requirement

Heatmap popovers must keep the heatmap bucket crop, because bucket counts can be
large and zero-only scale edges should be removed. After that heatmap-specific
crop is applied, the popover must show all remaining heatmap buckets. It must
not apply the generic popover window that hides rows behind `+N more values`.

Non-heatmap popovers must keep the existing generic popover windowing behavior.

### Evidence

- `chart.getVisibleHeatmapIds()` already returns the heatmap-specific cropped
  bucket list.
- `src/components/line/popover/dimensions.js` then applies a second generic
  row window with `getFrom()`, `getTo()`, and `dimensionIds.slice(from, to)`.
- That generic window is what renders `↑N more values` and `↓N more values`.
- Applying both crops to heatmaps hides buckets that already survived the
  heatmap-specific crop.

### Requirements

- Heatmap popovers must still get ids through `chart.onHoverSortDimensions()`,
  which returns the cropped heatmap bucket list.
- Heatmap popovers must render that returned list in full.
- Heatmap popovers must not render `more values` indicators.
- Non-heatmap popovers must still apply the generic row window and `more values`
  indicators.

### Implementation

- `src/components/line/popover/dimensions.js` now detects heatmap charts before
  applying the generic popover row window.
- For heatmaps, the popover renders the full id list returned by
  `chart.onHoverSortDimensions()`. That list is already the cropped heatmap
  bucket list.
- For non-heatmaps, the existing `getFrom()`, `getTo()`, `slice()`, and
  `more values` behavior is unchanged.

### Verification

- Added rendered popover regression tests proving:
  - heatmaps render all buckets that survived the heatmap bucket crop;
  - heatmaps do not render `more values` indicators;
  - non-heatmap popovers still render the generic `more values` indicator when
    there are more than 10 dimensions.
- Passed focused popover tests:
  `yarn test src/components/line/popover/dimensions.test.js --coverage=false --runInBand`
- Passed broader heatmap/chart/popover tests:
  `yarn test src/components/line/popover/dimensions.test.js src/sdk/makeChart/makeDimensions.test.js src/helpers/heatmap.test.js src/helpers/heatmapScale.test.js src/chartLibraries/dygraph/hoverX.test.js src/chartLibraries/dygraph/plotters/heatmap.test.js src/chartLibraries/dygraph/tickers/heatmap.test.js src/chartLibraries/dygraph/index.test.js --coverage=false --runInBand`
- Passed full tests:
  `yarn test --coverage=false --runInBand`
- Passed build:
  `yarn build`
- Passed scoped lint on changed source/test files:
  `./node_modules/.bin/eslint src/components/line/popover/dimensions.js src/components/line/popover/dimensions.test.js src/sdk/makeChart/makeDimensions.js src/sdk/makeChart/makeDimensions.test.js src/chartLibraries/dygraph/hoverX.js src/chartLibraries/dygraph/hoverX.test.js src/chartLibraries/dygraph/plotters/heatmap.js src/chartLibraries/dygraph/plotters/heatmap.test.js`
- Passed package copy to cloud-frontend:
  `yarn to-cloud`
- Passed cloud-frontend rebuild and install:
  `sudo ./agent.sh`
- Passed cloud-frontend final install copy:
  `sudo ./agent.sh install`
- Repo-wide lint was checked with `yarn lint`; it still fails on unrelated
  existing errors outside this change.

## Follow-up Scope: Heatmap Edge Zero Cropping

### User-approved requirement

Heatmaps should visually crop zero-only buckets only at the bottom and top
edges. Interior zero buckets must remain visible. The crop must keep at least
5 buckets visible when there is any non-zero bucket. The crop must also retain
one zero-only bucket below the non-zero span and one zero-only bucket above the
non-zero span when such buckets exist; this gives users visual context that the
data does not occupy the whole scale. This does not change the minimum from 5
to 7. If all buckets are zero, the full bucket scale must remain visible so
users can still see the scale.

This aligns with the Netdata `nonzero` behavior: when all dimensions are zero,
all dimensions remain visible.

### Evidence

- Heatmap bucket order already has a dedicated sorted-id path in
  `src/sdk/makeChart/makeDimensions.js`.
- The heatmap y-axis already asks `getVisibleHeatmapIds()` for labels in
  `src/chartLibraries/dygraph/index.js`.
- The heatmap plotter uses `getHeatmapYIndex()` to map each bucket id to its
  row in `src/chartLibraries/dygraph/plotters/heatmap.js`.
- Incremental heatmap values depend on `isDimensionVisible()` when subtracting
  previous bucket values in `src/sdk/makeChart/makeDimensions.js`.

### Requirements

- Do not remove dimensions from the API response.
- Do not alter global dimension visibility for the crop, because that can break
  incremental heatmap bucket math.
- Apply cropping only to the heatmap-visible id list used by y-axis labels,
  heatmap row mapping, and heatmap value range.
- Crop only leading and trailing zero-only buckets.
- Preserve interior zero-only buckets.
- Preserve the full scale when all visible buckets are zero-only.
- Keep at least 5 buckets visible when there is any non-zero bucket.
- Keep one zero-only bucket below and one zero-only bucket above the non-zero
  span when those buckets exist and would otherwise be hidden.

### Implementation

- Added a pure `cropHeatmapZeroEdges()` helper in `src/helpers/heatmap.js`.
- `chart.getVisibleHeatmapIds()` now crops only the heatmap-visible bucket id
  list. It does not change global dimension visibility.
- `chart.getHeatmapYIndex()` returns `-1` for cropped heatmap buckets so the
  plotter skips those rows.
- Dygraph heatmap `valueRange` now uses the cropped heatmap bucket count, so
  the y-axis range and rendered rows stay aligned.
- Added a shared real raw heatmap payload test helper under
  `jest/testUtilities/heatmapPayload.js` so crop tests use `doneFetch()` and
  the same internal payload state production uses.

### Verification

- Passed focused heatmap tests:
  `yarn test src/helpers/heatmap.test.js src/helpers/heatmapScale.test.js src/sdk/makeChart/makeDimensions.test.js src/chartLibraries/dygraph/index.test.js src/chartLibraries/dygraph/plotters/heatmap.test.js src/chartLibraries/dygraph/tickers/heatmap.test.js --coverage=false --runInBand`
- Passed full tests:
  `yarn test --coverage=false --runInBand`
- Passed build:
  `yarn build`
- Passed scoped lint on changed files:
  `./node_modules/.bin/eslint jest/testUtilities/heatmapPayload.js jest/testUtilities/index.js src/helpers/heatmap.js src/helpers/heatmap.test.js src/sdk/makeChart/makeDimensions.js src/sdk/makeChart/makeDimensions.test.js src/chartLibraries/dygraph/index.js src/chartLibraries/dygraph/index.test.js`
- Passed package copy to cloud-frontend:
  `yarn to-cloud`
- Passed cloud-frontend consuming build after the copy:
  `ENV=production yarn build:dev` from `../cloud-frontend`
- Repo-wide lint was checked with `yarn lint`; it still fails on unrelated
  existing errors outside this change.

## Follow-up Scope: Heatmap Hover Row Alignment

### User-approved requirement

Heatmap hover must show the value for the cell under the hairline. The rendered
cell color, selected timestamp row, highlighted y bucket, and popover value
must all refer to the same payload row and bucket. The fix is surgical: do not
change API data, Dygraph x-axis behavior, bucket ordering, or zero-edge
cropping behavior.

### Evidence

- Dygraph points carry `idx`, the original payload row index. The point-array
  loop index is only the index inside Dygraph's current visible point set.
- Dygraph can slice points to the visible date window, making point-array index
  and payload row index diverge.
- The heatmap plotter painted each cell at `p.canvasx` but read the color value
  with the loop index, so a rendered cell could be colored from the previous or
  next payload row.
- Hover bucket selection asked Dygraph for the closest x/y point and used only
  the returned series name. The row returned by that nearest-point search was
  ignored, while the hairline and popover continued to use the selected x
  timestamp row.
- Heatmap y geometry is custom: the plotter positions buckets with
  `getHeatmapYIndex()`, not with Dygraph's point y-value. Therefore Dygraph's
  generic nearest-point y search is not authoritative for heatmap bucket
  selection.

### Requirements

- Heatmap rendering must read values using `point.idx` when Dygraph provides it.
- Fallback to the loop index only when a point has no numeric `idx`, preserving
  defensive behavior for tests or unexpected Dygraph shapes.
- Heatmap hover must derive the y bucket from the cursor's y position and the
  current visible heatmap bucket list.
- Heatmap hover must keep the x timestamp supplied by Dygraph's selected row;
  only the bucket selection logic changes.
- Non-heatmap hover behavior must remain unchanged.
- Add regression tests for both mismatches.

### Implementation

- `src/chartLibraries/dygraph/plotters/heatmap.js` now uses `p.idx` for value
  lookup when available and falls back to the point-array loop index.
- `src/chartLibraries/dygraph/hoverX.js` now maps heatmap cursor y to
  `chart.getVisibleHeatmapIds()` via `dygraph.toDomYCoord(index)` bucket
  centers, instead of using `findClosestPoint()`.
- Non-heatmap hover paths still use the existing Dygraph nearest-point or
  stacked-point logic.

### Verification

- Added failing-first regression tests proving:
  - heatmap renderer uses `p.idx` instead of the point-array index;
  - heatmap hover ignores a neighboring `findClosestPoint()` result and selects
    the bucket under the cursor.
- Passed focused regressions:
  `yarn test src/chartLibraries/dygraph/plotters/heatmap.test.js src/chartLibraries/dygraph/hoverX.test.js --coverage=false --runInBand`
- Passed broader heatmap/chart tests:
  `yarn test src/chartLibraries/dygraph/hoverX.test.js src/chartLibraries/dygraph/plotters/heatmap.test.js src/chartLibraries/dygraph/index.test.js src/helpers/heatmap.test.js src/helpers/heatmapScale.test.js src/sdk/makeChart/makeDimensions.test.js src/chartLibraries/dygraph/tickers/heatmap.test.js --coverage=false --runInBand`
- Passed full tests:
  `yarn test --coverage=false --runInBand`
- Passed build:
  `yarn build`
- Passed scoped lint on changed source/test files:
  `./node_modules/.bin/eslint src/chartLibraries/dygraph/hoverX.js src/chartLibraries/dygraph/hoverX.test.js src/chartLibraries/dygraph/plotters/heatmap.js src/chartLibraries/dygraph/plotters/heatmap.test.js`
- Passed package copy to cloud-frontend:
  `yarn to-cloud`
- Passed cloud-frontend rebuild and install:
  `sudo ./agent.sh`
- Passed final cloud-frontend install copy:
  `sudo ./agent.sh install`
- Repo-wide lint was checked with `yarn lint`; it still fails on unrelated
  existing errors outside this change.

## Superseded Follow-up Scope: Heatmap Popover Sorting and Labels

This section records the earlier value-sorted heatmap popover approach. It is
superseded by `Follow-up Scope: Heatmap Popover Axis Order` above.

### Superseded requirement

Heatmap popovers must be value-sorted like normal chart popovers. The heatmap
popover labels must use the same scaled bucket formatting as the heatmap y-axis.
Non-heatmap popovers must not be affected.

### Evidence

- The line popover asks for value sorting by passing `valueDesc` for normal
  value rows.
- `chart.onHoverSortDimensions()` overrides all heatmap popover sorting to the
  default dimension sort, so heatmaps do not honor the requested value sort.
- The default sort falls back to `getDimensionName(...).localeCompare(...)`,
  which creates lexicographic ordering when priorities do not dominate.
- Heatmap y-axis labels already use `formatHeatmapLabel(..., scale)`.
- Popover labels use `chart.getDimensionName()`, and the heatmap branch only
  strips prefixes. It does not apply heatmap scale formatting.
- The rendered heatmap uses `getVisibleHeatmapIds()`, while the popover uses
  `getVisibleDimensionIds()`. After edge cropping, this can let the popover
  include buckets not currently visible on the heatmap.

### Requirements

- Heatmap popovers must sort by the requested hover sort method, especially
  `valueDesc`.
- Heatmap popovers must use `getVisibleHeatmapIds()` so cropped buckets do not
  appear in the popover list.
- Heatmap popover labels must use `formatHeatmapLabel()` with the chart's
  detected heatmap scale.
- Non-heatmap `onHoverSortDimensions()` behavior must remain unchanged.
- Add regression tests for heatmap value sorting, heatmap scaled labels, cropped
  heatmap popover ids, and non-heatmap value sorting.

### Implementation Plan

- Update `chart.onHoverSortDimensions()` to select the visible id source based
  on chart type:
  - heatmap: `chart.getVisibleHeatmapIds()`
  - non-heatmap: `chart.getVisibleDimensionIds()`
- Let heatmaps use the requested sort method instead of forcing default sort.
- Update heatmap `chart.getDimensionName()` to use `formatHeatmapLabel()` after
  prefix stripping, using `chart.getHeatmapScale()`.

### Implementation

- `src/sdk/makeChart/makeDimensions.js` now lets heatmaps use the requested
  hover sort method instead of forcing the default dimension sort.
- Heatmap hover popovers now read ids from `chart.getVisibleHeatmapIds()`, so
  buckets cropped from the rendered heatmap are not shown in the popover.
- Non-heatmap hover popovers still read ids from `chart.getVisibleDimensionIds()`
  and still use the requested hover sort method.
- Heatmap `chart.getDimensionName()` now formats bucket labels with
  `formatHeatmapLabel(withoutPrefix(...), chart.getHeatmapScale())`, matching
  the y-axis label formatter.
- Legend selection compatibility for prefixed heatmap buckets is preserved by
  matching the raw stripped bucket label as well as the displayed formatted
  label.

### Verification

- Added failing-first regression tests proving:
  - heatmap hover popovers use value sorting and cropped visible heatmap ids;
  - heatmap popover labels use scaled formatting;
  - raw prefixed bucket legend selection still works after label formatting;
  - non-heatmap hover popovers remain value-sorted.
- Passed focused makeDimensions tests:
  `yarn test src/sdk/makeChart/makeDimensions.test.js --coverage=false --runInBand`
- Passed broader heatmap/chart tests:
  `yarn test src/sdk/makeChart/makeDimensions.test.js src/helpers/heatmap.test.js src/helpers/heatmapScale.test.js src/chartLibraries/dygraph/hoverX.test.js src/chartLibraries/dygraph/plotters/heatmap.test.js src/chartLibraries/dygraph/tickers/heatmap.test.js src/chartLibraries/dygraph/index.test.js --coverage=false --runInBand`
- Passed full tests:
  `yarn test --coverage=false --runInBand`
- Passed build:
  `yarn build`
- Passed scoped lint on changed source/test files:
  `./node_modules/.bin/eslint src/sdk/makeChart/makeDimensions.js src/sdk/makeChart/makeDimensions.test.js src/chartLibraries/dygraph/hoverX.js src/chartLibraries/dygraph/hoverX.test.js src/chartLibraries/dygraph/plotters/heatmap.js src/chartLibraries/dygraph/plotters/heatmap.test.js`
- Passed package copy to cloud-frontend:
  `yarn to-cloud`
- Passed cloud-frontend rebuild and install:
  `sudo ./agent.sh`
- Passed cloud-frontend final install copy:
  `sudo ./agent.sh install`
- Repo-wide lint was checked with `yarn lint`; it still fails on unrelated
  existing errors outside this change.
