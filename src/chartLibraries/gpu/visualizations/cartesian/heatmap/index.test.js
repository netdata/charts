import { loadHeatmapPayload, makeTestChart } from "@jest/testUtilities"
import { makeHeatmapAxes } from "./axes"
import { findClosestHeatmapDimension } from "./interaction"
import { getHeatmapNotificationRange, getHeatmapValueRange, makeHeatmapStyle } from "."

describe("GPU heatmap visualization", () => {
  it("builds sorted categorical rows and labels", async () => {
    const { chart } = makeTestChart({
      attributes: {
        chartType: "heatmap",
        enabledXAxis: false,
        enabledYAxis: true,
        groupBy: [],
      },
    })
    await loadHeatmapPayload(chart, ["+Inf", "0.3", "2"], [[1, 2, 3]])
    const axes = makeHeatmapAxes({
      chart,
      width: 800,
      height: 400,
      min: 0,
      max: 3,
      afterMs: 1000000,
      beforeMs: 1001000,
    })

    expect(axes.rects).toHaveLength(3)
    expect(axes.labels.map(label => label.text)).toEqual(["0.3", "2", "+Inf"])
  })

  it("uses cropped bucket count for range and nearest-row hover", async () => {
    const { chart } = makeTestChart({ attributes: { chartType: "heatmap", groupBy: [] } })
    await loadHeatmapPayload(chart, ["1", "2", "3"], [[1, 2, 3]])

    expect(getHeatmapValueRange({ chart })).toEqual([0, 3])
    chart.updateAttribute("max", 90)
    expect(getHeatmapValueRange({ chart })).toEqual([0, 3])
    expect(getHeatmapNotificationRange({ chart })).toEqual([1, 90])
    expect(
      findClosestHeatmapDimension({
        chart,
        y: 48,
        domain: [-0.1, 3.1],
        plot: { top: 0, height: 96 },
      })
    ).toBe("2")
  })

  it("uses the cropped visible bucket count for its categorical domain", async () => {
    const { chart } = makeTestChart({ attributes: { chartType: "heatmap", groupBy: [] } })
    await loadHeatmapPayload(chart, ["1", "2", "3", "4", "5", "6", "7"], [[0, 0, 1, 2, 3, 0, 0]])

    expect(chart.getVisibleHeatmapIds()).toEqual(["2", "3", "4", "5", "6"])
    expect(getHeatmapValueRange({ chart })).toEqual([0, 5])
  })

  it("uses exact reduced-window width and color maximum", async () => {
    const { chart } = makeTestChart({ attributes: { chartType: "heatmap", groupBy: [] } })
    await loadHeatmapPayload(chart, ["1"], [[1], [2]], { timestamp: 0 })
    const packed = {
      sourceRows: chart.getPayload().all,
      point: chart.getPayload().point,
    }
    const style = makeHeatmapStyle(chart, {
      packed,
      frame: {
        afterMs: 0,
        beforeMs: 1000,
        plot: { width: 100 },
      },
    })

    expect(style).toEqual({
      barWidth: 100,
      fillAlpha: 1,
      heatmapMax: 2,
      lineWidth: 0,
      smooth: false,
      stepped: false,
    })
  })
})
