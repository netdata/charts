# SOW-0002 - Incremental uPlot Migration

## Status

Status: in-progress

Sub-state: Design approved. Phase 0 renderer routing and lifecycle safety is active; no uPlot rendering code will be added until this independently testable seam is complete.

## Purpose

Make high-cardinality Netdata visualizations materially faster by transitioning
their internal rendering engine from Dygraphs to uPlot, one visualization at a
time, without changing the public Charts contract or visible functionality.

The measured hard gates are 3x faster at 100,000 values and 5x faster at
1,000,000 values for both initial frame-settled mount and repeated
frame-settled updates against the latest Dygraphs implementation.

## Required Base

This worktree was created before the current Nodes and chart-performance work
was merged. Do not start implementation from its original commit.

The user approved provisional development on top of the four open prerequisite
PRs because all are user-owned and expected to merge. The recorded integration
base uses these exact heads:

- PR #225, Nodes fleet query and sparklines: `ad91660f0fad`
- PR #226, playback recovery and frozen-window gaps: `7ae202333862`
- PR #227, hidden Dygraph series extraction: `1d86cd2f93c3`
- PR #228, smooth-line plotter allocations: `92750ee8c05d`

Before uPlot implementation:

1. Fetch `origin` and verify the recorded heads still identify the intended PR revisions.
2. Create a versioned local integration branch from the recorded `origin/main`.
3. Merge the four heads in PR-number order and run the prerequisite test/build suite.
4. Rebase the uPlot branch onto that integration base.
5. If a prerequisite PR changes, create a new versioned integration base and rebase the uPlot-only commits onto it; do not silently mutate the recorded base.

Before any migrated visualization becomes the default or the uPlot work is
proposed for final merge:

1. Wait for all four prerequisite PRs to merge.
2. Fetch the resulting latest `origin/main` and verify it contains their final revisions.
3. Rebase only the uPlot commits onto final `origin/main`, leaving provisional integration commits behind.
4. Recapture the latest Dygraphs baseline and rerun complete parity, performance, ordinary-chart, and consuming-application validation.

The old `origin/explore/uplot-spike` branch is reference material only. Do not
merge it wholesale and do not use it as the implementation base. Reuse an idea
only after checking it against the latest architecture, behavior, tests, and
maintainer rules.

## Locked Contract

- Keep all existing payloads and query semantics unchanged.
- Keep the public `@netdata/charts` SDK, React component, attribute, event, and
  chart-type contracts unchanged.
- Preserve the visual result and all user-visible behavior.
- uPlot is an internal rendering engine, not a new user-facing chart type.
- Cloud Frontend must not need migration-specific changes.
- Dygraphs must remain installed, supported, and available as the reference and
  fallback renderer.
- Do not fork or patch either upstream charting library.
- Do not remove Dygraphs after a visualization is migrated.

Behavioral parity includes:

- Values, dimensions, ordering, colors, units, ranges, nulls, and gaps.
- Live updates, corrected history, dimension addition, removal, and reordering.
- Visibility, focus, legend values, NIDL controls, and synchronized hover.
- Pan, zoom, selection, reset, touch, click, and keyboard behavior.
- Alerts, anomaly ribbons, annotations, overlays, tooltips, and crosshairs.
- Time zones, unit conversion, stacking, diverging values, and heatmap semantics.
- Pause, play, focus, error, empty-data, remount, and destruction behavior.

## Delivery Rules

- Transition one visualization or tightly coupled visualization family per
  independently mergeable PR.
- Use the existing renderer abstraction. Do not spread engine-specific checks
  through React components or SDK consumers.
- Keep Dygraphs as the default for a visualization until its uPlot path passes
  correctness and performance gates.
- Fall back to Dygraphs whenever the uPlot path is unsupported or its structural
  compatibility is uncertain.
- Do not combine migration work with unrelated cleanup, redesign, query changes,
  scheduling, or dashboard changes.
