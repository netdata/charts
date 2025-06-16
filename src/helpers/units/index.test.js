import unitConverter, { 
  unitsMissing, 
  getUnitConfig, 
  getAlias, 
  isScalable, 
  isMetric, 
  isBinary, 
  isBit, 
  getScales, 
  getUnitsString 
} from "."
import allUnits from "./all"
import scalableUnits from "./scalableUnits"

// Mock the all.js file with representative data
jest.mock("./all", () => ({
  __esModule: true,
  default: {
    prefixes: {
      "Y": { symbol: "Y", name: "yotta", print_symbol: "Y", value: 1e24, is_binary: false },
      "k": { symbol: "k", name: "kilo", print_symbol: "k", value: 1000, is_binary: false },
      "m": { symbol: "m", name: "milli", print_symbol: "m", value: 0.001, is_binary: false },
      "Ki": { symbol: "Ki", name: "kibi", print_symbol: "Ki", value: 1024, is_binary: true },
      "Mi": { symbol: "Mi", name: "mebi", print_symbol: "Mi", value: 1048576, is_binary: true }
    },
    decimal_prefixes: {
      "K": { symbol: "K", name: "thousand", print_symbol: "K", value: 1000 },
      "M": { symbol: "M", name: "million", print_symbol: "M", value: 1000000 },
      "B": { symbol: "B", name: "billion", print_symbol: "B", value: 1000000000 }
    },
    units: {
      "bytes": {
        symbol: "bytes", name: "bytes", print_symbol: "B",
        is_metric: false, is_scalable: true, is_binary: true, is_bit: false
      },
      "bits": {
        symbol: "bits", name: "bits", print_symbol: "bits",
        is_metric: false, is_scalable: true, is_binary: false, is_bit: true
      },
      "seconds": {
        symbol: "seconds", name: "seconds", print_symbol: "s",
        is_metric: true, is_scalable: true, is_binary: false, is_bit: false
      },
      "percentage": {
        symbol: "percentage", name: "percentage", print_symbol: "%",
        is_metric: false, is_scalable: false, is_binary: false, is_bit: false
      },
      "mm:ss": {
        symbol: "mm:ss", name: "minutes", print_symbol: "mm:ss",
        is_metric: false, is_scalable: false, is_binary: false, is_bit: false
      },
      "{custom}": {
        symbol: "{custom}", name: "custom unit", print_symbol: "custom",
        is_metric: false, is_scalable: true, is_binary: false, is_bit: false
      }
    },
    aliases: {
      "% of time working": "%",
      "pct": "percentage",
      "sec": "seconds",
      "B": "bytes"
    }
  }
}))

