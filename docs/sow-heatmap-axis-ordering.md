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
