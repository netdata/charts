import React from "react"
import { renderWithChart } from "@jest/testUtilities"
import proceeded from "./proceeded"

const mockDygraph = {
  xAxisRange: () => [1000000, 2000000],
}

jest.mock("./helpers", () => ({
  trigger: jest.fn(),
  getArea: jest.fn(() => ({ from: 50, width: 100 })),
}))

describe("proceeded overlay", () => {
  let chartUI

  beforeEach(() => {
    const { chart } = renderWithChart(<div />, {
      chartType: "line",
      attributes: {
        outOfLimits: false,
        error: false,
      },
    })

    chart.getFirstEntry = jest.fn(() => 1500)

    chartUI = {
      chart,
      getDygraph: () => mockDygraph,
    }

    jest.clearAllMocks()
  })

  it("calculates time range correctly", () => {
    proceeded(chartUI, "test-proceeded")

    expect(chartUI.chart.getFirstEntry).toHaveBeenCalled()
  })

  it("handles outOfLimits state", () => {
    chartUI.chart.getAttribute = jest.fn(() => ({
      outOfLimits: true,
      error: false,
    }))

    expect(() => proceeded(chartUI, "test-proceeded")).not.toThrow()
  })

  it("handles error state", () => {
    chartUI.chart.getAttribute = jest.fn(() => ({
      outOfLimits: false,
      error: true,
    }))

    expect(() => proceeded(chartUI, "test-proceeded")).not.toThrow()
  })

  it("returns early when conditions not met", () => {
    chartUI.chart.getFirstEntry = jest.fn(() => null)
    chartUI.chart.getAttribute = jest.fn(() => ({
      outOfLimits: false,
      error: false,
    }))

    proceeded(chartUI, "test-proceeded")

    expect(chartUI.chart.getFirstEntry).toHaveBeenCalled()
  })
})