describe("units helpers", () => {
  describe("unitsMissing", () => {
    it("returns true for undefined units", () => {
      expect(unitsMissing("nonexistent_unit")).toBe(true)
    })

    it("returns false for existing units", () => {
      expect(unitsMissing("bytes")).toBe(false)
      expect(unitsMissing("seconds")).toBe(false)
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
      const config = getUnitConfig("bytes")
      expect(config).toHaveProperty("is_scalable", true)
      expect(config).toHaveProperty("is_metric", false)
      expect(config).toHaveProperty("is_binary", true)
      expect(config).toHaveProperty("is_bit", false)
      expect(config).toHaveProperty("print_symbol", "B")
      expect(config).toHaveProperty("name", "bytes")
    })

    it("returns actual unit config for known units", () => {
      const config = getUnitConfig("seconds")
      expect(config.is_metric).toBe(true)
      expect(config.is_scalable).toBe(true)
      expect(config.print_symbol).toBe("s")
    })

    it("returns default config for unknown units", () => {
      const config = getUnitConfig("unknown_unit")
      expect(config).toEqual({
        is_scalable: true,
        is_metric: false,
        is_binary: false,
        is_bit: false,
        print_symbol: "unknown_unit",
        name: "unknown_unit"
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
      expect(getAlias("pct")).toBe("percentage")
      expect(getAlias("sec")).toBe("seconds")
    })

    it("returns original unit if no alias exists but unit is known", () => {
      expect(getAlias("bytes")).toBe("bytes")
      expect(getAlias("seconds")).toBe("seconds")
    })

    it("finds curly brace variants", () => {
      expect(getAlias("custom")).toBe("{custom}")
    })

    it("handles units with slashes", () => {
      // Mock the all.js structure to test slash handling
      allUnits.units["{requests}/s"] = { symbol: "{requests}/s" }
      expect(getAlias("requests/s")).toBe("{requests}/s")
      
      allUnits.units["bytes/{time}"] = { symbol: "bytes/{time}" }
      expect(getAlias("bytes/time")).toBe("bytes/{time}")
    })

    it("returns original unit if no match found", () => {
      expect(getAlias("completely_unknown")).toBe("completely_unknown")
    })
  })

  describe("isScalable", () => {
    it("returns true for scalable units", () => {
      expect(isScalable("bytes")).toBe(true)
      expect(isScalable("seconds")).toBe(true)
      expect(isScalable("bits")).toBe(true)
    })

    it("returns false for non-scalable units", () => {
      expect(isScalable("percentage")).toBe(false)
      expect(isScalable("mm:ss")).toBe(false)
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
      expect(isMetric("seconds")).toBe(true)
    })

    it("returns false for non-metric units", () => {
      expect(isMetric("bytes")).toBe(false)
      expect(isMetric("bits")).toBe(false)
      expect(isMetric("percentage")).toBe(false)
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
      expect(isBinary("bytes")).toBe(true)
    })

    it("returns false for non-binary units", () => {
      expect(isBinary("seconds")).toBe(false)
      expect(isBinary("bits")).toBe(false)
      expect(isBinary("percentage")).toBe(false)
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
      expect(isBit("bits")).toBe(true)
    })

    it("returns false for non-bit units", () => {
      expect(isBit("bytes")).toBe(false)
      expect(isBit("seconds")).toBe(false)
      expect(isBit("percentage")).toBe(false)
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
      const [keys, values] = getScales("percentage")
      expect(keys).toEqual([])
      expect(values).toEqual({})
    })

    it("returns binary scales for binary units", () => {
      const [keys, values] = getScales("bytes")
      expect(keys).toEqual(["1", "Ki", "Mi", "Gi", "Ti"])
      expect(values).toBe(scalableUnits.binary)
    })

    it("returns num scales for bit units", () => {
      const [keys, values] = getScales("bits")
      expect(keys).toEqual(["1", "k", "M", "G", "T", "P", "E", "Z", "Y"])
      expect(values).toBe(scalableUnits.num)
    })

    it("returns num scales for metric units", () => {
      const [keys, values] = getScales("seconds")
      expect(keys).toEqual(["y", "z", "a", "f", "p", "n", "u", "m", "1", "k", "M", "G", "T", "P", "E", "Z", "Y"])
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
      const result = getUnitsString("percentage", "", "percent")
      expect(result).toBe("percent")
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
      const result = getUnitsString("seconds", "k", "seconds")
      expect(result).toBe("kseconds")
    })

    it("combines prefix and base for binary units", () => {
      const result = getUnitsString("bytes", "Ki", "bytes")
      expect(result).toBe("Kibytes")
    })

    it("combines prefix and base for bit units", () => {
      const result = getUnitsString("bits", "k", "bits")
      expect(result).toBe("kbits")
    })

    it("uses decimal prefix format for other units", () => {
      const result = getUnitsString("unknown_scalable", "K", "items")
      expect(result).toBe("K items")
    })

    it("handles empty prefix", () => {
      const result = getUnitsString("seconds", "", "seconds")
      expect(result).toBe("seconds")
    })

    it("handles long format for prefixes", () => {
      const result = getUnitsString("seconds", "k", "seconds", true)
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
        updateAttribute: jest.fn()
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
      const [, binaryScales] = getScales("bytes")
      const [, metricScales] = getScales("seconds")
      
      expect(binaryScales).toBe(scalableUnits.binary)
      expect(metricScales).toBe(scalableUnits.num)
    })
  })
})