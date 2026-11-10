import React from "react"
import { screen } from "@testing-library/react"
import { renderWithChart } from "@jest/testUtilities"
import HeatmapColorsLegend from "./heatmapColors"

describe("HeatmapColorsLegend", () => {
  it("names a log colour scale next to the maximum", () => {
    renderWithChart(<HeatmapColorsLegend />, {
      attributes: { max: 100, heatmapColorScale: "log" },
    })

    expect(screen.getByTestId("heatmap-legend").textContent).toContain("(log scale)")
  })

  it("shows no scale note for a linear colour scale", () => {
    renderWithChart(<HeatmapColorsLegend />, { attributes: { max: 100 } })

    expect(screen.getByTestId("heatmap-legend").textContent).not.toContain("log scale")
    expect(screen.getByTestId("heatmap-legend-scale")).toBeTruthy()
  })
})
