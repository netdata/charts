import React from "react"
import { makeTestChart, renderWithChart } from "@jest/testUtilities"
import systemLoadLine from "../../../fixtures/systemLoadLine"
import easyPieChart from "./index"

const loadChart = async (attributes = {}) => {
  const { chart } = makeTestChart({ attributes: { chartLibrary: "easypiechart", ...attributes } })
  chart.doneFetch(systemLoadLine[0])
  await new Promise(resolve => setTimeout(resolve, 0))
  return chart
}

const mountOn = chart => {
  const instance = easyPieChart(chart.sdk, chart)
  const element = document.createElement("div")
  instance.mount(element)
  return { instance, element }
}

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

  it("draws the canvas ring in the default flavour", async () => {
    const chart = await loadChart()
    const { instance, element } = mountOn(chart)

    expect(element.querySelector("canvas")).not.toBeNull()
    expect(instance.render()).toBe(true)
    instance.unmount()
  })

  it("draws no canvas in the modern flavour but still renders and reports the range", async () => {
    const chart = await loadChart({ designFlavour: "modern" })
    const yAxisChange = jest.fn()
    chart.on("yAxisChange", yAxisChange)
    const { instance, element } = mountOn(chart)

    expect(element.querySelector("canvas")).toBeNull()
    expect(instance.render()).toBe(true)
    expect(yAxisChange).toHaveBeenCalled()
    instance.unmount()
  })

  it("swaps the canvas when the flavour changes while mounted", async () => {
    const chart = await loadChart()
    const { instance, element } = mountOn(chart)

    chart.updateAttribute("designFlavour", "modern")
    expect(element.querySelector("canvas")).toBeNull()

    chart.updateAttribute("designFlavour", "default")
    expect(element.querySelectorAll("canvas")).toHaveLength(1)

    chart.updateAttribute("designFlavour", "minimal")
    expect(element.querySelectorAll("canvas")).toHaveLength(1)
    instance.unmount()
  })

  it("keeps one canvas across theme changes", async () => {
    const chart = await loadChart()
    const { instance, element } = mountOn(chart)

    chart.updateAttribute("theme", "dark")
    expect(element.querySelectorAll("canvas")).toHaveLength(1)
    instance.unmount()
  })

  it("mounts again after an unmount in the modern flavour", async () => {
    const chart = await loadChart({ designFlavour: "modern" })
    const { instance, element } = mountOn(chart)

    instance.unmount()
    expect(() => instance.mount(element)).not.toThrow()
    expect(instance.render()).toBe(true)
    instance.unmount()
  })
})
