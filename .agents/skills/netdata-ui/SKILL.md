---
name: netdata-ui
description: |
  PR review guide for repos that use @netdata/netdata-ui. Use when reviewing React/styled-components
  code that imports netdata-ui components, themes, icons, mixins, or utilities; when checking PRs for
  design-system violations such as raw colors, off-scale spacing, unsupported props, local component
  recreations, or incorrect netdata-ui API usage; or when a user mentions netdata-ui, netdata UI kit,
  Flex, Box, Text, Button, Icon, theme tokens, or netdata-ui PR review.
---

# Netdata UI PR Review Guide

This skill is for reviewing code in repositories that consume `@netdata/netdata-ui`. The source package is the authority. If a reference file conflicts with `src/`, trust `src/` and call out the drift.

## Review Workflow

1. Find the PR's netdata-ui usage: imports from `@netdata/netdata-ui`, styled wrappers around netdata-ui components, theme utility calls, icon names, and direct CSS values.
2. Load only the reference needed for the changed code: components, mixins, theme, or icons.
3. For style changes, classify each CSS declaration as a value or a feature using the reasoning model below. Values must route through component props, mixins, or theme utilities.
4. For component API claims, verify against the source path listed in [references/components.md](references/components.md). Do not invent props because they would be convenient.
5. In review findings, cite the changed file/line and say exactly what token, prop, or existing component should replace the issue.

## Source And Reference Map

- [references/components.md](references/components.md): public exports, core component prop surfaces, public hooks, and component-specific gotchas.
- [references/mixins.md](references/mixins.md): source-derived behavior for core mixins, Flex/Box props, Typography props, pseudo props, and spacing scales.
- [references/theme.md](references/theme.md): actual theme token names and utility fallback behavior.
- [references/icons.md](references/icons.md): complete `iconsList` keys and Icon props.

Before making a detailed claim in a PR review, read the source file listed in the relevant reference section if the behavior is not already explicit.

## Core Rules

1. **Props over CSS** — If a netdata-ui component accepts a prop for a style, use the prop directly in JSX or via `.attrs({})` in a styled wrapper. Never write CSS in the template literal when a prop exists.
2. **All colors must resolve through the theme** — Theme tokens are the only legitimate source of color in this codebase. Static colors (`#hex`, `rgb()`, `rgba()`, `hsl()`) bypass dark/light theming and break visual consistency. "No token matches" is a design problem (add the token), not a license to inline. See *How to reason about a styling decision* below.
3. **Prefer defaults** — Use netdata-ui components as-is unless customization is genuinely needed. Don't customize Tab colors, hover states, font-weights — `Tab` already handles active/inactive with theme colors.
4. **No shouldForwardProp** — The project uses `ThemeProvider` with `isPropValid` globally. Never add `shouldForwardProp` or transient `$props`.
5. **Extend netdata-ui, never raw elements** — Never `styled.div`, `styled.span`, `styled.button`. Always extend `Box`, `Flex`, `TextSmall`, `Button`, etc.
6. **CSS literals exist for CSS *features* the design system can't express, not for *values* that fall outside the design system.** Legitimate uses: `display: grid`, `transform`, `transition`, `pointer-events`, `mask-image`, nested selectors. Illegitimate uses: parking an off-scale spacing value or a static color because "no prop/token matches" — those are violations of the system, not gaps in it. See *How to reason about a styling decision* below.
7. **No re-exporting wrappers** — If swapping a component, callers import the replacement directly. No `export const MyLink = Anchor`.
8. **All spacing must snap to the 4px scale** — `padding`, `margin`, `gap`, `width/height`, `round`, and positional offsets must resolve to multiples of 4px. Local netdata-ui mixins use the linear 4px subunit; styled-system offset props (`top/right/bottom/left`) use their own default space scale, so verify the source before assuming `n * 4px`. Off-scale values are design inconsistencies to correct, not values to preserve in CSS. The only raw spacing that may legitimately remain is what *cannot* exist as a token at all (e.g. `1px` hairlines, which usually still come from a `border` prop). See *How to reason about a styling decision* below.
9. **No empty styled wrappers** — If all styling moves to props and the template literal is empty (`styled(Flex)\`\``), delete the wrapper entirely and use the component directly with those props inline or via `.attrs({})`.


## How to Reason About a Styling Decision

The rules above are the consequences. This is the model they come from. Apply it to **any** styling decision, including ones the rules don't enumerate.

### Why the design system exists

