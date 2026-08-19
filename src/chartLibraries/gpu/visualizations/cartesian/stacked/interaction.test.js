import { makeHeatmapPayload, makeTestChart } from "@jest/testUtilities"
import { findClosestStackedDimension } from "./interaction"

const load = async chart => {
  const payload = makeHeatmapPayload(
    ["positive", "negative", "crossing"],
    [[2, -1, 0.5]]
  )
  payload.view.chart_type = "stacked"
  payload.view.dimensions.grouped_by = []
  chart.doneFetch(payload)
  await new Promise(resolve => setTimeout(resolve, 0))
}

describe("GPU diverging stacked interaction", () => {
  it("selects the signed band under the pointer", async () => {
    const { chart } = makeTestChart({
      attributes: { chartType: "stacked", groupBy: [] },
    })
    await load(chart)
    const frame = { domain: [-3, 3], plot: { left: 0, top: 0, width: 100, height: 120 } }

    expect(findClosestStackedDimension({ chart, row: 0, y: 70, ...frame })).toBe(
      "negative"
    )
    expect(findClosestStackedDimension({ chart, row: 0, y: 55, ...frame })).toBe(
      "crossing"
    )
    expect(findClosestStackedDimension({ chart, row: 0, y: 40, ...frame })).toBe(
      "positive"
    )
  })
})
