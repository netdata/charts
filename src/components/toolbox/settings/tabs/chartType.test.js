import { screen } from "@testing-library/react"
import "@testing-library/jest-dom"
import { renderWithChart, makeTestChart } from "@jest/testUtilities"
import ChartType from "./chartType"

describe("settings ChartType", () => {
  it("uses quiet selection for the current chart type", async () => {
    const { user } = renderWithChart(<ChartType />, {
      attributes: { chartLibrary: "dygraph", chartType: "area" },
    })

    await user.click(screen.getByRole("combobox"))

    const selected = screen.getByRole("option", { name: "Area", selected: true })
    expect(getComputedStyle(selected).boxShadow).toBe("none")
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
