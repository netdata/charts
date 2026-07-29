---
name: project-testing
description: "Mandatory Charts testing workflow when adding or changing tests, fixing regressions, validating SDK/chart/component behavior, or claiming a Charts change is tested. Use before writing test doubles, selecting test commands, or reporting validation complete."
---
# Charts Testing

## Purpose

Keep tests behavioral and production-realistic so SDK lifecycle, provider subscriptions, rendering, and integration failures are caught instead of hidden behind hand-built mocks.

## Scope

Use this skill when:

- adding, changing, or reviewing `*.test.js` files;
- changing Jest setup, fixtures, test utilities, Storybook tests, or coverage configuration;
- validating SDK, chart-library, helper, component, or package behavior;
- investigating a regression or claiming tests are sufficient.

Do not use this skill for:

- product architecture decisions without test changes; also load `project-charts-development`;
- Cloud Frontend's Jotai/MSW test harness, which is a different repository workflow.

## Mandatory Knowledge

- Jest uses jsdom, tests match `*.test.js`, and roots are `src/` plus `.storybook/`. Evidence: `jest/config.js`.
- Global coverage thresholds are statements 50%, branches 40%, functions 47%, and lines 50%. Evidence: `jest/config.js`.
- Real chart integration tests use `makeTestChart`, `renderWithChart`, `renderHookWithChart`, and real providers from `jest/testUtilities/`. Evidence: `jest/testUtilities/index.js` and its implementations.
- Do not add Jest module mocks for Charts internals, netdata-ui, providers, or components. Existing legacy `jest.mock` tests are historical debt, not a pattern to copy. Evidence: `AGENTS.md` and repository search.
- Tests are colocated with source. Focused tests commonly disable coverage for speed; the full `yarn test` run enforces configured coverage.
- WebGPU/WebGL2 visual, completion, export, performance, shared-runtime, and physical-device behavior uses `benchmarks/time-series-renderers/`; jsdom unit tests cannot prove GPU execution. The harness validates exact Line/Area/Stacked draw counts, gaps, regular/step pixels, Dygraphs Area fill-order/baseline RGBA parity, diverging Stacked positive/negative band parity, exports, lifecycle, and fallback. GPU visual changes also require physical mixed-size/DPR resize checks because stale shared-context uniforms, fractional atlas scaling, and delayed backing-canvas updates are not visible in jsdom.

## Best Practices

- Assert public behavior, rendered output, chart attributes/events, payload effects, or returned values instead of private call counts.
- Use real imports and real providers. Build the smallest real chart state needed through `makeTestChart` and existing fixture helpers.
- Add a failing regression test before the implementation when expected behavior is established.
- Use deterministic payloads and explicit time control for polling, playback, debounce, and asynchronous lifecycle tests.
- Test cleanup and remount behavior for listeners, timers, observers, and chart instances.
- Keep focused commands in the execution log, then run the broadest affordable suite before completion.

## Bad Practices

- Do not use `jest.mock(...)` to replace Charts modules or netdata-ui because constructing the real path takes more effort.
- Do not hand-build partial chart objects when `makeTestChart` can expose the real contract.
- Do not assert `toBeDefined`, `typeof`, implementation call order, or conditional expectations when a concrete behavior can be asserted.
- Do not weaken coverage configuration or skip failing tests to make a change pass.
- Do not claim repo-wide lint or tests passed when only scoped commands ran or dependencies were unavailable.
- Do not fix unrelated existing failures inside a focused product change without explicit scope approval.

## Workflow Checklist

1. Read the active SOW, affected source, nearest tests, and relevant test utilities.
2. Identify the observable contract and the failure mode the test must detect.
3. Search for an existing real chart/provider/fixture pattern before creating setup code.
4. Write or update the behavioral regression first when practical.
5. Run the focused file or directory with `--coverage=false --runInBand` while iterating.
6. Implement the production change without weakening the test.
7. Run adjacent same-pattern tests and search for equivalent failure sites.
8. Run `yarn test`, `yarn build`, and lint when dependencies are available and scope requires them.
9. Exercise Storybook/browser or Cloud Frontend for visual/integration behavior that jsdom cannot prove.
10. Record exact commands, results, gaps, and unrelated failures in the SOW.

## Validation Checklist

Before claiming done:

- The test fails for the original defect or otherwise proves it can detect the changed behavior.
- Tests use real Charts/netdata-ui/provider imports and existing utilities.
- Focused, adjacent, and full-suite results are distinguished accurately.
- Coverage thresholds remain unchanged unless the user approved a separate policy change.
- Visual or consuming behavior has real-use evidence when applicable.
- The same failure pattern was searched across nearby chart types/components.
- Any missing dependency or environment gap is reported as a gap, not converted into a passing claim.

## Canonical Commands

```bash
yarn test path/to/file.test.js --coverage=false --runInBand
yarn test --coverage=false --runInBand
yarn test
yarn build
yarn lint
BENCHMARK_HEADED=1 CHROMIUM_OZONE_PLATFORM=wayland yarn benchmark:time-series
BENCHMARK_HEADED=1 BENCHMARK_RENDERERS=webgl2 yarn benchmark:time-series
BENCHMARK_HEADED=1 BENCHMARK_RENDERERS=webgpu,webgl2 CHROMIUM_OZONE_PLATFORM=wayland yarn benchmark:time-series
```

The physical benchmark page must display its current workload; a blank page or renderer fallback is a failed run. Software-adapter runs are correctness evidence only, never performance evidence.

Use `yarn to-cloud` followed by the consuming Cloud Frontend build/run path when package integration must be proven.

## Evidence

- `jest/config.js`: environment, roots, transforms, coverage, and test matching.
- `jest/testUtilities/index.js`: canonical real chart/provider utilities.
- `jest/testUtilities/makeTestChart.js`: real chart construction.
- `src/**/*.test.js`: colocated behavioral patterns.
- `.agents/sow/done/SOW-0003-20260707-heatmap-axis-ordering.md`: regression testing and consuming validation history.

## Update Rules

Update this skill when:

- Jest setup, thresholds, utilities, or canonical commands change;
- a regression passes existing tests and reveals a missing assertion or real-use gate;
- reviewers identify weak assertions or excessive mocking;
- a new fixture or integration path becomes canonical.
