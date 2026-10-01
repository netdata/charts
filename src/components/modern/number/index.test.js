import React from "react"
import { act, screen } from "@testing-library/react"
import "@testing-library/jest-dom"
import { DefaultTheme, DarkTheme } from "@netdata/netdata-ui"
import { makeTestChart, renderHookWithChart, renderWithChart } from "@jest/testUtilities"
import { useLatestDisplayValueWithUnit } from "@/components/provider"
import { formatReadout } from "@/components/modern/format"
import { makePayload, makeWave } from "@/helpers/makeWavePayload"
import { NumberChart } from "@/components/number"
import systemLoadLine from "../../../../fixtures/systemLoadLine"
import ModernNumber, { AttentionPill, getMean, isStateUnit } from "./index"
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

describe("isStateUnit", () => {
  it.each([["{state}"], ["status"], [["{boolean}"]], ["{ntp mode}"]])(
    "treats %p as a state",
    units => expect(isStateUnit(units)).toBe(true)
  )

  it.each([["requests/s"], [["%"]], [""], [undefined]])("treats %p as a measure", units =>
    expect(isStateUnit(units)).toBe(false)
  )
})

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
    expect(screen.queryByTestId("modernNumberStatus")).not.toBeInTheDocument()
  })

  it("shows no change vs mean for a state metric", async () => {
    const chart = await loadChart({}, requests(makeWave({ center: 1, amplitude: 1 })))
    act(() => chart.updateAttribute("units", ["{state}"]))
    renderWithChart(<ModernNumber />, { chart })

    expect(screen.getByTestId("modernNumberValue")).toBeInTheDocument()
    expect(screen.queryByTestId("modernNumberDelta")).not.toBeInTheDocument()
  })

  it("shows no status when the chart has no alerts", async () => {
    const chart = await loadChart({}, requests(makeWave({ center: 10, amplitude: 2 })))
    renderWithChart(<ModernNumber />, { chart })

    expect(screen.queryByTestId("modernNumberStatus")).not.toBeInTheDocument()
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

  it("shows the value with the same digits as the default number chart", async () => {
    const chart = await loadChart()
    renderWithChart(<ModernNumber />, { chart })

    const [id] = chart.getVisibleDimensionIds()
    const { convertedValue } = readLatest(chart, id)

    expect(screen.getByTestId("modernNumberValue")).toHaveTextContent(convertedValue)
  })

  it("scales thousands on the same unit as the default number chart", async () => {
    const chart = await loadChart({}, requests([...Array(96).fill(2000), 2022.7]))
    renderWithChart(<ModernNumber />, { chart })

    const { convertedValue, convertedUnit } = readLatest(chart, "requests")
    expect(screen.getByTestId("modernNumberValue")).toHaveTextContent(convertedValue)
    expect(screen.getByTestId("modernNumberUnit")).toHaveTextContent(convertedUnit)
    expect(screen.getByTestId("modernNumberDelta")).toHaveTextContent(/^\+.+ vs mean$/)
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

  it("shows the warning status and tone when an alert is raised", async () => {
    const chart = await loadChart()
    renderWithChart(<ModernNumber />, { chart })

    act(() => chart.updateAttribute("alerts", { load: { nm: "load", wr: 1 } }))

    const status = screen.getByTestId("modernNumberStatus")
    expect(status).toHaveAttribute("data-status", "warning")
    expect(status).toHaveTextContent("1 warning")
    expect(rgbToHex(getComputedStyle(screen.getByTestId("modernNumberValue")).color)).toBe(
      DefaultTheme.colors.warning
    )
  })

  it("shows critical as the prominent status", async () => {
    const chart = await loadChart()
    renderWithChart(<ModernNumber />, { chart })

    act(() => chart.updateAttribute("alerts", { load: { nm: "load", cr: 2 } }))

    const status = screen.getByTestId("modernNumberStatus")
    expect(status).toHaveAttribute("data-status", "critical")
    expect(status).toHaveTextContent("2 critical")
    expect(rgbToHex(getComputedStyle(status).backgroundColor)).toBe(DefaultTheme.colors.error)
  })

  it("renders a placeholder before data arrives", () => {
    renderWithChart(<ModernNumber />, { attributes: { designFlavour: "modern" } })

    expect(screen.getByTestId("modernNumber")).toBeInTheDocument()
    expect(screen.queryByTestId("modernNumberSpark")).not.toBeInTheDocument()
    expect(screen.queryByTestId("modernNumberDelta")).not.toBeInTheDocument()
  })
})

describe("number colour assignment", () => {
  it("does not take a colour slot before data arrives", async () => {
    const { chart: early } = makeTestChart({ attributes: { designFlavour: "modern" } })
    renderWithChart(<ModernNumber />, { chart: early })
    early.doneFetch(systemLoadLine[0])
    await act(() => new Promise(resolve => setTimeout(resolve, 0)))

    const { chart: plain } = makeTestChart({ attributes: { designFlavour: "default" } })
    plain.doneFetch(systemLoadLine[0])
    await new Promise(resolve => setTimeout(resolve, 0))

    plain
      .getDimensionIds()
      .forEach(id => expect(early.selectDimensionColor(id)).toBe(plain.selectDimensionColor(id)))
  })
})

describe("number status in other flavours", () => {
  it.each(["default", "minimal"])("renders no status for %s with raised alerts", async flavour => {
    const chart = await loadChart({ designFlavour: flavour })
    renderWithChart(<NumberChart />, { chart })

    act(() => chart.updateAttribute("alerts", { load: { nm: "load", cr: 1 } }))

    expect(screen.queryByTestId("modernNumberStatus")).not.toBeInTheDocument()
    expect(screen.queryByTestId("modernStatus-dot")).not.toBeInTheDocument()
    expect(screen.queryByText("1 critical")).not.toBeInTheDocument()
  })
})

describe("AttentionPill", () => {
  it.each([
    ["light", DefaultTheme],
    ["dark", DarkTheme],
  ])("keeps the critical ink readable on the solid tone in the %s theme", (_, theme) => {
    expect(contrast(theme.colors[getPillInk("error")], theme.colors.error)).toBeGreaterThanOrEqual(
      4.5
    )
  })

  it("renders the shared status indicator for the alert", () => {
    renderWithChart(
      <AttentionPill alert={{ level: "critical", count: 1, tone: "error", names: ["load"] }} />
    )

    const pill = screen.getByTestId("modernAttentionPill")
    expect(pill).toHaveAttribute("data-status", "critical")
    expect(pill).toHaveTextContent("1 critical")
    expect(rgbToHex(getComputedStyle(pill).backgroundColor)).toBe(DefaultTheme.colors.error)
    expect(
      contrast(
        rgbToHex(getComputedStyle(screen.getByTestId("modernStatus-label")).color),
        DefaultTheme.colors.error
      )
    ).toBeGreaterThanOrEqual(4.5)
  })
})
