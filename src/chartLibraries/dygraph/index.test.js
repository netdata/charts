import { loadHeatmapPayload, makeTestChart } from "@jest/testUtilities"
import dygraphChart from "./index"

const mockDygraph = {
  updateOptions: jest.fn(),
  destroy: jest.fn(),
  resize: jest.fn(),
  setSelection: jest.fn(),
  xAxisRange: jest.fn(() => [1617946860000, 1617947750000]),
  getArea: jest.fn(() => ({ w: 800, h: 400 })),
  toDomXCoord: jest.fn(x => x),
  xAxisExtremes: jest.fn(() => [1617946860000, 1617947750000]),
  renderGraph_: jest.fn(x => x),
}

jest.mock("dygraphs", () => jest.fn(() => mockDygraph))

describe("dygraphChart", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("creates chart instance with required methods", () => {
    const { sdk, chart } = makeTestChart()

    const instance = dygraphChart(sdk, chart)

    expect(instance).toHaveProperty("mount")
    expect(instance).toHaveProperty("unmount")
    expect(instance).toHaveProperty("render")
    expect(instance).toHaveProperty("getDygraph")
    expect(instance).toHaveProperty("getChartWidth")
    expect(instance).toHaveProperty("getChartHeight")
    expect(typeof instance.mount).toBe("function")
    expect(typeof instance.unmount).toBe("function")
    expect(typeof instance.render).toBe("function")
  })

  it("mounts and creates dygraph instance", () => {
    const { sdk, chart } = makeTestChart({
      attributes: {
        theme: "dark",
        outOfLimits: false,
      },
    })

    chart.getPayload = () => ({
      data: [[1617946860000, 10, 20]],
      labels: ["time", "load1", "load5"],
    })
    chart.getDateWindow = () => [1617946860000, 1617947750000]
    chart.formatXAxis = x => x.toString()
    chart.getThemeAttribute = () => "#333"
    chart.getUnitSign = () => ""

    const instance = dygraphChart(sdk, chart)
    const element = document.createElement("div")

    expect(() => instance.mount(element)).not.toThrow()

    const Dygraph = require("dygraphs")
    expect(Dygraph).toHaveBeenCalledWith(element, expect.any(Array), expect.any(Object))
    expect(element.classList.contains("dark")).toBe(true)
  })

  it("handles empty data by creating placeholder chart", () => {
    const { sdk, chart } = makeTestChart({
      attributes: {
        theme: "light",
        outOfLimits: true,
      },
    })

    chart.getPayload = () => ({
      data: [],
      labels: [],
    })
    chart.getDateWindow = () => [1617946860000, 1617947750000]
    chart.formatXAxis = x => x.toString()
    chart.getThemeAttribute = () => "#333"
    chart.getUnitSign = () => ""

    const instance = dygraphChart(sdk, chart)
    const element = document.createElement("div")

    instance.mount(element)

    const Dygraph = require("dygraphs")
    expect(Dygraph).toHaveBeenCalledWith(
      element,
      [[0]],
      expect.objectContaining({
        labels: ["X"],
      })
    )
  })

  it("prevents multiple mounts on same element", () => {
    const { sdk, chart } = makeTestChart({
      attributes: { theme: "dark" },
    })

    chart.getPayload = () => ({
      data: [[1617946860000, 10]],
      labels: ["time", "value"],
    })
    chart.getDateWindow = () => [1617946860000, 1617947750000]
    chart.formatXAxis = x => x.toString()
    chart.getThemeAttribute = () => "#333"
    chart.getUnitSign = () => ""

    const instance = dygraphChart(sdk, chart)
    const element = document.createElement("div")

    instance.mount(element)
    const Dygraph = require("dygraphs")
    const firstCallCount = Dygraph.mock.calls.length

    instance.mount(element)
    expect(Dygraph.mock.calls.length).toBe(firstCallCount)
  })

  it("renders without errors when not mounted", () => {
    const { sdk, chart } = makeTestChart()

    const instance = dygraphChart(sdk, chart)

    expect(() => instance.render()).not.toThrow()
  })

  it("blocks a nested option redraw while preserving the outer redraw", () => {
    const { sdk, chart } = makeTestChart({
      attributes: {
        highlighting: false,
        panning: false,
        processing: false,
      },
    })

    chart.getPayload = () => ({
      data: [[1617946860000, 10]],
      labels: ["time", "value"],
    })
    chart.getDateWindow = () => [1617946860000, 1617947750000]
    chart.formatXAxis = x => x.toString()
    chart.getThemeAttribute = () => "#333"
    chart.getUnitSign = () => ""

    const instance = dygraphChart(sdk, chart)
    instance.mount(document.createElement("div"))
    mockDygraph.updateOptions.mockClear()
    mockDygraph.updateOptions.mockImplementationOnce(() => {
      chart.updateAttribute("unitsConversionPrefix", ["Ki"])
    })

    instance.render()

    expect(mockDygraph.updateOptions).toHaveBeenCalledTimes(2)
    expect(mockDygraph.updateOptions.mock.calls[0][1]).toBe(false)
    expect(mockDygraph.updateOptions.mock.calls[1][1]).toBe(true)
  })

  it("skips render when highlighting, panning, or processing", () => {
    const { sdk, chart } = makeTestChart({
      attributes: {
        highlighting: true,
        panning: false,
        processing: false,
      },
    })

    chart.getPayload = () => ({
      data: [[1617946860000, 10]],
      labels: ["time", "value"],
    })
    chart.getDateWindow = () => [1617946860000, 1617947750000]
    chart.formatXAxis = x => x.toString()
    chart.getThemeAttribute = () => "#333"
    chart.getUnitSign = () => ""

    const instance = dygraphChart(sdk, chart)
    const element = document.createElement("div")

    instance.mount(element)
    instance.render()

    expect(mockDygraph.updateOptions).not.toHaveBeenCalled()
  })

  it("unmounts without errors", () => {
    const { sdk, chart } = makeTestChart()

    chart.getPayload = () => ({
      data: [[1617946860000, 10]],
      labels: ["time", "value"],
    })
    chart.getDateWindow = () => [1617946860000, 1617947750000]
    chart.formatXAxis = x => x.toString()
    chart.getThemeAttribute = () => "#333"
    chart.getUnitSign = () => ""

    const instance = dygraphChart(sdk, chart)
    const element = document.createElement("div")

    instance.mount(element)

    expect(() => instance.unmount()).not.toThrow()
    expect(mockDygraph.destroy).toHaveBeenCalled()
  })

  it("returns dygraph instance from getDygraph", () => {
    const { sdk, chart } = makeTestChart()

    chart.getPayload = () => ({
      data: [[1617946860000, 10]],
      labels: ["time", "value"],
    })
    chart.getDateWindow = () => [1617946860000, 1617947750000]
    chart.formatXAxis = x => x.toString()
    chart.getThemeAttribute = () => "#333"
    chart.getUnitSign = () => ""

    const instance = dygraphChart(sdk, chart)
    const element = document.createElement("div")

    expect(instance.getDygraph()).toBeNull()

    instance.mount(element)

    expect(instance.getDygraph()).toBe(mockDygraph)
  })

  it("calculates chart dimensions from dygraph when mounted", () => {
    const { sdk, chart } = makeTestChart()

    chart.getPayload = () => ({
      data: [[1617946860000, 10]],
      labels: ["time", "value"],
    })
    chart.getDateWindow = () => [1617946860000, 1617947750000]
    chart.formatXAxis = x => x.toString()
    chart.getThemeAttribute = () => "#333"
    chart.getUnitSign = () => ""

    const instance = dygraphChart(sdk, chart)
    const element = document.createElement("div")

    instance.mount(element)

    expect(instance.getChartWidth()).toBe(800)
    expect(instance.getChartHeight()).toBe(400)
  })

  it("enables dygraph stepPlot when the stepPlot attribute is set", () => {
    const { sdk, chart } = makeTestChart({
      attributes: { theme: "dark", chartType: "line", stepPlot: true },
    })

    chart.getPayload = () => ({ data: [[1617946860000, 1]], labels: ["time", "value"] })
    chart.getDateWindow = () => [1617946860000, 1617947750000]
    chart.formatXAxis = x => x.toString()
    chart.getThemeAttribute = () => "#333"
    chart.getUnitSign = () => ""

    const instance = dygraphChart(sdk, chart)
    instance.mount(document.createElement("div"))

    const Dygraph = require("dygraphs")
    expect(Dygraph).toHaveBeenCalledWith(
      expect.any(Object),
      expect.any(Array),
      expect.objectContaining({ stepPlot: true })
    )
  })

  it("does not enable dygraph stepPlot by default", () => {
    const { sdk, chart } = makeTestChart({
      attributes: { theme: "dark", chartType: "line" },
    })

    chart.getPayload = () => ({ data: [[1617946860000, 10]], labels: ["time", "value"] })
    chart.getDateWindow = () => [1617946860000, 1617947750000]
    chart.formatXAxis = x => x.toString()
    chart.getThemeAttribute = () => "#333"
    chart.getUnitSign = () => ""

    const instance = dygraphChart(sdk, chart)
    instance.mount(document.createElement("div"))

    const Dygraph = require("dygraphs")
    expect(Dygraph).toHaveBeenCalledWith(
      expect.any(Object),
      expect.any(Array),
      expect.objectContaining({ stepPlot: false })
    )
  })

  it("preserves compact scaled heatmap y-axis labels", () => {
    const ids = ["0.005", "1000", "+Inf"]
    const { sdk, chart } = makeTestChart({
      attributes: {
        chartType: "heatmap",
        groupBy: ["dimension"],
        selectedLegendDimensions: [],
        viewDimensions: {
          ids,
          names: ids,
          priorities: ids.map((_, index) => index),
          units: ids.map(() => ""),
          contexts: ids.map(() => ""),
          grouped: ["dimension"],
        },
      },
    })

    chart.updateDimensions()
    chart.getPayload = () => ({
      data: [[1617946860000, 1, 2, 3]],
      labels: ["time", "0.005", "1000", "+Inf"],
    })
    chart.getDateWindow = () => [1617946860000, 1617947750000]
    chart.formatXAxis = x => x.toString()
    chart.getThemeAttribute = () => "#333"
    chart.getUnitSign = () => ""

    const instance = dygraphChart(sdk, chart)
    instance.mount(document.createElement("div"))

    const Dygraph = require("dygraphs")
    const options = Dygraph.mock.calls[Dygraph.mock.calls.length - 1][2]
    const formatter = options.axes.y.axisLabelFormatter

    expect(formatter("5m")).toBe("5m")
    expect(formatter("1k")).toBe("1k")
    expect(formatter("+Inf")).toBe("+Inf")
    expect(formatter("0.005")).toBe(0.005)
  })

  it("uses cropped heatmap bucket count for y-axis range", async () => {
    const ids = ["0", "1", "2", "3", "4", "5", "6"]
    const { sdk, chart } = makeTestChart({
      attributes: {
        chartType: "heatmap",
        groupBy: ["dimension"],
        selectedLegendDimensions: [],
        viewDimensions: {
          ids,
          names: ids,
          priorities: ids.map((_, index) => index),
          units: ids.map(() => ""),
          contexts: ids.map(() => ""),
          grouped: ["dimension"],
        },
      },
    })

    await loadHeatmapPayload(chart, ids, [[0, 0, 1, 0, 2, 0, 0]], {
      timestamp: 1617946860000,
    })
    chart.getDateWindow = () => [1617946860000, 1617947750000]
    chart.formatXAxis = x => x.toString()
    chart.getThemeAttribute = () => "#333"
    chart.getUnitSign = () => ""

    const instance = dygraphChart(sdk, chart)
    instance.mount(document.createElement("div"))

    const Dygraph = require("dygraphs")
    const options = Dygraph.mock.calls[Dygraph.mock.calls.length - 1][2]

    expect(options.valueRange).toEqual([0, 5])
  })

  it("returns axis range from dygraph", () => {
    const { sdk, chart } = makeTestChart()

    chart.getPayload = () => ({
      data: [[1617946860000, 10]],
      labels: ["time", "value"],
    })
    chart.getDateWindow = () => [1617946860000, 1617947750000]
    chart.formatXAxis = x => x.toString()
    chart.getThemeAttribute = () => "#333"
    chart.getUnitSign = () => ""

    const instance = dygraphChart(sdk, chart)
    const element = document.createElement("div")

    instance.mount(element)

    expect(instance.getXAxisRange()).toEqual([1617946860000, 1617947750000])
  })
})
