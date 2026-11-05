import React from "react"
import { screen, waitFor } from "@testing-library/react"
import "@testing-library/jest-dom"
import { makeTestChart, renderWithChart } from "@jest/testUtilities"
import systemLoadLine from "../../../../fixtures/systemLoadLine"
import Dimensions from "./index"

describe("Dimensions", () => {
  it("renders dimensions table with window period by default", () => {
    renderWithChart(<Dimensions />)

    expect(screen.getByText("Window points")).toBeInTheDocument()
  })

  it("shows selected area header when selectedArea tab is active", () => {
    renderWithChart(<Dimensions />, {
      attributes: { drawer: { tab: "selectedArea" } },
    })

    expect(screen.getByText("Selected area points")).toBeInTheDocument()
  })

  it("renders table with dimension data", () => {
    renderWithChart(<Dimensions />)

    expect(screen.getByText("Name")).toBeInTheDocument()
    expect(screen.getByText("Min")).toBeInTheDocument()
    expect(screen.getByText("Avg")).toBeInTheDocument()
    expect(screen.getByText("Max")).toBeInTheDocument()
  })

  it("constrains the table viewport for virtualization", () => {
    renderWithChart(<Dimensions />)

    const container = screen.getByTestId("chart-values-table-container")

    expect(container).toHaveStyle({
      flexDirection: "column",
      height: "100%",
      minHeight: "0px",
      overflow: "hidden",
    })
  })

  it("searches displayed dimension names without matching numeric values", async () => {
    const { chart } = makeTestChart()
    chart.doneFetch(systemLoadLine[0])
    await new Promise(resolve => setTimeout(resolve, 0))
    const { user } = renderWithChart(<Dimensions />, { chart })
    const search = screen.getByPlaceholderText("Search")
    const header = screen.getByTestId("netdata-table").querySelector('[data-index="0"]')

    expect(header).toHaveTextContent("Value")
    expect(header).not.toHaveTextContent("Unit")
    expect(header).not.toHaveTextContent("load")

    await user.type(search, "load5")

    await waitFor(() => expect(screen.queryAllByTestId("netdata-table-row")).toHaveLength(1))
    expect(screen.queryByText("load1")).not.toBeInTheDocument()
    expect(screen.getByText("load5")).toBeInTheDocument()
    expect(screen.queryByText("load15")).not.toBeInTheDocument()
    expect(chart.getAttribute("drawer.valuesSearch")).toBe("load5")

    await user.clear(search)
    await user.type(search, "20.12")

    await waitFor(() =>
      expect(screen.queryAllByTestId("netdata-table-row")).toHaveLength(0)
    )
    expect(screen.queryByText("load1")).not.toBeInTheDocument()
    expect(screen.queryByText("load5")).not.toBeInTheDocument()
    expect(screen.queryByText("load15")).not.toBeInTheDocument()
  })
})
