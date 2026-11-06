import React from "react"
import { makeHeatmapPayload, renderWithChart } from "@jest/testUtilities"
import getInitialOptions, { updateThemeOptions } from "./getInitialOptions"

describe("getInitialOptions", () => {
  it("returns valid d3pie configuration object", () => {
    const { chart } = renderWithChart(<div />, {
      attributes: {
        chartType: "pie",
      },
    })

    const mockChartUI = {
      getElement: () => ({ clientWidth: 400, clientHeight: 300 }),
      chart,
    }

    const options = getInitialOptions(mockChartUI)

    expect(options).toHaveProperty("header")
    expect(options).toHaveProperty("footer")
    expect(options).toHaveProperty("data")
    expect(options).toHaveProperty("labels")
    expect(options).toHaveProperty("effects")
    expect(options).toHaveProperty("tooltips")
    expect(options).toHaveProperty("misc")
    expect(options).toHaveProperty("callbacks")
    expect(options).toHaveProperty("size")
  })

  it("sets canvas dimensions from element size", () => {
    const { chart } = renderWithChart(<div />, {
      chartType: "pie",
    })

    const mockChartUI = {
      getElement: () => ({ clientWidth: 500, clientHeight: 400 }),
      chart,
    }

    const options = getInitialOptions(mockChartUI)

    expect(options.size.canvasWidth).toBe(500)
    expect(options.size.canvasHeight).toBe(400)
  })

  it("includes custom formatter function", () => {
    const { chart } = renderWithChart(<div />, {
      chartType: "pie",
    })

    const mockChartUI = {
      getElement: () => ({ clientWidth: 400, clientHeight: 300 }),
      chart,
    }

    const options = getInitialOptions(mockChartUI)

    expect(typeof options.labels.formatter).toBe("function")
  })

  it("formats a signed value with its atomic scale", async () => {
    const { chart } = renderWithChart(<div />, {
      chartType: "pie",
    })
    const payload = makeHeatmapPayload(["bytes"], [[-1536]])
    payload.view.chart_type = "pie"
    payload.view.units = "By"
    payload.view.dimensions.units = ["By"]

    chart.doneFetch(payload)
    await new Promise(resolve => setTimeout(resolve, 0))

    const options = getInitialOptions({
      getElement: () => ({ clientWidth: 400, clientHeight: 300 }),
      chart,
    })

    expect(
      options.labels.formatter({
        part: "value",
        realLabel: "bytes",
        id: "bytes",
        value: 1536,
        signedValue: -1536,
      })
    ).toBe("-1.5 KiB")
  })
})

describe("cached classic pie theme options", () => {
  it("refreshes the grouped fill and segment boundaries without replacing data", () => {
    const { chart } = renderWithChart(<div />, {
      attributes: {
        themeD3pieSmallColor: ["#102030", "#c0d0e0"],
        themeD3pieStroke: ["#203040", "#d0e0f0"],
      },
    })
    const chartUI = { chart, getElement: () => ({ clientWidth: 400, clientHeight: 300 }) }
    const options = getInitialOptions(chartUI)
    const content = [{ label: "cpu", value: 10, color: "#3366cc" }]
    options.data.content = content
    chart.updateAttribute("theme", "dark")
    updateThemeOptions(options, chartUI)
    expect(options.data.smallSegmentGrouping.color).toBe("#c0d0e0")
    expect(options.misc.colors.segmentStroke).toBe("#d0e0f0")
    expect(options.data.content).toBe(content)
  })
})
