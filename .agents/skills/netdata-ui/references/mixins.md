# Netdata UI Mixins Reference

Source-derived from `src/mixins` and `src/components/templates/mixins`. Use this for PR review when deciding whether a style belongs in props, an existing mixin, or a legitimate CSS feature.

## Exported Core Mixins

Importable from `@netdata/netdata-ui`: `alignSelf`, `controlFocused`, `controlReset`, `cursor`, `margin`, `opacity`, `padding`, `position`, `round`, `textTransform`, `webkitVisibleScrollbar`, and `zIndex`.

| Mixin | Prop | Accepted values and behavior |
|---|---|---|
| `alignSelf` | `alignSelf` | `start -> flex-start`, `end -> flex-end`, `center`, `stretch`; unknown values emit nothing. |
| `margin` | `margin` | Arrays of length 1-4 only. Values use `theme.constants.SIZE_SUB_UNIT` (4px). Non-arrays log an error and emit nothing. |
| `padding` | `padding` | Same as `margin`; arrays only. |
| `round` | `round` | `true -> 4px`, number times 4px, string passthrough, or `{ side, size }` for `top`, `bottom`, `left`, `right`, `top-left`, `top-right`, `bottom-left`, `bottom-right`. Falsey emits nothing. |
| `position` | `position` | `static`, `absolute`, `fixed`, `relative`, `sticky`, `initial`, `inherit`; unknown values emit nothing. |
| `cursor` | `cursor` | Any provided value is emitted as `cursor`. |
| `opacity` | `opacity` | `weak -> 0.3`, `medium -> 0.4`, `strong -> 0.8`, `none -> 1`, or numeric/string passthrough if non-null. |
| `zIndex` | `zIndex` | Emits provided value when not null/undefined. |
| `textTransform` | `textTransform` | Supports CSS values and the custom `firstLetter` behavior used by buttons. Verify exact handling in `src/mixins/textTransform.js`. |
| `controlFocused` | none | CSS block for focus border/shadow using theme token `controlFocused`. |
| `controlReset` | none | CSS reset block for controls. |
| `webkitVisibleScrollbar` | none | WebKit scrollbar CSS using scrollbar theme tokens. |

## Template Mixins on Flex and Box

### width and height

Source: `src/components/templates/mixins/width.js`, `height.js`.

- String values pass through.
- Number values multiply by `SIZE_SUB_UNIT` (4px).
- Object values support `{ min, max, base }`; numeric values multiply by 4px, strings pass through.

### gap

Flex and Box use different gap mixins because CSS `gap` only applies to flex, grid, and multi-column layouts.

**Flex — `cssGap.js`**

Emits the real CSS `gap` property. Accepts two props:

- `gap`: alone, emits the single-value `gap` shorthand, which sets both row-gap and column-gap.
- `gapY`: alone, emits `row-gap`.

Numbers multiply by `SIZE_SUB_UNIT` (4px); strings pass through unchanged. When both props are set, emits the CSS shorthand `gap: <gapY> <gap>` (row before column, per the CSS spec), so `gap` becomes the column-gap only in that case.

**Box — `gap.js`**

Box defaults to `display: block`, where CSS `gap` has no effect, so Box's `gap` is implemented as child margins. Accepts a number only. Adds a margin to every direct child except the last: right margin by default, bottom margin when `column` or `columnReverse` is set, and left margin when `rowReverse` is set.

### direction

Source: `direction.js`. Real props are `column`, `columnReverse`, and `rowReverse`; default is `row`. A `row` prop is ignored by this mixin.

### flex, basis, wrap, align, justify

- `flex`: `true`, `false`, `grow`, `shrink`, number, object `{ grow, shrink }`, or raw value. `basis` defaults to `auto`; `basis` alone emits `flex-basis`.
- `flexWrap`: `true`, `false`, or `reverse`.
- `alignItems`: `start`, `center`, `end`, `baseline`, `stretch`.
- `alignContent`: `start`, `center`, `end`, `between`, `around`, `stretch`.
- `justifyContent`: `start`, `center`, `end`, `between`, `around`, `evenly`, `stretch`.

### background

Source: `background.js`.

- `background` resolves via `getColor(background)` and emits `background-color`.
- Unknown strings pass through because `getColor` falls back to the original value. That is implementation behavior, not permission to use raw colors in PRs.
- `backgroundOpacity` switches to `getRgbColor(background, opacity)`, which expects the resolved color to be a hex string. Do not combine opacity with rgba strings or non-hex tokens.

### border

Source: `border.js`.

- `true` emits a full `1px solid border` border.
- Side strings: `all`, `horizontal`, `vertical`, `top`, `right`, `bottom`, `left`.
- A theme color string or color-path array emits a full border with that color.
- Object form supports `{ side, size, type, color }`; `side` can be an array of side strings. Defaults are `side=all`, `size=1px`, `type=solid`, `color=border`.

### overflow

String emits `overflow`; object supports `{ vertical, horizontal }` and emits `overflow-y` / `overflow-x`.

### styled-system position props

Flex and Box also compose `position` from `styled-system`. Numeric `top`, `right`, `bottom`, and `left` use styled-system's default space scale `[0,4,8,16,32,64,128,256,512]` unless the theme supplies `space`. This is not the local linear 4px helper.

### sx

Flex and Box apply `css(props.sx)(props)` last. Treat `sx` like raw CSS during review: values inside still need tokens/scale.

## Typography Mixins

Typography components compose `fontColor`, `fontCode`, `alignSelf`, `textAlign`, `textDecoration`, `textTransform`, `truncate`, `whiteSpace`, `wordBreak`, `margin`, `padding`, `opacity`, `cursor`, plus local `fontSize` and `lineHeight` overrides.

Important gotcha: `background` is read only by `fontCode`; it applies only when `code={true}`.

## Pseudo Props

Source: `src/components/templates/mixins/pseudos.js`. Available props: `_before`, `_after`, `_hover`, `_active`, `_focus`, `_focusWithin`, `_visited`, `_empty`, `_even`, `_odd`, `_disabled`, `_checked`, `_mixed`, `_selected`, `_invalid`, `_pressed`, `_readOnly`, `_first`, `_last`, `_expanded`, `_grabbed`, `_notFirst`, `_notLast`, `_groupHover`, `_autofill`, and `_placeholder`.

Inside pseudo objects, these keys are transformed: `background`, `border`, `color`, and `alignItems`. Other keys are emitted as raw CSS property names.
