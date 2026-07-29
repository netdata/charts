# Netdata UI Component Reference

This file is source-derived review guidance for agents reviewing PRs in repos that consume `@netdata/netdata-ui`. Do not treat old examples as ground truth; verify against the source paths listed here when a PR depends on fine-grained behavior.

## Public Export Inventory

### components

- `Button`
- `IconButton`
- `ButtonGroup`
- `Sidebar`
- `PortalSidebar`
- `Icon`
- `IconComponents`
- `Checkbox`
- `Toggle`
- `RadioButton`
- `Tabs`
- `Tab`
- `InputRange`
- `MultiRangeInput`
- `Drop`
- `DropContainer`
- `Tooltip`
- `Popover`
- `Menu`
- `MenuDropdown`
- `MenuDropdownItem`
- `MenuItemContainer`
- `MenuButton`
- `Flex`
- `makeFlex`
- `Box`
- `makeBox`
- `Layer`
- `BackdropContainer`
- `Animation`
- `Collapsible`
- `Intersection`
- `Pill`
- `ProgressBar`
- `AlertMasterCard`
- `MasterCard`
- `Modal`
- `ModalContent`
- `ModalHeader`
- `ModalBody`
- `ModalFooter`
- `ModalButton`
- `ModalCloseButton`
- `ConfirmationDialog`
- `Table`
- `createLargeDataSource`
- `OverflowTooltip`
- `Select`
- `SearchInput`
- `CopyToClipboard`
- `GlobalStyles`
- `TextInput`

### typography

- `H0`
- `H1`
- `H2`
- `H3`
- `H4`
- `H5`
- `H6`
- `TextHuge`
- `TextBigger`
- `TextBig`
- `Text`
- `TextSmall`
- `TextMicro`
- `TextNano`
- `TextFemto`
- `List`
- `ListItem`
- `makeTypography`
- `makeH0`
- `makeH1`
- `makeH2`
- `makeH3`
- `makeH4`
- `makeH5`
- `makeH6`
- `makeFemto`
- `makeNano`
- `makeMicro`
- `makeSmall`
- `makeText`
- `makeBig`
- `makeBigger`
- `makeHuge`

### organisms

- `Documentation`
- `News`
- `NavigationTabs`
- `NavigationTab`
- `TabSeparator`
- `DraggableTabs`
- `BaseDraggableTabs`

### hooks

- `useIntersection`
- `useNavigationArrows`
- `useCheckboxesList`
- `useTouchedState`
- `useFocusedState`
- `useInputValue`

### theme-media

- `DefaultTheme`
- `DarkTheme`
- `getSizeUnit`
- `getSizeBy`
- `getRgbColor`
- `getOrElse`
- `propOrElse`
- `getColor`
- `devices`
- `breakpoints`

### mixins

- `alignSelf`
- `controlFocused`
- `controlReset`
- `cursor`
- `margin`
- `opacity`
- `padding`
- `position`
- `round`
- `textTransform`
- `webkitVisibleScrollbar`
- `zIndex`

### utils

- `mergeRefs`
- `capitalizeFirstLetter`
- `isFunction`
- `isArray`
- `isObject`
- `isEmptyObject`
- `downloadCsvAction`
- `iconsList`

## Core Layout Components

### Flex

Source: `src/components/templates/flex/flex.js`, `src/components/templates/flex/index.js`. Underlying element defaults to `div`; callers may pass `as`. `Flex` is `makeFlex("div")`; the public `makeFlex(Component)` factory wraps any component with the same mixin set.

