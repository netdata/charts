import React from "react"
import { renderWithChart } from "@/testUtilities"
import highlight from "./highlight"

const mockDygraph = {
  getArea: () => ({ h: 100 }),
  hidden_ctx_: {
    save: jest.fn(),
    beginPath: jest.fn(),
    rect: jest.fn(),
    fill: jest.fn(),
    setLineDash: jest.fn(),
    stroke: jest.fn(),
    closePath: jest.fn(),
    restore: jest.fn(),
    fillStyle: "",
    lineWidth: 0,
    strokeStyle: ""
  }
}

jest.mock("./helpers", () => ({
  trigger: jest.fn(),
  getArea: jest.fn(() => ({ from: 50, width: 100 }))
}))

describe("highlight overlay", () => {
  let chartUI

  beforeEach(() => {
    const { chart } = renderWithChart(<div />, {
      chartType: "line"
    })
    
    chart.getAttribute = () => ({
      "test-highlight": {
        range: [1000, 2000]
      }
    })
    
    chartUI = {
      chart,
      getDygraph: () => mockDygraph
    }
    
    jest.clearAllMocks()
  })

  it("renders highlight overlay when range is provided", () => {
    highlight(chartUI, "test-highlight")
    
    expect(mockDygraph.hidden_ctx_.save).toHaveBeenCalled()
    expect(mockDygraph.hidden_ctx_.beginPath).toHaveBeenCalled()
    expect(mockDygraph.hidden_ctx_.rect).toHaveBeenCalled()
    expect(mockDygraph.hidden_ctx_.fill).toHaveBeenCalled()
    expect(mockDygraph.hidden_ctx_.restore).toHaveBeenCalled()
  })

  it("applies correct styling", () => {
    highlight(chartUI, "test-highlight")
    
    expect(mockDygraph.hidden_ctx_.fillStyle).toBe("rgba(207, 213, 218, 0.12)")
    expect(mockDygraph.hidden_ctx_.lineWidth).toBe(1)
    expect(mockDygraph.hidden_ctx_.strokeStyle).toBe("#CFD5DA")
  })

  it("handles missing range gracefully", () => {
    chartUI.chart.getAttribute = () => ({
      "test-highlight": {}
    })
    
    highlight(chartUI, "test-highlight")
    
    expect(mockDygraph.hidden_ctx_.save).not.toHaveBeenCalled()
  })
})