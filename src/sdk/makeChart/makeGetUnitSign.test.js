import makeGetUnitSign from "./makeGetUnitSign"

describe("makeGetUnitSign", () => {
  let mockChart

  beforeEach(() => {
    mockChart = {
      getUnitAttributes: jest.fn(() => ({
        base: "bytes", 
        prefix: "K", 
        unit: "bytes"
      }))
    }
    makeGetUnitSign(mockChart)
  })

  it("creates getUnitSign function on chart", () => {
    expect(typeof mockChart.getUnitSign).toBe("function")
  })

  it("returns unit string with conversion", () => {
    const result = mockChart.getUnitSign({ dimensionId: "test" })
    expect(typeof result).toBe("string")
    expect(mockChart.getUnitAttributes).toBeCalledWith("test", "units")
  })

  it("uses custom key parameter", () => {
    mockChart.getUnitSign({ dimensionId: "test", key: "customUnits" })
    expect(mockChart.getUnitAttributes).toBeCalledWith("test", "customUnits")
  })

  it("returns unit name without conversion when requested", () => {
    mockChart.getUnitAttributes.mockReturnValue({
      base: "bytes",
      prefix: "M", 
      unit: "bytes"
    })
    
    const result = mockChart.getUnitSign({ 
      dimensionId: "test", 
      withoutConversion: true 
    })
    
    expect(typeof result).toBe("string")
  })

  it("handles long format", () => {
    const result = mockChart.getUnitSign({ 
      dimensionId: "test", 
      long: true 
    })
    
    expect(typeof result).toBe("string")
  })

  it("uses default parameters", () => {
    mockChart.getUnitSign()
    expect(mockChart.getUnitAttributes).toBeCalledWith(undefined, "units")
  })

  it("handles missing base unit", () => {
    mockChart.getUnitAttributes.mockReturnValue({
      base: null,
      prefix: "",
      unit: "percent"
    })
    
    const result = mockChart.getUnitSign({ dimensionId: "test" })
    expect(typeof result).toBe("string")
  })
})