import unitConversion from "./index"

jest.mock("./getConversionUnits", () => ({
  __esModule: true,
  default: jest.fn(() => ({
    method: ["adjust", "original"],
    fractionDigits: [2, -1],
    prefix: ["K", ""],
    base: ["bytes", "custom"],
    divider: [jest.fn(), undefined]
  })),
  getConversionAttributes: jest.fn((chart, units, options) => ({
    method: "adjust",
    fractionDigits: 2,
    prefix: "K",
    base: "bytes",
    divider: jest.fn(),
    unit: units
  }))
}))

describe("unitConversion", () => {
  let mockChart, getConversionUnits, getConversionAttributes

  beforeEach(() => {
    getConversionUnits = require("./getConversionUnits").default
    getConversionAttributes = require("./getConversionUnits").getConversionAttributes

    mockChart = {
      getAttribute: jest.fn(),
      updateAttributes: jest.fn(),
      updateAttribute: jest.fn(),
      getPayload: jest.fn(),
      getVisibleDimensionIds: jest.fn(() => ["cpu", "memory"]),
      getDimensionName: jest.fn(id => id),
      on: jest.fn(() => jest.fn())
    }

    // Reset mocks
    getConversionUnits.mockReset()
    getConversionAttributes.mockReset()
    mockChart.getAttribute.mockReset()
    mockChart.updateAttributes.mockReset()
    mockChart.updateAttribute.mockReset()
    mockChart.getPayload.mockReset()
    mockChart.on.mockReset()

    // Default mock implementations
    getConversionUnits.mockReturnValue({
      method: ["adjust", "original"],
      fractionDigits: [2, -1],
      prefix: ["K", ""],
      base: ["bytes", "custom"],
      divider: [jest.fn(), undefined]
    })

    getConversionAttributes.mockImplementation((chart, units, options) => ({
      method: "adjust",
      fractionDigits: 2,
      prefix: "K",
      base: "bytes",
      divider: jest.fn(),
      unit: units
    }))

    mockChart.getAttribute.mockImplementation((key) => {
      if (key === "unitsStsByContext") return {}
      if (key === "dbUnitsStsByContext") return {}
      if (key === "staticValueRange") return null
      return []
    })

    mockChart.getPayload.mockReturnValue({
      byDimension: {
        "cpu": { min: 10, max: 90 },
        "memory": { min: 20, max: 80 }
      }
    })
  })

  it("returns cleanup function", () => {
    const cleanup = unitConversion(mockChart)
    
    expect(typeof cleanup).toBe("function")
  })

  it("sets up event listeners for chart changes", () => {
    unitConversion(mockChart)
    
    expect(mockChart.on).toHaveBeenCalledWith("visibleDimensionsChanged", expect.any(Function))
    expect(mockChart.on).toHaveBeenCalledWith("yAxisChange", expect.any(Function))
  })

  it("calls cleanup functions when returned function is called", () => {
    const offVisibleDimensionsChanged = jest.fn()
    const offYAxisChange = jest.fn()
    
    mockChart.on
      .mockReturnValueOnce(offVisibleDimensionsChanged)
      .mockReturnValueOnce(offYAxisChange)
    
    const cleanup = unitConversion(mockChart)
    cleanup()
    
    expect(offVisibleDimensionsChanged).toHaveBeenCalled()
    expect(offYAxisChange).toHaveBeenCalled()
  })

  it("handles static value range", () => {
    mockChart.getAttribute.mockImplementation((key) => {
      if (key === "staticValueRange") return [0, 100]
      if (key === "unitsStsByContext") return {}
      if (key === "dbUnitsStsByContext") return {}
      return []
    })

    unitConversion(mockChart)
    
    // Trigger yAxisChange event
    const yAxisChangeHandler = mockChart.on.mock.calls.find(call => call[0] === "yAxisChange")[1]
    yAxisChangeHandler(50, 150)
    
    expect(getConversionUnits).toHaveBeenCalledWith(mockChart, "units", { min: 0, max: 100 })
    expect(getConversionUnits).toHaveBeenCalledWith(mockChart, "dbUnits", { min: 0, max: 100 })
    expect(mockChart.updateAttributes).toHaveBeenCalledWith({
      unitsConversionMethod: ["adjust", "original"],
      unitsConversionPrefix: ["K", ""],
      unitsConversionBase: ["bytes", "custom"],
      unitsConversionFractionDigits: [2, -1],
      unitsConversionDivider: expect.any(Array)
    })
    expect(mockChart.updateAttributes).toHaveBeenCalledWith({
      dbUnitsConversionMethod: ["adjust", "original"],
      dbUnitsConversionPrefix: ["K", ""],
      dbUnitsConversionBase: ["bytes", "custom"],
      dbUnitsConversionFractionDigits: [2, -1],
      dbUnitsConversionDivider: expect.any(Array)
    })
    expect(mockChart.updateAttributes).toHaveBeenCalledWith({
      min: 0,
      max: 100
    })
  })

  it("calculates min/max from dimension data", () => {
    mockChart.getPayload.mockReturnValue({
      byDimension: {
        "cpu": { min: 10, max: 90 },
        "memory": { min: 5, max: 95 }
      }
    })

    unitConversion(mockChart)
    
    // Trigger visibleDimensionsChanged event
    const visibleDimensionsHandler = mockChart.on.mock.calls.find(call => call[0] === "visibleDimensionsChanged")[1]
    visibleDimensionsHandler()
    
    expect(getConversionUnits).toHaveBeenCalledWith(mockChart, "units", { min: 5, max: 95 })
    expect(getConversionUnits).toHaveBeenCalledWith(mockChart, "dbUnits", { min: 5, max: 95 })
  })

  it("uses ymin/ymax when dimension data is unavailable", () => {
    mockChart.getPayload.mockReturnValue({
      byDimension: {}
    })

    unitConversion(mockChart)
    
    // Trigger yAxisChange with explicit values
    const yAxisChangeHandler = mockChart.on.mock.calls.find(call => call[0] === "yAxisChange")[1]
    yAxisChangeHandler(25, 75)
    
    expect(getConversionUnits).toHaveBeenCalledWith(mockChart, "units", { min: 25, max: 75 })
    expect(getConversionUnits).toHaveBeenCalledWith(mockChart, "dbUnits", { min: 25, max: 75 })
  })

  it("handles missing payload gracefully", () => {
    mockChart.getPayload.mockReturnValue(null)

    unitConversion(mockChart)
    
    const yAxisChangeHandler = mockChart.on.mock.calls.find(call => call[0] === "yAxisChange")[1]
    yAxisChangeHandler(15, 85)
    
    expect(getConversionUnits).toHaveBeenCalledWith(mockChart, "units", { min: 15, max: 85 })
    expect(getConversionUnits).toHaveBeenCalledWith(mockChart, "dbUnits", { min: 15, max: 85 })
  })

  it("does nothing when ymin/ymax are undefined and no dimension data", () => {
    mockChart.getPayload.mockReturnValue({
      byDimension: {}
    })

    unitConversion(mockChart)
    
    const yAxisChangeHandler = mockChart.on.mock.calls.find(call => call[0] === "yAxisChange")[1]
    yAxisChangeHandler(undefined, undefined)
    
    expect(getConversionUnits).not.toHaveBeenCalled()
  })

  it("processes unitsStsByContext correctly", () => {
    mockChart.getAttribute.mockImplementation((key) => {
      if (key === "unitsStsByContext") return {
        "context1": { units: "bytes", min: 1000, max: 5000 },
        "context2": { units: "seconds", min: 1, max: 10 }
      }
      if (key === "dbUnitsStsByContext") return {}
      return []
    })

    unitConversion(mockChart)
    
    const yAxisChangeHandler = mockChart.on.mock.calls.find(call => call[0] === "yAxisChange")[1]
    yAxisChangeHandler(10, 100)
    
    expect(getConversionAttributes).toHaveBeenCalledWith(mockChart, "bytes", { min: 1000, max: 5000 })
    expect(getConversionAttributes).toHaveBeenCalledWith(mockChart, "seconds", { min: 1, max: 10 })
    expect(mockChart.updateAttribute).toHaveBeenCalledWith("unitsByContext", expect.any(Object))
  })

  it("uses fallback min/max for unitsStsByContext when not provided", () => {
    mockChart.getAttribute.mockImplementation((key) => {
      if (key === "unitsStsByContext") return {
        "context1": { units: "bytes" }
      }
      if (key === "dbUnitsStsByContext") return {}
      return []
    })

    unitConversion(mockChart)
    
    const yAxisChangeHandler = mockChart.on.mock.calls.find(call => call[0] === "yAxisChange")[1]
    yAxisChangeHandler(20, 200)
    
    expect(getConversionAttributes).toHaveBeenCalledWith(mockChart, "bytes", { min: undefined, max: undefined })
  })

  it("handles dimension names that differ from IDs", () => {
    mockChart.getDimensionName.mockImplementation((id) => {
      if (id === "cpu") return "cpu_usage"
      return id
    })

    mockChart.getPayload.mockReturnValue({
      byDimension: {
        "cpu_usage": { min: 15, max: 85 },
        "memory": { min: 25, max: 75 }
      }
    })

    unitConversion(mockChart)
    
    const visibleDimensionsHandler = mockChart.on.mock.calls.find(call => call[0] === "visibleDimensionsChanged")[1]
    visibleDimensionsHandler()
    
    expect(getConversionUnits).toHaveBeenCalledWith(mockChart, "units", { min: 15, max: 85 })
  })

  it("handles empty visible dimensions", () => {
    mockChart.getVisibleDimensionIds.mockReturnValue([])
    
    unitConversion(mockChart)
    
    const visibleDimensionsHandler = mockChart.on.mock.calls.find(call => call[0] === "visibleDimensionsChanged")[1]
    visibleDimensionsHandler()
    
    expect(getConversionUnits).not.toHaveBeenCalled()
  })

  it("updates both units and dbUnits conversion attributes", () => {
    unitConversion(mockChart)
    
    const yAxisChangeHandler = mockChart.on.mock.calls.find(call => call[0] === "yAxisChange")[1]
    yAxisChangeHandler(0, 50)
    
    expect(mockChart.updateAttributes).toHaveBeenCalledWith({
      unitsConversionMethod: ["adjust", "original"],
      unitsConversionPrefix: ["K", ""],
      unitsConversionBase: ["bytes", "custom"],
      unitsConversionFractionDigits: [2, -1],
      unitsConversionDivider: expect.any(Array)
    })
    expect(mockChart.updateAttributes).toHaveBeenCalledWith({
      dbUnitsConversionMethod: ["adjust", "original"],
      dbUnitsConversionPrefix: ["K", ""],
      dbUnitsConversionBase: ["bytes", "custom"],
      dbUnitsConversionFractionDigits: [2, -1],
      dbUnitsConversionDivider: expect.any(Array)
    })
    // The min/max comes from the dimension data, not the yAxisChange parameters
    expect(mockChart.updateAttributes).toHaveBeenCalledWith({
      min: 10,
      max: 90
    })
  })
})