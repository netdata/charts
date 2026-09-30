import React from "react"
import { act, screen } from "@testing-library/react"
import "@testing-library/jest-dom"
import { makeTestChart, renderHookWithChart, renderWithChart } from "@jest/testUtilities"
import { useLatestDisplayValueWithUnit } from "@/components/provider"
import systemLoadLine from "../../../../fixtures/systemLoadLine"
import ModernNumber, { getMean } from "./index"

const readLatest = (chart, id) =>
  renderHookWithChart(() => useLatestDisplayValueWithUnit(id), { chart }).result.current

const loadChart = async (attributes = {}) => {
  const { chart } = makeTestChart({ attributes: { designFlavour: "modern", ...attributes } })
  chart.doneFetch(systemLoadLine[0])
  await new Promise(resolve => setTimeout(resolve, 0))
  return chart
}

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
    const { convertedValue, convertedUnit } = readLatest(chart, id)

    expect(screen.getByTestId("modernNumberValue")).toHaveTextContent(convertedValue)
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
    const converted = chart.getConvertedValue(Math.abs(delta), { dimensionId: id, unitAttributes })

    expect(screen.getByTestId("modernNumberDelta")).toHaveTextContent(`${sign}${converted} vs mean`)
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
