import getAggregateMethod from "./getAggregateMethod"

describe("getAggregateMethod", () => {
  let mockChart

  beforeEach(() => {
    mockChart = {
      getUnits: jest.fn(),
      getUnitSign: jest.fn()
    }
  })

  it("returns avg when no unit", () => {
    mockChart.getUnits.mockReturnValue(null)
    
    const result = getAggregateMethod(mockChart)
    expect(result).toBe("avg")
  })

  it("returns avg for percentage units", () => {
    mockChart.getUnits.mockReturnValue("%")
    
    const result = getAggregateMethod(mockChart)
    expect(result).toBe("avg")
  })

  it("returns avg for time units", () => {
    mockChart.getUnits.mockReturnValue("seconds")
    
    const result = getAggregateMethod(mockChart)
    expect(result).toBe("avg")
  })

  it("returns avg for temperature units", () => {
    mockChart.getUnits.mockReturnValue("celsius")
    
    const result = getAggregateMethod(mockChart)
    expect(result).toBe("avg")
  })

  it("returns avg for ratio-based units", () => {
    mockChart.getUnits.mockReturnValue("count/operation")
    mockChart.getUnitSign.mockReturnValue("c/op")
    
    const result = getAggregateMethod(mockChart)
    expect(result).toBe("avg")
  })

  it("returns sum for byte units", () => {
    mockChart.getUnits.mockReturnValue("bytes")
    mockChart.getUnitSign.mockReturnValue("B")
    
    const result = getAggregateMethod(mockChart)
    expect(result).toBe("sum")
  })

  it("falls back to unit sign when unit doesn't match", () => {
    mockChart.getUnits.mockReturnValue("custom")
    mockChart.getUnitSign.mockReturnValue("%")
    
    const result = getAggregateMethod(mockChart)
    expect(result).toBe("avg")
  })

  it("returns sum when neither unit nor unit sign match", () => {
    mockChart.getUnits.mockReturnValue("custom")
    mockChart.getUnitSign.mockReturnValue("custom-sign")
    
    const result = getAggregateMethod(mockChart)
    expect(result).toBe("sum")
  })

  it("handles case insensitive matching", () => {
    mockChart.getUnits.mockReturnValue("custom/operation")
    mockChart.getUnitSign.mockReturnValue("custom/operation")
    
    const result = getAggregateMethod(mockChart)
    expect(result).toBe("avg")
  })
})