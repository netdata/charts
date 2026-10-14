import React from "react"
import { fireEvent, screen } from "@testing-library/react"
import "@testing-library/jest-dom"
import { DefaultTheme, DarkTheme } from "@netdata/netdata-ui"
import { renderWithProviders } from "@jest/testUtilities"
import StatusIndicator, {
  capNames,
  getClearDescription,
  getStatusLabel,
  statusInk,
  summarizeAlerts,
} from "./index"

const luminance = hex => {
  const channels = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255)
  const [r, g, b] = channels.map(c => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4))
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

const contrast = (a, b) => {
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (light + 0.05) / (dark + 0.05)
}

const rgbToHex = rgb =>
  `#${rgb
    .match(/\d+/g)
    .slice(0, 3)
    .map(n => Number(n).toString(16).padStart(2, "0"))
    .join("")}`.toUpperCase()

const hover = node => fireEvent.mouseEnter(node)

describe("status summary", () => {
  it("counts instances and collects raised names, critical first", () => {
    const summary = summarizeAlerts({
      a: { nm: "a", wr: 2 },
      b: { nm: "b", cr: 1, wr: 1 },
      c: { nm: "c", cl: 1 },
    })

    expect(summary.watching).toBe(3)
    expect(summary.critical).toEqual({ count: 1, names: ["b"] })
    expect(summary.warning).toEqual({ count: 3, names: ["a", "b"] })
    expect(summary.raisedNames).toEqual(["b", "a"])
  })

  it("handles missing alerts", () => {
    expect(summarizeAlerts(undefined).watching).toBe(0)
    expect(summarizeAlerts(null).raisedNames).toEqual([])
  })

  it("labels with the count when it is known", () => {
    expect(getStatusLabel({ status: "warning", count: 1 })).toBe("1 warning")
    expect(getStatusLabel({ status: "critical", count: 2 })).toBe("2 critical")
    expect(getStatusLabel({ status: "critical" })).toBe("Critical")
    expect(getStatusLabel({ status: "warning", count: 0 })).toBe("Warning")
  })

  it("describes the clear state", () => {
    expect(getClearDescription(3)).toBe("3 alerts watch this chart, none is raised")
    expect(getClearDescription(1)).toBe("1 alert watches this chart, none is raised")
    expect(getClearDescription(0)).toBe("No alert is raised")
  })

  it("caps the listed names", () => {
    expect(capNames(["a", "b", "c", "d", "e", "f", "g"])).toEqual({
      shown: ["a", "b", "c", "d", "e"],
      more: 2,
    })
    expect(capNames(["a"])).toEqual({ shown: ["a"], more: 0 })
  })
})

describe("StatusIndicator", () => {
  it("renders nothing without a known status", () => {
    const { container } = renderWithProviders(<StatusIndicator status={null} />)
    expect(container).toBeEmptyDOMElement()

    renderWithProviders(<StatusIndicator status="unknown" />)
    expect(screen.queryByTestId("modernStatus")).not.toBeInTheDocument()
  })

  it("shows only a green dot when clear and describes it on hover", async () => {
    renderWithProviders(<StatusIndicator status="clear" description={getClearDescription(3)} />)

    const status = screen.getByTestId("modernStatus")
    expect(status).toHaveAttribute("data-status", "clear")
    expect(status).toHaveTextContent(/^$/)
    expect(screen.queryByTestId("modernStatus-label")).not.toBeInTheDocument()
    expect(rgbToHex(getComputedStyle(screen.getByTestId("modernStatus-dot")).backgroundColor)).toBe(
      DefaultTheme.colors.success
    )
    expect(status).toHaveAttribute("aria-label", "3 alerts watch this chart, none is raised")

    hover(status)
    expect(await screen.findByText("3 alerts watch this chart, none is raised")).toBeInTheDocument()
  })

  it("falls back to a generic clear description", () => {
    renderWithProviders(<StatusIndicator status="clear" />)
    expect(screen.getByTestId("modernStatus")).toHaveAttribute("aria-label", "No alert is raised")
  })

  it("shows an amber dot and a short label for warnings", async () => {
    renderWithProviders(<StatusIndicator status="warning" count={1} names={["load_15"]} />)

    const status = screen.getByTestId("modernStatus")
    expect(status).toHaveAttribute("data-status", "warning")
    expect(screen.getByTestId("modernStatus-label")).toHaveTextContent("1 warning")
    expect(rgbToHex(getComputedStyle(screen.getByTestId("modernStatus-dot")).backgroundColor)).toBe(
      DefaultTheme.colors.warning
    )
    expect(rgbToHex(getComputedStyle(status).backgroundColor)).not.toBe(DefaultTheme.colors.error)

    hover(status)
    expect(await screen.findByTestId("modernStatus-name")).toHaveTextContent("load_15")
  })

  it("shows critical as a solid pill and lists at most five names", async () => {
    const names = ["a", "b", "c", "d", "e", "f", "g", "h"]
    renderWithProviders(<StatusIndicator status="critical" count={2} names={names} />)

    const status = screen.getByTestId("modernStatus")
    expect(status).toHaveAttribute("data-status", "critical")
    expect(screen.getByTestId("modernStatus-label")).toHaveTextContent("2 critical")
    expect(rgbToHex(getComputedStyle(status).backgroundColor)).toBe(DefaultTheme.colors.error)
    expect(getComputedStyle(screen.getByTestId("modernStatus-label")).fontWeight).toBe("700")
    expect(status).toHaveAttribute("aria-label", "2 critical, a, b, c, d, e, f, g, h")

    hover(status)
    await screen.findByTestId("modernStatus-more")
    expect(screen.getAllByTestId("modernStatus-name").map(node => node.textContent)).toEqual([
      "a",
      "b",
      "c",
      "d",
      "e",
    ])
    expect(screen.getByTestId("modernStatus-more")).toHaveTextContent("3 more")
  })

  it("keeps the given test id for callers", () => {
    renderWithProviders(<StatusIndicator status="warning" data-testid="chartAttention-status" />)
    expect(screen.getByTestId("chartAttention-status")).toBeInTheDocument()
  })

  it.each([
    ["light", DefaultTheme],
    ["dark", DarkTheme],
  ])("keeps labels at 4.5:1 or more in the %s theme", (_, theme) => {
    expect(
      contrast(theme.colors[statusInk.warning], theme.colors.mainChartBg)
    ).toBeGreaterThanOrEqual(4.5)
    expect(contrast(theme.colors[statusInk.critical], theme.colors.error)).toBeGreaterThanOrEqual(
      4.5
    )
  })

  it("renders the label colours from the theme", () => {
    renderWithProviders(<StatusIndicator status="critical" count={1} />, { theme: DarkTheme })

    expect(rgbToHex(getComputedStyle(screen.getByTestId("modernStatus-label")).color)).toBe(
      DarkTheme.colors.bright
    )
  })
})
