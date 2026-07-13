import makeStackedAreaPlotter, { reduceStackedAreaPoints } from "./stackedArea"

const makePoint = (index, count, width) => ({
  x: (index / (count - 1)) * width,
  baseY: index % 31,
  endY: index % 47,
})

const interpolateBoundary = (points, x, key) => {
  const rightIndex = points.findIndex(point => point.x >= x)
  const right = points[rightIndex]
  if (right.x === x) return right[key]

  const left = points[rightIndex - 1]
  const progress = (x - left.x) / (right.x - left.x)

  return left[key] + (right[key] - left[key]) * progress
}

describe("stacked area plotter", () => {
  it("provides fill and line plotter functions to Dygraphs", () => {
    const plotters = makeStackedAreaPlotter()

    expect(plotters).toHaveLength(2)
    plotters.forEach(plotter => expect(typeof plotter).toBe("function"))
  })

  it("bounds high-density render points by canvas width", () => {
    const width = 800
    const count = 86400
    const points = Array.from({ length: count }, (_, index) => makePoint(index, count, width))

    const reduced = reduceStackedAreaPoints(points, width)

    expect(reduced.length).toBeLessThanOrEqual((width + 1) * 6)
    expect(reduced[0]).toBe(points[0])
    expect(reduced[reduced.length - 1]).toBe(points[points.length - 1])
  })

  it("preserves boundary extrema within the same canvas pixel", () => {
    const points = [
      { x: 1.1, baseY: 5, endY: 10 },
      { x: 1.2, baseY: -20, endY: 8 },
      { x: 1.3, baseY: 4, endY: 30 },
      { x: 1.4, baseY: 7, endY: -40 },
      { x: 1.45, baseY: 6, endY: 9 },
    ]

    const reduced = reduceStackedAreaPoints(points, 1)

    expect(reduced).toEqual(points)
  })

  it("preserves gaps while reducing dense runs", () => {
    const left = Array.from({ length: 20 }, (_, index) => makePoint(index, 20, 2))
    const right = Array.from({ length: 20 }, (_, index) => makePoint(index, 20, 2))
    const points = [...left, null, ...right]

    const reduced = reduceStackedAreaPoints(points, 2)
    const gap = reduced.indexOf(null)

    expect(gap).toBeGreaterThan(0)
    expect(gap).toBeLessThan(reduced.length - 1)
  })

  it("keeps adjacent series on the same shared boundary after reduction", () => {
    const xValues = [0.01, 0.02, 0.03, 0.04, 0.05, 0.06, 0.07]
    const sharedBoundary = [0, 30, 45, 60, 120, 100, 80]
    const lowerBase = [0, 10, 20, 100, 40, 50, 60]
    const upperEnd = [50, -100, 60, 70, 80, 200, 90]
    const lower = xValues.map((x, index) => ({
      x,
      baseY: lowerBase[index],
      endY: sharedBoundary[index],
    }))
    const upper = xValues.map((x, index) => ({
      x,
      baseY: sharedBoundary[index],
      endY: upperEnd[index],
    }))

    const reducedLower = reduceStackedAreaPoints(lower, 1)
    const reducedUpper = reduceStackedAreaPoints(upper, 1)
    const x = xValues[3]

    expect(interpolateBoundary(reducedLower, x, "endY")).toBe(60)
    expect(interpolateBoundary(reducedUpper, x, "baseY")).toBe(60)
  })
})
