import { makeHeatmapPayload, makeTestChart } from "@jest/testUtilities"
import {
  getMultiBarGroupWidth,
  getReducedWindowBounds,
  makeMultiBarStyle,
} from "."
import { makeMultiBarColors } from "./colors"

describe("GPU multi column visualization", () => {
  const rows = [
    [0, 1, 1],
    [1000, 1, 1],
    [2000, null, 1],
    [3000, 1, 1],
    [4000, 1, 1],
  ]

  it("matches Dygraphs reduced-window boundary expansion through nulls", () => {
    expect(
      getReducedWindowBounds({
        rows,
        point: null,
        seriesIndex: 0,
        afterMs: 2200,
        beforeMs: 3200,
      })
    ).toEqual({ first: 1, last: 4 })
    expect(
      getReducedWindowBounds({
        rows,
        point: null,
        seriesIndex: 1,
        afterMs: 2200,
        beforeMs: 3200,
      })
    ).toEqual({ first: 2, last: 4 })
  })

  it("uses only the first two reduced points for the historical group width", () => {
    expect(
      getMultiBarGroupWidth({
        packed: {
          sourceRows: [
            [0, 1],
            [1000, 1],
            [3000, 1],
          ],
          point: null,
        },
        visibleSeriesIndexes: [0],
        afterMs: 0,
        beforeMs: 3000,
        plotWidth: 90,
      })
    ).toBe(20)
    expect(
      getMultiBarGroupWidth({
        packed: {
          sourceRows: [
            [0, 1],
            [1000, 1],
          ],
          point: null,
        },
        visibleSeriesIndexes: [0],
        afterMs: 0,
        beforeMs: 2000000,
        plotWidth: 800,
      })
    ).toBe(0)
  })

  it("reflows visible ranks and preserves legacy fill/stroke colors", async () => {
    const { chart } = makeTestChart({
      attributes: {
        chartType: "multiBar",
        colors: { first: "#ff0000", second: "#00ff00", third: "#0000ff" },
        selectedLegendDimensions: ["first", "third"],
      },
    })
    chart.doneFetch(makeHeatmapPayload(["first", "second", "third"], [[1, 2, 3]]))
    await new Promise(resolve => setTimeout(resolve, 0))
    const colors = Array.from(makeMultiBarColors(chart))

    expect(colors.slice(8, 10)).toEqual([0, 2])
    expect(colors.slice(20, 22)).toEqual([-1, 2])
    expect(colors.slice(32, 34)).toEqual([1, 2])
    expect(colors[15]).toBe(0)
  })

  it("preserves normal and sparkline bar styles", async () => {
    const { chart } = makeTestChart({ attributes: { chartType: "multiBar" } })
    chart.doneFetch(makeHeatmapPayload(["value"], [[1]]))
    await new Promise(resolve => setTimeout(resolve, 0))
    const state = {
      packed: {
        sourceRows: [
          [0, 1],
          [1000, 2],
        ],
        point: null,
      },
      frame: {
        afterMs: 0,
        beforeMs: 1000,
        plot: { width: 90 },
      },
    }

    expect(makeMultiBarStyle(chart, state)).toEqual({
      barWidth: 60,
      fillAlpha: 1,
      lineWidth: 0.7,
      smooth: false,
      stepped: false,
    })
    chart.updateAttribute("sparkline", true)
    expect(makeMultiBarStyle(chart, state).lineWidth).toBe(0)
  })
})