| Prop or mixin | Source | Behavior |
|---|---|---|
| `column` | `direction` | Sets `flex-direction: column`. |
| `columnReverse` | `direction` | Sets `flex-direction: column-reverse`. |
| `rowReverse` | `direction` | Sets `flex-direction: row-reverse`. |
| default direction | `direction` | Defaults to `row`. There is no real `row` prop in the mixin. |
| `flexWrap` | `wrap` | `true -> wrap`, `false -> nowrap`, `"reverse" -> reverse`. |
| `alignItems` | `alignItems` | `start`, `center`, `end`, `baseline`, `stretch`. |
| `alignContent` | `alignContent` | `start`, `center`, `end`, `between`, `around`, `stretch`. |
| `justifyContent` | `justifyContent` | `start`, `center`, `end`, `between`, `around`, `evenly`, `stretch`. |
| `alignSelf` | `src/mixins/alignSelf.js` | `start`, `center`, `end`, `stretch`. |
| `flex`, `basis` | `flex` | `true -> 1 1 basis`, `false -> 0 0 basis`, `grow`, `shrink`, number, object `{ grow, shrink }`; `basis` alone emits `flex-basis`. |
| `gap`, `gapY` | `cssGap` | Real CSS `gap`. `gap` alone emits the single-value `gap` shorthand, which sets both axes; `gapY` alone emits `row-gap`; when both are set, emits `gap: <gapY> <gap>`, making `gap` the column-gap. Numbers multiply by `SIZE_SUB_UNIT` (4px); strings pass through. |
| `padding`, `margin` | core mixins | Arrays of length 1-4 only. Values use `SIZE_SUB_UNIT` (4px). Number props are invalid for these mixins. |
| `width`, `height` | template mixins | String passthrough, number times 4px, or object `{ min, max, base }` where numeric values are times 4px. |
| `background`, `backgroundOpacity` | `background` | Resolves through `getColor`; opacity uses `getRgbColor`. Review should require tokens even though unknown strings pass through without opacity. |
| `color` | Typography `fontColor` | Flex supports text color via `color` and defaults to `text` if the prop is omitted. |
| `border` | `border` | `true`, side strings, theme color string/path, or object `{ side, size, type, color }`; object `side` can be an array. |
| `round` | core mixin | `true -> 4px`, number times 4px, string passthrough, or `{ side, size }`. |
| `overflow` | template mixin | String `overflow`, or object `{ vertical, horizontal }`. |
| `position` | core mixin plus styled-system | Core mixin accepts CSS position keywords. `top/right/bottom/left` come from styled-system, using default scale `[0,4,8,16,32,64,128,256,512]` unless a theme space scale is supplied. |
| `opacity` | core mixin | `weak -> 0.3`, `medium -> 0.4`, `strong -> 0.8`, `none -> 1`, or numeric. |
| `cursor`, `zIndex` | core mixins | Cursor string passthrough; z-index number/string emitted when present. |
| `sx` | `@styled-system/css` | Styled-system object applied last. Review carefully because it can bypass component props. |
| pseudo props | `pseudos` | See `references/mixins.md`; transformed keys include `background`, `border`, `color`, `alignItems`, and raw CSS keys pass through. |

### Box

Source: `src/components/templates/box/box.js`, `src/components/templates/box/index.js`. Box defaults to `div` and is `makeBox("div")`; the public `makeBox(Component)` factory wraps any component with the same mixin set. Box includes layout/container mixins, but it does not include Flex-only direction/flex alignment props and does not include Typography `fontColor`. Use `Box` for containers; use `Flex` for flex layout or text color props.

Box includes: `alignContent`, `alignSelf`, `position`, `margin`, `padding`, `gap`, `width`, `height`, `background`, `opacity`, `border`, `round`, `overflow`, `zIndex`, `cursor`, pseudo props, styled-system `position`, and `sx`.

### Layer

Source: `src/components/templates/layer/index.js`, `container.js`, `backdropContainer.js`.

| Prop | Default | Behavior |
|---|---|---|
| `position` | `center` | One of `top-left`, `top`, `top-right`, `left`, `center`, `right`, `bottom-left`, `bottom`, `bottom-right`. |
| `full` | `false` | `true`, `vertical`, or `horizontal` pins corresponding sides. |
| `backdrop` | `true` | Wraps content with fixed backdrop container and uses absolute content positioning. |
| `margin` | `[]` | Converted by `getMarginDimensions`. |
| `onClickOutside`, `onEsc` | none | Wired through internal hooks. |
| `borderShadow` | none | Adds a static box-shadow; it is not theme-tokenized in source. |
| `backdropContainerProps`, `backdropProps`, `dataDrop` | `layer-content` for `dataDrop` | Forwarded to backdrop/container plumbing. |

