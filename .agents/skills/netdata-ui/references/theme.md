# Netdata UI Theme Reference

Source-derived from `src/theme/default`, `src/theme/dark`, `src/theme/rawColors.js`, and `src/theme/utils.js`.

## Theme Shape

`DefaultTheme` and `DarkTheme` export this shape:

```js
{
  name: "Default" | "Dark",
  version: "0.0.1",
  constants: { SIZE_SUB_UNIT: 4, SIZE_UNIT: 8, GUTTER_HEIGHT: 8 },
  colors: { ...appColors, ...rawColors }
}
```

Default and Dark currently define the same 148 app color token names. Values differ by theme.

## App Color Tokens

Use these token names for component props and review comments. Do not inline the resolved hex value.

- `primary`
- `accent`
- `main`
- `border`
- `borderSecondary`
- `disabled`
- `disabledBackground`
- `dropdown`
- `dropdownShadow`
- `elementBackground`
- `elementBackgroundHover`
- `mainBackground`
- `mainBackgroundDisabled`
- `modalHeaderBackground`
- `modalTabsBackground`
- `modalBackground`
- `modalInfoBackground`
- `menuItemSelected`
- `menuItemHover`
- `scrollBarTrack`
- `scrollBarThumb`
- `scrollBarThumbHover`
- `scrollBarBorder`
- `link`
- `linkHover`
- `primaryHighlight`
- `secondaryColor`
- `secondaryHighlight`
- `neutralHighlight`
- `primaryAI`
- `accentAI`
- `primaryHighlightAI`
- `secondaryColorAI`
- `secondaryHighlightAI`
- `strokeMain`
- `strokeHighlight`
- `aiParticleMain`
- `success`
- `successLite`
- `successSemi`
- `successBackground`
- `successText`
- `warning`
- `warningLite`
- `warningSemi`
- `warningBackground`
- `warningBannerBg`
- `warningText`
- `error`
- `errorLite`
- `errorSemi`
- `errorBackground`
- `errorBannerBg`
- `errorText`
- `generic`
- `live`
- `stale`
- `staleSemi`
- `unseen`
- `offline`
- `attention`
- `attentionSecondary`
- `separator`
- `controlFocused`
- `selected`
- `highlight`
- `tooltip`
- `tooltipText`
- `tooltipBg`
- `bright`
- `text`
- `textLite`
- `textNoFocus`
- `textFocus`
- `textDescription`
- `sectionHeaderBackground`
- `sectionTitle`
- `sectionDescription`
- `placeholder`
- `key`
- `panel`
- `panelBg`
- `mainChartBg`
- `mainChartHeaderBg`
- `mainChartBorder`
- `mainChartTboxHover`
- `sideBar`
- `sideBarMini`
- `spaceSelected`
- `spaceIdle`
- `spaceHovered`
- `hoverHighlight`
- `menuItem`
- `topBarBg`
- `elevationLevelOne`
- `datePickerPausedBg`
- `datePickerPlayBg`
- `dateTimePickerChipBg`
- `dateTimePickerChipAccent`
- `inputBg`
- `inputBorder`
- `inputBorderHover`
- `inputBorderFocus`
- `nodeBadgeBackground`
- `nodeBadgeBorder`
- `nodeBadgeColor`
- `neutralPillBg`
- `neutralPillBorder`
- `neutralPillColor`
- `alertIcon`
- `idleError`
- `idleWarning`
- `idleClear`
- `dropdownTable`
- `tableRowBg`
- `tableRowBgHover`
- `tableRowBg2`
- `tableRowBg2Hover`
- `columnHighlight`
- `iconColor`
- `progressBg`
- `resizerLine`
- `anomalyText`
- `anomalyTextLite`
- `anomalyTextFocus`
- `terminalGreen`
- `terminalGreenBorder`
- `darkBackground`
- `integrationMenuItemHover`
- `clauseBg`
- `clauseText`
- `nodeButtonsText`
- `nodeButtonsTextHover`
- `pnlBorder`
- `pnlBackground`
- `pnlText`
- `insightsYellow`
- `insightsYellowSemi`
- `insightsViolet`
- `insightsVioletSemi`
- `insightsPurple`
- `insightsPurpleSemi`
- `insightsGreen`
- `insightsGreenSemi`
- `insightsRed`
- `insightsRedSemi`
- `insightsBlue`
- `insightsBlueSemi`

