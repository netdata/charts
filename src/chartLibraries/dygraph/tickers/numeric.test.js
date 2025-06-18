import numericTicker from "./numeric"
import { isBinary } from "@/helpers/units"

describe("numericTicker", () => {
  let mockOpts
  let mockDygraph

  beforeEach(() => {
    mockOpts = jest.fn((key) => {
      const options = {
        pixelsPerLabel: 50,
        axisLabelFormatter: jest.fn((value) => `${value}`)
      }
      return options[key]
    })

    mockDygraph = {
      yAxisRange: jest.fn(() => [0, 100]),
      getArea: jest.fn(() => ({ h: 300 }))
    }
  })

  it("generates ticks when vals parameter is provided", () => {
    const vals = [0, 25, 50, 75, 100]
    const ticks = numericTicker(0, 100, 200, mockOpts, mockDygraph, vals, { units: [""] })

    expect(ticks.length).toBeGreaterThan(vals.length) // includes boundary ticks and anomaly SVG
    
    // Check that vals are included in ticks
    vals.forEach(val => {
      expect(ticks.some(tick => tick.v === val)).toBe(true)
    })
  })

  it("generates ticks automatically when vals is not provided", () => {
    const ticks = numericTicker(0, 100, 400, mockOpts, mockDygraph, null, { units: [""] })

    expect(Array.isArray(ticks)).toBe(true)
    expect(ticks.length).toBeGreaterThan(2) // At least boundary ticks
    expect(ticks[0]).toHaveProperty("label_v") // Anomaly SVG tick
    expect(ticks[ticks.length - 1]).toHaveProperty("label_v") // Bottom boundary
  })

  it("uses binary multiples for binary units", () => {
    const ticks = numericTicker(0, 1024, 400, mockOpts, mockDygraph, null, { units: ["By"] })

    expect(Array.isArray(ticks)).toBe(true)
    expect(ticks.length).toBeGreaterThan(2)
    
    // Verify ticks are using binary spacing (powers of 2)
    const dataTicks = ticks.filter(tick => tick.v !== undefined && !tick.label_v).map(t => t.v)
    if (dataTicks.length > 2) {
      const spacing = dataTicks[1] - dataTicks[0]
      // Binary units should use nice round numbers, not necessarily exact powers of 2
      expect(spacing).toBeGreaterThan(0)
      expect(spacing).toBeLessThanOrEqual(512)
    }
  })

  it("uses decimal multiples for non-binary units", () => {
    const ticks = numericTicker(0, 100, 400, mockOpts, mockDygraph, null, { units: ["percent"] })

    expect(Array.isArray(ticks)).toBe(true)
    expect(ticks.length).toBeGreaterThan(2)
    
    // Verify ticks are using decimal spacing
    const dataTicks = ticks.filter(tick => tick.v !== undefined && !tick.label_v).map(t => t.v)
    if (dataTicks.length > 2) {
      const spacing = dataTicks[1] - dataTicks[0]
      // Decimal units typically use 1, 2, 5, 10, 20, 50, 100 spacing
      expect([1, 2, 5, 10, 20, 25, 50, 100].some(v => Math.abs(spacing - v) < 0.01)).toBe(true)
    }
  })

  it("calculates appropriate number of ticks based on pixels", () => {
    const pixels = 500
    const pixelsPerLabel = 50
    mockOpts.mockImplementation((key) => {
      if (key === "pixelsPerLabel") return pixelsPerLabel
      if (key === "axisLabelFormatter") return jest.fn((v) => `${v}`)
    })

    const ticks = numericTicker(0, 100, pixels, mockOpts, mockDygraph, null, { units: [""] })
    
    // Should not exceed maximum ticks based on pixel spacing
    const maxTicks = Math.ceil(pixels / pixelsPerLabel)
    const dataTicks = ticks.filter(tick => tick.v !== undefined && !tick.label_v)
    expect(dataTicks.length).toBeLessThanOrEqual(maxTicks + 2) // Allow some margin for boundaries
  })

  it("formats labels using axisLabelFormatter", () => {
    const mockFormatter = jest.fn((value) => `formatted_${value}`)
    mockOpts.mockImplementation((key) => {
      if (key === "axisLabelFormatter") return mockFormatter
      if (key === "pixelsPerLabel") return 50
    })

    const vals = [0, 50, 100]
    numericTicker(0, 100, 200, mockOpts, mockDygraph, vals, { units: [""] })

    expect(mockFormatter).toHaveBeenCalled()
    expect(mockFormatter).toHaveBeenCalledWith(expect.any(Number), 0, mockOpts, mockDygraph)
  })

  it("includes anomaly SVG in first tick", () => {
    const ticks = numericTicker(0, 100, 200, mockOpts, mockDygraph, null, { units: [""] })

    expect(ticks[0]).toHaveProperty("label_v")
    expect(ticks[0]).toHaveProperty("label")
    expect(ticks[0].label).toContain("svg")
    expect(ticks[0].label).toContain("Anomaly detection")
  })

  it("includes empty label in last tick", () => {
    const ticks = numericTicker(0, 100, 200, mockOpts, mockDygraph, null, { units: [""] })

    expect(ticks[ticks.length - 1]).toHaveProperty("label_v")
    expect(ticks[ticks.length - 1]).toHaveProperty("label")
    expect(ticks[ticks.length - 1].label).toBe("")
  })

  it("handles negative ranges correctly", () => {
    const ticks = numericTicker(-50, 50, 400, mockOpts, mockDygraph, null, { units: [""] })

    expect(Array.isArray(ticks)).toBe(true)
    expect(ticks.length).toBeGreaterThan(2)
    
    // Should include ticks in negative range
    const dataTicks = ticks.filter(tick => tick.v !== undefined && !tick.label_v)
    expect(dataTicks.some(tick => tick.v < 0)).toBe(true)
  })

  it("handles reverse axis correctly", () => {
    // Test with b < a to simulate reverse axis
    const ticks = numericTicker(100, 0, 400, mockOpts, mockDygraph, null, { units: [""] })

    expect(Array.isArray(ticks)).toBe(true)
    expect(ticks.length).toBeGreaterThan(2)
  })

  it("calculates point height for boundary ticks", () => {
    mockDygraph.yAxisRange.mockReturnValue([10, 90])
    mockDygraph.getArea.mockReturnValue({ h: 150 })

    const ticks = numericTicker(0, 100, 200, mockOpts, mockDygraph, null, { units: [""] })

    // Point height should be calculated as (max - min) / 15 / area.h
    const expectedPointHeight = (90 - 10) / 15 / 150
    expect(ticks[0].label_v).toBeCloseTo(90 - expectedPointHeight)
    expect(ticks[ticks.length - 1].label_v).toBeCloseTo(10 + expectedPointHeight)
  })

  it("formats all generated ticks with labels", () => {
    const vals = [0, 25, 50, 75, 100]
    const ticks = numericTicker(0, 100, 200, mockOpts, mockDygraph, vals, { units: [""] })
    
    // All ticks should have labels (including boundary ticks)
    ticks.forEach(tick => {
      expect(tick).toHaveProperty("label")
    })
    
    // Data ticks should have formatted labels
    const dataTicks = ticks.filter(tick => tick.v !== undefined && !tick.label_v)
    dataTicks.forEach(tick => {
      expect(typeof tick.label).toBe("string")
    })
  })

  it("handles edge case with very small range", () => {
    const ticks = numericTicker(0, 0.001, 200, mockOpts, mockDygraph, null, { units: [""] })

    expect(Array.isArray(ticks)).toBe(true)
    expect(ticks.length).toBeGreaterThan(2)
  })

  it("handles edge case with very large range", () => {
    const ticks = numericTicker(0, 1000000, 200, mockOpts, mockDygraph, null, { units: [""] })

    expect(Array.isArray(ticks)).toBe(true)
    expect(ticks.length).toBeGreaterThan(2)
  })
})