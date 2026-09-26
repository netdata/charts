import { makeTestChart } from "../../../../../../jest/testUtilities"
import { makeAreaStyle } from "."

describe("GPU area visualization", () => {
  it("uses Dygraphs area fill and stroke semantics", () => {
    const { chart } = makeTestChart({
      attributes: { chartType: "area", sparkline: false, stepPlot: false },
    })

    expect(makeAreaStyle(chart)).toEqual({
      fillAlpha: 0.2,
      lineWidth: 0.7,
      smooth: false,
      stepped: false,
    })

    chart.updateAttribute("stepPlot", true)

    expect(makeAreaStyle(chart)).toEqual({
      fillAlpha: 0.2,
      lineWidth: 0.7,
      smooth: false,
      stepped: true,
    })
  })

  it("renders sparklines as an opaque fill without a stroke", () => {
    const { chart } = makeTestChart({
      attributes: { chartType: "area", sparkline: true },
    })

    expect(makeAreaStyle(chart)).toEqual({
      fillAlpha: 1,
      lineWidth: 0,
      smooth: false,
      stepped: false,
    })
  })
})
