import { makeTestChart } from "@jest/testUtilities"
import tableChart from "./index"

describe("tableChart", () => {
  it("creates chart instance with required methods", () => {
    const { sdk, chart } = makeTestChart()

    const instance = tableChart(sdk, chart)

    expect(instance).toHaveProperty("mount")
    expect(instance).toHaveProperty("unmount") 
    expect(instance).toHaveProperty("render")
    expect(typeof instance.mount).toBe("function")
    expect(typeof instance.unmount).toBe("function")
    expect(typeof instance.render).toBe("function")
  })

  it("mounts without errors", () => {
    const { sdk, chart } = makeTestChart()

    const instance = tableChart(sdk, chart)
    const element = document.createElement("div")
    
    expect(() => instance.mount(element)).not.toThrow()
  })

  it("renders without errors when chart is not loaded", () => {
    const { sdk, chart } = makeTestChart({
      attributes: { loaded: false }
    })

    const instance = tableChart(sdk, chart)
    
    expect(() => instance.render()).not.toThrow()
  })

  it("renders without errors when chart is loaded", () => {
    const { sdk, chart } = makeTestChart({
      attributes: { loaded: true }
    })

    chart.getPayload = () => ({ data: [[1617946860000, 10, 20]] })
    chart.getClosestRow = () => 1
    
    const instance = tableChart(sdk, chart)
    
    expect(() => instance.render()).not.toThrow()
  })

  it("handles hoverX attribute when rendering", () => {
    const { sdk, chart } = makeTestChart({
      attributes: { 
        loaded: true,
        hoverX: [1617946865000]
      }
    })

    chart.getPayload = () => ({ 
      data: [
        [1617946860000, 10],
        [1617946870000, 20]
      ]
    })
    chart.getClosestRow = () => 0
    
    const instance = tableChart(sdk, chart)
    
    expect(() => instance.render()).not.toThrow()
  })

  it("handles empty data gracefully", () => {
    const { sdk, chart } = makeTestChart({
      attributes: { loaded: true }
    })

    chart.getPayload = () => ({ data: [] })

    const instance = tableChart(sdk, chart)
    
    expect(() => instance.render()).not.toThrow()
  })

  it("unmounts without errors", () => {
    const { sdk, chart } = makeTestChart()

    const instance = tableChart(sdk, chart)
    const element = document.createElement("div")
    
    instance.mount(element)
    
    expect(() => instance.unmount()).not.toThrow()
  })
})