## Raw Color Palettes

Raw palettes are merged into `theme.colors`, so path arrays such as `["green", "green100"]` work with `getColor`. Prefer app tokens for product UI; use raw palette paths only when the source pattern already does.

### transparent

- `transparent.full`
- `transparent.semi`
- `transparent.popover`

### green

- `green.poker`
- `green.chateau`
- `green.netdata`
- `green.deyork`
- `green.vista`
- `green.fringyFlower`
- `green.frostee`
- `green.limeGreen`
- `green.green10`
- `green.green20`
- `green.green30`
- `green.green40`
- `green.green50`
- `green.green60`
- `green.green70`
- `green.green80`
- `green.green90`
- `green.green100`
- `green.green110`
- `green.green120`
- `green.green130`
- `green.green140`
- `green.green150`
- `green.green160`
- `green.green170`
- `green.green180`
- `green.green190`
- `green.green195`
- `green.green196`
- `green.green197`
- `green.green198`
- `green.green199`
- `green.green200`
- `green.green300`
- `green.green400`
- `green.green500`
- `green.green600`
- `green.green700`
- `green.green800`
- `green.green900`
- `green.green1000`

### red

- `red.pomegranate`
- `red.carnation`
- `red.apricot`
- `red.wewak`
- `red.pastelpink`
- `red.lavender`
- `red.red10`
- `red.red20`
- `red.red30`
- `red.red40`
- `red.red50`
- `red.red60`
- `red.red70`
- `red.red80`
- `red.red90`
- `red.red100`
- `red.red110`
- `red.red120`
- `red.red130`
- `red.red140`
- `red.red150`
- `red.red160`
- `red.red170`
- `red.red180`
- `red.red190`
- `red.red200`
- `red.red300`
- `red.red400`
- `red.red500`
- `red.red600`
- `red.red700`
- `red.red800`
- `red.red900`
- `red.red1000`

### yellow

- `yellow.amber`
- `yellow.sunglow`
- `yellow.seaBuckthorn`
- `yellow.mustard`
- `yellow.salomie`
- `yellow.buttermilk`
- `yellow.ginfizz`
- `yellow.yellow10`
- `yellow.yellow20`
- `yellow.yellow30`
- `yellow.yellow40`
- `yellow.yellow50`
- `yellow.yellow60`
- `yellow.yellow70`
- `yellow.yellow80`
- `yellow.yellow90`
- `yellow.yellow100`
- `yellow.yellow110`
- `yellow.yellow120`
- `yellow.yellow130`
- `yellow.yellow140`
- `yellow.yellow150`
- `yellow.yellow160`
- `yellow.yellow170`
- `yellow.yellow180`
- `yellow.yellow190`
- `yellow.yellow200`
- `yellow.yellow300`
- `yellow.yellow400`
- `yellow.yellow500`
- `yellow.yellow600`
- `yellow.yellow700`
- `yellow.yellow800`
- `yellow.yellow900`
- `yellow.yellow1000`

### neutral

- `neutral.white`
- `neutral.black`
- `neutral.limedSpruce`
- `neutral.regentgrey`
- `neutral.blackhaze`
- `neutral.brightGrey`
- `neutral.chineseWhite`
- `neutral.iron`
- `neutral.porcelain`
- `neutral.bluebayoux`
- `neutral.shark`
- `neutral.tuna`
- `neutral.outerSpace`
- `neutral.ratsbane`
- `neutral.arsenic`
- `neutral.gunmetal`
- `neutral.darkGunmetal`
- `neutral.eerieBlack`
- `neutral.grey05`
- `neutral.grey10`
- `neutral.grey15`
- `neutral.grey20`
- `neutral.grey25`
- `neutral.grey30`
- `neutral.grey35`
- `neutral.grey40`
- `neutral.grey45`
- `neutral.grey50`
- `neutral.grey55`
- `neutral.grey60`
- `neutral.grey65`
- `neutral.grey70`
- `neutral.grey75`
- `neutral.grey80`
- `neutral.grey85`
- `neutral.grey90`
- `neutral.grey95`
- `neutral.grey100`
- `neutral.grey105`
- `neutral.grey110`
- `neutral.grey115`
- `neutral.grey120`
- `neutral.grey125`
- `neutral.grey130`
- `neutral.grey135`
- `neutral.grey140`
- `neutral.grey145`
- `neutral.grey150`
- `neutral.grey155`
- `neutral.grey160`
- `neutral.grey165`
- `neutral.grey170`
- `neutral.grey175`
- `neutral.grey180`
- `neutral.grey185`
- `neutral.grey190`
- `neutral.grey195`

