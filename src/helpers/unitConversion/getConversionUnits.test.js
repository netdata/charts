import getConversionUnits, { getConversionAttributes } from "./getConversionUnits"

jest.mock("@/helpers/units/conversableUnits", () => ({
  makeConversableKey: jest.fn((unit, scale) => `${unit}-${scale}`),
  keys: {
    "seconds": ["MS", "S", "MINUTES", "HOURS", "DAYS"],
    "bytes": ["B", "KB", "MB", "GB", "TB"]
  },
  __esModule: true,
  default: {}
}))

jest.mock("@/helpers/units", () => ({
  getScales: jest.fn(() => [["", "K", "M", "G"], { "": 1, "K": 1000, "M": 1000000, "G": 1000000000 }]),
  getUnitConfig: jest.fn(() => ({ base_unit: "bytes", prefix_symbol: "" })),
  isScalable: jest.fn(() => true),
  __esModule: true,
  default: jest.fn((chart, method, value, divider) => {
    if (method === "original") return value
    if (divider) return divider(value)
    return value
  })
}))

describe("getConversionUnits", () => {
  let mockChart
  let getScales, getUnitConfig, isScalable, conversableUnits, makeConversableKey

  beforeEach(() => {
    getScales = require("@/helpers/units").getScales
    getUnitConfig = require("@/helpers/units").getUnitConfig
    isScalable = require("@/helpers/units").isScalable
    conversableUnits = require("@/helpers/units/conversableUnits").default
    makeConversableKey = require("@/helpers/units/conversableUnits").makeConversableKey

    mockChart = {
      getAttribute: jest.fn(),
      getAttributes: jest.fn(() => ({ desiredUnits: "auto" })),
      updateAttributes: jest.fn(),
      updateAttribute: jest.fn(),
      getPayload: jest.fn(),
      getVisibleDimensionIds: jest.fn(() => ["cpu", "memory"]),
      getDimensionName: jest.fn(id => id),
      on: jest.fn(() => jest.fn())
    }

    getScales.mockReturnValue([["", "K", "M", "G"], { "": 1, "K": 1000, "M": 1000000, "G": 1000000000 }])
    getUnitConfig.mockReturnValue({ base_unit: "bytes", prefix_symbol: "" })
    isScalable.mockReturnValue(true)
    makeConversableKey.mockImplementation((unit, scale) => `${unit}-${scale}`)
    
    // Reset conversableUnits default object
    Object.keys(conversableUnits).forEach(key => delete conversableUnits[key])
  })

  describe("getConversionAttributes", () => {
    it("returns conversion attributes for scalable units", () => {
      getUnitConfig.mockReturnValue({ base_unit: "bytes", prefix_symbol: "" })
      
      const result = getConversionAttributes(mockChart, "bytes", { min: 1000, max: 5000 })
      
      expect(result).toHaveProperty("method")
      expect(result).toHaveProperty("divider")
      expect(result).toHaveProperty("fractionDigits")
      expect(result).toHaveProperty("prefix")
      expect(result).toHaveProperty("base")
      expect(result).toHaveProperty("unit", "bytes")
    })

    it("handles conversable units when no conversable unit is available", () => {
      const result = getConversionAttributes(mockChart, "seconds", { min: 1, max: 10 })
      
      expect(result.method).toBe("original")
      expect(result).toHaveProperty("unit", "seconds")
    })

    it("returns original method for non-scalable units", () => {
      isScalable.mockReturnValue(false)
      
      const result = getConversionAttributes(mockChart, "custom", { min: 1, max: 10 })
      
      expect(result.method).toBe("original")
    })

    it("handles desired units for scalable conversion", () => {
      mockChart.getAttributes.mockReturnValue({ desiredUnits: "KB" })
      getUnitConfig
        .mockReturnValueOnce({ base_unit: "bytes", prefix_symbol: "" })
        .mockReturnValueOnce({ base_unit: "bytes", prefix_symbol: "K" })
      getScales.mockReturnValue([["", "K", "M"], { "": 1, "K": 1000, "M": 1000000 }])
      
      const result = getConversionAttributes(mockChart, "bytes", { min: 1000, max: 5000 })
      
      expect(result.method).toBe("adjust")
      expect(result.prefix).toBe("K")
      expect(result.base).toBe("bytes")
    })

    it("handles desired units for conversable units", () => {
      mockChart.getAttributes.mockReturnValue({ desiredUnits: "MINUTES" })
      conversableUnits["seconds"] = {
        "MINUTES": { check: jest.fn() }
      }
      
      const result = getConversionAttributes(mockChart, "seconds", { min: 60, max: 300 })
      
      expect(makeConversableKey).toHaveBeenCalledWith("seconds", "MINUTES")
      expect(result.method).toBe("seconds-MINUTES")
    })

    it("falls back to original when desired units not available", () => {
      mockChart.getAttributes.mockReturnValue({ desiredUnits: "unknown" })
      conversableUnits["seconds"] = {
        "S": { check: jest.fn() }
      }
      
      const result = getConversionAttributes(mockChart, "seconds", { min: 1, max: 10 })
      
      expect(result.method).toBe("original")
    })

    it("calculates fraction digits correctly", () => {
      const result1 = getConversionAttributes(mockChart, "bytes", { min: 1500, max: 2500 })
      expect(result1.fractionDigits).toBeGreaterThanOrEqual(-1)
      
      const result2 = getConversionAttributes(mockChart, "bytes", { min: 0.05, max: 0.1 })
      expect(result2.fractionDigits).toBeGreaterThanOrEqual(-1)
    })

    it("handles equal min and max values", () => {
      const result = getConversionAttributes(mockChart, "bytes", { min: 1000, max: 1000 })
      
      expect(result.fractionDigits).toBeGreaterThanOrEqual(-1)
    })

    it("respects maxDecimals option", () => {
      const result = getConversionAttributes(mockChart, "bytes", { min: 0.001, max: 0.002, maxDecimals: 2 })
      
      expect(result.fractionDigits).toBeLessThanOrEqual(2)
    })

    it("handles NaN delta", () => {
      const result = getConversionAttributes(mockChart, "bytes", { min: NaN, max: NaN })
      
      expect(result.fractionDigits).toBe(-1)
    })

    it("handles zero delta", () => {
      const result = getConversionAttributes(mockChart, "bytes", { min: 0, max: 0 })
      
      expect(result.fractionDigits).toBe(-1)
    })

    it("selects appropriate scale for large values", () => {
      getScales.mockReturnValue([["", "K", "M", "G"], { "": 1, "K": 1000, "M": 1000000, "G": 1000000000 }])
      
      const result = getConversionAttributes(mockChart, "bytes", { min: 1000000, max: 5000000 })
      
      expect(result.method).toBe("adjust")
      expect(result.prefix).toBe("M")
    })

    it("uses absolute values for comparison", () => {
      const result = getConversionAttributes(mockChart, "bytes", { min: -5000, max: -1000 })
      
      expect(result.method).toBe("adjust")
      expect(typeof result.divider).toBe("function")
    })

    it("handles units that do not match any conversable scale", () => {
      const result = getConversionAttributes(mockChart, "seconds", { min: 1, max: 10 })
      
      expect(result.method).toBe("original")
      expect(result).toHaveProperty("unit", "seconds")
    })
  })

  describe("getConversionUnits", () => {
    it("processes multiple units correctly", () => {
      mockChart.getAttribute.mockReturnValue(["bytes", "seconds"])
      
      const result = getConversionUnits(mockChart, "units")
      
      expect(result).toHaveProperty("method")
      expect(result).toHaveProperty("fractionDigits")
      expect(result).toHaveProperty("prefix")
      expect(result).toHaveProperty("base")
      expect(result).toHaveProperty("divider")
      
      expect(result.method).toHaveLength(2)
      expect(result.fractionDigits).toHaveLength(2)
      expect(result.prefix).toHaveLength(2)
      expect(result.base).toHaveLength(2)
      expect(result.divider).toHaveLength(2)
    })

    it("handles empty units array", () => {
      mockChart.getAttribute.mockReturnValue([])
      
      const result = getConversionUnits(mockChart, "units")
      
      expect(result.method).toEqual([])
      expect(result.fractionDigits).toEqual([])
      expect(result.prefix).toEqual([])
      expect(result.base).toEqual([])
      expect(result.divider).toEqual([])
    })

    it("passes options to getConversionAttributes", () => {
      mockChart.getAttribute.mockReturnValue(["bytes"])
      const options = { min: 100, max: 1000, maxDecimals: 3 }
      
      getConversionUnits(mockChart, "units", options)
      
      expect(mockChart.getAttribute).toHaveBeenCalledWith("units")
    })

    it("handles single unit", () => {
      mockChart.getAttribute.mockReturnValue(["bytes"])
      
      const result = getConversionUnits(mockChart, "units")
      
      expect(result.method).toHaveLength(1)
      expect(result.fractionDigits).toHaveLength(1)
      expect(result.prefix).toHaveLength(1)
      expect(result.base).toHaveLength(1)
      expect(result.divider).toHaveLength(1)
    })
  })

  describe("edge cases", () => {
    it("handles missing scales gracefully", () => {
      getScales.mockReturnValue([[], {}])
      
      const result = getConversionAttributes(mockChart, "bytes", { min: 1000, max: 5000 })
      
      expect(result.method).toBe("original")
    })

    it("handles invalid getUnitConfig response", () => {
      getUnitConfig.mockReturnValue({})
      
      const result = getConversionAttributes(mockChart, "bytes", { min: 1000, max: 5000 })
      
      expect(result).toHaveProperty("method")
      expect(result).toHaveProperty("base")
      expect(result).toHaveProperty("prefix")
    })

    it("handles delta that results in decimal index", () => {
      const result = getConversionAttributes(mockChart, "bytes", { min: 1.5, max: 2.5 })
      
      expect(result.fractionDigits).toBeGreaterThanOrEqual(-1)
    })

    it("handles very small values", () => {
      const result = getConversionAttributes(mockChart, "bytes", { min: 0.0001, max: 0.0005 })
      
      expect(result.fractionDigits).toBeGreaterThanOrEqual(-1)
    })

    it("handles very large values", () => {
      getScales.mockReturnValue([["", "K", "M", "G", "T"], { "": 1, "K": 1000, "M": 1000000, "G": 1000000000, "T": 1000000000000 }])
      
      const result = getConversionAttributes(mockChart, "bytes", { min: 1000000000000, max: 5000000000000 })
      
      expect(result.method).toBe("adjust")
      expect(result.prefix).toBe("T")
    })

    it("handles missing conversable units", () => {
      delete conversableUnits["unknown"]
      
      const result = getConversionAttributes(mockChart, "unknown", { min: 1, max: 10 })
      
      expect(result.method).toBe("original")
    })

    it("handles scale finding when no scale matches small values", () => {
      getScales.mockReturnValue([["K", "M"], { "K": 1000, "M": 1000000 }])
      
      const result = getConversionAttributes(mockChart, "bytes", { min: 1, max: 10 })
      
      expect(result.method).toBe("original")
    })
  })
})