import React from "react"
import { screen } from "@testing-library/react"
import "@testing-library/jest-dom"
import { renderWithChart, makeTestChart } from "@/testUtilities"
import { TableChart } from "./index"

describe("TableChart", () => {
  it("renders table chart container", () => {
    renderWithChart(<TableChart />)
    
    expect(screen.getByTestId("chartContent")).toBeInTheDocument()
  })

  it("renders with column layout", () => {
    renderWithChart(<TableChart />)
    
    const container = screen.getByTestId("chartContent")
    expect(container).toHaveStyle({
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center"
    })
  })

  it("passes additional props to container", () => {
    renderWithChart(
      <TableChart data-custom="value" className="custom-class" />
    )
    
    const container = screen.getByTestId("chartContent")
    expect(container).toHaveAttribute("data-custom", "value")
    expect(container).toHaveClass("custom-class")
  })

  it("renders with dimensions when data is available", () => {
    const { chart } = makeTestChart({
      attributes: {
        dimensionIds: ["cpu.user", "cpu.system"],
        contextScope: ["cpu"],
        tableColumns: ["context", "dimension"],
        tableSortBy: []
      }
    })
    
    chart.getDimensionGroups = jest.fn(() => ["context", "dimension"])
    
    renderWithChart(<TableChart />, { testChartOptions: { chart } })
    
    expect(screen.getByTestId("chartContent")).toBeInTheDocument()
  })

  it("handles search functionality", () => {
    const { chart } = makeTestChart({
      attributes: {
        dimensionIds: ["cpu.user", "memory.used"],
        contextScope: ["cpu", "memory"],
        tableColumns: ["context"],
        searchQuery: ""
      }
    })
    
    chart.getDimensionGroups = jest.fn(() => ["context", "dimension"])
    
    renderWithChart(<TableChart />, { testChartOptions: { chart } })
    
    expect(screen.getByTestId("chartContent")).toBeInTheDocument()
  })

  it("handles empty dimension list", () => {
    const { chart } = makeTestChart({
      attributes: {
        dimensionIds: [],
        contextScope: [],
        tableColumns: [],
        tableSortBy: []
      }
    })
    
    chart.getDimensionGroups = jest.fn(() => [])
    
    renderWithChart(<TableChart />, { testChartOptions: { chart } })
    
    expect(screen.getByTestId("chartContent")).toBeInTheDocument()
  })
})