- Do not build a general benchmark product. Use only small, deterministic,
  task-specific measurements.

## Per-Visualization Gates

Before switching any visualization to uPlot:

1. Capture the latest Dygraphs baseline using identical deterministic data,
   browser, viewport, settings, and update sequences.
2. Prove equivalent output and interactions with automated tests and focused
   Storybook/browser verification.
3. Measure initial render, genuine live update, main-thread blocking, transient
   heap, settled heap, and repeated-update stability.
4. Demonstrate at least 3x faster frame-settled mount and repeated updates at
   100,000 values and 5x faster at 1,000,000 values.
5. Confirm ordinary charts and dashboards do not regress in behavior, cadence,
   responsiveness, or memory.
6. Keep a tested internal switch back to Dygraphs.

If a visualization cannot meet parity or either workload-specific target,
leave it on Dygraphs and present the measured blocker before changing the
design or contract.

## Suggested Sequence

Start with the complete line family: regular line, `stepPlot`, and sparkline
behavior, including their existing interactions and overlays. Continue only
after that independently mergeable milestone is accepted. Area, stacked,
bars, and heatmaps follow as separate milestones based on their verified
coupling and parity requirements.

Global update admission, refresh backoff, workers, WebGL, payload changes, and
backend changes are separate decisions. uPlot migration must first prove the
renderer-level gain without depending on them.

## Integration Base Decision - 2026-07-27

Decision: use a versioned local integration base containing the exact recorded heads of PRs #225-#228 so uPlot work can begin before those PRs merge.

Implications accepted:

- Prerequisite PR changes may require rebasing and adapting uPlot code/tests.
- Clean Git merges do not prove semantic compatibility; the combined prerequisite suite must pass.
- The integration branch is local scaffolding, not part of the final uPlot history.
- Final validation and performance claims must use the merged revisions on latest `origin/main`, not this provisional stack.

The completed SOW bootstrap was committed first as `9023f0c3c266` so branch construction and rebasing start from a clean worktree.

Integration validation completed on 2026-07-27:

- `integration/uplot-prereqs-20260727-v1` was created from the recorded `origin/main` and merged the four exact heads in PR-number order, producing `3c9eac8bea1f`.
- The combined base passed 150 Jest suites and 1,497 tests.
- CommonJS and ES6 builds passed.
- Repository-wide lint reported 36 pre-existing errors unrelated to the integration stack; no uPlot source exists yet.
- `codex/uplot-charts` was rebased onto that immutable integration base; the post-rebase documentation head used for research and baseline capture is `6bb27b5110ed`.

## Pre-Implementation Gate

Status: ready. Integration, research, current-baseline evidence, renderer routing, first-milestone scope, and performance interpretation are approved.

Problem / root-cause model:

- The current Dygraphs renderer cannot meet the intended high-cardinality responsiveness. In three reproducible Chromium runs, the median frame-settled update was 79.0 ms for 100,000 values and 715.4 ms for 1,000,000 values; sustained rates were 13.68 and 1.65 updates/second respectively.
- Renderer selection is coupled to chart type. `src/sdk/makeChart/filters/makeControllers.js` hardcodes `chartLibrary: "dygraph"` for every time-series chart type, while `src/sdk/index.js` constructs the UI before the payload supplies its final chart type.
- Renderer replacement is not lifecycle-safe. `src/components/chartContainer.js` mounts only once and resolves `chart.getUI()` again during cleanup, while the controller unmounts and replaces the UI object imperatively. Incremental per-type routing must fix this seam rather than copy the existing replacement pattern.
- uPlot requires aligned columnar data with ascending numeric x values and nullable numeric y values, while Charts payloads are row-major. The adapter therefore needs a measured, cached transpose without changing payload/query semantics.
- uPlot provides the low-level lifecycle and update primitives needed by Charts (`setData`, `setScale`, `setSeries`, `setSize`, hooks/plugins, and `destroy`), but panning, stacking, and Netdata overlays remain application responsibilities.

