import React from "react"
import { screen, act } from "@testing-library/react"
import "@testing-library/jest-dom"
import { renderWithChart } from "@jest/testUtilities"
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
      testChartOptions: { attributes: { drawerTab: "selectedArea" } },
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
})
