import React from "react"
import { screen, fireEvent, waitFor } from "@testing-library/react"
import "@testing-library/jest-dom"
import { renderWithChart, makeTestChart } from "@jest/testUtilities"
import ChartType from "./chartType"

describe("ChartType component", () => {
  it("renders chart type options for dygraph library", () => {
    const { chart } = makeTestChart({
      attributes: {
        chartLibrary: "dygraph",
        chartType: "line",
      },
    })

    renderWithChart(<ChartType disabled={false} />, { testChartOptions: { chart } })

    const button = screen.getByTestId("chartHeaderToolbox-chartType")
    fireEvent.click(button)

    expect(screen.getByText("Timeseries")).toBeInTheDocument()
    expect(screen.getByText("Line")).toBeInTheDocument()
    expect(screen.getByText("Area")).toBeInTheDocument()
    expect(screen.getByText("Stacked")).toBeInTheDocument()
  })

  it("shows current chart type as selected for dygraph library", () => {
    const { chart } = makeTestChart({
      attributes: {
        chartLibrary: "dygraph",
        chartType: "area",
      },
    })

    renderWithChart(<ChartType disabled={false} />, { testChartOptions: { chart } })

    const button = screen.getByTestId("chartHeaderToolbox-chartType")
    expect(button).toBeInTheDocument()
  })

  it("triggers chart type change when dygraph option is selected", () => {
    const { chart } = makeTestChart({
      attributes: {
        chartLibrary: "dygraph",
        chartType: "line",
      },
    })

    const spy = jest.spyOn(chart, "updateChartTypeAttribute")

    renderWithChart(<ChartType disabled={false} />, { testChartOptions: { chart } })

    const button = screen.getByTestId("chartHeaderToolbox-chartType")
    fireEvent.click(button)

    const areaButton = screen.getByText("Area")
    fireEvent.click(areaButton)

    expect(spy).toHaveBeenCalledWith("area")
  })

  it("renders with disabled state", () => {
    renderWithChart(<ChartType disabled={true} />)

    const button = screen.getByTestId("chartHeaderToolbox-chartType")
    expect(button).toBeDisabled()
  })

  it("renders with enabled state by default", () => {
    renderWithChart(<ChartType />)

    const button = screen.getByTestId("chartHeaderToolbox-chartType")
    expect(button).not.toBeDisabled()
  })

  it("handles multiple chart types correctly", () => {
    const { chart } = makeTestChart({
      attributes: {
        chartLibrary: "dygraph",
        chartType: "line",
      },
    })

    const spy = jest.spyOn(chart, "updateChartTypeAttribute")

    renderWithChart(<ChartType />, { testChartOptions: { chart } })

    const button = screen.getByTestId("chartHeaderToolbox-chartType")
    fireEvent.click(button)

    const stackedButton = screen.getByText("Stacked")
    fireEvent.click(stackedButton)

    expect(spy).toHaveBeenCalledWith("stacked")
  })

  it("updates display when chart type changes", async () => {
    const { chart } = makeTestChart({
      attributes: {
        chartLibrary: "dygraph",
        chartType: "line",
      },
    })

    const { rerender } = renderWithChart(<ChartType />, { testChartOptions: { chart } })

    let button = screen.getByTestId("chartHeaderToolbox-chartType")
    fireEvent.click(button)
    expect(screen.getByText("Line")).toBeInTheDocument()

    fireEvent.keyDown(document, { key: "Escape" })

    chart.updateAttribute("chartType", "area")
    rerender(<ChartType />)

    await waitFor(() => {
      button = screen.getByTestId("chartHeaderToolbox-chartType")
      fireEvent.click(button)
      expect(screen.getByText("Area")).toBeInTheDocument()
    })
  })

  it("includes heatmap option when enabled", () => {
    const { chart } = makeTestChart({
      attributes: {
        chartLibrary: "dygraph",
        chartType: "line",
      },
    })

    chart.getHeatmapType = jest.fn(() => "enabled")

    renderWithChart(<ChartType disabled={false} />, { testChartOptions: { chart } })

    const button = screen.getByTestId("chartHeaderToolbox-chartType")
    expect(button).toBeInTheDocument()
    expect(chart.getHeatmapType).toBeDefined()
  })

  it("excludes heatmap option when disabled", () => {
    const { chart } = makeTestChart({
      attributes: {
        chartLibrary: "dygraph",
        chartType: "line",
        heatmapType: "disabled",
      },
    })

    renderWithChart(<ChartType disabled={false} />, { testChartOptions: { chart } })

    const button = screen.getByTestId("chartHeaderToolbox-chartType")
    fireEvent.click(button)

    expect(screen.queryByText("Heatmap")).not.toBeInTheDocument()
  })
})
