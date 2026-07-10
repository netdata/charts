import getConversionUnits, { getConversionAttributes } from "./getConversionUnits"
import { makeTestChart } from "@jest/testUtilities"

describe("getConversionUnits", () => {
  let chart

  beforeEach(() => {
    const testChart = makeTestChart({
      attributes: {
        units: ["By", "By"],
        desiredUnits: "auto",
        unitsConversion: "original",
        visibleDimensionIds: ["dim1", "dim2"],
      },
    })
    chart = testChart.chart
  })

  describe("getConversionAttributes", () => {
    it("returns conversion attributes for scalable units", () => {
      const result = getConversionAttributes(chart, "By", { min: 1000, max: 5000 })

      expect(result).toHaveProperty("method")
      expect(result).toHaveProperty("divider")
      expect(result).toHaveProperty("fractionDigits")
      expect(result).toHaveProperty("prefix")
      expect(result).toHaveProperty("base")
      expect(result).toHaveProperty("unit", "By")
    })

    it("handles non-scalable units", () => {
      const result = getConversionAttributes(chart, "%", { min: 0, max: 100 })

      expect(result.method).toBe("original")
      expect(result.unit).toBe("%")
      expect(result.divider).toBeUndefined()
    })

    it("uses proper scale for large values", () => {
      const result = getConversionAttributes(chart, "By", { min: 0, max: 10000000 })

      expect(result.prefix).toBeTruthy()
      if (result.method === "adjust") {
        expect(typeof result.divider).toBe("function")
      } else if (result.method === "divide") {
        expect(result.divider).toBeGreaterThan(1)
      }
    })

    it("handles zero range", () => {
      const result = getConversionAttributes(chart, "By", { min: 100, max: 100 })

      expect(result).toHaveProperty("method")
      expect(result).toHaveProperty("unit", "By")
    })

    it("uses print_symbol for base when base_unit is not defined", () => {
      const result = getConversionAttributes(chart, "{entropy}", { min: 0, max: 256 })

      expect(result.base).toBe("entropy")
    })

    it("scales the unknown sentinel as a generic item count", () => {
      chart.updateAttributes({ units: ["unknown"], desiredUnits: ["auto"] })

      const unscaled = getConversionAttributes(chart, "unknown", { min: 0, max: 999 })
      const scaled = getConversionAttributes(chart, "unknown", { min: 0, max: 12000 })

      expect(unscaled).toMatchObject({ base: "items", prefix: "" })
      expect(scaled).toMatchObject({ base: "items", prefix: "K" })
      expect(chart.getConvertedValueWithUnit(95, { unitAttributes: unscaled })).toBe("95")
      expect(chart.getConvertedValueWithUnit(12000, { unitAttributes: scaled })).toBe("12 K")
    })

    it("preserves empty print_symbol for base when base_unit is not defined", () => {
      const result = getConversionAttributes(chart, "{state}", { min: 0, max: 1 })

      expect(result.base).toBe("")
    })

    it("handles negative values", () => {
      const result = getConversionAttributes(chart, "By", { min: -1000, max: 1000 })

      expect(result).toHaveProperty("method")
      expect(result).toHaveProperty("divider")
    })

    it("respects desired units setting", () => {
      chart.updateAttribute("desiredUnits", "KiB")

      const result = getConversionAttributes(chart, "By", { min: 0, max: 10000 })

      // Should use Ki prefix for binary units
      expect(result.prefix).toContain("Ki")
    })

    it("uses a smaller conversable scale before excessive fractional digits", () => {
      chart.updateAttributes({
        units: ["s"],
        desiredUnits: ["auto"],
        secondsAsTime: true,
      })

      const result = getConversionAttributes(chart, "s", {
        min: 0.00512000001,
        max: 0.00512000009,
      })

      expect(result.method).toBe("s-us")
      expect(result.fractionDigits).toBe(5)
    })

    it("converts source hours through duration-aware scales", () => {
      chart.updateAttributes({
        units: ["h"],
        desiredUnits: ["auto"],
        secondsAsTime: true,
      })

      const result = getConversionAttributes(chart, "h", {
        min: 0,
        max: 26,
      })

      expect(result.method).toBe("h-d:h:mm")
      expect(result.base).toBe("d:h:mm")
    })

    it("allows high precision when no smaller scale is available", () => {
      chart.updateAttributes({
        units: ["{operation}/s"],
        desiredUnits: ["auto"],
      })

      const result = getConversionAttributes(chart, "{operation}/s", {
        min: 5.12000001,
        max: 5.12000009,
      })

      expect(result.method).toBe("adjust")
      expect(result.prefix).toBe("")
      expect(result.fractionDigits).toBe(8)
    })
  })

  describe("getConversionUnits", () => {
    it("returns arrays of conversion parameters for dimensions", () => {
      // Set up chart with multiple dimensions
      chart.updateAttribute("visibleDimensionIds", ["dim1", "dim2"])
      chart.payload = {
        byDimension: {
          dim1: { min: 0, max: 1000 },
          dim2: { min: 0, max: 2000 },
        },
      }

      const result = getConversionUnits(chart, "units", { min: 0, max: 2000 })

      expect(result).toHaveProperty("method")
      expect(result).toHaveProperty("fractionDigits")
      expect(result).toHaveProperty("prefix")
      expect(result).toHaveProperty("base")
      expect(result).toHaveProperty("divider")

      // Arrays should have length equal to number of dimensions
      expect(Array.isArray(result.method)).toBe(true)
      expect(result.method.length).toBe(2)
    })

    it("handles charts with single dimension", () => {
      chart.updateAttribute("visibleDimensionIds", ["single"])
      chart.updateAttribute("units", ["By"])

      const result = getConversionUnits(chart, "units", { min: 0, max: 100 })

      expect(result.method).toHaveLength(1)
      expect(result.prefix).toHaveLength(1)
    })

    it("normalizes unitsCurrent source-scaled units when available", () => {
      chart.updateAttribute("unitsCurrent", ["KiB", "KiB"])

      const result = getConversionUnits(chart, "unitsCurrent", { min: 0, max: 1000 })

      expect(result.base).toEqual(["By", "By"])
      expect(result.prefix).toEqual(["Ki", "Ki"])
    })

    it("falls back to units when unitsCurrent not set", () => {
      chart.updateAttribute("units", ["%"])
      chart.updateAttribute("unitsCurrent", null)
      chart.updateAttribute("visibleDimensionIds", ["percent"])

      const result = getConversionUnits(chart, "units", { min: 0, max: 100 })

      expect(result.method).toContain("original")
      expect(result.base[0]).toBe("")
    })

    it("handles unitsConversion method override", () => {
      chart.updateAttribute("unitsConversion", "absolute")

      const result = getConversionUnits(chart, "units", { min: 0, max: 100 })

      expect(result.method.length).toBeGreaterThan(0)
      expect(result.method[0]).toMatch(/adjust|original|divide/)
    })

    it("processes metric units correctly", () => {
      chart.updateAttribute("units", ["m"])
      chart.updateAttribute("visibleDimensionIds", ["dist"])

      const result = getConversionUnits(chart, "units", { min: 0, max: 1500 })

      expect(result.prefix[0]).toBeTruthy()
    })

    it("handles empty visible dimensions", () => {
      chart.updateAttribute("visibleDimensionIds", [])
      chart.updateAttribute("units", [])

      const result = getConversionUnits(chart, "units", { min: 0, max: 100 })

      expect(result.method).toEqual([])
      expect(result.prefix).toEqual([])
    })

    it("processes dbUnits separately", () => {
      chart.updateAttribute("dbUnits", ["custom", "custom"])

      const result = getConversionUnits(chart, "dbUnits", { min: 0, max: 100 })

      expect(result).toHaveProperty("base")
      expect(result.base).toContain("custom")
    })
  })
})
