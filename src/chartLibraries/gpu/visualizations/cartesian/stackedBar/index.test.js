import { makeHeatmapPayload, makeTestChart } from "@jest/testUtilities"
import { getStackedBarWidth, makeStackedBarStyle } from "."
import { makeStackedBarColors } from "./colors"

describe("GPU stacked bar visualization", () => {
  it("matches the legacy minimum-separation width", () => {
    expect(
      getStackedBarWidth({
        packed: { minXSeparationMs: 1000, pointCount: 4 },
        afterMs: 0,
        beforeMs: 4000,
        plotWidth: 120,
      })
    ).toBe(20)
  })

  it("uses the legacy single-point width fallback and one-pixel minimum", () => {
    expect(
      getStackedBarWidth({
        packed: { minXSeparationMs: Infinity, pointCount: 1 },
        afterMs: 0,
        beforeMs: 4000,
        plotWidth: 120,
      })
    ).toBe(80)
    expect(
      getStackedBarWidth({
        packed: { minXSeparationMs: 1, pointCount: 4 },
        afterMs: 0,
        beforeMs: 4000,
        plotWidth: 120,
      })
    ).toBe(1)
  })

  it("preserves legacy border parsing for configured colors", async () => {
    const { chart } = makeTestChart({ attributes: { colors: { value: "red" } } })
    chart.doneFetch(makeHeatmapPayload(["value"], [[1]]))
    await new Promise(resolve => setTimeout(resolve, 0))

    const colors = Array.from(makeStackedBarColors(chart))
    expect(colors.slice(0, 4)).toEqual([1, 0, 0, 1])
    colors.slice(4, 7).forEach(channel => expect(channel).toBeCloseTo(127 / 255))
    expect(colors[7]).toBe(1)
  })

  it("preserves the normal and sparkline stroke widths", () => {
    const { chart } = makeTestChart({ attributes: { chartType: "stackedBar" } })
    const state = {
      packed: { minXSeparationMs: 1000, pointCount: 4 },
      frame: { afterMs: 0, beforeMs: 4000, plot: { width: 120 } },
    }

    expect(makeStackedBarStyle(chart, state)).toEqual({
      barWidth: 20,
      fillAlpha: 1,
      lineWidth: 0.7,
      smooth: false,
      stepped: false,
    })

    chart.updateAttribute("sparkline", true)
    expect(makeStackedBarStyle(chart, state).lineWidth).toBe(0)
  })
})
