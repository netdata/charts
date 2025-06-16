import { getChartURLOptions, pointMultiplierByChartType, getChartPayload, errorCodesToMessage } from "./helpers"

describe("API helpers", () => {
  describe("getChartURLOptions", () => {
    let mockChart

    beforeEach(() => {
      mockChart = {
        getAttributes: jest.fn()
      }
    })

    it("returns default options for default chart library", () => {
      mockChart.getAttributes.mockReturnValue({
        eliminateZeroDimensions: false,
        urlOptions: [],
        chartLibrary: "dygraph"
      })

      const result = getChartURLOptions(mockChart)
      
      expect(result).toEqual([
        "jsonwrap",
        "flip",
        "ms",
        "jw-anomaly-rates",
        "minify"
      ])
    })

    it("includes custom urlOptions", () => {
      mockChart.getAttributes.mockReturnValue({
        eliminateZeroDimensions: false,
        urlOptions: ["custom-option"],
        chartLibrary: "dygraph"
      })

      const result = getChartURLOptions(mockChart)
      
      expect(result).toContain("custom-option")
    })

    it("includes nonzero when eliminateZeroDimensions is true and not table", () => {
      mockChart.getAttributes.mockReturnValue({
        eliminateZeroDimensions: true,
        urlOptions: [],
        chartLibrary: "dygraph"
      })

      const result = getChartURLOptions(mockChart)
      
      expect(result).toContain("nonzero")
    })

    it("excludes nonzero for table chart library", () => {
      mockChart.getAttributes.mockReturnValue({
        eliminateZeroDimensions: true,
        urlOptions: [],
        chartLibrary: "table"
      })

      const result = getChartURLOptions(mockChart)
      
      expect(result).not.toContain("nonzero")
    })

    it("includes group-by-labels for groupBoxes library", () => {
      mockChart.getAttributes.mockReturnValue({
        eliminateZeroDimensions: false,
        urlOptions: [],
        chartLibrary: "groupBoxes"
      })

      const result = getChartURLOptions(mockChart)
      
      expect(result).toContain("group-by-labels")
    })
  })

  describe("pointMultiplierByChartType", () => {
    it("exports correct multipliers", () => {
      expect(pointMultiplierByChartType).toEqual({
        multiBar: 0.1,
        stackedBar: 0.1,
        table: 0.1,
        heatmap: 0.7,
        default: 0.7
      })
    })
  })

  describe("getChartPayload", () => {
    let mockChart
    let mockUI

    beforeEach(() => {
      mockUI = {
        getChartWidth: jest.fn(() => 800)
      }

      mockChart = {
        getUI: jest.fn(() => mockUI),
        getAttribute: jest.fn(),
        getAttributes: jest.fn(() => ({
          after: -300,
          before: 0,
          groupingMethod: "average",
          groupingTime: "auto",
          renderedAt: null,
          hovering: false,
          fetchStartedAt: 1000000,
          chartType: "line",
          pixelsPerPoint: 4,
          chartLibrary: "dygraph"
        }))
      }
    })

    it("returns correct payload structure", () => {
      const result = getChartPayload(mockChart)
      
      expect(result).toHaveProperty("points")
      expect(result).toHaveProperty("format", "json2")
      expect(result).toHaveProperty("time_group", "average")
      expect(result).toHaveProperty("time_resampling", "auto")
      expect(result).toHaveProperty("after")
      expect(result).toHaveProperty("before")
    })

    it("calculates points correctly", () => {
      const result = getChartPayload(mockChart)
      
      // (800 / 4) * 0.7 = 140
      expect(result.points).toBe(140)
    })

    it("uses container width when available", () => {
      mockChart.getAttribute.mockImplementation(key => {
        if (key === "containerWidth") return 1000
        return mockChart.getAttributes()[key]
      })

      const result = getChartPayload(mockChart)
      
      // (1000 / 4) * 0.7 = 175
      expect(result.points).toBe(175)
    })

    it("handles positive after/before values", () => {
      mockChart.getAttributes.mockReturnValue({
        ...mockChart.getAttributes(),
        after: 1000,
        before: 2000
      })

      const result = getChartPayload(mockChart)
      
      expect(result.after).toBe(1000)
      expect(result.before).toBe(2000)
    })

    it("uses different multiplier for multiBar", () => {
      mockChart.getAttributes.mockReturnValue({
        ...mockChart.getAttributes(),
        chartType: "multiBar"
      })

      const result = getChartPayload(mockChart)
      
      // (800 / 4) * 0.1 = 20
      expect(result.points).toBe(20)
    })

    it("defaults to 300 points when calculation is NaN", () => {
      mockChart.getAttributes.mockReturnValue({
        ...mockChart.getAttributes(),
        pixelsPerPoint: NaN
      })

      const result = getChartPayload(mockChart)
      
      expect(result.points).toBe(300)
    })
  })

  describe("errorCodesToMessage", () => {
    it("exports correct error messages", () => {
      expect(errorCodesToMessage).toEqual({
        ErrAllNodesFailed: "All agents failed to return data"
      })
    })
  })
})