netdata-ui is a token-based design system. Spacing, sizing, radii step on a discrete 4px scale; colors are named tokens that resolve to different RGB values per theme (light/dark) at runtime. Every static value in source code that bypasses this — a hex color, a 3px gap, an inline `style={{}}` — is a hole in the system: it can't theme, it can't be globally re-scaled, it breaks visual rhythm, and it accumulates into a codebase no one can refactor coherently. The system is only as strong as the weakest opt-out, so opt-outs have to be principled, not "I couldn't find a prop."

### The two questions to ask, in order

When you encounter any piece of styling — incoming code you're reviewing, or a decision you're about to make — ask these in order:

**Question 1: "Is this expressing a *value* (size, color, spacing, radius, opacity) or a *CSS feature* (a kind of effect or layout primitive)?"**

- A **value** is *what* something looks like: `8px`, `#0f1818`, `0.65`, `12px radius`.
- A **CSS feature** is *how* an effect is produced: `display: grid`, `transform: rotate(...)`, `transition: ...`, `mask-image`, a pseudo-selector, an animation.

This distinction is the entire framework. The design system constrains *values*. It does not, and cannot, constrain *features*.

**Question 2 — branches on the answer to Q1:**

- **If it's a value:** the value must come from the design system. The only acceptable questions are:
  1. Which prop / mixin / token expresses this value? (use it)
  2. If nothing expresses it: *is the value itself wrong?* (snap to scale, pick the right token) — this is almost always the answer.
  3. Only if the value is genuinely correct *and* unrepresentable: the token/scale is missing. Add it. Don't inline.
  4. "Keep it in CSS as a one-off" is never a valid answer for a value. Off-system values *are* the violation; the CSS literal is just where they're hiding.

- **If it's a feature:** props/mixins may not exist (the system isn't trying to cover every CSS feature). A CSS literal is legitimate. But the *values inside* that feature still go through Q1 — e.g. a `transform: translateY(8px)` should use `getSizeBy(1)` for the 8px, and a `box-shadow` color should come from `getRgbColor("token", alpha)`.

### Applying the model

| Incoming code | Q1 answer | Verdict |
|---|---|---|
| `gap: 3px` | value (spacing) | Off-scale → snap to `gap={1}` (4px). The fact that "3px isn't on the scale" is the bug. |
| `padding: 1px 6px` | value (spacing) | `6px` snaps to an adjacent 4px-scale value such as `padding={[0, 2]}` (0 8px) or `padding={[0, 1]}` (0 4px), depending on design intent. `1px` only survives if it's actually a hairline border masquerading as padding — re-examine. |
| `background: rgba(15, 24, 24, 0.65)` | value (color) | Static color → resolve through the theme. `background="<token>" backgroundOpacity={0.65}`, or in a CSS literal `getRgbColor("<token>", 0.65)`. If no token is the right base, the *theme* is missing a token — add it. |
| `color: #93a8a8` | value (color) | Same as above. Static → token. |
| `width: 173px` | value (sizing) | Off-scale → either snap to scale or, if it's content-driven, reconsider whether a fixed width is even right (often it isn't). |
| `letter-spacing: 0.3px` | value (typographic) | Not on a token scale → either it should come from a typography token/component (`TextSmall`, `H3`, etc., which already encode this) or it's a one-off the design didn't intend. Don't inline as a raw value. |
| `display: grid; grid-template-columns: ...` | feature | Legitimate CSS literal. (The values inside — gaps, sizes — still go through Q1.) |
| `transform: translateY(${getSizeBy(1)})` | feature, with a value inside | Legitimate. Value comes from the system. |
| `transition: opacity 0.2s ease` | feature | Legitimate. |
| `&:not(:last-child) { border-bottom: 1px solid ${getColor("border")} }` | feature (selector), with a value inside | Legitimate. Value comes from the system. |

### The verdict template (for reviewer AIs)

When reviewing code, never write "must stay in CSS because no prop/token matches." That phrasing reveals you skipped Q1. Instead:

- For values: "`<raw value>` is off-system. Replace with `<prop or token>`." Or: "`<raw value>` is off-system *and* no token represents it. Either snap to `<closest token>`, or the theme is missing a token — flag this."
- For features: "Legitimate CSS literal (feature: `<grid/transform/transition/...>`). Verify that values inside (`<list them>`) resolve through the design system."

### The single test that catches almost everything

Before accepting any styling — prop, CSS literal, or inline — ask: *"If the user switches from light to dark theme, or the design team rescales spacing tomorrow, does this code adapt automatically?"* If no, it's a value bypassing the system, and the fix is to route it through the system — never to keep it raw.


## High-Risk Gotchas

