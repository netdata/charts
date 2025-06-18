import React from "react"
import { renderWithChart } from "@/testUtilities"
import gaugeChart from "./index"

const mockGauge = {
  setOptions: jest.fn(),
  setMinValue: jest.fn(),
  set: jest.fn(),
  update: jest.fn(),
  maxValue: 0,
  animationSpeed: 0
}

jest.mock("./library", () => jest.fn(() => mockGauge))

describe("gaugeChart", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("creates chart instance with required methods", () => {
    const { chart } = renderWithChart(<div />, {
      chartType: "gauge"
    })
    
    const instance = gaugeChart(chart.sdk, chart)
    
    expect(instance).toHaveProperty("mount")
    expect(instance).toHaveProperty("unmount")
    expect(instance).toHaveProperty("render")
    expect(instance).toHaveProperty("getMinMax")
    expect(typeof instance.mount).toBe("function")
    expect(typeof instance.unmount).toBe("function")
    expect(typeof instance.render).toBe("function")
    expect(typeof instance.getMinMax).toBe("function")
  })

  it("handles mount attempt", () => {
    const { chart } = renderWithChart(<div />, {
      chartType: "gauge"
    })
    
    const instance = gaugeChart(chart.sdk, chart)
    const element = document.createElement("div")
    element.appendChild(document.createElement("canvas"))
    
    expect(() => instance.mount(element)).toThrow()
  })

  it("unmounts without errors", () => {
    const { chart } = renderWithChart(<div />, {
      chartType: "gauge"
    })
    
    const instance = gaugeChart(chart.sdk, chart)
    
    expect(() => instance.unmount()).not.toThrow()
  })

  it("renders without mounting", () => {
    const { chart } = renderWithChart(<div />, {
      chartType: "gauge",
      attributes: { loaded: true }
    })
    
    const instance = gaugeChart(chart.sdk, chart)
    
    expect(() => instance.render()).not.toThrow()
  })
})