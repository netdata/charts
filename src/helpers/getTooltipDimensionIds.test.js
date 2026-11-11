import { loadHeatmapPayload, makeTestChart } from "@jest/testUtilities"
import getTooltipDimensionIds from "./getTooltipDimensionIds"

const ids = ["1", "2", "3", "4", "5", "6"]

const makeHeatmap = async (attributes = {}) => {
  const { chart } = makeTestChart({
    attributes: {
      chartType: "heatmap",
      groupBy: ["dimension"],
      selectedDimensions: [],
      selectedLegendDimensions: [],
      heatmapKeepEmptyRows: true,
      ...attributes,
    },
  })
  await loadHeatmapPayload(chart, ids, [[1, 0, 3, 2, 0, 4]])
  return chart
}

describe("getTooltipDimensionIds", () => {
  it("lists heatmap rows bottom first, zeros included, by default", async () => {
    const chart = await makeHeatmap()
    expect(getTooltipDimensionIds(chart, 0, "valueDesc")).toEqual(ids)
  })

  it("drops empty rows with heatmapTooltipHideZeros", async () => {
    const chart = await makeHeatmap({ heatmapTooltipHideZeros: true })
    expect(getTooltipDimensionIds(chart, 0, "valueDesc")).toEqual(["1", "3", "4", "6"])
  })

  it("lists the top row first with heatmapTooltipTopFirst, after hiding zeros", async () => {
    const chart = await makeHeatmap({
      heatmapTooltipHideZeros: true,
      heatmapTooltipTopFirst: true,
    })
    expect(getTooltipDimensionIds(chart, 0, "valueDesc")).toEqual(["6", "4", "3", "1"])
  })

  it("keeps only the selected dimensions", async () => {
    const chart = await makeHeatmap({ selectedDimensions: ["3", "4"] })
    jest.spyOn(chart, "isDimensionVisible").mockImplementation(id => ["3", "4"].includes(id))
    expect(getTooltipDimensionIds(chart, 0, "valueDesc")).toEqual(["3", "4"])
  })
})
