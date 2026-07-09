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

  it("uses compact denominators for compound unit labels", () => {
    mockChart.getUnitAttributes.mockReturnValue({
      base: "By/{operation}",
      prefix: "Mi",
      unit: "KiBy/{operation}",
    })

    const result = mockChart.getUnitSign({ dimensionId: "test" })

    expect(result).toBe("MiB/op")
  })

  it("uses compact denominators for latency per request labels", () => {
    mockChart.getUnitAttributes.mockReturnValue({
      base: "s/{request}",
      prefix: "u",
      unit: "ms/{request}",
    })

    const result = mockChart.getUnitSign({ dimensionId: "test" })

    expect(result).toBe("\u00b5s/req")
  })

  it("labels whole CPU-core scale as cores", () => {
    mockChart.getUnitAttributes.mockReturnValue({
      base: "[CPU]",
      prefix: "",
      unit: "m[CPU]",
    })

    const result = mockChart.getUnitSign({ dimensionId: "test" })

    expect(result).toBe("core")
  })

  it("keeps milliCPU for sub-core scale", () => {
    mockChart.getUnitAttributes.mockReturnValue({
      base: "[CPU]",
      prefix: "m",
      unit: "m[CPU]",
    })

    const result = mockChart.getUnitSign({ dimensionId: "test" })

    expect(result).toBe("mCPU")
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

  it("normalizes source duration units to seconds", () => {
    mockChart.getUnitAttributes.mockReturnValue({
      base: "d:h:mm",
      prefix: "",
      unit: "h",
    })

    const result = mockChart.getUnitSign({
      dimensionId: "test",
      withoutConversion: true,
    })

    expect(result).toBe("seconds")
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
