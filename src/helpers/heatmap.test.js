import {
  heatmapTypes,
  isHeatmap,
  isIncremental,
  heatmapOrChartType,
  makeGetColor,
  withoutPrefix,
  cropHeatmapZeroEdges,
} from "./heatmap"

describe("heatmap utilities", () => {
  describe("heatmapTypes", () => {
    it("exports correct heatmap types", () => {
      expect(heatmapTypes.default).toBe("default")
      expect(heatmapTypes.disabled).toBe("disabled")
      expect(heatmapTypes.incremental).toBe("incremental")
    })
  })

  describe("isHeatmap", () => {
    it("returns true for heatmap string", () => {
      expect(isHeatmap("heatmap")).toBe(true)
    })

    it("returns false for non-heatmap string", () => {
      expect(isHeatmap("line")).toBe(false)
    })

    it("returns true for chart object with heatmap type", () => {
      const chart = {
        getAttribute: jest.fn(() => "heatmap"),
      }
      expect(isHeatmap(chart)).toBe(true)
    })

    it("returns false for chart object with non-heatmap type", () => {
      const chart = {
        getAttribute: jest.fn(() => "line"),
      }
      expect(isHeatmap(chart)).toBe(false)
    })

    it("handles null/undefined input", () => {
      expect(isHeatmap(null)).toBe(false)
      expect(isHeatmap(undefined)).toBe(false)
    })
  })

  describe("isIncremental", () => {
    it("returns true for incremental heatmap", () => {
      const chart = {
        getAttribute: jest.fn(attr => {
          if (attr === "chartType") return "heatmap"
          if (attr === "heatmapType") return "incremental"
        }),
      }
      expect(isIncremental(chart)).toBe(true)
    })

    it("returns false for non-incremental heatmap", () => {
      const chart = {
        getAttribute: jest.fn(attr => {
          if (attr === "chartType") return "heatmap"
          if (attr === "heatmapType") return "default"
        }),
      }
      expect(isIncremental(chart)).toBe(false)
    })

    it("returns false for non-heatmap", () => {
      const chart = {
        getAttribute: jest.fn(() => "line"),
      }
      expect(isIncremental(chart)).toBe(false)
    })
  })

  describe("heatmapOrChartType", () => {
    it("returns heatmap for matching id patterns", () => {
      const ids = ["temp_10", "temp_20.5", "temp_+Inf"]
      const result = heatmapOrChartType(ids, "line")
      expect(result).toBe("heatmap")
    })

    it("returns original chartType for non-matching patterns", () => {
      const ids = ["temp", "value", "count"]
      const result = heatmapOrChartType(ids, "line")
      expect(result).toBe("line")
    })

    it("returns original chartType for empty array", () => {
      const result = heatmapOrChartType([], "line")
      expect(result).toBe("line")
    })

    it("returns original chartType for non-array input", () => {
      const result = heatmapOrChartType("not-array", "line")
      expect(result).toBe("line")
    })

    it("handles mixed matching and non-matching ids", () => {
      const ids = ["temp_10", "invalid"]
      const result = heatmapOrChartType(ids, "line")
      expect(result).toBe("line")
    })
  })

  describe("makeGetColor", () => {
    let mockChart

    beforeEach(() => {
      mockChart = {
        getAttribute: jest.fn(() => 800),
      }
    })

    it("returns color function", () => {
      const getColor = makeGetColor(mockChart)
      expect(typeof getColor).toBe("function")
    })

    it("returns transparent for null/undefined values", () => {
      const getColor = makeGetColor(mockChart)
      expect(getColor(null)).toBe("transparent")
      expect(getColor(undefined)).toBe("transparent")
    })

    it("returns transparent for zero value", () => {
      const getColor = makeGetColor(mockChart)
      expect(getColor(0)).toBe("transparent")
    })

    it("uses the low-end color when the heatmap max is zero", () => {
      mockChart.getAttribute = jest.fn(() => 0)

      const getColor = makeGetColor(mockChart)

      expect(getColor(0)).toBe("transparent")
      expect(getColor(null)).toBe("transparent")
      expect(getColor(undefined)).toBe("transparent")
    })

    it("returns color for valid values", () => {
      const getColor = makeGetColor(mockChart)
      const color = getColor(100)
      expect(color).toMatch(/rgba?\(\d+,\s*\d+,\s*\d+/)
    })

    it("uses custom opacity", () => {
      const getColor = makeGetColor(mockChart, 0.5)
      const color = getColor(100)
      expect(color).toContain("0.5")
    })
  })

  describe("withoutPrefix", () => {
    it("removes prefix from heatmap labels", () => {
      expect(withoutPrefix("temperature_10")).toBe("10")
      expect(withoutPrefix("value_20.5")).toBe("20.5")
      expect(withoutPrefix("data_+Inf")).toBe("+Inf")
      expect(withoutPrefix("metric_+inf")).toBe("+inf")
    })

    it("returns unchanged for non-matching patterns", () => {
      expect(withoutPrefix("simple")).toBe("simple")
      expect(withoutPrefix("no_number")).toBe("no_number")
    })

    it("handles null/undefined input", () => {
      expect(withoutPrefix(null)).toBe(null)
      expect(withoutPrefix(undefined)).toBe(undefined)
    })

    it("handles empty string", () => {
      expect(withoutPrefix("")).toBe("")
    })
  })

  describe("cropHeatmapZeroEdges", () => {
    const makeIsZeroOnly = zeroIds => id => zeroIds.includes(id)

    it("crops only zero buckets from the bottom and top edges", () => {
      const ids = ["0", "1", "2", "3", "4", "5", "6"]

      expect(cropHeatmapZeroEdges(ids, makeIsZeroOnly(["0", "1", "6"]))).toEqual([
        "1",
        "2",
        "3",
        "4",
        "5",
        "6",
      ])
    })

    it("keeps interior zero buckets", () => {
      const ids = ["0", "1", "2", "3", "4", "5", "6", "7", "8"]

      expect(cropHeatmapZeroEdges(ids, makeIsZeroOnly(["0", "1", "3", "7", "8"]))).toEqual([
        "1",
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
      ])
    })

    it("keeps one zero bucket below and above a five-bucket non-zero span", () => {
      const ids = ["0", "1", "2", "3", "4", "5", "6", "7", "8"]

      expect(cropHeatmapZeroEdges(ids, makeIsZeroOnly(["0", "1", "7", "8"]))).toEqual([
        "1",
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
      ])
    })

    it("expands around a narrow non-zero range to keep at least five buckets", () => {
      const ids = ["0", "1", "2", "3", "4", "5", "6", "7", "8"]
      const zeroIds = ["0", "1", "2", "4", "5", "6", "7", "8"]

      expect(cropHeatmapZeroEdges(ids, makeIsZeroOnly(zeroIds))).toEqual(["1", "2", "3", "4", "5"])
    })

    it("keeps the full scale when all buckets are zero", () => {
      const ids = ["0", "1", "2", "3", "4", "5", "6"]

      expect(cropHeatmapZeroEdges(ids, makeIsZeroOnly(ids))).toEqual(ids)
    })

    it("does not crop when there are fewer than the minimum visible buckets", () => {
      const ids = ["0", "1", "2"]

      expect(cropHeatmapZeroEdges(ids, makeIsZeroOnly(["0", "2"]))).toEqual(ids)
    })

    it("does not crop without a zero-only predicate", () => {
      const ids = ["0", "1", "2", "3", "4", "5"]

      expect(cropHeatmapZeroEdges(ids)).toEqual(ids)
    })
  })
})
