import makeStackedAreaPlotter, { reduceStackedAreaPoints } from "./stackedArea"

const makePoint = (index, count, width) => ({
  x: (index / (count - 1)) * width,
  baseY: index % 31,
  endY: index % 47,
})

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
})
