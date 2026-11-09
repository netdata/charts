import "@testing-library/jest-dom"
import { act, within } from "@testing-library/react"
import { DarkTheme, DefaultTheme } from "@netdata/netdata-ui"
import { makeTestChart } from "@jest/testUtilities"
import makeDefaultSDK from "./makeDefaultSDK"
import mount from "./mount"
import parseDOM from "./sdk/parseDOM"

describe("standalone chart themes", () => {
  let element
  let root

  beforeEach(() => {
    element = document.createElement("div")
    document.body.appendChild(element)
  })

  afterEach(() => {
    act(() => root?.unmount())
    root = undefined
    element.remove()
  })

  it("passes a chart's data-theme to the SDK canvas palette", () => {
    element.setAttribute("data-netdata", "")
    element.setAttribute("data-theme", "dark")

    const { nodeByElement } = parseDOM(makeDefaultSDK())
    const chart = nodeByElement.get(element)

    expect(chart.getThemeAttribute("themeBackground")).toBe(DarkTheme.colors.cardBackground)
  })

  it.each(["constructor", "__proto__"])("uses the default theme for unsupported name %s", theme => {
    const { chart } = makeTestChart({ attributes: { theme } })

    act(() => {
      root = mount(chart, element)
    })

    expect(within(element).getByTestId("chart")).toHaveStyle({
      background: DefaultTheme.colors.cardBackground,
    })
    expect(chart.getThemeAttribute("themeBackground")).toBe(DefaultTheme.colors.cardBackground)
  })

  it("keeps the mounted chart surface in sync with the SDK canvas palette", () => {
    const { chart } = makeTestChart({ attributes: { theme: "dark" } })

    act(() => {
      root = mount(chart, element)
    })

    const surface = within(element).getByTestId("chart")
    expect(surface).toHaveStyle({ background: DarkTheme.colors.cardBackground })

    act(() => chart.updateAttribute("theme", "default"))

    expect(surface).toHaveStyle({ background: DefaultTheme.colors.cardBackground })
  })
})