Evidence reviewed:

- The locked migration and consumer contracts above and `.agents/sow/specs/charts-public-consumer-contract.md`.
- Current integration source and tests for `src/makeDefaultSDK.js`, `src/chartLibraries/dygraph/`, `src/sdk/`, `src/components/line/`, renderer selection, chart mounting, overlays, hover, navigation, units, and dimensions.
- PR-head merge simulations, the validated integration base `3c9eac8bea1f`, and the rebased research/baseline head `6bb27b5110ed`.
- `origin/explore/uplot-spike` at `e49c1fb`: useful verified ideas exist, but its 921-line renderer, generalized performance HUD, direct `chartLibrary` exposure, older base, and monolithic structure are not acceptable as-is under this SOW.
- Official uPlot source, API, required CSS, demos, performance methodology, non-features, and lifecycle behavior at the recorded upstream revision below. npm registry verification found `1.6.32` is the current published release.
- Grafana's production wrapper pattern: rebuild only when configuration changes, otherwise use `setData`/`setSize`, and always destroy on unmount.
- VictoriaMetrics' line and heatmap integrations: real uPlot CSS inclusion, `setData`, dynamic series handling, range updates, resize handling, hooks, and explicit destruction.
- Current Dygraphs baseline captured with a temporary task-specific browser harness against `6bb27b5110ed`: deterministic row-major data, two pre-generated revisions, 1600x500 viewport, device-pixel ratio 1, Chromium 150, Node 22.22.0, 3 mounts, 2 warmups, 10 measured updates, and a 3-second sustained run per workload. Three complete runs produced stable medians:
  - 100,000 values (100 series x 1,000 points): 39.5 ms synchronous mount, 170.7 ms frame-settled mount, 11.3 ms synchronous update, 79.0 ms frame-settled update, 13.68 sustained updates/second, and 65.3 MiB sampled peak heap delta.
  - 1,000,000 values (1,000 series x 1,000 points): 269.5 ms synchronous mount, 1,503.5 ms frame-settled mount, 98.7 ms synchronous update, 715.4 ms frame-settled update, 1.65 sustained updates/second, and 347.3 MiB sampled peak heap delta.
  - The synchronous call and frame-settled values are both retained because Chromium defers substantial Canvas work beyond the adapter call. Comparing only JavaScript call duration would materially understate user-visible blocking.

Affected contracts and surfaces:

- Internal renderer implementations and selection, chart UI replacement/mount lifecycle, chart/root attributes, line rendering and variants, payload-to-renderer transformation, React overlays, renderer-neutral coordinate access, hover/click/navigation events, CSS, tests, Storybook, CJS/ES6 output, Cloud Frontend consumption, and performance measurements.

Existing patterns to reuse:

- Existing chart-library factory contract and `makeChartUI` lifecycle/event surface.
- Attribute-driven persistent state and `useAttributeValue` subscriptions.
- Current Dygraphs behavior as the executable parity oracle and fallback.
- Existing separated hover, navigation, overlay, plotter, ticker, and data-handler modules rather than a monolithic adapter.
- Real `makeTestChart`/provider/component tests without new Jest mocks, focused Storybook stories, and browser-level rendering checks.
- Upstream production pattern of `setData`/`setSize` for ordinary updates and complete rebuilds only for structural configuration changes.

Risk and blast radius:

- High risk: a renderer change can silently alter values, ranges, gap handling, axis formatting, color/visibility ordering, events, navigation, overlays, annotations, teardown, memory, and virtualization behavior.
- Renderer routing is a shared SDK seam. A bad change can also break existing transitions between time-series and gauge/table/pie renderers even when uPlot is disabled.
- Row-to-column conversion can erase the expected speed win or double memory if it is repeated unnecessarily or retained after teardown.
- Shipping upstream CSS as an external consumer requirement would violate the no-Cloud-migration contract; required functional styles must be supplied internally without breaking CJS/ES6 consumers.
- The performance baseline is provisional until the four prerequisite PRs merge; final claims require a fresh latest-`origin/main` baseline and full rerun.

