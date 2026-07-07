import React from "react"
import { screen } from "@testing-library/react"
import "@testing-library/jest-dom"
import {
  loadHeatmapPayload,
  makeHeatmapPayload,
  makeTestChart,
  renderWithChart,
} from "@jest/testUtilities"
import Dimensions from "./dimensions"

const loadLinePayload = async (chart, ids, rows) => {
  const payload = makeHeatmapPayload(ids, rows)

  payload.view.chart_type = "line"
  payload.view.dimensions.grouped_by = []

  chart.doneFetch(payload)
  await new Promise(resolve => setTimeout(resolve, 0))
}

describe("line popover Dimensions", () => {
  it("shows all cropped heatmap buckets without generic more-values windowing", async () => {
    const ids = Array.from({ length: 14 }, (_, index) => String(index))
    const row = ids.map((_, index) => (index > 1 && index < 12 ? 1 : 0))
    const { chart } = makeTestChart({
      attributes: {
        chartType: "heatmap",
        groupBy: ["dimension"],
        selectedDimensions: [],
        selectedLegendDimensions: [],
      },
    })

    await loadHeatmapPayload(chart, ids, [row])
    chart.updateAttribute("hoverX", [1000, "6"])

    renderWithChart(<Dimensions />, { chart })

    expect(chart.getVisibleHeatmapIds()).toEqual(ids.slice(1, 13))
    expect(screen.queryByText(/more values/)).not.toBeInTheDocument()
    expect(screen.getAllByTestId("chartPopover-dimension")).toHaveLength(12)
    expect(screen.getAllByTestId("chartDimensions-name").map(node => node.textContent)).toEqual(
      ids.slice(1, 13)
    )
  })

  it("keeps generic more-values windowing for non-heatmap popovers", async () => {
    const ids = Array.from({ length: 12 }, (_, index) => `dim${index}`)
    const { chart } = makeTestChart({
      attributes: {
        chartType: "line",
        groupBy: [],
        selectedDimensions: [],
        selectedLegendDimensions: [],
      },
    })

    await loadLinePayload(
      chart,
      ids,
      [ids.map((_, index) => index)]
    )
    chart.updateAttribute("hoverX", [1000, "not-a-dimension"])

    renderWithChart(<Dimensions />, { chart })

    expect(screen.getByText(/more values/)).toBeInTheDocument()
    expect(screen.getAllByTestId("chartPopover-dimension")).toHaveLength(10)
  })
})
