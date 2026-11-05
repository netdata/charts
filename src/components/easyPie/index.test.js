import React from "react"
import { act, screen } from "@testing-library/react"
import "@testing-library/jest-dom"
import { makeTestChart, renderHookWithChart, renderWithChart } from "@jest/testUtilities"
import { useLatestDisplayValueWithUnit } from "@/components/provider"
import systemLoadLine from "../../../fixtures/systemLoadLine"
import { EasyPie } from "./index"

const loadChart = async (attributes = {}) => {
  const { chart } = makeTestChart({ attributes: { chartLibrary: "easypiechart", ...attributes } })
  chart.doneFetch(systemLoadLine[0])
  await new Promise(resolve => setTimeout(resolve, 0))
  return chart
}

describe("EasyPie", () => {
  it("shows the skeleton before the chart loads, in every flavour", () => {
    ;["default", "modern"].forEach(designFlavour => {
      const { unmount } = renderWithChart(<EasyPie />, { attributes: { designFlavour } })

      expect(screen.queryByTestId("chartContent")).not.toBeInTheDocument()
      expect(screen.queryByTestId("modernEasyPie")).not.toBeInTheDocument()
      unmount()
    })
  })

  it.each(["default", "minimal"])(
    "keeps the canvas ring and centred stats in the %s flavour",
    async designFlavour => {
      const chart = await loadChart({ designFlavour })
      renderWithChart(<EasyPie />, { chart })

      const content = screen.getByTestId("chartContent")
      expect(content.querySelector("canvas")).not.toBeNull()
      expect(content).toHaveTextContent(/^[\d.,-]+threads$/)
      const [id] = chart.getVisibleDimensionIds()
      const { convertedValue } = renderHookWithChart(() => useLatestDisplayValueWithUnit(id), {
        chart,
      }).result.current
      expect(content).toHaveTextContent(`${convertedValue}threads`)
      expect(screen.queryByTestId("modernEasyPie")).not.toBeInTheDocument()
      expect(content.querySelector("svg")).toBeNull()
    }
  )

  it("draws the SVG ring and no canvas in the modern flavour", async () => {
    const chart = await loadChart({ designFlavour: "modern" })
    renderWithChart(<EasyPie />, { chart })

    const content = screen.getByTestId("chartContent")
    expect(screen.getByTestId("modernEasyPie")).toBeInTheDocument()
    expect(content.querySelector("canvas")).toBeNull()
    expect(screen.getByTestId("modernEasyPieUnit")).toHaveTextContent("threads")
  })

  it("swaps between the canvas and the SVG ring when the flavour changes", async () => {
    const chart = await loadChart()
    renderWithChart(<EasyPie />, { chart })
    const content = screen.getByTestId("chartContent")

    act(() => chart.updateAttribute("designFlavour", "modern"))
    expect(content.querySelector("canvas")).toBeNull()
    expect(screen.getByTestId("modernEasyPie")).toBeInTheDocument()

    act(() => chart.updateAttribute("designFlavour", "default"))
    expect(content.querySelectorAll("canvas")).toHaveLength(1)
    expect(screen.queryByTestId("modernEasyPie")).not.toBeInTheDocument()
  })
})