## Typography

Source: `src/components/typography/typography.js`, `src/components/typography/index.js`. Headings default to `h1`-`h6`; text components default to `span`.

| Prop | Default | Source | Behavior |
|---|---|---|---|
| `color` | `text` | `fontColor` | Theme color path via `getColor`; unknown strings pass through. |
| `strong` | factory default | `makeFontWeight` | Headings default bold; text defaults normal unless `strong` is true. |
| `code` | false | `fontCode` | Enables inline-code background, color, radius, and padding. |
| `background` | `text` | `fontCode` | Only applies when `code={true}`. It silently does nothing without `code`. |
| `fontSize` | factory size | local block | Overrides both font-size and line-height to the same value. |
| `lineHeight` | factory line height | local block | Overrides line-height only. |
| `alignSelf` | none | core mixin | `start`, `center`, `end`, `stretch`. |
| `textAlign` | none | typography mixin | Emits `text-align` for any provided value. |
| `textDecoration` | none | typography mixin | Emits `text-decoration` for any provided value. |
| `textTransform` | none | core mixin | `none`, `capitalize`, `uppercase`, `lowercase`, `firstLetter`, `fullWidth`, etc. |
| `truncate` | false | typography mixin | Adds no-wrap ellipsis CSS only when truthy. |
| `whiteSpace` | none | typography mixin | Emits `white-space` for any provided value. |
| `wordBreak` | none | typography mixin | Emits `word-break` for any provided value. |
| `margin`, `padding` | none | core mixins | Arrays only, length 1-4, 4px subunit. |
| `opacity` | none | core mixin | Named presets or number. |
| `cursor` | none | core mixin | Cursor string passthrough. |
| `as` | component default | styled-components | Changes rendered element/component. |

Factory sizes: `H0 26/32`, `H1 24/28`, `H2 22/24`, `H3 20/24`, `H4 16/21`, `H5 14/18`, `H6 12/14`, `TextHuge 24/32`, `TextBigger 16/18`, `TextBig 14/20`, `Text 12/16`, `TextSmall 11/14`, `TextMicro 10/13`, `TextNano 8/10`, `TextFemto 7/8`.

## Buttons and Icons

### Button

Source: `src/components/button/button.js`, `styled.js`.

Key public props: `label`, `children`, `icon`, `flavour` (`default`, `hollow`, `borderless`), `isLoading`, `loadingLabel`, `onClick`, `textTransform` (default `firstLetter`), `iconColor`, `iconSize`, `iconWidth`, `iconHeight`, `iconRotate` (passed to `Icon` as the `rotate` multiplier, so `1` means 90deg), `large`, `strong`, `disabled`, `danger`, `warning`, `neutral`, `active`, `color`, `colorPalette`, `themeType`, `margin`, `padding`, `alignSelf`, `position`, and styled-system offsets. Grouping props `groupFirst`, `groupLast`, and `groupMiddle` alter radius.

### IconButton

Source: `src/components/button/iconButton.js`. Wraps `Button` inside `Tooltip`, defaults `flavour="borderless"`, `neutral`, `width="14px"`, and `height="14px"`. The `tooltip` prop is a string rendered in a custom tooltip; other props pass to `Button`.

### Icon

Source: `src/components/icon/icon.js`, `styled.js`, `iconsList.js`.

| Prop | Default | Behavior |
|---|---|---|
| `name` | required | Missing/unknown names return `null`. Use keys from `iconsList`. |
| `size` | derived | Defaults from name suffix: `_s -> small`, `_l -> large`, otherwise `medium`. |
| `width`, `height` | size map | Override rendered SVG dimensions. |
| `color` | none | Sets `fill` through `getColor`. |
| `hoverColor` | none | Sets hover `fill` through `getColor`. |
| `rotate` | none | Numeric multiplier, emitted as `rotate * 90deg`. |
| `disabled` | false | Sets opacity `0.4` and disables pointer events. |
| `margin`, `alignSelf`, `cursor`, `sx` | none | Same mixins as source. |

