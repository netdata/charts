import React from "react"
import { renderWithChart } from "@/testUtilities"
import tableChart from "./index"

describe("tableChart", () => {
  it("creates chart instance with required methods", () => {
    const { chart } = renderWithChart(<div />, {
      chartType: "table"
    })
    
    const instance = tableChart(chart.sdk, chart)
    
    expect(instance).toHaveProperty("mount")
    expect(instance).toHaveProperty("unmount")
    expect(instance).toHaveProperty("render")
    expect(typeof instance.mount).toBe("function")
    expect(typeof instance.unmount).toBe("function")
    expect(typeof instance.render).toBe("function")
  })

  it("mounts without errors", () => {
    const { chart } = renderWithChart(<div />, {
      chartType: "table"
    })
    
    const instance = tableChart(chart.sdk, chart)
    const element = document.createElement("div")
    
    expect(() => instance.mount(element)).not.toThrow()
  })

  it("unmounts and cleans up resources", () => {
    const { chart } = renderWithChart(<div />, {
      chartType: "table"
    })
    
    const instance = tableChart(chart.sdk, chart)
    const element = document.createElement("div")
    
    instance.mount(element)
    expect(() => instance.unmount()).not.toThrow()
  })

  it("renders without errors when chart is loaded", () => {
    const { chart } = renderWithChart(<div />, {
      chartType: "table",
      attributes: { loaded: true }
    })
    
    const instance = tableChart(chart.sdk, chart)
    const element = document.createElement("div")
    
    instance.mount(element)
    expect(() => instance.render()).not.toThrow()
    instance.unmount()
  })

  it("handles hoverX attribute changes", () => {
    const { chart } = renderWithChart(<div />, {
      chartType: "table",
      attributes: { loaded: true, hoverX: [1000] }
    })
    
    const instance = tableChart(chart.sdk, chart)
    const element = document.createElement("div")
    
    instance.mount(element)
    expect(() => instance.render()).not.toThrow()
    instance.unmount()
  })

  it("handles attribute changes without errors", () => {
    const { chart } = renderWithChart(<div />, {
      chartType: "table",
      attributes: { loaded: true, min: 0, max: 100 }
    })
    
    chart.getPayload = () => ({ data: [[1, 50, 30]] })
    
    const instance = tableChart(chart.sdk, chart)
    const element = document.createElement("div")
    
    instance.mount(element)
    instance.render()
    
    chart.setAttribute("min", 10)
    chart.setAttribute("max", 200)
    
    expect(() => instance.render()).not.toThrow()
    instance.unmount()
  })
})