Sensitive data handling plan:

- Benchmarks and committed fixtures use deterministic synthetic or already-sanitized local data only. Raw private high-cardinality responses remain under ignored `.local/` paths and are never copied into SOWs, tests, docs, skills, comments, screenshots, or benchmark output.
- No production systems are required or authorized for this work.

Implementation plan after the open decisions are resolved:

1. Make renderer resolution per time-series chart type and lifecycle-safe without changing the visible chart-type contract; add complete real-object regression coverage and keep every type on Dygraphs by default.
2. Add the current uPlot release and an internally styled, modular renderer implementation for the approved first line milestone. Keep data conversion, options, navigation, hover, coordinates, and overlays separated.
3. Add renderer-neutral coordinate primitives where React overlays currently reach through `getDygraph`, while preserving `getDygraph` for the fallback/reference path.
4. Validate line correctness and interactions against Dygraphs, then run the same deterministic browser workloads against both renderers.
5. Change the default only for the validated line milestone if every parity, performance, memory, ordinary-chart, build, and consumer gate passes; preserve a tested internal map override back to Dygraphs.
6. Keep later visualization families on Dygraphs and execute them as separate independently mergeable milestones.
7. After prerequisite PRs merge, rebase uPlot-only commits onto latest `origin/main`, recapture both baselines, and rerun all gates before final merge.

Validation plan:

Sensitive data gate:

- Before every milestone commit and before SOW completion, scan all changed durable artifacts and benchmark outputs for secrets, credentials, bearer tokens, community/customer or personal data, non-private identifying addresses, private endpoints, and proprietary incident details. Only deterministic synthetic or verified sanitized evidence may be committed.

- Unit and integration coverage with real uPlot, real Dygraphs where behavior is the oracle, real SDK charts/providers/components, and no new Jest mocks.
- Exact tests for payload alignment, null/gap handling, dimension add/remove/reorder, visibility, units/ranges/timezone/theme changes, empty/error/loading transitions, resize/remount/destroy, event parity, overlays, keyboard, mouse, and touch interactions in the approved line scope.
- Focused Storybook/browser checks in light/dark themes and ordinary/high-cardinality workloads.
- A small committed task-specific comparator reproducing the baseline method; no HUD, registry, general monitoring plugin, or production instrumentation.
- Performance reports must include synchronous and frame-settled mount/update distributions, sustained update rate, main-thread task time, sampled peak heap, post-teardown heap, and repeated-update stability.
- Full Jest suite, targeted lint on changed files, CJS and ES6 builds, Storybook build, consuming Cloud Frontend build/tests, and same-failure searches.

Artifact impact plan:

- AGENTS.md: update only if a new project-wide renderer or benchmark guardrail is learned.
- Runtime project skills: update renderer/testing skills with proven lifecycle, CSS, real-uPlot testing, and canonical benchmark commands.
- Specs: preserve the public consumer contract; record internal renderer/fallback behavior only if it becomes durable product behavior.
- End-user/operator docs: no migration instructions should be needed because uPlot remains internal; update only if shipped visible behavior or supported operation changes.
- End-user/operator skills: no change expected unless package usage changes, which the locked contract forbids.
- SOW lifecycle: move to `current/` after all decisions below are resolved and recorded; later visualization families remain separate milestones/PRs.

Open-source reference evidence:

- `leeoniya/uPlot @ 0e5812c504430f5c804e0f993376d8999b26cc34`
  - `README.md:3-14,24-47,77-98`
  - `docs/README.md:1-100`
  - `src/uPlot.js:811-815,1223-1293,2375-2379,2500-2504,3470-3480`
  - `dist/uPlot.d.ts:54-111`
  - `src/uPlot.css:1-113`
