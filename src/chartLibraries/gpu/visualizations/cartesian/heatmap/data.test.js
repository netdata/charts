import { loadHeatmapPayload, makeTestChart } from "@jest/testUtilities"
import { makeHeatmapMetadata } from "./colors"
import makeHeatmapData from "./data"

describe("GPU heatmap data", () => {
  it("packs public all-rows with absolute values and sorted bucket metadata", async () => {
    const { chart } = makeTestChart({ attributes: { chartType: "heatmap", groupBy: [] } })
    await loadHeatmapPayload(chart, ["+Inf", "0.3", "2"], [[-1, 2, 0]])
    const packed = makeHeatmapData(chart).get()

    expect(Array.from(packed.y)).toEqual([1, 2, 0])
    expect(Array.from(makeHeatmapMetadata(chart))).toEqual([2, 3, 0, 1, 0, 3, 0, 1, 1, 3, 0, 1])
  })

  it("reflows visible ranks while retaining hidden bucket metadata", async () => {
    const { chart } = makeTestChart({ attributes: { chartType: "heatmap", groupBy: [] } })
    await loadHeatmapPayload(chart, ["1", "2", "3"], [[1, 2, 3]])
    chart.updateAttribute("selectedLegendDimensions", ["1", "3"])

    expect(Array.from(makeHeatmapMetadata(chart))).toEqual([0, 2, 0, 1, -1, 2, 0, 0, 1, 2, 0, 1])
  })

  it("packs values row-major for direct instance access", async () => {
    const { chart } = makeTestChart({ attributes: { chartType: "heatmap", groupBy: [] } })
    await loadHeatmapPayload(
      chart,
      ["1", "2"],
      [
        [1, 2],
        [3, 4],
      ]
    )

    expect(Array.from(makeHeatmapData(chart).get().y)).toEqual([1, 2, 3, 4])
  })

  it("preserves cumulative-to-incremental bucket semantics", async () => {
    const { chart } = makeTestChart({ attributes: { chartType: "heatmap", groupBy: [] } })
    await loadHeatmapPayload(chart, ["1", "2", "3", "4"], [[2, 5, 5, 3]])
    chart.updateAttribute("heatmapType", "incremental")
    const packed = makeHeatmapData(chart).get()

    expect(Array.from(packed.y)).toEqual([2, 3, 0, -2])
  })
})