## Forms

### TextInput

Source: `src/components/input/input.js`, `styled.js`, `input.d.ts`. Public export name is `TextInput`. Props include `label`, `placeholder`, `value`, native input props, `onChange`, `onFocus`, `onBlur`, `error`, `hint`, `disabled`, `size` (default `large`, but the current source does not define separate small/tiny visual styling), `iconLeft`, `iconRight`, `fieldIndicator`, `name`, `inputRef`, `containerStyles`, `inputContainerStyles`, `hideErrorMessage`, and `errorMessageProps`. `type` defaults to `text` but can be overridden because rest props are spread after the default.

### Select

Source: `src/components/select/index.js`. Wrapper around `react-select` or `react-select/creatable` when `isCreatable` is true. Most react-select props pass through. Options can include `icon`, which renders a netdata `Icon` before the label. The wrapper injects custom components, theme, styles, and virtualized menu list by default; custom `components` and `styles` are merged.

### Checkbox, Toggle, RadioButton, Range Inputs

These are public exports. Use the component-specific source and `.d.ts` files before making exact prop claims: `src/components/checkbox`, `toggle`, `radio-button`, `input/range`, and `input/multiRange`. For PR review, prefer existing components over local recreations and check that labels/errors/disabled states are not rebuilt manually.

## Tabs and Navigation

Source: `src/components/tabs`, `src/organisms/navigation`.

`Tabs` manages active tab state unless an `onChange` handler is provided; `selected` is the selected index. `Tab` uses `label` for visible tab text, accepts `disabled`, `active`, `index`, `onChange`, `isMenuItem`, `flavour` (`default`, `success`, `warning`, `error`), `green`, `maxWidth`, and Flex props. Passing `onClick` also works because rest props are spread after the internal handler, but `onChange(index, event)` is the component's intended callback.

## Overlays

`Tooltip`, `Popover`, `Drop`, `DropContainer`, `Menu`, `MenuDropdown`, `MenuDropdownItem`, `MenuItemContainer`, `MenuButton`, `Modal`, `ModalContent`, `ModalHeader`, `ModalBody`, `ModalFooter`, `ModalButton`, `ModalCloseButton`, and `ConfirmationDialog` are public exports. Use their source and `.d.ts` files for exact prop details when reviewing behavior. Common review concern: avoid nested portals/layers and prefer `Popover` for rich hover/click content instead of forcing `Tooltip`.

## Data Display and Misc Components

`Pill`, `AlertMasterCard`, `MasterCard`, `ProgressBar`, `Table`, `createLargeDataSource`, `OverflowTooltip`, `Intersection`, `Animation`, `Collapsible`, `Sidebar`, `PortalSidebar`, `Documentation`, `News`, `CopyToClipboard`, and `GlobalStyles` are public exports. Use `.d.ts` plus implementation files for exact prop claims. `Table` wraps `@tanstack/react-table`; review configuration against `src/components/table/index.d.ts` and `table.js`. `createLargeDataSource` and `OverflowTooltip` are public table helpers/components; verify their current APIs in `src/components/table/` before use.

## Public Hooks

Public from `src/index.js`: `useIntersection`, `useNavigationArrows`, `useCheckboxesList`, `useTouchedState`, `useFocusedState`, and `useInputValue`.

Do not tell consuming repos to import internal hooks from the package root unless `src/index.js` exports them. Internal-only examples in the old skill included `useToggle`, `useDebounce`, `useDebouncedValue`, `useMeasure`, `useOutsideClick`, `useKeyboardEsc`, `useForwardRef`, `usePrevious`, `useUpdateEffect`, `useMountedRef`, `useDropElement`, and `useColor`.
