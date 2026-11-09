import { DefaultTheme, DarkTheme } from "@netdata/netdata-ui/dist/theme"
import { makeTestChart } from "@jest/testUtilities"

const roles = {
  themeGridColor: "borderSecondary",
  themeCrosshair: "highlight",
  themeTrackColor: "progressBg",
  themeScaleColor: "border",
  themeEasyPieTrackColor: "progressBg",
  themeEasyPieScaleColor: "border",
  themeGaugePointer: "textLite",
  themeGaugeStroke: "progressBg",
  themeD3pieSmallColor: "placeholder",
  themeD3pieStroke: "cardBackground",
  themeInnerLabelColor: "actionContrastText",
  themeLabelColor: "text",
  themeAxisLabelColor: "textLite",
  themeBackground: "cardBackground",
  themeNeutralBackground: "progressBg",
  themeSkeleton: "progressBg",
  themeSkeletonGrid: "borderSecondary",
  themeSkeletonSpark: "bright",
  themeHighlightColor: "highlight",
  themeSelectionColor: "highlight",
  themeDraftAnnotationColor: "textLite",
  themeActiveBoxColor: "controlFocused",
  themeShadow: "dropdownShadow",
}

describe.each([
  ["default", DefaultTheme],
  ["dark", DarkTheme],
])("%s chart neutrals", (mode, theme) => {
  it.each(Object.entries(roles))("resolves %s from the kit's %s role", (attribute, role) => {
    const { chart } = makeTestChart({ attributes: { theme: mode } })
    expect(chart.getThemeAttribute(attribute)).toBe(theme.colors[role])
  })

  it("keeps explicit SDK neutral overrides", () => {
    const { chart } = makeTestChart({
      attributes: {
        theme: mode,
        themeBackground: ["#112233", "#445566"],
      },
    })
    expect(chart.getThemeAttribute("themeBackground")).toBe(mode === "dark" ? "#445566" : "#112233")
  })
})
