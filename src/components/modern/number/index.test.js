import React from "react"
import { act, screen } from "@testing-library/react"
import "@testing-library/jest-dom"
import { DefaultTheme, DarkTheme } from "@netdata/netdata-ui"
import { makeTestChart, renderHookWithChart, renderWithChart } from "@jest/testUtilities"
import { useLatestDisplayValueWithUnit } from "@/components/provider"
import { formatReadout } from "@/components/modern/format"
import { makePayload } from "@/helpers/makeWavePayload"
import systemLoadLine from "../../../../fixtures/systemLoadLine"
import ModernNumber, { AttentionPill, getMean } from "./index"
import { getPillInk } from "./attention"

const readLatest = (chart, id) =>
  renderHookWithChart(() => useLatestDisplayValueWithUnit(id), { chart }).result.current

const loadChart = async (attributes = {}, payload = systemLoadLine[0]) => {
  const { chart } = makeTestChart({ attributes: { designFlavour: "modern", ...attributes } })
  chart.doneFetch(payload)
  await new Promise(resolve => setTimeout(resolve, 0))
  return chart
}

const requests = values =>
  makePayload({
    context: "modern.requests",
    title: "Requests",
    unit: "requests/s",
    dimensions: [{ id: "requests", values }],
  })

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

describe("getMean", () => {
  it("averages the numbers and skips gaps", () => {
    expect(getMean([1, null, 3])).toBe(2)
    expect(getMean([null])).toBeNull()
    expect(getMean([])).toBeNull()
  })
})

describe("ModernNumber", () => {
  it("shows the latest value, units, change vs mean and the window sparkline", async () => {
    const chart = await loadChart()
    renderWithChart(<ModernNumber />, { chart })

    const [id] = chart.getVisibleDimensionIds()
    const { value, convertedUnit, unitAttributes } = readLatest(chart, id)

    expect(screen.getByTestId("modernNumberValue")).toHaveTextContent(
      formatReadout(chart, value, { dimensionId: id, unitAttributes })
    )
    expect(screen.getByTestId("modernNumberUnit")).toHaveTextContent(convertedUnit)
    expect(screen.getByTestId("modernNumberDelta")).toHaveTextContent(/^[+−].+ vs mean$/)
    expect(screen.getByTestId("modernNumberSpark")).toBeInTheDocument()
    expect(screen.getByTestId("modernNumberSparkMarker").style.left).toBe("100%")
    expect(screen.queryByTestId("modernAttentionPill")).not.toBeInTheDocument()
  })

  it("renders the value in the numerals font with tabular numerals", async () => {
    const chart = await loadChart()
    renderWithChart(<ModernNumber />, { chart })

    const value = screen.getByTestId("modernNumberValue")
    expect(value).toHaveStyle({ fontVariantNumeric: "tabular-nums" })
    expect(getComputedStyle(value).fontFamily).toContain("IBM Plex Sans Condensed")
  })

  it("computes the delta against the window mean", async () => {
    const chart = await loadChart()
    renderWithChart(<ModernNumber />, { chart })

    const [id] = chart.getVisibleDimensionIds()
    const { all } = chart.getPayload()
    const values = all.map((_, i) => chart.getDimensionValue(id, i, { abs: false }))
    const delta = values[values.length - 1] - getMean(values)
    const sign = delta >= 0 ? "+" : "−"

    const { unitAttributes } = readLatest(chart, id)
    const converted = formatReadout(chart, Math.abs(delta), { dimensionId: id, unitAttributes })

    expect(screen.getByTestId("modernNumberDelta")).toHaveTextContent(`${sign}${converted} vs mean`)
  })

  it("keeps the value and the delta to at most two decimals", async () => {
    const chart = await loadChart()
    renderWithChart(<ModernNumber />, { chart })

    const [id] = chart.getVisibleDimensionIds()
    const { convertedValue } = readLatest(chart, id)

    expect(convertedValue).toMatch(/\.\d{3,}$/)
    expect(screen.getByTestId("modernNumberValue").textContent).toMatch(/^[\d,]+(\.\d{1,2})?$/)
    expect(screen.getByTestId("modernNumberDelta").textContent).toMatch(/^[+−][\d,]+(\.\d{1,2})? /)
  })

  it("scales thousands with two decimals on the same unit as the value", async () => {
    const chart = await loadChart({}, requests([...Array(96).fill(2000), 2022.7]))
    renderWithChart(<ModernNumber />, { chart })

    expect(readLatest(chart, "requests").convertedValue).toBe("2.0227")
    expect(screen.getByTestId("modernNumberValue")).toHaveTextContent(/^2\.02$/)
    expect(screen.getByTestId("modernNumberUnit")).toHaveTextContent(/^K/)
    expect(screen.getByTestId("modernNumberDelta")).toHaveTextContent(/^\+0\.02 vs mean$/)
  })

  it("keeps the decimals the user chose", async () => {
    const chart = await loadChart({ staticFractionDigits: 4 })
    renderWithChart(<ModernNumber />, { chart })

    expect(screen.getByTestId("modernNumberValue").textContent).toMatch(/\.\d{4}$/)
    expect(screen.getByTestId("modernNumberDelta").textContent).toMatch(/\.\d{4} vs mean$/)
  })

  it("moves the marker with the hovered point", async () => {
    const chart = await loadChart()
    renderWithChart(<ModernNumber />, { chart })

    const { all } = chart.getPayload()
    act(() => chart.updateAttribute("hoverX", [all[0][0], null]))

    expect(screen.getByTestId("modernNumberSparkMarker").style.left).toBe("0%")
  })

  it("shows an attention pill and tone when an alert is raised", async () => {
    const chart = await loadChart()
    renderWithChart(<ModernNumber />, { chart })

    act(() => chart.updateAttribute("alerts", { load: { nm: "load", wr: 1 } }))

    expect(screen.getByTestId("modernAttentionPill")).toHaveTextContent("Warning")
  })

  it("renders a placeholder before data arrives", () => {
    renderWithChart(<ModernNumber />, { attributes: { designFlavour: "modern" } })

    expect(screen.getByTestId("modernNumber")).toBeInTheDocument()
    expect(screen.queryByTestId("modernNumberSpark")).not.toBeInTheDocument()
    expect(screen.queryByTestId("modernNumberDelta")).not.toBeInTheDocument()
  })
})

describe("AttentionPill", () => {
  it.each([
    ["light", DefaultTheme],
    ["dark", DarkTheme],
  ])("keeps warning and critical labels readable in the %s theme", (_, theme) => {
    ;[
      { level: "warning", count: 1, tone: "warning" },
      { level: "critical", count: 1, tone: "error" },
    ].forEach(alert => {
      const ink = theme.colors[getPillInk(alert.tone)]
      expect(contrast(ink, theme.colors[alert.tone])).toBeGreaterThanOrEqual(4.5)
    })
  })

  it("renders the label in the tone's ink on the solid tone", () => {
    const alert = { level: "warning", count: 1, tone: "warning" }
    renderWithChart(<AttentionPill alert={alert} />)

    const pill = screen.getByTestId("modernAttentionPill")
    const label = pill.firstChild

    expect(rgbToHex(getComputedStyle(pill).backgroundColor)).toBe(DefaultTheme.colors.warning)
    expect(rgbToHex(getComputedStyle(label).color)).toBe(
      DefaultTheme.colors[getPillInk("warning")].toUpperCase()
    )
    expect(
      contrast(rgbToHex(getComputedStyle(label).color), DefaultTheme.colors.warning)
    ).toBeGreaterThanOrEqual(4.5)
  })
})
