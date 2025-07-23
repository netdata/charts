import { makeTestChart } from "@jest/testUtilities"
import gaugeChart from "./index"

const mockGauge = {
  setOptions: jest.fn().mockReturnThis(),
  setMinValue: jest.fn(),
  setMaxValue: jest.fn(),
  set: jest.fn(),
  update: jest.fn(),
  render: jest.fn(),
  maxValue: 100,
  minValue: 0,
  animationSpeed: 32,
}

jest.mock("./library", () => jest.fn(() => mockGauge))

describe("gaugeChart", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("creates chart instance with required methods", () => {
    const { sdk, chart } = makeTestChart()

    const instance = gaugeChart(sdk, chart)

    expect(instance).toHaveProperty("mount")
    expect(instance).toHaveProperty("unmount")
    expect(instance).toHaveProperty("render")
    expect(instance).toHaveProperty("getMinMax")
    expect(typeof instance.mount).toBe("function")
    expect(typeof instance.unmount).toBe("function")
    expect(typeof instance.render).toBe("function")
    expect(typeof instance.getMinMax).toBe("function")
  })

  it("mounts successfully when canvas element exists", () => {
    const { sdk, chart } = makeTestChart()

    chart.selectDimensionColor = () => "#ff0000"
    chart.getThemeAttribute = () => "#333"

    const instance = gaugeChart(sdk, chart)
    const element = document.createElement("div")
    const canvas = document.createElement("canvas")
    canvas.width = 200
    canvas.height = 200
    element.appendChild(canvas)

    expect(() => instance.mount(element)).not.toThrow()
    
    const GaugeLibrary = require("./library")
    expect(GaugeLibrary).toHaveBeenCalledWith(canvas)
    expect(mockGauge.setOptions).toHaveBeenCalled()
    expect(mockGauge.setMinValue).toHaveBeenCalledWith(0)
  })

  it("skips mounting when gauge already exists", () => {
    const { sdk, chart } = makeTestChart()

    chart.selectDimensionColor = () => "#ff0000"
    chart.getThemeAttribute = () => "#333"

    const instance = gaugeChart(sdk, chart)
    const element = document.createElement("div")
    const canvas = document.createElement("canvas")
    element.appendChild(canvas)
    
    instance.mount(element)
    const GaugeLibrary = require("./library")
    const firstCallCount = GaugeLibrary.mock.calls.length

    instance.mount(element)
    
    expect(GaugeLibrary.mock.calls.length).toBe(firstCallCount)
  })

  it("renders without errors when not loaded", () => {
    const { sdk, chart } = makeTestChart({
      attributes: { loaded: false }
    })

    const instance = gaugeChart(sdk, chart)
    
    expect(() => instance.render()).not.toThrow()
  })

  it("renders without errors when gauge not mounted", () => {
    const { sdk, chart } = makeTestChart({
      attributes: { loaded: true }
    })

    const instance = gaugeChart(sdk, chart)
    
    expect(() => instance.render()).not.toThrow()
  })

  it("renders with data when loaded and mounted", () => {
    const { sdk, chart } = makeTestChart({
      attributes: { 
        loaded: true,
        getValueRange: () => [0, 100]
      }
    })

    chart.getPayload = () => ({ 
      data: [
        [1617946860000, 75],
        [1617946870000, 82]
      ]
    })
    chart.getClosestRow = () => 1
    chart.selectDimensionColor = () => "#ff0000"
    chart.getThemeAttribute = () => "#333"
    
    const instance = gaugeChart(sdk, chart)
    const element = document.createElement("div")
    const canvas = document.createElement("canvas")
    element.appendChild(canvas)
    
    instance.mount(element)
    
    expect(() => instance.render()).not.toThrow()
  })

  it("handles hoverX when rendering", () => {
    const { sdk, chart } = makeTestChart({
      attributes: {
        loaded: true,
        hoverX: [1617946865000],
        getValueRange: () => [0, 100]
      }
    })

    chart.getPayload = () => ({
      data: [
        [1617946860000, 10],
        [1617946870000, 20]
      ]
    })
    chart.getClosestRow = () => 0
    chart.selectDimensionColor = () => "#ff0000"
    chart.getThemeAttribute = () => "#333"
    
    const instance = gaugeChart(sdk, chart)
    const element = document.createElement("div")
    const canvas = document.createElement("canvas")
    element.appendChild(canvas)
    
    instance.mount(element)
    
    expect(() => instance.render()).not.toThrow()
  })

  it("handles empty data gracefully", () => {
    const { sdk, chart } = makeTestChart({
      attributes: { loaded: true }
    })

    chart.getPayload = () => ({ data: [] })

    const instance = gaugeChart(sdk, chart)
    
    expect(() => instance.render()).not.toThrow()
  })

  it("unmounts without errors", () => {
    const { sdk, chart } = makeTestChart()

    chart.selectDimensionColor = () => "#ff0000"
    chart.getThemeAttribute = () => "#333"

    const instance = gaugeChart(sdk, chart)
    const element = document.createElement("div")
    const canvas = document.createElement("canvas")
    element.appendChild(canvas)
    
    instance.mount(element)
    
    expect(() => instance.unmount()).not.toThrow()
  })

  it("getMinMax returns result from getValueRange attribute", () => {
    const { sdk, chart } = makeTestChart({
      attributes: {
        getValueRange: () => [20, 80]
      }
    })

    const instance = gaugeChart(sdk, chart)
    const result = instance.getMinMax()
    
    expect(result).toEqual([20, 80])
  })
})