# G9 — uPlot Navigation Parity (prod-readiness) — plan / mandate

> Parity sub-project G9. **Driver: ship uPlot in production without losing any dygraph
> functionality.** Acceptance = dygraph parity, same UX contracts. This doc covers the navigation +
> cursor + CSS gaps verified against source; the broader prod-readiness gap map (renderer-internal +
> app-coupling) is being expanded by two exploration audits and will feed follow-on parts.

## Verified gaps (evidence in hand)

### 1. Cursors not applied on uPlot  ·  quick, user-visible
`cursorStyle` (`src/components/helpers/cursorStyle.js:3-13`: default→default, pan→`grabbing`(:active),
select→`col-resize`, highlight→`crosshair`, selectVertical→`row-resize`) is pulled in ONLY inside the
`dygraph` branch of the `chartLibraries` map (`src/components/line/chartContentWrapper.js:14-45`, mixin
at `:43`). `StyledContainer` applies `chartLibraries[chartLibrary] || ""` (`:48`) → uPlot gets no
cursor rules. The `navigation` prop is already passed for every renderer (`:57,68`).
**Fix:** apply `cursorStyle` for uPlot too — add a `uplot` entry to `chartLibraries` (paired with the
CSS from part 2), or hoist the `cursorStyle` mixin so it applies regardless of `chartLibrary`. uPlot's
own stylesheet sets no cursor on `.u-over` (only `.u-series th`), so nothing overrides it.

### 2. uPlot layout CSS missing from the shipped library  ·  quick, breaks visuals in prod
`import "uplot/dist/uPlot.min.css"` exists ONLY in `.storybook/preview.js:5`. The library source
imports it nowhere, and the build is Babel-only (`package.json:16-18`, `babel src --copy-files`, no
bundler) with ZERO existing `.css` side-effect imports — dygraph ships its styling via
styled-components, not a CSS file. So a prod consumer gets uPlot with no `.u-over/.u-under`
positioning, no `.u-select` drag rectangle, no `.u-cursor-*` crosshair lines.
**Fix (build-safe, matches dygraph):** port the required uPlot rules into a `uplot` styled-components
block in `chartContentWrapper.js` (the minimal set from `uplot/dist/uPlot.min.css`: `box-sizing`,
`.u-wrap{position:relative;user-select:none}`, `.u-over,.u-under{position:absolute}`,
`.u-under{overflow:hidden}`, `.uplot canvas{display:block;position:relative;width:100%;height:100%}`,
`.u-axis{position:absolute}`, `.u-select{background:rgba(0,0,0,0.07);position:absolute;
pointer-events:none}`, `.u-cursor-x/-y/-pt`, `.u-*.u-off{display:none}`). Avoid a raw `import ".css"`
(would break the CJS `require` build path). Co-locate with the part-1 cursor entry.

### 3. Modifier-key navigation switching  ·  biggest behavioral gap
dygraph `src/chartLibraries/dygraph/navigation/generic.js:20-40`: on `mousedown`, Shift→`select`,
Alt→`highlight`, Shift+Alt→`selectVertical`, written via
`updateAttributes({ navigation, prevNavigation })`; `mouseup` restores `prevNavigation`
(`generic.js:35-40`). uPlot's `attachNavigation` `onDown` only handles `navigation === "pan"`
(`src/chartLibraries/uplot/index.js`), no modifier switching.
**Fix:** in uPlot's over `mousedown`, replicate the modifier→mode mapping and the
`navigation`/`prevNavigation` attribute contract; restore on `mouseup`. Because the SDK plugins and
the `navigation` attribute are renderer-agnostic, switching the attribute reuses the existing
select/highlight/selectVertical drag paths uPlot already has.

### 4. `highlightStart` fires at drag-end, not drag-start
dygraph emits `highlightStart`/`highlightVerticalStart` on `mousedown`
(`navigation/select.js:9`, `selectVertical.js:9`), so the SDK plugins set
`highlighting:true`+`enabledHover:false` DURING the drag (`src/sdk/plugins/select.js:5-7`,
`selectVertical.js:5-7`). uPlot emits start+end together at drag-end (`onSetSelect`,
`uplot/index.js:547,552`) → hover isn't suppressed mid-drag and the `highlighting` render-guard never
engages while selecting.
**Fix:** emit `highlightStart`/`highlightVerticalStart` from a `mousedown` in select/highlight/
selectVertical modes (keep the end emission in `onSetSelect`).

### 5. Missing drag threshold + wheel-zoom modifier mismatch
- dygraph ignores drags < 5px (`select.js:47`, `selectVertical.js:48`); uPlot fires on any
  `select.width > 0` (`uplot/index.js:549`) → a twitch zooms/highlights. Add the 5px threshold.
- dygraph wheel-zoom is gated on Shift/Alt (`generic.js:47` early-return); uPlot zooms on plain wheel
  (`uplot/index.js` `onWheel`). Reconcile to the intended prod behavior (confirm with maintainer which
  wins; default to matching dygraph unless product wants plain-wheel zoom).

## Sequencing
1 + 2 together (same `chartContentWrapper` edit) → 3 (modifier switching) → 4 → 5. Each TDD'd where a
seam exists (3/4/5 are unit-testable via synthetic events like the existing pan/touch tests; 1/2 are
CSS, maintainer-verified in Storybook — the perf/nav stories already exercise both renderers).

## Tests (real, no mocks — makeTestChart; synthetic mouse/wheel events on `u.over`)
- Modifier switch: `mousedown`+Shift sets `navigation:"select"` and `prevNavigation`; `mouseup`
  restores. Same for Alt→highlight, Shift+Alt→selectVertical.
- highlightStart: a `mousedown` in select mode emits `highlightStart` before any `mouseup`.
- threshold: a <5px drag emits no `highlightEnd`; a >5px drag does.
- wheel gating: per the chosen behavior.
- Full suite green; eslint clean on changed files.

## Visual verification (maintainer, Storybook — do NOT run a dev server on their behalf)
`chartLibrary:"uplot"`: pan shows `grabbing`, select `col-resize`, highlight `crosshair`,
selectVertical `row-resize`; the drag-select rectangle is visible; Shift/Alt temporarily switch modes
and release restores.

## Out of scope here → tracked separately
Renderer-internal parity (options/tickers/plotters/formatting/gaps) and app-level dygraph coupling
(`getDygraph`/`chartLibrary==="dygraph"` branches, `usePlotArea`, popover/indicators/alertTimeline)
are being enumerated by the two exploration audits; findings become G10+ parts.

## Constraints
No semicolons; double quotes; 2-space indent; 100-char; ES5 trailing commas; arrow functions; imports
at top; no description comments; NEVER mock; JSX files import React. Commit in logical chunks.
Test: `yarn jest --config ./jest/config.js <path> --collectCoverage=false`.
