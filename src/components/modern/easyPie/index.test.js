import React from "react"
import { act, screen } from "@testing-library/react"
import "@testing-library/jest-dom"
import { makeTestChart, renderHookWithChart, renderWithChart } from "@jest/testUtilities"
import { useLatestDisplayValueWithUnit } from "@/components/provider"
import { getRingValue } from "@/chartLibraries/easyPie/ringValue"
import { formatReadout } from "@/components/modern/format"
import { makePayload } from "@/helpers/makeWavePayload"
import systemLoadLine from "../../../../fixtures/systemLoadLine"
import ModernEasyPie, { toFraction } from "./index"

const loadChart = async (attributes = {}, payload = systemLoadLine[0]) => {
  const { chart } = makeTestChart({
    attributes: { chartLibrary: "easypiechart", designFlavour: "modern", ...attributes },
  })
  chart.doneFetch(payload)
  await new Promise(resolve => setTimeout(resolve, 0))
  return chart
}

const readLatest = (chart, id) =>
  renderHookWithChart(() => useLatestDisplayValueWithUnit(id), { chart }).result.current

const utilization = latest =>
  makePayload({
    context: "modern.cpu",
    title: "cpu",
    unit: "percentage",
    dimensions: [{ id: "utilization", values: [...Array(96).fill(1.5), latest] }],
  })

describe("toFraction", () => {
  it("clamps the percentage into the ring", () => {
    expect(toFraction(50)).toBe(0.5)
    expect(toFraction(-20)).toBe(0)
    expect(toFraction(140)).toBe(1)
  })

  it("draws nothing for an undefined range", () => {
    expect(toFraction(NaN)).toBe(0)
    expect(toFraction(Infinity)).toBe(0)
    expect(toFraction(undefined)).toBe(0)
  })
})

describe("ModernEasyPie", () => {
  it("draws a thin SVG ring with the value and units in the centre", async () => {
    const chart = await loadChart()
    renderWithChart(<ModernEasyPie size={120} />, { chart })

    const [id] = chart.getVisibleDimensionIds()
    const { value, convertedUnit, unitAttributes } = readLatest(chart, id)
    const readout = formatReadout(chart, value, { dimensionId: id, unitAttributes })

    expect(screen.getByTestId("modernEasyPie")).toHaveStyle({ width: "120px", height: "120px" })
    expect(screen.getByTestId("modernEasyPieValue")).toHaveTextContent(readout)
    expect(screen.getByTestId("modernEasyPieUnit")).toHaveTextContent(convertedUnit)
    expect(screen.getByRole("img")).toHaveAttribute("aria-label", `${readout} ${convertedUnit}`)
  })

  it("shows the centre value with the same digits as the default easy pie", async () => {
    const chart = await loadChart({}, utilization(1.8813))
    renderWithChart(<ModernEasyPie size={120} />, { chart })

    const { convertedValue } = readLatest(chart, "utilization")
    expect(screen.getByTestId("modernEasyPieValue")).toHaveTextContent(convertedValue)
  })

  it("keeps the decimals the user chose in the centre value", async () => {
    const chart = await loadChart({ staticFractionDigits: 3 }, utilization(1.8813))
    renderWithChart(<ModernEasyPie size={120} />, { chart })

    expect(screen.getByTestId("modernEasyPieValue")).toHaveTextContent(/^1\.881$/)
  })

  it("fills the arc by the same range position as the canvas ring", async () => {
    const chart = await loadChart()
    renderWithChart(<ModernEasyPie size={120} />, { chart })

    const expected = toFraction(getRingValue(chart).percentage)

    expect(Number(screen.getByRole("img").getAttribute("data-fraction"))).toBeCloseTo(expected)
    if (expected > 0) expect(screen.getByTestId("modernEasyPieArc")).toBeInTheDocument()
  })

  it("follows a static value range", async () => {
    const chart = await loadChart({ staticValueRange: [0, 1000] })
    renderWithChart(<ModernEasyPie size={120} />, { chart })

    const { value } = getRingValue(chart)

    expect(Number(screen.getByRole("img").getAttribute("data-fraction"))).toBeCloseTo(value / 1000)
  })

  it("draws the arc in the same colour as the default easy pie while no threshold is crossed", async () => {
    const chart = await loadChart()
    renderWithChart(<ModernEasyPie size={120} />, { chart })

    expect(screen.getByTestId("modernEasyPieArc")).toHaveStyle({
      stroke: chart.selectDimensionColor(),
    })
  })

  it("keeps the dimension colour while the value stays in the base band", async () => {
    const chart = await loadChart()
    const { value, min } = getRingValue(chart)
    renderWithChart(<ModernEasyPie size={120} />, { chart })

    act(() =>
      chart.updateAttribute("gaugeThresholds", [
        { id: "base", from: min, color: ["#00AB44", "#00AB44"] },
        { id: "hot", from: value + 1000, color: ["#123456", "#654321"] },
      ])
    )

    expect(screen.getByTestId("modernEasyPieArc")).toHaveStyle({
      stroke: chart.selectDimensionColor(),
    })
  })

  it("switches from the dimension colour once an alert is raised", async () => {
    const chart = await loadChart()
    const { container } = renderWithChart(<ModernEasyPie size={120} />, { chart })

    const neutral = getComputedStyle(screen.getByTestId("modernEasyPieArc")).stroke
    const neutralValue = getComputedStyle(screen.getByTestId("modernEasyPieValue")).fill

    act(() => chart.updateAttribute("alerts", { load: { nm: "load", cr: 1 } }))

    const hot = getComputedStyle(screen.getByTestId("modernEasyPieArc")).stroke
    expect(hot).not.toBe(neutral)
    expect(getComputedStyle(screen.getByTestId("modernEasyPieValue")).fill).toBe(hot)
    expect(getComputedStyle(screen.getByTestId("modernEasyPieValue")).fill).not.toBe(neutralValue)
    expect(container.querySelector("canvas")).toBeNull()
  })

  it("colours the arc with a crossed value threshold", async () => {
    const chart = await loadChart()
    const { value, min } = getRingValue(chart)
    renderWithChart(<ModernEasyPie size={120} />, { chart })

    act(() =>
      chart.updateAttribute("gaugeThresholds", [
        { id: "base", from: min, color: ["#00AB44", "#00AB44"] },
        { id: "hot", from: value - 0.001, color: ["#123456", "#654321"] },
      ])
    )

    expect(screen.getByTestId("modernEasyPieArc")).toHaveStyle({ stroke: "#123456" })
  })
})
