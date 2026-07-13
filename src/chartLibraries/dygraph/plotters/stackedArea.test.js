import makeStackedAreaPlotter, {
  reduceStackedAreaPoints,
  selectStackedAreaPointIndexes,
} from "./stackedArea"

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

    const selectedIndexes = selectStackedAreaPointIndexes([points], width)
    const reduced = reduceStackedAreaPoints(points, selectedIndexes)

    expect(reduced.length).toBeLessThanOrEqual((width + 1) * 6)
    expect(reduced[0]).toBe(points[0])
    expect(reduced[reduced.length - 1]).toBe(points[points.length - 1])
  })

  it("uses pixel coordinates when Dygraph points include normalized and canvas x values", () => {
    const width = 800
    const count = 86400
    const points = Array.from({ length: count }, (_, index) => ({
      x: index / (count - 1),
      canvasx: (index / (count - 1)) * width,
      baseY: index % 31,
      endY: index % 47,
    }))

    const selectedIndexes = selectStackedAreaPointIndexes([points], width)
    const selectedPixels = new Set(
      selectedIndexes.map(index => Math.round(points[index].canvasx))
    )

    expect(selectedIndexes.length).toBeGreaterThanOrEqual(width + 1)
    expect(selectedPixels.size).toBe(width + 1)
  })

  it("keeps the canvas-width bound independent of the number of stacked series", () => {
    const width = 100
    const count = 10000
    const series = Array.from({ length: 8 }, (_, seriesIndex) =>
      Array.from({ length: count }, (_, index) => ({
        x: (index / (count - 1)) * width,
        baseY: Math.sin(index * (seriesIndex + 1)) * 10,
        endY: Math.cos(index * (seriesIndex + 1)) * 10,
      }))
    )

    const selectedIndexes = selectStackedAreaPointIndexes(series, width)

    expect(selectedIndexes.length).toBeLessThanOrEqual((width + 1) * 6)
  })

  it("preserves boundary extrema within the same canvas pixel", () => {
    const points = [
      { x: 1.01, baseY: 0, endY: 0 },
      { x: 1.02, baseY: -20, endY: 1 },
      { x: 1.03, baseY: 2, endY: 30 },
      { x: 1.04, baseY: 3, endY: 4 },
      { x: 1.05, baseY: 5, endY: -40 },
      { x: 1.06, baseY: 35, endY: 6 },
      { x: 1.07, baseY: 0, endY: 0 },
    ]

    const selectedIndexes = selectStackedAreaPointIndexes([points], 1)
    const reduced = reduceStackedAreaPoints(points, selectedIndexes)

    expect(reduced).toEqual([points[0], points[1], points[2], points[4], points[5], points[6]])
  })

  it("preserves gaps while reducing dense runs", () => {
    const left = Array.from({ length: 20 }, (_, index) => makePoint(index, 20, 2))
    const right = Array.from({ length: 20 }, (_, index) => makePoint(index, 20, 2))
    const points = [...left, null, ...right]

    const selectedIndexes = selectStackedAreaPointIndexes([points], 2)
    const reduced = reduceStackedAreaPoints(points, selectedIndexes)
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

    const selectedIndexes = selectStackedAreaPointIndexes([lower, upper], 1)
    const reducedLower = reduceStackedAreaPoints(lower, selectedIndexes)
    const reducedUpper = reduceStackedAreaPoints(upper, selectedIndexes)
    const x = xValues[3]

    expect(reducedLower.map(point => point?.x)).toEqual(reducedUpper.map(point => point?.x))
    expect(reducedLower.map(point => point?.endY)).toEqual(
      reducedUpper.map(point => point?.baseY)
    )
    expect(interpolateBoundary(reducedLower, x, "endY")).toBe(60)
    expect(interpolateBoundary(reducedUpper, x, "baseY")).toBe(60)
  })
})