- `grafana/grafana @ d18e58d33aa8741f08fbab4aa73bdaf1f04e3be5`
  - `packages/grafana-ui/src/components/uPlot/Plot.tsx:60-103`
  - `packages/grafana-ui/src/components/uPlot/config/UPlotConfigBuilder.ts:1-240`
  - `public/app/plugins/panel/timeseries/TimeSeriesPanel.tsx:1-200`
- `VictoriaMetrics/VictoriaMetrics @ 07b6070193e806441386832d0bae7bdce4bf5fd5`
  - `app/vmui/packages/vmui/src/components/Chart/Line/LineChart/LineChart.tsx:1-138`
  - `app/vmui/packages/vmui/src/components/Chart/Heatmap/HeatmapChart/HeatmapChart.tsx:1-142`
  - `app/vmui/packages/vmui/src/utils/uplot/index.ts:1-240`

Resolved decisions:

- Use a per-chart-type internal renderer map with lifecycle-safe reconciliation after payload chart type is known. Keep uPlot out of user-facing chart-type controls.
- The first visualization milestone is the complete line family: regular line, `stepPlot`, and sparkline behavior with all existing line interactions and overlays. Area, stacked, bars, and heatmaps remain on Dygraphs.
- Apply the hard 3x-at-100k and 5x-at-1M gates to both initial frame-settled mount and repeated frame-settled updates. Continue reporting synchronous latency, sustained rate, main-thread time, and heap so the ratios cannot hide regressions.
- Use the immutable versioned integration stack now and discard it from final uPlot history after the prerequisite PRs merge.
- Keep uPlot internal, keep Dygraphs installed and supported, preserve query/payload/public contracts, use no new Jest mocks, and avoid a generalized benchmark product.

## Execution Log

### 2026-07-27 - Phase 0 renderer routing and lifecycle

Implemented:

- Added the internal `chartLibrariesByType` default map with every current time-series type still routed to Dygraphs.
- Added registered-renderer resolution, unavailable-renderer fallback, first-payload reconciliation, parent-inheritance reconciliation, explicit switch-back support, and protection for renderers selected as standalone chart libraries.
- Replaced unsafe unmount/assignment with `replaceUI`, which transfers a mounted DOM element, preserves custom `options.ui` overrides, and constructs the replacement with the same public chart object.
- Added `chartUIChanged` and `useChartUI`; migrated renderer-bound React subscriptions so they detach from a destroyed UI and attach to its replacement.
- Kept both chart-type controls visualization-oriented when a non-Dygraphs internal renderer is active.
- Updated the consumer-contract spec and Charts development skill with the durable routing and lifecycle rules.

Regression-first evidence:

- Before implementation, the new focused suite failed in eight places: missing renderer helpers, missing mounted-UI replacement, missing inheritance/first-payload routing, and chart-type controls treating the internal renderer as the selected visualization.
- A separate chart-identity assertion then exposed that the historical replacement path constructed renderers with the private backing node instead of the public chart object; the factory path was corrected and the regression test now passes.
- A switch-back test exposed ambiguity between a mapped renderer and the same library selected as a standalone visualization; active time-series routing state now distinguishes those cases.

Validation evidence:

- Focused routing/lifecycle/toolbox/default tests: 6 suites, 51 tests passed.
- Adjacent SDK/provider/line/container tests: 6 suites, 104 tests passed.
- Full suite without coverage: 152 suites passed; 1,510 tests passed and 2 skipped.
- Full coverage suite: 152 suites passed; 1,510 tests passed and 2 skipped; configured thresholds passed.
- Changed-file ESLint: passed.
- Repository-wide ESLint: the same 36 pre-existing errors recorded on the integration base; no changed Phase 0 file is listed.
- CommonJS and ES6 builds: 477 files compiled successfully in each distribution.
- Static Storybook build: passed; existing missing-MDX and bundle-size warnings remain.
- SOW audit and `git diff --check`: passed.

Phase 0 result:

- The routing seam is independently usable and all default behavior remains Dygraphs. No uPlot dependency or renderer source has been added yet.
