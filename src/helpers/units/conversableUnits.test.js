import conversableUnits, { makeConversableKey, keys } from "./conversableUnits"

// Mock zeropad since we're focusing on the conversion logic
jest.mock("@/helpers/zeropad", () => jest.fn(val => String(val).padStart(2, "0")))

describe("conversableUnits", () => {
  describe("makeConversableKey", () => {
    it("creates key from unit and scale", () => {
      expect(makeConversableKey("seconds", "ms")).toBe("seconds-ms")
      expect(makeConversableKey("bytes", "KB")).toBe("bytes-KB")
    })

    it("handles empty strings", () => {
      expect(makeConversableKey("", "")).toBe("-")
      expect(makeConversableKey("unit", "")).toBe("unit-")
      expect(makeConversableKey("", "scale")).toBe("-scale")
    })
  })

  describe("keys export", () => {
    it("contains expected unit types", () => {
      expect(keys).toHaveProperty("Cel")
      expect(keys).toHaveProperty("ns")
      expect(keys).toHaveProperty("ms")
      expect(keys).toHaveProperty("s")
    })

    it("contains correct Celsius conversion options", () => {
      expect(keys.Cel).toEqual(["[degF]"])
    })

    it("contains correct nanosecond conversion options", () => {
      expect(keys.ns).toEqual(["ns", "us", "ms", "s"])
    })

    it("contains correct millisecond conversion options", () => {
      expect(keys.ms).toEqual(["us", "ms", "s", "a:mo:d", "mo:d:h", "d:h:mm", "h:mm:ss", "mm:ss"])
    })

    it("contains correct second conversion options", () => {
      expect(keys.s).toEqual(["us", "ms", "s", "a:mo:d", "mo:d:h", "d:h:mm", "h:mm:ss", "mm:ss", "dHH:MM:ss"])
    })
  })

  describe("Celsius conversions", () => {
    let mockChart

    beforeEach(() => {
      mockChart = {
        getAttribute: jest.fn()
      }
    })

    it("converts Celsius to Fahrenheit when temperature is fahrenheit", () => {
      mockChart.getAttribute.mockReturnValue("fahrenheit")
      
      const converter = conversableUnits.Cel["[degF]"]
      expect(converter.check(mockChart)).toBe(true)
      expect(converter.convert(0)).toBe(32) // 0°C = 32°F
      expect(converter.convert(100)).toBe(212) // 100°C = 212°F
      expect(converter.convert(-40)).toBe(-40) // -40°C = -40°F
    })

    it("does not convert when temperature is not fahrenheit", () => {
      mockChart.getAttribute.mockReturnValue("celsius")
      
      const converter = conversableUnits.Cel["[degF]"]
      expect(converter.check(mockChart)).toBe(false)
    })
  })

  describe("nanosecond conversions", () => {
    let mockChart

    beforeEach(() => {
      mockChart = {
        getAttribute: jest.fn(() => true) // secondsAsTime is true
      }
    })

    it("converts to nanoseconds for values < 1000", () => {
      const converter = conversableUnits.ns.ns
      expect(converter.check(mockChart, 999)).toBe(true)
      expect(converter.check(mockChart, 1000)).toBe(false)
      
      const result = converter.convert(123)
      expect(typeof result).toBe("string")
      expect(result).toMatch(/^\d+\.\d+$/)
    })

    it("converts to microseconds for values 1000-999999", () => {
      const converter = conversableUnits.ns.us
      expect(converter.check(mockChart, 1000)).toBe(true)
      expect(converter.check(mockChart, 999999)).toBe(true)
      expect(converter.check(mockChart, 1000000)).toBe(false)
      
      const result = converter.convert(1500)
      expect(typeof result).toBe("string")
      expect(result).toMatch(/^\d+\.\d+$/)
    })

    it("converts to milliseconds for values 1M-999M", () => {
      const converter = conversableUnits.ns.ms
      expect(converter.check(mockChart, 1000000)).toBe(true)
      expect(converter.check(mockChart, 999999999)).toBe(true)
      expect(converter.check(mockChart, 1000000000)).toBe(false)
      
      const result = converter.convert(1500000)
      expect(typeof result).toBe("string")
      expect(result).toMatch(/^\d+\.\d+$/)
    })

    it("converts to seconds for values >= 1B", () => {
      const converter = conversableUnits.ns.s
      expect(converter.check(mockChart, 1000000000)).toBe(true)
      expect(converter.check(mockChart, 5000000000)).toBe(true)
      
      const result = converter.convert(1500000000)
      expect(typeof result).toBe("string")
      expect(result).toMatch(/^\d+\.\d+$/)
    })

    it("does not convert when secondsAsTime is false", () => {
      mockChart.getAttribute.mockReturnValue(false)
      
      expect(conversableUnits.ns.ns.check(mockChart, 500)).toBe(false)
      expect(conversableUnits.ns.us.check(mockChart, 5000)).toBe(false)
    })
  })

  describe("millisecond conversions", () => {
    let mockChart

    beforeEach(() => {
      mockChart = {
        getAttribute: jest.fn(() => true) // secondsAsTime is true
      }
    })

    it("converts to microseconds for values < 1", () => {
      const converter = conversableUnits.ms.us
      expect(converter.check(mockChart, 0.5)).toBe(true)
      expect(converter.check(mockChart, 1)).toBe(false)
      
      expect(converter.convert).toBeDefined()
      expect(typeof converter.convert(0.5)).toBe("number")
    })

    it("converts to milliseconds for values 1-999", () => {
      const converter = conversableUnits.ms.ms
      expect(converter.check(mockChart, 1)).toBe(true)
      expect(converter.check(mockChart, 999)).toBe(true)
      expect(converter.check(mockChart, 1000)).toBe(false)
      
      expect(converter.convert).toBeDefined()
    })

    it("converts to seconds for values 1000-59999", () => {
      const converter = conversableUnits.ms.s
      expect(converter.check(mockChart, 1000)).toBe(true)
      expect(converter.check(mockChart, 59999)).toBe(true)
      expect(converter.check(mockChart, 60000)).toBe(false)
      
      expect(converter.convert).toBeDefined()
    })

    it("converts to mm:ss for values 60s-59min", () => {
      const converter = conversableUnits.ms["mm:ss"]
      expect(converter.check(mockChart, 60000)).toBe(true)
      expect(converter.check(mockChart, 3599999)).toBe(true)
      expect(converter.check(mockChart, 3600000)).toBe(false)
      
      const result = converter.convert(90000) // 1.5 minutes
      expect(typeof result).toBe("string")
    })

    it("converts to h:mm:ss for values 1h-23h", () => {
      const converter = conversableUnits.ms["h:mm:ss"]
      expect(converter.check(mockChart, 3600000)).toBe(true)
      expect(converter.check(mockChart, 86399999)).toBe(true)
      expect(converter.check(mockChart, 86400000)).toBe(false)
      
      const result = converter.convert(7200000) // 2 hours
      expect(typeof result).toBe("string")
    })

    it("converts to longer time formats for larger values", () => {
      const dayConverter = conversableUnits.ms["d:h:mm"]
      expect(dayConverter.check(mockChart, 86400000)).toBe(true) // 1 day
      
      const monthConverter = conversableUnits.ms["mo:d:h"]
      expect(monthConverter.check(mockChart, 86400000 * 30)).toBe(true) // 30 days
      
      const yearConverter = conversableUnits.ms["a:mo:d"]
      expect(yearConverter.check(mockChart, 86400000 * 365)).toBe(true) // 365 days
    })
  })

  describe("second conversions", () => {
    let mockChart

    beforeEach(() => {
      mockChart = {
        getAttribute: jest.fn(() => true) // secondsAsTime is true
      }
    })

    it("converts to microseconds for very small values", () => {
      const converter = conversableUnits.s.us
      expect(converter.check(mockChart, 0.0005)).toBe(true)
      expect(converter.check(mockChart, 0.001)).toBe(false)
      
      expect(converter.convert).toBeDefined()
      expect(typeof converter.convert(0.0005)).toBe("number")
    })

    it("converts to milliseconds for small values", () => {
      const converter = conversableUnits.s.ms
      expect(converter.check(mockChart, 0.001)).toBe(true)
      expect(converter.check(mockChart, 0.999)).toBe(true)
      expect(converter.check(mockChart, 1)).toBe(false)
      
      expect(converter.convert).toBeDefined()
    })

    it("converts to seconds for values 1-59", () => {
      const converter = conversableUnits.s.s
      expect(converter.check(mockChart, 1)).toBe(true)
      expect(converter.check(mockChart, 59)).toBe(true)
      expect(converter.check(mockChart, 60)).toBe(false)
      
      expect(converter.convert).toBeDefined()
    })

    it("converts to time formats for larger values", () => {
      const mmssConverter = conversableUnits.s["mm:ss"]
      expect(mmssConverter.check(mockChart, 60)).toBe(true)
      expect(mmssConverter.check(mockChart, 3599)).toBe(true)
      
      const result = mmssConverter.convert(90) // 1.5 minutes
      expect(typeof result).toBe("string")
    })

    it("has dHH:MM:ss format that never auto-selects", () => {
      const converter = conversableUnits.s["dHH:MM:ss"]
      expect(converter.check()).toBe(false) // always false for auto-selection
      
      const result = converter.convert(90061) // > 1 day
      expect(typeof result).toBe("string")
    })
  })

  describe("conversion function behavior", () => {
    it("handles edge cases in time conversion", () => {
      const mockChart = { getAttribute: jest.fn(() => true) }
      
      // Test mm:ss conversion
      const mmssConverter = conversableUnits.s["mm:ss"]
      const result = mmssConverter.convert(125) // 2:05
      expect(typeof result).toBe("string")
      
      // Test h:mm:ss conversion
      const hmmssConverter = conversableUnits.s["h:mm:ss"]
      const hourResult = hmmssConverter.convert(3725) // 1:02:05
      expect(typeof hourResult).toBe("string")
    })

    it("applies multipliers correctly", () => {
      const mockChart = { getAttribute: jest.fn(() => true) }
      
      // Test microsecond conversion (multiplier = 1000000)
      const usConverter = conversableUnits.s.us
      const result = usConverter.convert(0.001) // 1ms = 1000μs
      expect(result).toBe(1000)
      
      // Test millisecond conversion (multiplier = 1000)
      const msConverter = conversableUnits.s.ms
      const msResult = msConverter.convert(0.5) // 0.5s = 500ms
      expect(msResult).toBe(500)
    })
  })

  describe("structure validation", () => {
    it("exports object with expected unit types", () => {
      expect(conversableUnits).toHaveProperty("Cel")
      expect(conversableUnits).toHaveProperty("ns")
      expect(conversableUnits).toHaveProperty("ms")
      expect(conversableUnits).toHaveProperty("s")
    })

    it("all converters have check and convert functions", () => {
      Object.values(conversableUnits).forEach(unitGroup => {
        Object.values(unitGroup).forEach(converter => {
          expect(converter).toHaveProperty("check")
          expect(converter).toHaveProperty("convert")
          expect(typeof converter.check).toBe("function")
          expect(typeof converter.convert).toBe("function")
        })
      })
    })

    it("check functions return boolean values", () => {
      const mockChart = { getAttribute: jest.fn(() => true) }
      
      Object.values(conversableUnits).forEach(unitGroup => {
        Object.values(unitGroup).forEach(converter => {
          const result = converter.check(mockChart, 1000)
          expect(typeof result).toBe("boolean")
        })
      })
    })
  })

  describe("temperature conversion edge cases", () => {
    it("handles negative temperatures correctly", () => {
      const converter = conversableUnits.Cel["[degF]"]
      expect(converter.convert(-273.15)).toBeCloseTo(-459.67, 1) // Absolute zero
      expect(converter.convert(-17.78)).toBeCloseTo(0, 1) // 0°F
    })

    it("handles fractional temperatures", () => {
      const converter = conversableUnits.Cel["[degF]"]
      expect(converter.convert(36.67)).toBeCloseTo(98, 1) // ~98°F (body temp)
      expect(converter.convert(100.56)).toBeCloseTo(213, 1) // Slightly above boiling
    })
  })
})