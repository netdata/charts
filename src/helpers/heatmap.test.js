import { act } from "@testing-library/react"
import { makeTestChart, renderHookWithChart, loadHeatmapPayload } from "@jest/testUtilities"
import {
  heatmapTypes,
  isHeatmap,
  isIncremental,
  heatmapOrChartType,
  makeGetColor,
  useGetColor,
  getHeatmapPalette,
  heatmapDefaultPalette,
  withoutPrefix,
  cropHeatmapZeroEdges,
  getHeatmapRowsRange,
  snapHeatmapRange,
  getHeatmapLabelOffset,
  getMarkedHeatmapCell,
  getHeatmapMax,
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
      mockChart.getPayload = () => ({})

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

    it("spans the whole palette from the smallest count to max, and clamps above it", () => {
      const getColor = makeGetColor(mockChart)

      expect(getColor(800)).toBe("rgb(253, 231, 37)")
      expect(getColor(5000)).toBe("rgb(253, 231, 37)")
      expect(getColor(400)).not.toBe(getColor(800))
    })
  })

  describe("custom palette and log colour scale", () => {
    const blues = ["rgb(222, 235, 247)", "rgb(107, 174, 214)", "rgb(8, 48, 107)"]
    const chartWith = attributes => makeTestChart({ attributes: { max: 100, ...attributes } }).chart

    it("takes one palette for every theme, or one per theme", () => {
      expect(getHeatmapPalette(chartWith({ heatmapPalette: blues }))).toEqual(blues)

      const perTheme = { default: blues, dark: [...blues].reverse() }
      expect(getHeatmapPalette(chartWith({ heatmapPalette: perTheme }))).toEqual(blues)
      expect(getHeatmapPalette(chartWith({ heatmapPalette: perTheme, theme: "dark" }))).toEqual(
        [...blues].reverse()
      )
      expect(
        getHeatmapPalette(chartWith({ heatmapPalette: { default: blues }, theme: "dark" }))
      ).toEqual(blues)
    })

    it("drops entries that are not colours", () => {
      expect(
        getHeatmapPalette(
          chartWith({ heatmapPalette: ["#000", "not a colour", [1, 2, 3], "#fff"] })
        )
      ).toEqual(["#000", "#fff"])
      expect(getHeatmapPalette(chartWith({ heatmapPalette: ["#000", "nope"] }))).toEqual(
        heatmapDefaultPalette
      )
    })

    it("places counts below zero at the bottom of a log scale", () => {
      const getColor = makeGetColor(
        chartWith({ heatmapPalette: ["#ff0000", "#0000ff"], heatmapColorScale: "log" })
      )
      expect(getColor(-5)).toBe("rgb(255, 0, 0)")
    })

    it("falls back to the default palette without at least two colours", () => {
      expect(getHeatmapPalette(chartWith({}))).toEqual(heatmapDefaultPalette)
      expect(getHeatmapPalette(chartWith({ heatmapPalette: ["#fff"] }))).toEqual(
        heatmapDefaultPalette
      )
    })

    it("maps counts onto the palette linearly by default", () => {
      const getColor = makeGetColor(chartWith({ heatmapPalette: ["#000000", "#ffffff"] }))

      expect(getColor(100)).toBe("rgb(255, 255, 255)")
      expect(getColor(50)).toBe("rgb(128, 128, 128)")
    })

    it("places counts by their logarithm with the log scale", () => {
      const getColor = makeGetColor(
        chartWith({
          max: 9999,
          heatmapPalette: ["#ff0000", "#00ff00", "#0000ff"],
          heatmapColorScale: "log",
        })
      )

      expect(getColor(99)).toBe("rgb(0, 255, 0)")
      expect(getColor(9999)).toBe("rgb(0, 0, 255)")
      expect(getColor(0)).toBe("transparent")
    })

    it("applies the opacity to palette colours", () => {
      const getColor = makeGetColor(chartWith({ heatmapPalette: blues }), 0.4)
      expect(getColor(100)).toBe("rgba(8, 48, 107, 0.4)")
    })
  })

  describe("heatmap colour maximum", () => {
    it("falls back to the largest cell of the payload when max is missing", async () => {
      const ids = ["1", "2", "3"]
      const { chart } = makeTestChart({ attributes: { chartType: "heatmap" } })
      await loadHeatmapPayload(chart, ids, [[1, 10, 4]])
      chart.updateAttribute("max", undefined)

      expect(getHeatmapMax(chart)).toBe(10)
      expect(makeGetColor(chart)(10)).toBe("rgb(253, 231, 37)")
      expect(makeGetColor(chart)(4)).not.toBe(makeGetColor(chart)(1))
    })

    it("prefers a positive max attribute", () => {
      const { chart } = makeTestChart({ attributes: { max: 50 } })
      expect(getHeatmapMax(chart)).toBe(50)
    })
  })

  describe("useGetColor", () => {
    it("follows a change of max", () => {
      const { chart } = makeTestChart({ attributes: { max: 800 } })
      const { result, rerender } = renderHookWithChart(() => useGetColor(), { chart })

      expect(result.current(800)).toBe("rgb(253, 231, 37)")

      act(() => chart.updateAttribute("max", 1600))
      rerender()

      expect(result.current(800)).not.toBe("rgb(253, 231, 37)")
      expect(result.current(1600)).toBe("rgb(253, 231, 37)")
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

  describe("heatmap row ranges", () => {
    it("frames whole rows, each row centred on its index", () => {
      expect(getHeatmapRowsRange(5)).toEqual([-0.5, 4.5])
      expect(getHeatmapRowsRange(0)).toEqual([-0.5, 0.5])
    })

    it("snaps a value range outwards to the edges of the rows it touches", () => {
      expect(snapHeatmapRange([1.3, 3.7], 7)).toEqual([0.5, 4.5])
      expect(snapHeatmapRange([2, 2], 7)).toEqual([1.5, 2.5])
      expect(snapHeatmapRange([-0.4, 0.2], 7)).toEqual([-0.5, 0.5])
    })

    it("adds no row for a range that ends on a row edge", () => {
      expect(snapHeatmapRange([0.5, 2.5], 7)).toEqual([0.5, 2.5])
    })

    it("keeps the range inside the rows and at least one row tall", () => {
      expect(snapHeatmapRange([-2, 9], 7)).toEqual([-0.5, 6.5])
      expect(snapHeatmapRange([7, 8], 7)).toEqual([5.5, 6.5])
    })

    it("puts labels of numeric buckets on the row's upper edge, others on its centre", () => {
      expect(getHeatmapLabelOffset({ getHeatmapSortedIds: () => ["1", "2"] })).toBe(0.5)
      expect(getHeatmapLabelOffset({ getHeatmapSortedIds: () => null })).toBe(0)
    })
  })

  describe("getMarkedHeatmapCell", () => {
    const ids = ["0", "1", "2", "3", "4", "5", "6"]
    const rows = [
      [0, 0, 1, 0, 2, 0, 0],
      [0, 0, 0, 3, 1, 0, 0],
    ]
    const window = () => [1000, 2000]

    const makeChart = async marked => {
      const { chart } = makeTestChart({
        attributes: {
          chartType: "heatmap",
          context: "prometheus.test.histogram",
          groupBy: ["dimension"],
          selectedLegendDimensions: [],
          heatmapMarkedCell: marked,
          viewDimensions: {
            ids,
            names: ids,
            priorities: ids.map((_, index) => index),
            units: ids.map(() => ""),
            contexts: ids.map(() => ""),
            grouped: ["dimension"],
          },
        },
      })
      await loadHeatmapPayload(chart, ids, rows, { timestamp: 1000 })
      return chart
    }

    it("finds the payload row and the visible row of the marked cell", async () => {
      const chart = await makeChart({ x: 2000, id: "3" })
      expect(getMarkedHeatmapCell(chart, window)).toEqual({
        row: 1,
        yIndex: chart.getHeatmapYIndex("3"),
      })
    })

    it("marks nothing for a time more than half a step from every column", async () => {
      expect(
        getMarkedHeatmapCell(await makeChart({ x: 2900, id: "3" }), () => [1000, 3000])
      ).toBeNull()
    })

    it("marks nothing without a cell, outside the window or on a hidden row", async () => {
      expect(getMarkedHeatmapCell(await makeChart(null), window)).toBeNull()
      expect(getMarkedHeatmapCell(await makeChart({ x: 9000, id: "3" }), window)).toBeNull()
      expect(getMarkedHeatmapCell(await makeChart({ x: 2000, id: "0" }), window)).toBeNull()
    })
  })
})
