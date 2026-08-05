import Dygraph from "dygraphs/src/dygraph"
import linePlotter from "@/chartLibraries/dygraph/plotters/linePlotter"
import { computeSmoothOps } from "./smoothLinePath"

const recordDygraphOps = points => {
  const calls = []
  const drawingContext = {}
  ;["beginPath", "moveTo", "bezierCurveTo", "stroke"].forEach(method => {
    drawingContext[method] = (...args) => calls.push([method, ...args])
  })

  linePlotter()({ drawingContext, points })

  return calls
    .filter(([method]) => method === "moveTo" || method === "bezierCurveTo")
    .map(([method, ...args]) =>
      method === "moveTo"
        ? { type: "moveTo", x: args[0], y: args[1] }
        : {
            type: "bezier",
            cp1x: args[0],
            cp1y: args[1],
            cp2x: args[2],
            cp2y: args[3],
            x: args[4],
            y: args[5],
          }
    )
}

const toHelperPoints = points =>
  points.map(p => (p == null ? null : { x: p.canvasx, y: p.canvasy }))

const expectOpsMatch = points => {
  const expected = recordDygraphOps(points)
  const actual = computeSmoothOps(toHelperPoints(points))
  expect(actual).toEqual(expected)
}

describe("computeSmoothOps", () => {
  it("assumes the Dygraph default smoothing of 1/3 (the value this SDK relies on)", () => {
    expect(Dygraph.smoothPlotter.smoothing).toBe(1 / 3)
  })

  it("matches Dygraph's smooth plotter for a monotonic rising set", () => {
    expectOpsMatch([
      { canvasx: 10, canvasy: 10 },
      { canvasx: 20, canvasy: 20 },
      { canvasx: 30, canvasy: 30 },
      { canvasx: 40, canvasy: 40 },
    ])
  })

  it("matches Dygraph's smooth plotter through a local peak (false-extrema clamps)", () => {
    expectOpsMatch([
      { canvasx: 10, canvasy: 40 },
      { canvasx: 20, canvasy: 10 },
      { canvasx: 30, canvasy: 60 },
      { canvasx: 40, canvasy: 20 },
    ])
  })

  it("matches Dygraph's smooth plotter with a null gap and a zero-height point in the middle", () => {
    expectOpsMatch([
      { canvasx: 10, canvasy: 40 },
      { canvasx: 20, canvasy: null },
      { canvasx: 30, canvasy: 20 },
      { canvasx: 40, canvasy: 0 },
      { canvasx: 50, canvasy: 30 },
      { canvasx: 60, canvasy: NaN },
    ])
  })

  it("matches Dygraph's smooth plotter for a two-point set", () => {
    expectOpsMatch([
      { canvasx: 10, canvasy: 40 },
      { canvasx: 20, canvasy: 10 },
    ])
  })

  it("matches Dygraph's smooth plotter with a leading gap", () => {
    expectOpsMatch([
      { canvasx: 10, canvasy: null },
      { canvasx: 20, canvasy: 30 },
      { canvasx: 30, canvasy: 50 },
      { canvasx: 40, canvasy: 20 },
    ])
  })

  it("matches Dygraph's smooth plotter with a trailing gap", () => {
    expectOpsMatch([
      { canvasx: 10, canvasy: 10 },
      { canvasx: 20, canvasy: 30 },
      { canvasx: 30, canvasy: 50 },
      { canvasx: 40, canvasy: null },
    ])
  })

  it("matches Dygraph's smooth plotter for a longer noisy set", () => {
    const values = [10, 90, -20, 60, 5, 120, 0, 40, 80, 15, 30]
    const points = Array.from({ length: 60 }, (_, index) => ({
      canvasx: index * 7 + (index % 5),
      canvasy: values[index % values.length],
    }))
    expectOpsMatch(points)
  })

  it("treats a raw null entry the same as an interior missing-y point", () => {
    const withNull = [{ x: 10, y: 10 }, null, { x: 30, y: 30 }]
    const withNaN = [
      { x: 10, y: 10 },
      { x: 20, y: NaN },
      { x: 30, y: 30 },
    ]
    expect(computeSmoothOps(withNull)).toEqual(computeSmoothOps(withNaN))
  })

  it("returns an empty op list for an empty point set", () => {
    expect(computeSmoothOps([])).toEqual([])
  })
})