### purple

- `purple.mauve`
- `purple.mauveDark`
- `purple.mauveFocus`
- `purple.daisy`
- `purple.lilac`
- `purple.lilacLite`
- `purple.lilacFocus`
- `purple.purple10`
- `purple.purple20`
- `purple.purple30`
- `purple.purple40`
- `purple.purple50`
- `purple.purple60`
- `purple.purple70`
- `purple.purple80`
- `purple.purple90`
- `purple.purple100`
- `purple.purple110`
- `purple.purple120`
- `purple.purple130`
- `purple.purple140`
- `purple.purple150`
- `purple.purple160`
- `purple.purple170`
- `purple.purple180`
- `purple.purple190`
- `purple.purple200`
- `purple.purple300`
- `purple.purple400`
- `purple.purple500`
- `purple.purple600`
- `purple.purple700`
- `purple.purple800`
- `purple.purple900`
- `purple.purple1000`

### blue

- `blue.aquamarine`
- `blue.indigo`
- `blue.cyan`
- `blue.blue10`
- `blue.blue20`
- `blue.blue30`
- `blue.blue40`
- `blue.blue50`
- `blue.blue60`
- `blue.blue70`
- `blue.blue80`
- `blue.blue90`
- `blue.blue100`
- `blue.blue110`
- `blue.blue120`
- `blue.blue130`
- `blue.blue140`
- `blue.blue150`
- `blue.blue160`
- `blue.blue170`
- `blue.blue180`
- `blue.blue190`
- `blue.blue200`
- `blue.blue300`
- `blue.blue400`
- `blue.blue500`
- `blue.blue600`
- `blue.blue700`
- `blue.blue800`
- `blue.blue900`
- `blue.blue1000`

### violet

- `violet.violet10`
- `violet.violet20`
- `violet.violet30`
- `violet.violet40`
- `violet.violet50`
- `violet.violet60`
- `violet.violet70`
- `violet.violet80`
- `violet.violet90`
- `violet.violet100`
- `violet.violet110`
- `violet.violet120`
- `violet.violet130`
- `violet.violet140`
- `violet.violet150`
- `violet.violet160`
- `violet.violet170`
- `violet.violet180`
- `violet.violet190`
- `violet.violet200`
- `violet.violet300`
- `violet.violet400`
- `violet.violet500`
- `violet.violet600`
- `violet.violet700`
- `violet.violet800`
- `violet.violet900`
- `violet.violet1000`

### shadows

- `shadows.dropdownLight`
- `shadows.dropdownDark`

## Utilities

### getColor(colorPath)

Source: `src/theme/utils.js`. Curried helper returning `({ theme }) => value`.

- String input checks `theme.colors[string]`.
- Array input checks nested paths, for example `["green", "green100"]`.
- Unknown or missing values fall back to the original `colorPath`, or `#fff` when the path is falsey.
- Because unknown strings pass through, static hex/rgb values can appear to work. In PR review, still reject raw color values unless the code is a legitimate CSS feature and the value is routed through a token.

### getRgbColor(colorPath, opacity = 1)

Curried helper that resolves `getColor(colorPath)`, parses it as a hex color, and returns `rgba(r, g, b, opacity)`. It expects the resolved value to be hex-like. Do not use it with tokens that resolve to existing rgba strings such as `transparent.popover` or shadows.

### getSizeUnit

Curried helper reading `theme.constants.SIZE_UNIT`, defaulting to `8`.

### getSizeBy(multiplier = 1)

Curried helper. Numeric multipliers return `SIZE_UNIT * multiplier` in px, so `getSizeBy(2)` resolves to `16px`. Non-numeric multipliers pass through unchanged.

### getOrElse(pathName, defaultValue) and propOrElse(pathName, defaultValue)

Curried lodash `get` helpers for theme props and arbitrary props respectively.

## Review Notes

- Component spacing props such as `padding`, `margin`, `gap`, `width`, `height`, and `round` use `SIZE_SUB_UNIT` (4px) in local mixins.
- `getSizeBy` uses `SIZE_UNIT` (8px).
- Styled-system `top/right/bottom/left` use styled-system's default space scale unless a theme `space` key is supplied.
