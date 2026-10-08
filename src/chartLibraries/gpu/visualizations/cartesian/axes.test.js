import { makeTestChart } from "@jest/testUtilities"
import { makeCartesianAxes, makePlotArea, padValueRange } from "./axes"

describe("GPU Cartesian axes", () => {
  it("reserves plot space only for enabled axes", () => {
    const { chart } = makeTestChart({
      attributes: { enabledXAxis: true, enabledYAxis: true, yAxisLabelWidth: 72 },
    })

    expect(makePlotArea(chart, 800, 400)).toEqual({
      left: 78,
      top: 0,
      width: 727,
      height: 384,
    })

    chart.updateAttributes({ enabledXAxis: false, enabledYAxis: false })
    expect(makePlotArea(chart, 800, 400)).toEqual({
      left: 0,
      top: 0,
      width: 805,
      height: 400,
    })
  })

  it("suppresses both axes for sparklines even when the axis flags are enabled", () => {
    const { chart } = makeTestChart({
      attributes: { sparkline: true, enabledXAxis: true, enabledYAxis: true },
    })
    const [afterMs, beforeMs] = chart.getDateWindow()
    const axes = makeCartesianAxes({
      chart,
      width: 800,
      height: 400,
      min: -90,
      max: 90,
      afterMs,
      beforeMs,
    })

    expect(axes.plot).toEqual({ left: 0, top: 0, width: 805, height: 400 })
    expect(axes.rects).toEqual([])
    expect(axes.labels).toEqual([])
  })

  it("pads a finite value domain by the Dygraphs line padding", () => {
    const [min, max] = padValueRange(-90, 90, 484)

    expect(min).toBeCloseTo(-90 - (180 * 15) / 484)
    expect(max).toBeCloseTo(90 + (180 * 15) / 484)
  })

  it("builds deterministic GPU grid and shaped text layers", () => {
    const { chart } = makeTestChart()
    const [afterMs, beforeMs] = chart.getDateWindow()
    const axes = makeCartesianAxes({
      chart,
      width: 800,
      height: 400,
      min: -90,
      max: 90,
      afterMs,
      beforeMs,
    })

    expect(axes.rects.length).toBeGreaterThan(0)
    expect(axes.labels.length).toBe(axes.rects.length)
    expect(axes.labels.every(label => label.font === "10px sans-serif")).toBe(true)
    expect(axes.labels.every(label => typeof label.text === "string")).toBe(true)

    chart.updateAttributes({ theme: "dark", axisLabelFontSize: 12 })
    const darkAxes = makeCartesianAxes({
      chart,
      width: 800,
      height: 400,
      min: -90,
      max: 90,
      afterMs,
      beforeMs,
    })
    expect(darkAxes.labels.every(label => label.font === "12px sans-serif")).toBe(true)
    expect(
      darkAxes.labels.every(label => label.color === chart.getThemeAttribute("themeLabelColor"))
    ).toBe(true)
  })
})
