import React from "react"
import { act, screen } from "@testing-library/react"
import "@testing-library/jest-dom"
import { makeTestChart, renderHookWithChart, renderWithChart } from "@jest/testUtilities"
import { useLatestDisplayValueWithUnit } from "@/components/provider"
import { getRingValue } from "@/chartLibraries/easyPie/ringValue"
import systemLoadLine from "../../../../fixtures/systemLoadLine"
import ModernEasyPie, { toFraction } from "./index"

const loadChart = async (attributes = {}) => {
  const { chart } = makeTestChart({
    attributes: { chartLibrary: "easypiechart", designFlavour: "modern", ...attributes },
  })
  chart.doneFetch(systemLoadLine[0])
  await new Promise(resolve => setTimeout(resolve, 0))
  return chart
}

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
    const { convertedValue, convertedUnit } = renderHookWithChart(
      () => useLatestDisplayValueWithUnit(id),
      { chart }
    ).result.current

    expect(screen.getByTestId("modernEasyPie")).toHaveStyle({ width: "120px", height: "120px" })
    expect(screen.getByTestId("modernEasyPieValue")).toHaveTextContent(convertedValue)
    expect(screen.getByTestId("modernEasyPieUnit")).toHaveTextContent(convertedUnit)
    expect(screen.getByRole("img")).toHaveAttribute(
      "aria-label",
      `${convertedValue} ${convertedUnit}`
    )
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

  it("is neutral without a threshold and coloured once one is crossed", async () => {
    const chart = await loadChart()
    const { container } = renderWithChart(<ModernEasyPie size={120} />, { chart })

    const neutral = getComputedStyle(screen.getByTestId("modernEasyPieArc")).stroke

    act(() => chart.updateAttribute("alerts", { load: { nm: "load", cr: 1 } }))

    const hot = getComputedStyle(screen.getByTestId("modernEasyPieArc")).stroke
    expect(hot).not.toBe(neutral)
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
