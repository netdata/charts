import makeGetUnitSign from "./makeGetUnitSign"

describe("makeGetUnitSign", () => {
  let mockChart

  beforeEach(() => {
    mockChart = {
      getUnitAttributes: jest.fn(() => ({
        base: "bytes",
        prefix: "K",
        unit: "bytes",
      })),
    }
    makeGetUnitSign(mockChart)
  })

  it("creates getUnitSign function on chart", () => {
    expect(typeof mockChart.getUnitSign).toBe("function")
  })

  it("returns unit string with conversion", () => {
    const result = mockChart.getUnitSign({ dimensionId: "test" })
    expect(typeof result).toBe("string")
    expect(mockChart.getUnitAttributes).toHaveBeenCalledWith("test", "units")
  })

  it("uses custom key parameter", () => {
    mockChart.getUnitSign({ dimensionId: "test", key: "customUnits" })
    expect(mockChart.getUnitAttributes).toHaveBeenCalledWith("test", "customUnits")
  })

  it("returns normalized unit name without conversion when requested", () => {
    mockChart.getUnitAttributes.mockReturnValue({
      base: "By",
      prefix: "M",
      unit: "KiBy",
    })

    const result = mockChart.getUnitSign({
      dimensionId: "test",
      withoutConversion: true,
    })

    expect(result).toBe("bytes")
  })

  it("keeps the denominator when normalizing pre-scaled source units", () => {
    mockChart.getUnitAttributes.mockReturnValue({
      base: "s/{request}",
      prefix: "u",
      unit: "ms/{request}",
    })

    const result = mockChart.getUnitSign({
      dimensionId: "test",
      withoutConversion: true,
    })

    expect(result).toBe("seconds per request")
  })

  it("does not normalize non-scalable special units", () => {
    mockChart.getUnitAttributes.mockReturnValue({
      base: "dB[mW]",
      prefix: "",
      unit: "dB[mW]",
    })

    const result = mockChart.getUnitSign({
      dimensionId: "test",
      withoutConversion: true,
    })

    expect(result).toBe("decibel milliwatts")
  })

  it("handles long format", () => {
    const result = mockChart.getUnitSign({
      dimensionId: "test",
      long: true,
    })

    expect(typeof result).toBe("string")
  })

  it("uses default parameters", () => {
    mockChart.getUnitSign()
    expect(mockChart.getUnitAttributes).toHaveBeenCalledWith(undefined, "units")
  })

  it("handles missing base unit", () => {
    mockChart.getUnitAttributes.mockReturnValue({
      base: null,
      prefix: "",
      unit: "percent",
    })

    const result = mockChart.getUnitSign({ dimensionId: "test" })
    expect(typeof result).toBe("string")
  })
})
