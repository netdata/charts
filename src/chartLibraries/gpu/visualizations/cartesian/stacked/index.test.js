import { makeTestChart } from "../../../../../../jest/testUtilities"
import { makeStackedStyle } from "."

describe("GPU stacked visualization", () => {
  it("uses Dygraphs stacked fill and stroke semantics", () => {
    const { chart } = makeTestChart({
      attributes: { chartType: "stacked", sparkline: false, stepPlot: false },
    })

    expect(makeStackedStyle(chart)).toEqual({
      fillAlpha: 0.8,
      lineWidth: 0.1,
      smooth: false,
      stepped: false,
    })

    chart.updateAttribute("stepPlot", true)

    expect(makeStackedStyle(chart)).toEqual({
      fillAlpha: 0.8,
      lineWidth: 0.1,
      smooth: false,
      stepped: true,
    })
  })

  it("renders stacked sparklines as opaque fills without strokes", () => {
    const { chart } = makeTestChart({
      attributes: { chartType: "stacked", sparkline: true },
    })

    expect(makeStackedStyle(chart)).toEqual({
      fillAlpha: 1,
      lineWidth: 0,
      smooth: false,
      stepped: false,
    })
  })
})
