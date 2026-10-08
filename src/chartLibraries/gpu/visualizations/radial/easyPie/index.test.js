import { makeTestChart } from "@jest/testUtilities"
import { getEasyPieValue, makeEasyPieFrame } from "."

const makeChart = ({ data, range = [-100, 100], hoverX = null }) => {
  const { chart } = makeTestChart({
    attributes: {
      chartLibrary: "easypiechart",
      getValueRange: () => range,
      hoverX,
      loaded: true,
    },
  })
  chart.getPayload = () => ({ data })
  chart.getClosestRow = timestamp => data.findIndex(row => row[0] === timestamp)
  return chart
}

const colors = {
  bar: "#ff0000",
  track: "#00ff00",
  scale: "#0000ff",
}

describe("GPU EasyPie visualization", () => {
  it("preserves current-row summation and signed range normalization", () => {
    const chart = makeChart({ data: [[1000, 10, -20]] })
    const frame = makeEasyPieFrame(chart, {
      width: 220,
      height: 110,
      dpr: 2,
      colors,
    })

    expect(getEasyPieValue(chart)).toBe(-10)
    expect(frame).toMatchObject({
      value: -10,
      percentage: 45,
      sweep: 0.45,
      centerX: 220,
      centerY: 110,
      size: 220,
      radius: 91,
      lineWidth: 10,
      scaleLength: 10,
      scaleEnabled: true,
      trackEnabled: true,
    })
  })

  it("uses synchronized hover rows and clamps signed drawing", () => {
    const chart = makeChart({
      data: [
        [1000, -150],
        [2000, 150],
      ],
      range: [0, 100],
      hoverX: [1000, 1000],
    })

    expect(
      makeEasyPieFrame(chart, { width: 100, height: 100, dpr: 1, colors }).sweep
    ).toBe(-1)
    chart.updateAttribute("hoverX", [2000, 2000])
    expect(
      makeEasyPieFrame(chart, { width: 100, height: 100, dpr: 1, colors }).sweep
    ).toBe(1)
  })

  it("preserves the minimum canvas and thin-ring formulas", () => {
    const chart = makeChart({ data: [[1000, 50]], range: [0, 100] })
    const frame = makeEasyPieFrame(chart, {
      width: 10,
      height: 15,
      dpr: 1,
      colors: { ...colors, scale: null },
    })

    expect(frame).toMatchObject({
      size: 20,
      radius: 9,
      lineWidth: 2,
      scaleLength: 2,
      scaleEnabled: false,
      sweep: 0.5,
    })
  })

  it("draws no progress when the range is degenerate", () => {
    const chart = makeChart({ data: [[1000, 1]], range: [1, 1] })
    expect(
      makeEasyPieFrame(chart, { width: 100, height: 100, dpr: 1, colors }).sweep
    ).toBe(0)
  })
})
