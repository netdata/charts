import React from "react"
import { renderWithChart } from "@jest/testUtilities"
import easyPieChart from "./index"

describe("easyPieChart", () => {
  it("creates chart instance with required methods", () => {
    const { chart } = renderWithChart(<div />, {
      chartType: "easyPie",
    })

    const instance = easyPieChart(chart.sdk, chart)

    expect(instance).toHaveProperty("mount")
    expect(instance).toHaveProperty("unmount")
    expect(instance).toHaveProperty("render")
    expect(typeof instance.mount).toBe("function")
    expect(typeof instance.unmount).toBe("function")
    expect(typeof instance.render).toBe("function")
  })

  it("mounts without errors", () => {
    const { chart } = renderWithChart(<div />, {
      chartType: "easyPie",
    })

    const instance = easyPieChart(chart.sdk, chart)
    const element = document.createElement("div")

    expect(() => instance.mount(element)).not.toThrow()
  })

  it("unmounts without errors", () => {
    const { chart } = renderWithChart(<div />, {
      chartType: "easyPie",
    })

    const instance = easyPieChart(chart.sdk, chart)
    const element = document.createElement("div")

    instance.mount(element)
    expect(() => instance.unmount()).not.toThrow()
  })

  it("renders without errors when loaded", () => {
    const { chart } = renderWithChart(<div />, {
      chartType: "easyPie",
      attributes: { loaded: true },
    })

    chart.getPayload = () => ({ data: [[1, 50, 30]] })
    chart.getClosestRow = () => 0

    const instance = easyPieChart(chart.sdk, chart)
    const element = document.createElement("div")

    instance.mount(element)
    expect(() => instance.render()).not.toThrow()
    instance.unmount()
  })
})
