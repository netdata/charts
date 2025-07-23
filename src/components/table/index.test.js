import React from "react"
import { screen } from "@testing-library/react"
import "@testing-library/jest-dom"
import { renderWithChart, makeTestChart } from "@jest/testUtilities"
import { TableChart } from "./index"
import tableFixture from "../../../fixtures/table"

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
      justifyContent: "center",
    })
  })

  it("passes additional props to container", () => {
    renderWithChart(<TableChart data-custom="value" className="custom-class" />)

    const container = screen.getByTestId("chartContent")
    expect(container).toHaveAttribute("data-custom", "value")
    expect(container).toHaveClass("custom-class")
  })

  it.skip("renders table with actual dimension data and values", async () => {
    const { container } = renderWithChart(<TableChart />, {
      mockData: tableFixture[0],
      attributes: {
        contextScope: ["disk.io", "disk.ops", "disk.await", "disk.util"],
        chartLibrary: "table",
        groupBy: ["dimension", "label", "node", "context"],
        groupByLabel: ["device"],
        tableColumns: ["context", "dimension"],
      },
    })

    await screen.getByText("nd-child-unpaid01")
    expect(container).toMatchSnapshot()
  })

  it.skip("displays multi-context table with grouped data", () => {
    renderWithChart(<TableChart />, {
      mockData: tableFixture[0],
      attributes: {
        contextScope: ["disk.io", "disk.ops", "disk.await", "disk.util"],
        tableColumns: ["context", "dimension"],
        tableSortBy: [],
        searchQuery: "",
        chartLibrary: "table",
        groupBy: ["label", "dimension", "context", "node"],
        groupByLabel: ["device"],
      },
    })

    expect(screen.getByText("sda")).toBeInTheDocument()
    expect(screen.getByText("dm-0")).toBeInTheDocument()
    expect(screen.getByText("reads")).toBeInTheDocument()
    expect(screen.getByText("writes")).toBeInTheDocument()
  })

  it("handles empty dimension list", () => {
    const { chart } = makeTestChart({
      attributes: {
        dimensionIds: [],
        contextScope: [],
        tableColumns: [],
        tableSortBy: [],
      },
    })

    chart.getDimensionGroups = jest.fn(() => [])

    renderWithChart(<TableChart />, { chart })

    expect(screen.getByTestId("chartContent")).toBeInTheDocument()
  })
})
