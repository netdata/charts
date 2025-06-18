import React from "react"
import { renderWithChart } from "@/testUtilities"
import numberChart from "./index"

describe("numberChart", () => {
  it("creates chart instance with required methods", () => {
    const { chart } = renderWithChart(<div />, {
      chartType: "number"
    })
    
    const instance = numberChart(chart.sdk, chart)
    
    expect(instance).toHaveProperty("mount")
    expect(instance).toHaveProperty("unmount")
    expect(instance).toHaveProperty("render")
    expect(typeof instance.mount).toBe("function")
    expect(typeof instance.unmount).toBe("function")
    expect(typeof instance.render).toBe("function")
  })

  it("mounts without errors", () => {
    const { chart } = renderWithChart(<div />, {
      chartType: "number"
    })
    
    const instance = numberChart(chart.sdk, chart)
    const element = document.createElement("div")
    
    expect(() => instance.mount(element)).not.toThrow()
  })

  it("unmounts and cleans up resources", () => {
    const { chart } = renderWithChart(<div />, {
      chartType: "number"
    })
    
    const instance = numberChart(chart.sdk, chart)
    const element = document.createElement("div")
    
    instance.mount(element)
    expect(() => instance.unmount()).not.toThrow()
  })

  it("renders without errors when chart is loaded", () => {
    const { chart } = renderWithChart(<div />, {
      chartType: "number",
      attributes: { loaded: true }
    })
    
    const instance = numberChart(chart.sdk, chart)
    const element = document.createElement("div")
    
    instance.mount(element)
    expect(() => instance.render()).not.toThrow()
    instance.unmount()
  })
})