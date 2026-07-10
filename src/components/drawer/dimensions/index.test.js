import React from "react"
import { screen, waitFor } from "@testing-library/react"
import "@testing-library/jest-dom"
import { makeTestChart, renderWithChart } from "@jest/testUtilities"
import systemLoadLine from "../../../../fixtures/systemLoadLine"
import Dimensions from "./index"

describe("Dimensions", () => {
  const mockData = [
    [1617946860000, 25, 50, 75],
    [1617946920000, 30, 55, 70],
    [1617946980000, 20, 45, 80],
    [1617947040000, 35, 60, 65],
  ]

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("renders dimensions table with window period by default", () => {
    const { chart } = renderWithChart(<Dimensions />)

    jest.spyOn(chart, "getPayload").mockReturnValue({ data: mockData })
    jest.spyOn(chart, "getDimensionIds").mockReturnValue(["dim1", "dim2"])

    expect(screen.getByText("Window points")).toBeInTheDocument()
  })

  it("shows selected area header when selectedArea tab is active", () => {
    const { chart } = renderWithChart(<Dimensions />, {
      attributes: { drawer: { tab: "selectedArea" } },
    })

    jest.spyOn(chart, "getPayload").mockReturnValue({ data: mockData })
    jest.spyOn(chart, "getDimensionIds").mockReturnValue(["dim1", "dim2"])

    expect(screen.getByText("Selected area points")).toBeInTheDocument()
  })

  it("renders table with dimension data", () => {
    const { chart } = renderWithChart(<Dimensions />)

    jest.spyOn(chart, "getPayload").mockReturnValue({ data: mockData })
    jest.spyOn(chart, "getDimensionIds").mockReturnValue(["cpu", "memory"])
    jest.spyOn(chart, "getDimensionName").mockImplementation(id => id)

    expect(screen.getByText("Name")).toBeInTheDocument()
    expect(screen.getByText("Min")).toBeInTheDocument()
    expect(screen.getByText("Avg")).toBeInTheDocument()
    expect(screen.getByText("Max")).toBeInTheDocument()
  })

  it("constrains the table viewport for virtualization", () => {
    renderWithChart(<Dimensions />)

    const container = screen.getByTestId("chart-values-table-container")

    expect(container).toHaveAttribute("height", "100%")
    expect(container).toHaveStyle({
      flexDirection: "column",
      minHeight: "0",
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

    expect(header).toHaveTextContent("ValueUnit")
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
