import hoverX from "./hoverX"
import { makeTestChart } from "@jest/testUtilities"

describe("hoverX", () => {
  let chart, chartUI, hoverXInstance

  beforeEach(() => {
    const testChart = makeTestChart({
      attributes: {
        chartType: "line",
        overlays: {},
      },
    })

    chart = testChart.chart
    chart.trigger = jest.fn()
    chart.updateAttribute = jest.fn()

    chartUI = {
      on: jest.fn().mockReturnThis(),
      off: jest.fn().mockReturnThis(),
      getDygraph: jest.fn(() => ({
        getArea: jest.fn(() => ({ h: 200 })),
        findStackedPoint: jest.fn(() => ({
          point: { canvasy: 100 },
          row: 0,
          seriesName: "test",
        })),
        findClosestPoint: jest.fn(() => ({ seriesName: "test" })),
        getPropertiesForSeries: jest.fn(() => ({ column: 1 })),
        toDomXCoord: jest.fn(x => x),
      })),
      sdk: {
        trigger: jest.fn(),
      },
      chart,
    }

    hoverXInstance = hoverX(chartUI)
  })

  it("creates hoverX handler", () => {
    expect(typeof hoverX).toBe("function")
    expect(hoverXInstance).toHaveProperty("toggle")
    expect(hoverXInstance).toHaveProperty("destroy")
  })

  it("registers event listeners when toggled on", () => {
    hoverXInstance.toggle(true)

    expect(chartUI.on).toHaveBeenCalledWith("highlightCallback", expect.any(Function))
    expect(chartUI.on).toHaveBeenCalledWith("mousemove", expect.any(Function))
    expect(chartUI.on).toHaveBeenCalledWith("mouseout", expect.any(Function))
    expect(chartUI.on).toHaveBeenCalledWith("click", expect.any(Function))
  })

  it("handles highlight event with valid data", () => {
    hoverXInstance.toggle(true)

    const highlightHandler = chartUI.on.mock.calls.find(call => call[0] === "highlightCallback")[1]

    const mockEvent = {
      offsetX: 100,
      offsetY: 100,
      stopImmediatePropagation: jest.fn(),
      preventDefault: jest.fn(),
      target: { getBoundingClientRect: () => ({ left: 0, top: 0 }) },
    }
    const xValue = 1640995200000
    const points = [
      {
        xval: xValue,
        yval: 100,
        idx: 0,
        name: "test",
      },
    ]

    chart.getPayloadDimensionIds = jest.fn(() => ["test"])

    highlightHandler(mockEvent, xValue, points)

    expect(chartUI.sdk.trigger).toHaveBeenCalledWith("highlightHover", chart, xValue, "test")
    expect(chart.trigger).toHaveBeenCalledWith("highlightHover", xValue, "test")
  })

  it("handles mouseout event", () => {
    hoverXInstance.toggle(true)

    const mouseoutHandler = chartUI.on.mock.calls.find(call => call[0] === "mouseout")[1]

    mouseoutHandler()

    expect(chartUI.sdk.trigger).toHaveBeenCalledWith("highlightBlur", chart)
    expect(chart.trigger).toHaveBeenCalledWith("highlightBlur")
  })

  it("handles annotations area hover", () => {
    hoverXInstance.toggle(true)

    const highlightHandler = chartUI.on.mock.calls.find(call => call[0] === "highlightCallback")[1]

    const mockEvent = {
      offsetX: 100,
      offsetY: 195,
      target: { getBoundingClientRect: () => ({ left: 0, top: 0 }) },
    }

    highlightHandler(mockEvent, 1640995200000, [])

    expect(chartUI.sdk.trigger).not.toHaveBeenCalled()
    expect(chart.trigger).not.toHaveBeenCalled()
  })

  it("handles anomaly rate area hover", () => {
    hoverXInstance.toggle(true)

    const highlightHandler = chartUI.on.mock.calls.find(call => call[0] === "highlightCallback")[1]

    const mockEvent = {
      offsetX: 100,
      offsetY: 10,
      target: { getBoundingClientRect: () => ({ left: 0, top: 0 }) },
    }

    highlightHandler(mockEvent, 1640995200000, [])

    expect(chartUI.sdk.trigger).not.toHaveBeenCalled()
    expect(chart.trigger).not.toHaveBeenCalled()
  })

  it("handles stacked chart type", () => {
    chart.getAttribute = jest.fn(key => {
      if (key === "chartType") return "stacked"
      if (key === "overlays") return {}
      return null
    })
    hoverXInstance.toggle(true)

    const highlightHandler = chartUI.on.mock.calls.find(call => call[0] === "highlightCallback")[1]

    const mockEvent = {
      offsetX: 100,
      offsetY: 100,
      target: { getBoundingClientRect: () => ({ left: 0, top: 0 }) },
    }
    const points = [
      { yval: 10, idx: 0, name: "cpu" },
      { yval: 20, idx: 0, name: "memory" },
    ]

    chart.getPayloadDimensionIds = jest.fn(() => ["cpu", "memory"])

    highlightHandler(mockEvent, 1640995200000, points)

    expect(chartUI.sdk.trigger).toHaveBeenCalled()
  })

  it("triggers SDK hover event", () => {
    hoverXInstance.toggle(true)

    const highlightHandler = chartUI.on.mock.calls.find(call => call[0] === "highlightCallback")[1]

    const mockEvent = {
      offsetX: 100,
      offsetY: 100,
      target: { getBoundingClientRect: () => ({ left: 0, top: 0 }) },
    }

    chart.getPayloadDimensionIds = jest.fn(() => ["test"])

    highlightHandler(mockEvent, 1640995200000, [])

    expect(chartUI.sdk.trigger).toHaveBeenCalledWith("highlightHover", chart, 1640995200000, "test")
  })

  it("handles destroy method", () => {
    hoverXInstance.toggle(true)
    hoverXInstance.destroy()

    expect(chartUI.off).toHaveBeenCalledWith("highlightCallback", expect.any(Function))
    expect(chartUI.off).toHaveBeenCalledWith("mousemove", expect.any(Function))
    expect(chartUI.off).toHaveBeenCalledWith("mouseout", expect.any(Function))
    expect(chartUI.off).toHaveBeenCalledWith("click", expect.any(Function))
  })

  it("deduplicates repeated hover events at same position", () => {
    hoverXInstance.toggle(true)

    const highlightHandler = chartUI.on.mock.calls.find(call => call[0] === "highlightCallback")[1]

    const mockEvent = {
      offsetX: 100,
      offsetY: 100,
      stopImmediatePropagation: jest.fn(),
      preventDefault: jest.fn(),
      target: { getBoundingClientRect: () => ({ left: 0, top: 0 }) },
    }

    const xValue = 1640995200000
    const points = [{ idx: 0, name: "test" }]

    chart.getPayloadDimensionIds = jest.fn(() => ["test"])

    highlightHandler(mockEvent, xValue, points)
    expect(chartUI.sdk.trigger).toHaveBeenCalledTimes(1)

    highlightHandler(mockEvent, xValue, points)
    expect(chartUI.sdk.trigger).toHaveBeenCalledTimes(1)

    highlightHandler(mockEvent, xValue + 60000, points)
    expect(chartUI.sdk.trigger).toHaveBeenCalledTimes(2)
  })

  it("handles click event for annotations", () => {
    hoverXInstance.toggle(true)

    const clickHandler = chartUI.on.mock.calls.find(call => call[0] === "click")[1]

    const mockEvent = {
      offsetX: 100,
      offsetY: 100,
      target: { getBoundingClientRect: () => ({ left: 0, top: 0 }) },
    }

    chart.getPayloadDimensionIds = jest.fn(() => ["test"])

    clickHandler(mockEvent, 1640995200000, [])

    expect(chart.updateAttribute).toHaveBeenCalledWith(
      "draftAnnotation",
      expect.objectContaining({
        timestamp: 1640995200,
        status: "draft",
      })
    )
    expect(chart.trigger).toHaveBeenCalledWith("annotationCreate", 1640995200)
    expect(chartUI.sdk.trigger).toHaveBeenCalledWith(
      "annotationCreate",
      expect.objectContaining({
        trigger: chart.trigger,
        getAttribute: chart.getAttribute,
      }),
      1640995200
    )
  })

  it("skips annotation creation near existing annotations", () => {
    chart.getAttribute = jest.fn(key => {
      if (key === "overlays") return { 1: { type: "annotation", timestamp: 1640995200 } }
      return null
    })

    chartUI.getDygraph = jest.fn(() => ({
      getArea: jest.fn(() => ({ h: 200 })),
      findClosestPoint: jest.fn(() => ({ seriesName: "test" })),
      getPropertiesForSeries: jest.fn(() => ({ column: 1 })),
      toDomXCoord: jest.fn(timestamp => {
        if (timestamp === 1640995200 * 1000) return 105
        return timestamp
      }),
    }))

    hoverXInstance.toggle(true)

    const clickHandler = chartUI.on.mock.calls.find(call => call[0] === "click")[1]

    const mockEvent = {
      clientX: 105,
      clientY: 100,
      target: { getBoundingClientRect: () => ({ left: 0, top: 0 }) },
    }

    chart.getPayloadDimensionIds = jest.fn(() => ["test"])

    clickHandler(mockEvent, 1640995200000, [])

    expect(chart.updateAttribute).not.toHaveBeenCalledWith("draftAnnotation", expect.anything())
  })

  it("handles mousemove event", () => {
    hoverXInstance.toggle(true)

    const highlightHandler = chartUI.on.mock.calls.find(call => call[0] === "highlightCallback")[1]
    const mousemoveHandler = chartUI.on.mock.calls.find(call => call[0] === "mousemove")[1]

    chart.getPayloadDimensionIds = jest.fn(() => ["test"])

    highlightHandler(
      {
        offsetX: 100,
        offsetY: 100,
        target: { getBoundingClientRect: () => ({ left: 0, top: 0 }) },
      },
      1640995200000,
      []
    )

    const mockEvent = {
      offsetX: 200,
      offsetY: 150,
      target: { getBoundingClientRect: () => ({ left: 0, top: 0 }) },
    }

    mousemoveHandler(mockEvent)

    expect(chartUI.sdk.trigger).toHaveBeenCalledWith("highlightHover", chart, 1640995200000, "test")
  })
})
