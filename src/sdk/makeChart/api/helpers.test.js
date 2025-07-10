import {
  getChartURLOptions,
  pointMultiplierByChartType,
  getChartPayload,
  errorCodesToMessage,
} from "./helpers"
import { makeTestChart } from "@jest/testUtilities"

describe("API helpers", () => {
  describe("getChartURLOptions", () => {
    it("returns default options for default chart library", () => {
      const { chart } = makeTestChart({
        attributes: {
          eliminateZeroDimensions: false,
          urlOptions: [],
          chartLibrary: "dygraph",
        },
      })

      const result = getChartURLOptions(chart)

      expect(result).toEqual(["jsonwrap", "flip", "ms", "jw-anomaly-rates", "minify"])
    })

    it("includes custom urlOptions", () => {
      const { chart } = makeTestChart({
        attributes: {
          eliminateZeroDimensions: false,
          urlOptions: ["custom-option"],
          chartLibrary: "dygraph",
        },
      })

      const result = getChartURLOptions(chart)

      expect(result).toContain("custom-option")
    })

    it("includes nonzero when eliminateZeroDimensions is true and not table", () => {
      const { chart } = makeTestChart({
        attributes: {
          eliminateZeroDimensions: true,
          urlOptions: [],
          chartLibrary: "dygraph",
        },
      })

      const result = getChartURLOptions(chart)

      expect(result).toContain("nonzero")
    })

    it("excludes nonzero for table chart library", () => {
      const { chart } = makeTestChart({
        attributes: {
          eliminateZeroDimensions: true,
          urlOptions: [],
          chartLibrary: "table",
        },
      })

      const result = getChartURLOptions(chart)

      expect(result).not.toContain("nonzero")
    })

    it("includes group-by-labels for groupBoxes library", () => {
      const { chart } = makeTestChart({
        attributes: {
          eliminateZeroDimensions: false,
          urlOptions: [],
          chartLibrary: "groupBoxes",
        },
      })

      const result = getChartURLOptions(chart)

      expect(result).toContain("group-by-labels")
    })

    it("uses default options when attributes are not specified", () => {
      const { chart } = makeTestChart({
        attributes: {
          chartLibrary: "dygraph",
        },
      })

      const result = getChartURLOptions(chart)

      // eliminateZeroDimensions is true by default, so "nonzero" is included
      expect(result).toEqual(["jsonwrap", "nonzero", "flip", "ms", "jw-anomaly-rates", "minify"])
    })
  })

  describe("pointMultiplierByChartType", () => {
    it("exports correct multipliers", () => {
      expect(pointMultiplierByChartType).toEqual({
        multiBar: 0.1,
        stackedBar: 0.1,
        table: 0.1,
        heatmap: 0.7,
        default: 0.7,
      })
    })
  })

  describe("getChartPayload", () => {
    it("returns correct payload structure", () => {
      const { chart } = makeTestChart({
        attributes: {
          after: -300,
          before: 0,
          groupingMethod: "average",
          groupingTime: "auto",
          renderedAt: null,
          hovering: false,
          fetchStartedAt: 1000000,
          chartType: "line",
          pixelsPerPoint: 4,
          chartLibrary: "dygraph",
        },
      })

      // Mock UI width
      chart.getUI().getChartWidth = () => 800

      const result = getChartPayload(chart)

      expect(result).toHaveProperty("points")
      expect(result).toHaveProperty("format", "json2")
      expect(result).toHaveProperty("time_group", "average")
      expect(result).toHaveProperty("time_resampling", "auto")
      expect(result).toHaveProperty("after")
      expect(result).toHaveProperty("before")
    })

    it("calculates points correctly", () => {
      const { chart } = makeTestChart({
        attributes: {
          after: -300,
          before: 0,
          groupingMethod: "average",
          groupingTime: "auto",
          chartType: "line",
          pixelsPerPoint: 4,
          chartLibrary: "dygraph",
        },
      })

      // Mock UI width
      chart.getUI().getChartWidth = () => 800

      const result = getChartPayload(chart)

      // (800 / 4) * 0.7 = 140
      expect(result.points).toBe(140)
    })

    it("uses container width when available", () => {
      const { chart } = makeTestChart({
        attributes: {
          after: -300,
          before: 0,
          groupingMethod: "average",
          groupingTime: "auto",
          chartType: "line",
          pixelsPerPoint: 4,
          chartLibrary: "dygraph",
          containerWidth: 1000,
        },
      })

      // Mock UI width
      chart.getUI().getChartWidth = () => 800

      const result = getChartPayload(chart)

      // (1000 / 4) * 0.7 = 175
      expect(result.points).toBe(175)
    })

    it("handles positive after/before values", () => {
      const { chart } = makeTestChart({
        attributes: {
          after: 1000,
          before: 2000,
          groupingMethod: "average",
          groupingTime: "auto",
          chartType: "line",
          pixelsPerPoint: 4,
          chartLibrary: "dygraph",
        },
      })

      // Mock UI width
      chart.getUI().getChartWidth = () => 800

      const result = getChartPayload(chart)

      expect(result.after).toBe(1000)
      expect(result.before).toBe(2000)
    })

    it("uses different multiplier for multiBar", () => {
      const { chart } = makeTestChart({
        attributes: {
          after: -300,
          before: 0,
          groupingMethod: "average",
          groupingTime: "auto",
          chartType: "multiBar",
          pixelsPerPoint: 4,
          chartLibrary: "dygraph",
        },
      })

      // Mock UI width
      chart.getUI().getChartWidth = () => 800

      const result = getChartPayload(chart)

      // (800 / 4) * 0.1 = 20
      expect(result.points).toBe(20)
    })

    it("defaults to 300 points when calculation is NaN", () => {
      const { chart } = makeTestChart({
        attributes: {
          after: -300,
          before: 0,
          groupingMethod: "average",
          groupingTime: "auto",
          chartType: "line",
          pixelsPerPoint: NaN,
          chartLibrary: "dygraph",
        },
      })

      // Mock UI width
      chart.getUI().getChartWidth = () => 800

      const result = getChartPayload(chart)

      expect(result.points).toBe(300)
    })
  })

  describe("errorCodesToMessage", () => {
    it("exports correct error messages", () => {
      expect(errorCodesToMessage).toEqual({
        ErrAllNodesFailed: "All agents failed to return data",
      })
    })
  })
})
