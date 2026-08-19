import { makeTestChart } from "@jest/testUtilities"
import { makeGaugeFrame } from "."

const makeChart = (attributes = {}) => {
  const { chart } = makeTestChart({
    attributes: {
      chartLibrary: "gauge",
      getValueRange: () => [0, 100],
      gaugeGradient: true,
      gaugeLineWidth: 0.1,
      loaded: true,
      ...attributes,
    },
  })
  chart.getPayload = () => ({ data: [[1000, 50]] })
  return chart
}

const colors = {
  dimension: "#3366cc",
  pointer: "#8f9eaa",
  track: "#dbe1e1",
}

describe("GPU Gauge visualization", () => {
  it("preserves legacy arc, pointer, and sizing formulas", () => {
    const frame = makeGaugeFrame(makeChart(), {
      width: 500,
      height: 500,
      dpr: 1,
      colors,
    })

    expect(frame.percentage).toBe(50)
    expect(frame.progressSweep).toBeCloseTo(Math.PI * 0.7)
    expect(frame.pointerAngle).toBeCloseTo(Math.PI * 1.5)
    expect(frame.lineWidth).toBe(36)
    expect(frame.radius).toBeCloseTo(215.394, 3)
    expect(frame.pointerLength).toBeCloseTo(frame.radius * 1.2)
    expect(frame.pointerWidth).toBeCloseTo(15.75)
    expect(frame.gradientEnabled).toBe(true)
  })

  it("clamps display percentages exactly like the legacy gauge", () => {
    const chart = makeChart()
    chart.getPayload = () => ({ data: [[1000, -10]] })
    expect(makeGaugeFrame(chart, { width: 100, height: 100, dpr: 1, colors }).percentage).toBe(
      0.001
    )

    chart.getPayload = () => ({ data: [[1000, 110]] })
    expect(makeGaugeFrame(chart, { width: 100, height: 100, dpr: 1, colors }).percentage).toBe(
      99.999
    )
  })

  it("selects threshold colors without applying the smooth gradient", () => {
    const chart = makeChart({
      gaugeThresholds: [
        { from: 0, color: ["#00ff00", "#00ff00"] },
        { from: 40, color: ["#ffff00", "#ffff00"] },
        { from: 80, color: ["#ff0000", "#ff0000"] },
      ],
    })
    const frame = makeGaugeFrame(chart, { width: 100, height: 100, dpr: 1, colors })

    expect(frame.gradientEnabled).toBe(false)
    expect(frame.progressEndColor).toEqual([1, 1, 0, 1])
    expect(frame.progressStartColor).toEqual(frame.progressEndColor)
  })

  it("rejects static zones instead of approximating them", () => {
    const chart = makeChart({ staticZones: [{ min: 0, max: 50, strokeStyle: "red" }] })
    expect(() =>
      makeGaugeFrame(chart, { width: 100, height: 100, dpr: 1, colors })
    ).toThrow("staticZones")
  })
})
