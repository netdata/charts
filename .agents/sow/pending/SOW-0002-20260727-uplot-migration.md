# SOW-0002 - Incremental uPlot Migration

## Status

Status: open

Sub-state: Blocked until the required base changes are present and the branch is refreshed against the resulting latest `origin/main`.

## Purpose

Make high-cardinality Netdata visualizations materially faster by transitioning
their internal rendering engine from Dygraphs to uPlot, one visualization at a
time, without changing the public Charts contract or visible functionality.

The measured target is a 3x minimum and 5x stretch improvement in genuine
high-cardinality data-update and rendering time against the latest Dygraphs
implementation.

## Required Base

This worktree was created before the current Nodes and chart-performance work
was merged. Do not start implementation from its current commit.

Before implementation:

1. Wait for the relevant Charts work to be merged:
   - PR #225: Nodes fleet query and sparklines.
   - PR #226: Playback recovery and frozen-window gaps.
   - PR #227: Hidden Dygraph series extraction.
   - PR #228: Smooth-line plotter allocations.
2. Fetch `origin`.
3. Rebase this branch onto the resulting latest `origin/main`.
4. Verify that `origin/main` contains the merged changes and the latest Charts
   release state.

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
4. Demonstrate at least a 3x improvement in the high-cardinality update/render
   workload; 5x is the intended upper target.
5. Confirm ordinary charts and dashboards do not regress in behavior, cadence,
   responsiveness, or memory.
6. Keep a tested internal switch back to Dygraphs.

If a visualization cannot meet parity or the 3x target, leave it on Dygraphs
and present the measured blocker before changing the design or contract.

## Suggested Sequence

Start with the visualization that offers the clearest low-risk performance
proof, normally plain line charts. Continue only after that PR is accepted.
Area, stepped, stacked, bars, and heatmaps follow as separate milestones based
on their verified coupling and parity requirements.

Global update admission, refresh backoff, workers, WebGL, payload changes, and
backend changes are separate decisions. uPlot migration must first prove the
renderer-level gain without depending on them.

## Pre-Implementation Gate

Status: blocked

Problem / root-cause model:

- High-cardinality visualizations need materially lower rendering and update cost, but no implementation should start until the required Charts work is merged and a current deterministic Dygraphs baseline is captured.

Evidence reviewed:

- The preserved migration contract above.
- `package.json`, `src/makeDefaultSDK.js`, `src/chartLibraries/`, `src/sdk/`, and current colocated tests.
- Required base PR presence and latest release state have not yet been verified; this is the blocking evidence gap.

Affected contracts and surfaces:

- Internal renderer implementations, chart libraries, SDK/chart attributes, React chart components, interactions, tests, Storybook, build output, Cloud Frontend consumption, and performance measurements.

Existing patterns to reuse:

- Existing chart-library abstraction, attribute-driven state, plugin system, real `makeTestChart` integration tests, colocated tests, and Storybook examples.

Risk and blast radius:

- High risk if behavioral parity, payload semantics, synchronized interactions, fallback behavior, or ordinary-chart performance changes. Delivery remains one visualization or tightly coupled family per independently reviewable unit.

Sensitive data handling plan:

- Benchmarks and fixtures must use deterministic synthetic or sanitized data. Do not write customer/community data, private endpoints, credentials, bearer tokens, production traces, or proprietary incident details into SOWs, tests, docs, skills, or comments.

Implementation plan:

1. Verify and refresh the required base.
2. Research current uPlot official APIs and source-verified open-source integration patterns.
3. Capture deterministic Dygraphs correctness and performance baselines.
4. Implement one renderer path behind the existing abstraction and fallback.
5. Prove parity and the minimum performance target before changing the default for that visualization.

Validation plan:

- Automated behavioral tests, focused Storybook/browser interaction checks, deterministic performance measurements, ordinary-chart regression checks, repeated-update memory checks, consuming Cloud Frontend validation, and same-failure searches.

Artifact impact plan:

- AGENTS.md: update only if project-wide workflow or guardrails change.
- Runtime project skills: update renderer/testing skills with reusable lessons and canonical benchmark commands.
- Specs: update the consumer contract only if public behavior changes; the locked requirement is no public contract change.
- End-user/operator docs: update only if visible behavior or supported operation changes.
- End-user/operator skills: update affected consumer guidance if package usage changes.
- SOW lifecycle: move to `current/` only after this gate is refreshed to ready; split visualization milestones into separate SOWs if they become independently executable.

Open-source reference evidence:

- No external uPlot source was checked during SOW normalization. Record future research as `owner/repo @ commit` plus repository-relative paths before this gate becomes ready.

Open decisions:

- None beyond the preserved locked contract. The required-base and benchmark evidence gaps block implementation.
