import React from "react"
import { screen } from "@testing-library/react"
import "@testing-library/jest-dom"
import { renderWithChart } from "@jest/testUtilities"
import ChartType from "./chartType"

describe("settings chart type", () => {
  it("shows the chart type when its internal renderer is not dygraph", () => {
    renderWithChart(<ChartType />, {
      rendererPolicy: () => "number",
      attributes: { chartType: "line" },
    })

    expect(screen.getByText("Line")).toBeInTheDocument()
    expect(screen.queryByText("Value")).not.toBeInTheDocument()
  })
})
