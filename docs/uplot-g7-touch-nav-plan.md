# G7 — uPlot Touch / Mobile Navigation — plan / mandate

> Parity sub-project G7 (`docs/uplot-parity-gap-map.md` §G7). **Acceptance = dygraph parity.**
> uPlot currently has zero touch handlers; dygraph has single-finger horizontal pan, tap, and
> double-tap (`src/chartLibraries/dygraph/navigation/generic.js:104-141`).

## Current gap (verified)
`src/chartLibraries/uplot/index.js` `attachNavigation` binds only `mousedown`/`mousemove`/`mouseup`/
`wheel`/`dblclick`. No `touchstart`/`touchmove`/`touchend`. dygraph's `generic.js`:
- `touchStart`: horizontal-only direction, records first touch pageX, resets move flag.
- `touchMove`: pans; emits `panStart` on the first move.
- `touchEnd`: double-tap (`< 300ms`) → `dblclick` (→ `resetNavigation`); tap with no move →
  `updateAttribute("clickX", [dataX, null])`; otherwise if panning → `panEnd` with the date window.

## Parts

### Touch handlers in `attachNavigation`
Add `onTouchStart`/`onTouchMove`/`onTouchEnd` on `u.over`, gated by `enabledNavigation`, mirroring
the existing mouse-pan math (`u.posToVal(1,"x")-u.posToVal(0,"x")` units/px, `u.setScale("x",…)`):
- **start**: record `touch.clientX`, `u.scales.x.min/max`, units/px; clear `touchMoved`.
- **move**: `preventDefault` (non-passive listener); on first move set `touchMoved` and `emitNav("panStart")`;
  shift the x-scale by `unitsPerPx * (clientX - startX)`.
- **end** (same order as dygraph): if `now - lastTouchEndTime < 300` → `chart.resetNavigation()`;
  else set `lastTouchEndTime`; if not moved → tap → `updateAttribute("clickX", [posToVal(offsetX)*1000, null])`;
  else if panning → `emitNav("panEnd", [min*1000, max*1000])`.

Register the three listeners (touchmove `{passive:false}`) and add their removal to the existing
`attachNavigation` cleanup.

## Out of scope
Pinch-zoom (dygraph touch is horizontal-pan only per `touchDirections {x:true,y:false}`). Multi-touch.

## Tests (real, no mocks — makeTestChart)
- `index.test.js`: dispatch synthetic touch events on `u.over` (Event + `touches`/`changedTouches`,
  `over.getBoundingClientRect` overridden as in the click tests):
  - pan: touchstart→touchmove→touchend emits `panStart` then `panEnd` and shifts `u.scales.x`.
  - tap: touchstart→touchend (no move) sets `clickX` to the tapped timestamp.
  - double-tap: two taps within 300ms call `resetNavigation`.
- Full suite green; eslint clean on changed files.

## Visual verification (maintainer)
Storybook `chartLibrary:"uplot"` on a touch device / emulation: one-finger drag pans, tap sets the
crosshair, double-tap resets zoom — matching dygraph. Do NOT run a dev server.

## Constraints
No semicolons; double quotes; 2-space indent; 100-char; ES5 trailing commas; arrow functions; imports
at top; no description comments; NEVER mock. `Date.now()` is fine in app code (dygraph uses it).
Test: `yarn jest --config ./jest/config.js <path> --collectCoverage=false`.
