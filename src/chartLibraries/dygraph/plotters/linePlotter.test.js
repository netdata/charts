import Dygraph from "dygraphs/src/dygraph"
import linePlotter from "./linePlotter"

const makeContext = () => {
  const calls = []
  const drawingContext = {}

  ;["beginPath", "moveTo", "bezierCurveTo", "stroke"].forEach(method => {
    drawingContext[method] = (...args) => calls.push([method, ...args])
  })

  return { calls, drawingContext }
}

const expectSameDrawing = (points, smoothing) => {
  const previousSmoothing = Dygraph.smoothPlotter.smoothing
  const reference = makeContext()
  const candidate = makeContext()

  try {
    Dygraph.smoothPlotter.smoothing = smoothing
    Dygraph.smoothPlotter({ drawingContext: reference.drawingContext, points })
    linePlotter()({ drawingContext: candidate.drawingContext, points })
  } finally {
    Dygraph.smoothPlotter.smoothing = previousSmoothing
  }

  expect(candidate.calls).toEqual(reference.calls)
}

describe("linePlotter", () => {
  it("returns a function", () => {
    const plotter = linePlotter()
    expect(typeof plotter).toBe("function")
  })

  it.each([
    {
      name: "continuous points",
      points: [
        { canvasx: 10, canvasy: 40 },
        { canvasx: 20, canvasy: 10 },
        { canvasx: 30, canvasy: 60 },
        { canvasx: 40, canvasy: 20 },
      ],
    },
    {
      name: "missing and zero-height points",
      points: [
        { canvasx: 10, canvasy: 40 },
        { canvasx: 20, canvasy: null },
        { canvasx: 30, canvasy: 20 },
        { canvasx: 40, canvasy: 0 },
        { canvasx: 50, canvasy: 30 },
        { canvasx: 60, canvasy: NaN },
      ],
    },
    {
      name: "two points",
      points: [
        { canvasx: 10, canvasy: 40 },
        { canvasx: 20, canvasy: 10 },
      ],
    },
  ])("matches the Dygraph smooth plotter for $name", ({ points }) => {
    expectSameDrawing(points, Dygraph.smoothPlotter.smoothing)
  })

  it.each([undefined, 0, 0.2, 1 / 3, 0.8])(
    "matches the Dygraph smooth plotter with smoothing %s",
    smoothing => {
      const values = [10, 90, -20, 60, 5, 120, 0, null, 40, NaN, 80, 15, Infinity, 30]
      const points = Array.from({ length: 140 }, (_, index) => ({
        canvasx: index % 17 === 0 ? index - 1 : index,
        canvasy: values[index % values.length],
      }))

      expectSameDrawing(points, smoothing)
    }
  )
})
