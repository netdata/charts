import { makeTestChart } from "@/testUtilities"
import barsChart from "./index"

describe("barsChart", () => {
  it("creates chart instance with required methods", () => {
    const { sdk, chart } = makeTestChart()
    
    const instance = barsChart(sdk, chart)
    
    expect(instance).toHaveProperty("mount")
    expect(instance).toHaveProperty("unmount") 
    expect(instance).toHaveProperty("render")
    expect(typeof instance.mount).toBe("function")
    expect(typeof instance.unmount).toBe("function")
    expect(typeof instance.render).toBe("function")
  })

  it("mounts and unmounts without errors", () => {
    const { sdk, chart } = makeTestChart()
    
    const instance = barsChart(sdk, chart)
    const element = document.createElement("div")
    
    expect(() => instance.mount(element)).not.toThrow()
    expect(() => instance.unmount()).not.toThrow()
  })

  it("renders without errors when chart is loaded", () => {
    const { sdk, chart } = makeTestChart({
      attributes: { loaded: true }
    })
    
    const instance = barsChart(sdk, chart)
    const element = document.createElement("div")
    
    instance.mount(element)
    expect(() => instance.render()).not.toThrow()
    instance.unmount()
  })
})