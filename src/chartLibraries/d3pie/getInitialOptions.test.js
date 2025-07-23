import React from "react"
import { renderWithChart } from "@jest/testUtilities"
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
})
