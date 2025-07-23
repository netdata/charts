import { makeTestChart } from "@jest/testUtilities"
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
        outOfLimits: false
      }
    })

    chart.getPayload = () => ({
      data: [[1617946860000, 10, 20]],
      labels: ["time", "load1", "load5"]
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
        outOfLimits: true
      }
    })

    chart.getPayload = () => ({
      data: [],
      labels: []
    })
    chart.getDateWindow = () => [1617946860000, 1617947750000]
    chart.formatXAxis = x => x.toString()
    chart.getThemeAttribute = () => "#333"
    chart.getUnitSign = () => ""
    
    const instance = dygraphChart(sdk, chart)
    const element = document.createElement("div")
    
    instance.mount(element)
    
    const Dygraph = require("dygraphs")
    expect(Dygraph).toHaveBeenCalledWith(element, [[0]], expect.objectContaining({
      labels: ["X"]
    }))
  })

  it("prevents multiple mounts on same element", () => {
    const { sdk, chart } = makeTestChart({
      attributes: { theme: "dark" }
    })

    chart.getPayload = () => ({
      data: [[1617946860000, 10]], 
      labels: ["time", "value"]
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

  it("skips render when highlighting, panning, or processing", () => {
    const { sdk, chart } = makeTestChart({
      attributes: {
        highlighting: true,
        panning: false,
        processing: false
      }
    })

    chart.getPayload = () => ({
      data: [[1617946860000, 10]], 
      labels: ["time", "value"]
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
      labels: ["time", "value"]
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
      labels: ["time", "value"]
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
      labels: ["time", "value"]
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

  it("returns axis range from dygraph", () => {
    const { sdk, chart } = makeTestChart()

    chart.getPayload = () => ({
      data: [[1617946860000, 10]], 
      labels: ["time", "value"]
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