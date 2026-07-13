import React from "react"
import { makeHeatmapPayload, renderWithChart } from "@jest/testUtilities"
import getInitialOptions from "./getInitialOptions"

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
