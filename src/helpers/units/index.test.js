import unitConverter, {
  unitsMissing,
  getUnitConfig,
  getAlias,
  isScalable,
  isMetric,
  isBinary,
  isBit,
  getScales,
  getUnitsString,
} from "."
import allUnits from "./all"
import scalableUnits from "./scalableUnits"

describe("units helpers", () => {
  describe("unitsMissing", () => {
    it("returns true for undefined units", () => {
      expect(unitsMissing("nonexistent_unit")).toBe(true)
    })

    it("returns false for existing units", () => {
      expect(unitsMissing("By")).toBe(false)
      expect(unitsMissing("s")).toBe(false)
      expect(unitsMissing("%")).toBe(false)
    })

    it("returns boolean for any input", () => {
      expect(typeof unitsMissing("any_unit")).toBe("boolean")
      expect(typeof unitsMissing("")).toBe("boolean")
      expect(typeof unitsMissing(null)).toBe("boolean")
      expect(typeof unitsMissing(undefined)).toBe("boolean")
    })
  })

  describe("getUnitConfig", () => {
    it("returns config object with required properties", () => {
      const config = getUnitConfig("By")
      expect(config).toHaveProperty("is_scalable", true)
      expect(config).toHaveProperty("is_metric", true)
      expect(config).toHaveProperty("is_binary", true)
      expect(config).toHaveProperty("print_symbol", "B")
      expect(config).toHaveProperty("name", "bytes")
      // is_bit is added by getUnitConfig for unknown units, but By doesn't have it
      expect(config.is_bit).toBeUndefined()
    })

    it("returns actual unit config for known units", () => {
      const config = getUnitConfig("s")
      expect(config.is_metric).toBe(true)
      expect(config.is_scalable).toBe(true)
      expect(config.print_symbol).toBe("s")
      expect(config.name).toBe("seconds")
    })

    it("returns default config for unknown units", () => {
      const config = getUnitConfig("unknown_unit")
      expect(config).toEqual({
        is_scalable: true,
        is_metric: false,
        is_binary: false,
        is_bit: false,
        print_symbol: "unknown_unit",
        name: "unknown_unit",
      })
    })

    it("handles null units", () => {
      const config = getUnitConfig(null)
      expect(config.print_symbol).toBe("")
      expect(config.name).toBe("")
    })

    it("handles undefined units", () => {
      const config = getUnitConfig(undefined)
      expect(config.print_symbol).toBe("")
      expect(config.name).toBe("")
    })

    it("preserves unit string for unknown units", () => {
      const config = getUnitConfig("custom/second")
      expect(config.print_symbol).toBe("custom/second")
      expect(config.name).toBe("custom/second")
    })
  })

  describe("getAlias", () => {
    it("returns alias for known aliases", () => {
      expect(getAlias("% of time working")).toBe("%")
      expect(getAlias("seconds")).toBe("s")
      expect(getAlias("bytes")).toBe("By")
    })

    it("returns original unit if no alias exists but unit is known", () => {
      expect(getAlias("By")).toBe("By")
      expect(getAlias("s")).toBe("s")
      expect(getAlias("%")).toBe("%")
    })

    it("finds curly brace variants", () => {
      // Test with actual curly brace units from all.js
      const result = getAlias("custom")
      // If {custom} doesn't exist, it should return "custom"
      expect(typeof result).toBe("string")
    })

    it("handles units with slashes", () => {
      // Mock the all.js structure to test slash handling
      // Test with existing slash patterns from all.js
      // actions/s is aliased to {action}/s
      expect(getAlias("actions/s")).toBe("{action}/s")
    })

    it("returns original unit if no match found", () => {
      expect(getAlias("completely_unknown")).toBe("completely_unknown")
    })
  })

  describe("isScalable", () => {
    it("returns true for scalable units", () => {
      expect(isScalable("By")).toBe(true)
      expect(isScalable("s")).toBe(true)
      expect(isScalable("bit")).toBe(true)
    })

    it("returns false for non-scalable units", () => {
      expect(isScalable("%")).toBe(false)
      // Most units default to scalable, find actual non-scalable ones
      const config = getUnitConfig("%")
      expect(config.is_scalable).toBe(false)
    })

    it("handles string input", () => {
      expect(isScalable("unknown_unit")).toBe(true) // defaults to scalable
    })

    it("handles unit config object input", () => {
      const scalableConfig = { is_scalable: true }
      const nonScalableConfig = { is_scalable: false }

      expect(isScalable(scalableConfig)).toBe(true)
      expect(isScalable(nonScalableConfig)).toBe(false)
    })

    it("handles empty or undefined input", () => {
      expect(isScalable("")).toBe(true)
      expect(isScalable()).toBe(true)
      expect(isScalable(null)).toBeUndefined()
    })
  })

  describe("isMetric", () => {
    it("returns true for metric units", () => {
      expect(isMetric("s")).toBe(true)
      expect(isMetric("By")).toBe(true) // bytes is metric in all.js
    })

    it("returns false for non-metric units", () => {
      expect(isMetric("%")).toBe(false)
      // Note: By (bytes) is actually metric:true in all.js
    })

    it("handles unit config object input", () => {
      const metricConfig = { is_metric: true }
      const nonMetricConfig = { is_metric: false }

      expect(isMetric(metricConfig)).toBe(true)
      expect(isMetric(nonMetricConfig)).toBe(false)
    })

    it("handles empty or undefined input", () => {
      expect(isMetric("")).toBe(false)
      expect(isMetric()).toBe(false)
    })
  })

  describe("isBinary", () => {
    it("returns true for binary units", () => {
      expect(isBinary("By")).toBe(true)
    })

    it("returns false for non-binary units", () => {
      expect(isBinary("s")).toBe(false)
      expect(isBinary("bit")).toBe(false)
      expect(isBinary("%")).toBe(false)
    })

    it("handles unit config object input", () => {
      const binaryConfig = { is_binary: true }
      const nonBinaryConfig = { is_binary: false }

      expect(isBinary(binaryConfig)).toBe(true)
      expect(isBinary(nonBinaryConfig)).toBe(false)
    })

    it("handles empty or undefined input", () => {
      expect(isBinary("")).toBe(false)
      expect(isBinary()).toBe(false)
    })
  })

  describe("isBit", () => {
    it("returns true for bit units", () => {
      expect(isBit("bit")).toBe(true)
    })

    it("returns false for non-bit units", () => {
      // Units without is_bit property return undefined
      expect(isBit("By")).toBeUndefined()
      expect(isBit("s")).toBeUndefined()
      expect(isBit("%")).toBeUndefined()
    })

    it("handles unit config object input", () => {
      const bitConfig = { is_bit: true }
      const nonBitConfig = { is_bit: false }

      expect(isBit(bitConfig)).toBe(true)
      expect(isBit(nonBitConfig)).toBe(false)
    })

    it("handles empty or undefined input", () => {
      expect(isBit("")).toBe(false)
      expect(isBit()).toBe(false)
    })
  })

  describe("getScales", () => {
    it("returns empty arrays for non-scalable units", () => {
      const [keys, values] = getScales("%")
      expect(keys).toEqual([])
      expect(values).toEqual({})
    })

    it("returns binary scales for binary units", () => {
      const [keys, values] = getScales("By")
      expect(keys).toContain("1")
      expect(keys).toContain("Ki")
      expect(keys).toContain("Mi")
      expect(values).toBe(scalableUnits.binary)
    })

    it("returns num scales for bit units", () => {
      const [keys, values] = getScales("bit")
      expect(keys).toContain("1")
      expect(keys).toContain("k")
      expect(keys).toContain("M")
      expect(values).toBe(scalableUnits.num)
    })

    it("returns num scales for metric units", () => {
      const [keys, values] = getScales("s")
      expect(keys).toContain("1")
      expect(keys).toContain("k")
      expect(keys).toContain("m")
      expect(keys).toContain("u")
      expect(values).toBe(scalableUnits.num)
    })

    it("returns decimal scales for other scalable units", () => {
      const [keys, values] = getScales("unknown_scalable")
      expect(keys).toEqual(["1", "K", "M", "B", "T"])
      expect(values).toBe(scalableUnits.decimal)
    })
  })

  describe("getUnitsString", () => {
    it("returns base label for non-scalable units", () => {
      const result = getUnitsString("%", "", "%")
      expect(result).toBe("%")
    })

    it("returns base label with config for non-scalable units", () => {
      const config = { print_symbol: "%", name: "percentage" }
      const result = getUnitsString(config, "", "percent")
      expect(result).toBe("%")
    })

    it("returns long name when requested for non-scalable units", () => {
      const config = { print_symbol: "%", name: "percentage" }
      const result = getUnitsString(config, "", "percent", true)
      expect(result).toBe("percentage")
    })

    it("combines prefix and base for metric units", () => {
      const result = getUnitsString("s", "k", "s")
      expect(result).toBe("ks")
    })

    it("combines prefix and base for binary units", () => {
      const result = getUnitsString("By", "Ki", "B")
      expect(result).toBe("KiB")
    })

    it("combines prefix and base for bit units", () => {
      const result = getUnitsString("bit", "k", "bit")
      expect(result).toBe("kbit")
    })

    it("uses decimal prefix format for other units", () => {
      const result = getUnitsString("unknown_scalable", "K", "items")
      expect(result).toBe("K items")
    })

    it("handles empty prefix", () => {
      const result = getUnitsString("s", "", "s")
      expect(result).toBe("s")
    })

    it("handles long format for prefixes", () => {
      const result = getUnitsString("s", "k", "seconds", true)
      expect(result).toBe("kiloseconds")
    })

    it("trims whitespace correctly", () => {
      const result = getUnitsString("unknown", "", "")
      expect(result).toBe("")
    })
  })

  describe("default export (unitConverter)", () => {
    let mockChart

    beforeEach(() => {
      mockChart = {
        getAttribute: jest.fn(),
        updateAttribute: jest.fn(),
      }
    })

    it("returns original value for original method", () => {
      const result = unitConverter(mockChart, "original", 100)
      expect(result).toBe(100)
    })

    it("divides value for divide method", () => {
      const result = unitConverter(mockChart, "divide", 1000, 10)
      expect(result).toBe(100)
    })

    it("applies make function for adjust method", () => {
      const makeFn = jest.fn(value => value * 2)
      const result = unitConverter(mockChart, "adjust", 50, makeFn)
      expect(result).toBe(100)
      expect(makeFn).toHaveBeenCalledWith(50)
    })

    it("falls back to original for unknown methods", () => {
      const result = unitConverter(mockChart, "unknown_method", 42)
      expect(result).toBe(42)
    })

    it("handles conversable unit methods", () => {
      // This would be tested more thoroughly with actual conversableUnits data
      const result = unitConverter(mockChart, "seconds-ms", 1000)
      expect(typeof result).toBe("number")
    })

    it("handles null/undefined values gracefully", () => {
      expect(unitConverter(mockChart, "original", null)).toBeNull()
      expect(unitConverter(mockChart, "original", undefined)).toBeUndefined()
      expect(unitConverter(mockChart, "original", 0)).toBe(0)
    })
  })

  describe("edge cases and error handling", () => {
    it("handles malformed unit strings", () => {
      expect(() => getUnitConfig("")).not.toThrow()
      expect(() => getAlias("")).not.toThrow()
      expect(() => isScalable("")).not.toThrow()
    })

    it("handles numeric inputs where strings expected", () => {
      expect(() => getUnitConfig(123)).not.toThrow()
      expect(() => getAlias(123)).not.toThrow()
    })

    it("handles complex slash patterns in getAlias", () => {
      // Test deep slash patterns
      const complexUnit = "requests/per/second/avg"
      const result = getAlias(complexUnit)
      expect(typeof result).toBe("string")
    })

    it("preserves object references for scale data", () => {
      const [, binaryScales] = getScales("By")
      const [, metricScales] = getScales("s")

      expect(binaryScales).toBe(scalableUnits.binary)
      expect(metricScales).toBe(scalableUnits.num)
    })
  })
})
