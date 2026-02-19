import getAggregateMethod from "./getAggregateMethod"

describe("getAggregateMethod", () => {
  let mockChart

  beforeEach(() => {
    mockChart = {
      getUnits: jest.fn(),
      getAttribute: jest.fn(),
    }
  })

  it("returns avg when no unit", () => {
    mockChart.getUnits.mockReturnValue(null)
    mockChart.getAttribute.mockReturnValue(null)

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

    const result = getAggregateMethod(mockChart)
    expect(result).toBe("avg")
  })

  it("returns sum for state units", () => {
    mockChart.getUnits.mockReturnValue("state")

    const result = getAggregateMethod(mockChart)
    expect(result).toBe("sum")
  })

  it("returns sum for status units", () => {
    mockChart.getUnits.mockReturnValue("status")

    const result = getAggregateMethod(mockChart)
    expect(result).toBe("sum")
  })

  it("falls back to contextUnit when unit is not set", () => {
    mockChart.getUnits.mockReturnValue(null)
    mockChart.getAttribute.mockReturnValue("%")

    const result = getAggregateMethod(mockChart)
    expect(result).toBe("avg")
  })

  it("returns avg when unit does not match any known patterns", () => {
    mockChart.getUnits.mockReturnValue("custom")
    mockChart.getAttribute.mockReturnValue(null)

    const result = getAggregateMethod(mockChart)
    expect(result).toBe("avg")
  })

  it("handles case insensitive matching for regex patterns", () => {
    mockChart.getUnits.mockReturnValue("custom/operation")

    const result = getAggregateMethod(mockChart)
    expect(result).toBe("avg")
  })
})
