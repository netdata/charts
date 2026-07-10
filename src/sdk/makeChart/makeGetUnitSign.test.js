import { makeTestChart } from "@jest/testUtilities"

describe("makeGetUnitSign", () => {
  let chart

  beforeEach(() => {
    chart = makeTestChart().chart
  })

  const setUnitAttributes = (attrs, key = "units") =>
    chart.updateAttribute(`${key}ByDimension`, { test: attrs })

  it("creates getUnitSign function on chart", () => {
    expect(typeof chart.getUnitSign).toBe("function")
  })

  it("returns unit string with conversion", () => {
    setUnitAttributes({ base: "bytes", prefix: "K", unit: "bytes" })

    const result = chart.getUnitSign({ dimensionId: "test" })

    expect(typeof result).toBe("string")
  })

  it("uses custom key parameter", () => {
    setUnitAttributes({ base: "By", prefix: "Mi", unit: "KiBy" }, "customUnits")

    const result = chart.getUnitSign({ dimensionId: "test", key: "customUnits" })

    expect(result).toBe("MiB")
  })

  it("returns normalized unit name without conversion when requested", () => {
    setUnitAttributes({ base: "By", prefix: "M", unit: "KiBy" })

    const result = chart.getUnitSign({
      dimensionId: "test",
      withoutConversion: true,
    })

    expect(result).toBe("bytes")
  })

  it("keeps the denominator when normalizing pre-scaled source units", () => {
    setUnitAttributes({ base: "s/{request}", prefix: "u", unit: "ms/{request}" })

    const result = chart.getUnitSign({
      dimensionId: "test",
      withoutConversion: true,
    })

    expect(result).toBe("seconds per request")
  })

  it("uses compact denominators for compound unit labels", () => {
    setUnitAttributes({ base: "By/{operation}", prefix: "Mi", unit: "KiBy/{operation}" })

    const result = chart.getUnitSign({ dimensionId: "test" })

    expect(result).toBe("MiB/op")
  })

  it("uses compact denominators for latency per request labels", () => {
    setUnitAttributes({ base: "s/{request}", prefix: "u", unit: "ms/{request}" })

    const result = chart.getUnitSign({ dimensionId: "test" })

    expect(result).toBe("µs/req")
  })

  it("labels whole CPU-core scale as cores", () => {
    setUnitAttributes({ base: "[CPU]", prefix: "", unit: "m[CPU]" })

    const result = chart.getUnitSign({ dimensionId: "test" })

    expect(result).toBe("core")
  })

  it("keeps milliCPU for sub-core scale", () => {
    setUnitAttributes({ base: "[CPU]", prefix: "m", unit: "m[CPU]" })

    const result = chart.getUnitSign({ dimensionId: "test" })

    expect(result).toBe("mCPU")
  })

  it("does not normalize non-scalable special units", () => {
    setUnitAttributes({ base: "dB[mW]", prefix: "", unit: "dB[mW]" })

    const result = chart.getUnitSign({
      dimensionId: "test",
      withoutConversion: true,
    })

    expect(result).toBe("decibel milliwatts")
  })

  it("normalizes source duration units to seconds", () => {
    setUnitAttributes({ base: "d:h:mm", prefix: "", unit: "h" })

    const result = chart.getUnitSign({
      dimensionId: "test",
      withoutConversion: true,
    })

    expect(result).toBe("seconds")
  })

  it("handles long format", () => {
    setUnitAttributes({ base: "bytes", prefix: "K", unit: "bytes" })

    const result = chart.getUnitSign({
      dimensionId: "test",
      long: true,
    })

    expect(typeof result).toBe("string")
  })

  it("uses default parameters", () => {
    setUnitAttributes({ base: "bytes", prefix: "K", unit: "bytes" })

    const result = chart.getUnitSign()

    expect(typeof result).toBe("string")
  })

  it("handles missing base unit", () => {
    setUnitAttributes({ base: null, prefix: "", unit: "percent" })

    const result = chart.getUnitSign({ dimensionId: "test" })

    expect(typeof result).toBe("string")
  })
})
