import { loadHeatmapPayload, makeTestChart } from "@jest/testUtilities"
import { hasAnomalyAt, hasAnnotationAt } from "./rowMarks"

const ids = ["1", "2", "3"]

const makeChart = async rows => {
  const { chart } = makeTestChart({
    attributes: { chartType: "heatmap", groupBy: ["dimension"], selectedLegendDimensions: [] },
  })
  await loadHeatmapPayload(chart, ids, rows)
  return chart
}

describe("row marks", () => {
  it("reports an anomaly rate or an annotation only in the rows that have one", async () => {
    const chart = await makeChart([
      [1, [2, 40, 0], 3],
      [1, [2, 0, 1], 3],
      [1, 2, 3],
    ])

    expect([0, 1, 2].map(row => hasAnomalyAt(chart, row))).toEqual([true, false, false])
    expect([0, 1, 2].map(row => hasAnnotationAt(chart, row))).toEqual([false, true, false])
  })

  it("reports nothing for a missing row", async () => {
    const chart = await makeChart([[1, 2, 3]])

    expect(hasAnomalyAt(chart, undefined)).toBe(false)
    expect(hasAnnotationAt(chart, 7)).toBe(false)
  })
})
