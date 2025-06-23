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

    it("uses unitsCurrent when available", () => {
      chart.updateAttribute("unitsCurrent", ["KiB", "KiB"])

      const result = getConversionUnits(chart, "unitsCurrent", { min: 0, max: 1000 })

      expect(result.base).toContain("KiB")
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