- `Text`/Typography `background` only applies when `code={true}`. `<Text background="primary" />` silently does nothing for background.
- `margin` and `padding` mixins accept arrays only. `margin={2}` and `padding={2}` are invalid for the local mixins. Use `margin={[2]}` and `padding={[2]}`.
- Flex direction defaults to row. `column`, `columnReverse`, and `rowReverse` are real props; `row` is not a meaningful direction prop in the source mixin.
- Flex and Box use different `gap` mixins. Flex emits real CSS `gap`: `gap` alone is the single-value shorthand (both axes), `gapY` alone is `row-gap`, and both together emit `gap: <gapY> <gap>`; numbers scale by 4px, strings pass through. Box defaults to `display: block`, where CSS `gap` has no effect, so Box's `gap` is implemented as child margins (number only; direction follows `column`/`columnReverse`/`rowReverse`). This matters for nested selectors and last-child behavior on Box.
- Flex/Box `top/right/bottom/left` come from styled-system's position mixin. Numeric values use styled-system's default space scale `[0,4,8,16,32,64,128,256,512]`, not a linear `n * 4px` scale.
- `backgroundOpacity` uses `getRgbColor`, which expects the resolved color to be hex-like. Do not combine it with rgba tokens or raw rgba strings.
- `getColor` passes unknown strings through. That fallback is implementation behavior, not permission to use raw colors in reviewed code.
- `Icon rotate` is a multiplier: `rotate={1}` means 90deg, `rotate={2}` means 180deg.
- Public hooks from the package root are limited. Do not recommend `useToggle`, `useDebounce`, `useMeasure`, or other internal hooks unless `src/index.js` exports them.

## Correct Usage Examples

```jsx
import { ThemeProvider } from "styled-components"
import { DefaultTheme, GlobalStyles, Flex, Text, Button, Icon } from "@netdata/netdata-ui"

const App = () => (
  <ThemeProvider theme={DefaultTheme}>
    <GlobalStyles />
    <Flex column gap={2} padding={[4]} background="mainBackground">
      <Text color="textLite">Hello Netdata</Text>
      <Button label="Save" icon="check" onClick={() => {}} />
      <Icon name="alarm" color="primary" rotate={1} />
    </Flex>
  </ThemeProvider>
)
```

```jsx
// Good: background is a Flex prop and opacity resolves from a theme token.
<Flex background="primary" backgroundOpacity={0.08} padding={[2, 3]} round />

// Good: Typography code background is conditional and explicit.
<Text code background="text" color="elementBackground">
  alarms.warning
</Text>

// Good: feature in CSS, values still come from the design system.
const ShiftedPanel = styled(Flex).attrs({ padding: [2], background: "elementBackground" })`
  transform: translateY(${getSizeBy(1)});
`
```

## Public Hooks

Public from `@netdata/netdata-ui`: `useIntersection`, `useNavigationArrows`, `useCheckboxesList`, `useTouchedState`, `useFocusedState`, and `useInputValue`.

```jsx
import { useIntersection } from "@netdata/netdata-ui"

const [setRef, ref, isVisible] = useIntersection({ threshold: 0.1 })
```

## Theme Utilities

`getColor`, `getRgbColor`, `getSizeBy`, `getSizeUnit`, `getOrElse`, and `propOrElse` are curried helpers. Use them in styled-components CSS features when a component prop cannot express the feature.

```jsx
import styled from "styled-components"
import { Box, getColor, getRgbColor, getSizeBy } from "@netdata/netdata-ui"

const Panel = styled(Box).attrs({ padding: [2], background: "elementBackground" })`
  border-bottom: 1px solid ${getColor("border")};
  box-shadow: 0 ${getSizeBy(0.5)} ${getSizeBy(2)} ${getRgbColor("main", 0.16)};
`
```

## Review Verdict Templates

- Raw color: "`<value>` bypasses the netdata-ui theme. Replace it with `<token/prop>`, or add a theme token if none exists."
- Off-scale spacing: "`<value>` is off the 4px scale. Use `<prop>={<array/number>}` or `getSizeBy(<n>)` depending on the API."
- Unsupported prop: "`<Component>` does not read `<prop>` in netdata-ui source. Use `<supported prop>` or extend the component with a legitimate CSS feature."
- Legitimate CSS feature: "The CSS feature is fine, but route embedded values through netdata-ui tokens/helpers."

## References

- [references/components.md](references/components.md)
- [references/mixins.md](references/mixins.md)
- [references/theme.md](references/theme.md)
- [references/icons.md](references/icons.md)
