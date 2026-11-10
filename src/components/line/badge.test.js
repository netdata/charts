import { render, within } from "@testing-library/react"
import { ThemeProvider } from "styled-components"
import { DefaultTheme, DarkTheme } from "@netdata/netdata-ui/dist/theme"
import Badge, { getColors } from "./badge"

const luminance = rgb => {
  const channels = rgb.match(/\d+/g).map(channel => Number(channel) / 255)
  const [r, g, b] = channels.map(c => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4))
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

describe("Badge component", () => {
  it.each([
    ["light", DefaultTheme],
    ["dark", DarkTheme],
  ])("uses readable text against each %s status fill", (_, theme) => {
    const types = ["error", "warning", "success", "neutral"]
    const { getAllByTestId } = render(
      <ThemeProvider theme={theme}>
        {types.map(type => (
          <Badge key={type} type={type}>
            {type}
          </Badge>
        ))}
      </ThemeProvider>
    )

    getAllByTestId("badge").forEach((badge, index) => {
      const text = within(badge).getByText(types[index])
      const ink = luminance(getComputedStyle(text).color)
      const fill = luminance(getComputedStyle(badge).backgroundColor)

      const ratio = (Math.max(ink, fill) + 0.05) / (Math.min(ink, fill) + 0.05)

      expect(ratio).toBeGreaterThanOrEqual(4.5)
    })
  })

  it("exports Badge component", () => {
    expect(Badge).toBeDefined()
    expect(typeof Badge).toBe("function")
  })

  it("exports getColors function", () => {
    expect(getColors).toBeDefined()
    expect(typeof getColors).toBe("function")
  })
})

describe("getColors function", () => {
  it("returns error colors for error type", () => {
    const colors = getColors("error")

    expect(colors).toEqual({
      background: "errorBackground",
      color: "errorText",
    })
  })

  it("returns warning colors for warning type", () => {
    const colors = getColors("warning")

    expect(colors).toEqual({
      background: "warningBackground",
      color: "warningText",
    })
  })

  it("returns success colors for success type", () => {
    const colors = getColors("success")

    expect(colors).toEqual({
      background: ["green", "frostee"],
      color: "success",
    })
  })

  it("returns neutral colors for neutral type", () => {
    const colors = getColors("neutral")

    expect(colors).toEqual({
      background: "elementBackground",
      color: "textLite",
    })
  })

  it("returns error colors for unknown type", () => {
    const colors = getColors("unknown")

    expect(colors).toEqual({
      background: "errorBackground",
      color: "errorText",
    })
  })

  it("returns error colors for undefined type", () => {
    const colors = getColors(undefined)

    expect(colors).toEqual({
      background: "errorBackground",
      color: "errorText",
    })
  })

  it("returns error colors for null type", () => {
    const colors = getColors(null)

    expect(colors).toEqual({
      background: "errorBackground",
      color: "errorText",
    })
  })
})
