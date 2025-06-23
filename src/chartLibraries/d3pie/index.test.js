import { makeTestChart } from "@jest/testUtilities"
import d3pieChart from "./index"

describe("d3pieChart", () => {
  it("creates chart instance with required methods", () => {
    const { sdk, chart } = makeTestChart()

    const instance = d3pieChart(sdk, chart)

    expect(instance).toHaveProperty("mount")
    expect(instance).toHaveProperty("unmount")
    expect(instance).toHaveProperty("render")
    expect(typeof instance.mount).toBe("function")
    expect(typeof instance.unmount).toBe("function")
    expect(typeof instance.render).toBe("function")
  })

  it("handles mount attempt with DOM limitations", () => {
    const { sdk, chart } = makeTestChart()

    const instance = d3pieChart(sdk, chart)
    const element = document.createElement("div")

    expect(() => instance.mount(element)).toThrow()
  })

  it("unmounts without errors when not mounted", () => {
    const { sdk, chart } = makeTestChart()

    const instance = d3pieChart(sdk, chart)

    expect(() => instance.unmount()).not.toThrow()
  })

  it("renders without errors when not mounted", () => {
    const { sdk, chart } = makeTestChart({
      attributes: { loaded: true },
    })

    chart.getPayload = () => ({ data: [[1, 50, 30]] })
    chart.getVisibleDimensionIds = () => ["cpu", "memory"]
    chart.getDimensionValue = () => 25
    chart.selectDimensionColor = () => "#ff0000"
    chart.getClosestRow = () => 0

    const instance = d3pieChart(sdk, chart)

    expect(() => instance.render()).not.toThrow()
  })
})
