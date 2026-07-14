import React from "react"
import { screen } from "@testing-library/react"
import "@testing-library/jest-dom"
import { renderWithChart, makeTestChart } from "@jest/testUtilities"
import ChartType from "./chartType"

describe("settings ChartType", () => {
  it("shows the chart type as the selected value for the dygraph renderer", () => {
    const { chart } = makeTestChart({
      attributes: { chartLibrary: "dygraph", chartType: "area" },
    })

    renderWithChart(<ChartType />, { chart })

    expect(screen.getByText("Area")).toBeInTheDocument()
  })

  it("resolves to the chart type when the time-series renderer is non-dygraph", () => {
    const { chart } = makeTestChart({
      attributes: { chartLibrariesByType: { line: "uplot" } },
    })
    chart.updateAttributes({ chartLibrary: "uplot", chartType: "line" })

    renderWithChart(<ChartType />, { chart })

    expect(screen.getByText("Line")).toBeInTheDocument()
  })
})
