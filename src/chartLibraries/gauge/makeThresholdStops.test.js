import Gauge from "./library"
import makeThresholdStops from "./makeThresholdStops"

const T = [
  { id: "a", from: 0, color: ["#00AB44", "#00AB44"] },
  { id: "b", from: 80, color: ["#FFCC26", "#FFCC26"] },
  { id: "c", from: 90, color: ["#F95251", "#F95251"] },
]

describe("makeThresholdStops", () => {
  it("returns undefined for empty or degenerate input", () => {
    expect(makeThresholdStops(null, 0, 100, 0)).toBeUndefined()
    expect(makeThresholdStops([], 0, 100, 0)).toBeUndefined()
    expect(makeThresholdStops(T, 50, 50, 0)).toBeUndefined()
  })

  it("builds ascending upper-bound stops with the last band open-ended", () => {
    const stops = makeThresholdStops(T, 0, 100, 0)
    expect(stops).toHaveLength(3)
    expect(stops[0][0]).toBeCloseTo(0.8, 5)
    expect(stops[1][0]).toBeCloseTo(0.9, 5)
    expect(stops[2]).toEqual([1, "#F95251"])
    expect(stops[0][1]).toBe("#00AB44")
    expect(stops[1][1]).toBe("#FFCC26")
  })

  it("resolves the color by theme index", () => {
    const stops = makeThresholdStops(
      [{ from: 0, color: ["#111111", "#eeeeee"] }],
      0,
      100,
      1
    )
    expect(stops[0][1]).toBe("#eeeeee")
  })

  it("sorts unordered input and keeps real-unit bands under an auto-scaled range", () => {
    const shuffled = [T[2], T[0], T[1]]
    const stops = makeThresholdStops(shuffled, 0, 200, 0)
    expect(stops[0][0]).toBeCloseTo(0.4, 5)
    expect(stops[1][0]).toBeCloseTo(0.45, 5)
    expect(stops[2]).toEqual([1, "#F95251"])
  })

  it("drops thresholds above max so unreachable bands never win", () => {
    const stops = makeThresholdStops(T, 0, 85, 0)
    expect(stops).toHaveLength(2)
    expect(stops[1]).toEqual([1, "#FFCC26"])
  })

  it("feeds a real gauge engine to the correct color per band", () => {
    const canvas = document.createElement("canvas")
    canvas.width = 200
    canvas.height = 200
    const gauge = new Gauge(canvas)
    gauge.maxValue = 100
    gauge.setMinValue(0)
    gauge.setOptions({ percentColors: makeThresholdStops(T, 0, 100, 0), generateGradient: false })

    expect(gauge.getColorForValue(50, false)).toBe("rgb(0,171,68)")
    expect(gauge.getColorForValue(80, false)).toBe("rgb(255,204,38)")
    expect(gauge.getColorForValue(85, false)).toBe("rgb(255,204,38)")
    expect(gauge.getColorForValue(90, false)).toBe("rgb(249,82,81)")
    expect(gauge.getColorForValue(99, false)).toBe("rgb(249,82,81)")
  })

  it("keeps the last threshold when two share the same from", () => {
    const stops = makeThresholdStops(
      [
        { from: 0, color: ["#00AB44", "#00AB44"] },
        { from: 50, color: ["#AAAAAA", "#AAAAAA"] },
        { from: 50, color: ["#BBBBBB", "#BBBBBB"] },
      ],
      0,
      100,
      0
    )
    expect(stops).toHaveLength(2)
    expect(stops[1]).toEqual([1, "#BBBBBB"])
  })

  it("defaults themeIndex to 0 (light) when omitted", () => {
    const stops = makeThresholdStops([{ from: 0, color: ["#111111", "#eeeeee"] }], 0, 100)
    expect(stops[0][1]).toBe("#111111")
  })

  it("falls back to color[0] when themeIndex is out of range", () => {
    const stops = makeThresholdStops([{ from: 0, color: ["#123456", "#654321"] }], 0, 100, 5)
    expect(stops[0][1]).toBe("#123456")
  })
})
