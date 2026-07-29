import { makeTestChart } from "@jest/testUtilities"
import { groupD3PieContent, makeD3PieContent } from "./data"

const makeChart = values => {
  const ids = values.map((_, index) => `dimension-${index}`)
  const { chart } = makeTestChart({ attributes: { hoverX: null } })
  chart.getPayload = () => ({ data: [[1000, ...values]] })
  chart.getVisibleDimensionIds = () => ids
  chart.getDimensionValue = id => values[ids.indexOf(id)]
  chart.selectDimensionColor = id => `#00000${ids.indexOf(id) + 1}`
  return chart
}

const chartUI = chart => ({ chart })

describe("D3 Pie data", () => {
  it("preserves absolute wedge size and signed label values", () => {
    const chart = makeChart([-20, 0, 30])
    expect(makeD3PieContent(chart, chartUI(chart))).toEqual([
      expect.objectContaining({ id: "dimension-0", value: 20, signedValue: -20 }),
      expect.objectContaining({ id: "dimension-2", value: 30, signedValue: 30 }),
    ])
  })

  it("preserves label ordering and exact top-five grouping", () => {
    const content = [7, 1, 6, 2, 5, 3, 4].map((value, index) => ({
      label: `dimension-${6 - index}`,
      value,
      id: `dimension-${6 - index}`,
    }))
    const grouped = groupD3PieContent(content, "#abcdef")

    expect(grouped).toHaveLength(6)
    expect(grouped.slice(0, 5).map(({ id }) => id)).toEqual([
      "dimension-0",
      "dimension-1",
      "dimension-2",
      "dimension-4",
      "dimension-6",
    ])
    expect(grouped[5]).toEqual(
      expect.objectContaining({
        label: "[smaller 2]",
        caption: "rest of dimensions",
        color: "#abcdef",
        value: 3,
        isGrouped: true,
      })
    )
  })

  it("preserves the legacy no-data segment", () => {
    const chart = makeChart([0])
    chart.getThemeAttribute = () => "#536775"
    expect(makeD3PieContent(chart, chartUI(chart))).toEqual([
      { label: "No data", value: 1, color: "#536775" },
    ])
  })
})
