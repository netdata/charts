import {
  getSeriesStackBounds,
  getStackBounds,
  getStackSegments,
  getStackValueRange,
} from "./stacking"

describe("getStackBounds", () => {
  // dygraph accumulates last series first (dygraphs/src/dygraph.js:2249-2253), so the last
  // dimension owns the bottom band and the first is drawn on top
  it("accumulates the last column from a zero base", () => {
    const data = [
      [0, 10, 20, 30],
      [1, 1, 2, 3],
    ]
    const bounds = getStackBounds(data, ["a", "b", "c"])

    expect(bounds[2][0]).toEqual([0, 30])
    expect(bounds[1][0]).toEqual([30, 50])
    expect(bounds[0][0]).toEqual([50, 60])
  })

  it("stacks negative values in a separate downward accumulator", () => {
    const data = [[0, 5, -3, -2, 4]]
    const bounds = getStackBounds(data, ["a", "b", "c", "d"])

    expect(bounds[3][0]).toEqual([0, 4])
    expect(bounds[2][0]).toEqual([0, -2])
    expect(bounds[1][0]).toEqual([-2, -5])
    expect(bounds[0][0]).toEqual([4, 9])
  })

  it("skips hidden columns and leaves gaps for null values", () => {
    const data = [[0, 5, null, 7]]
    const bounds = getStackBounds(data, ["a", "b", "c"], column => column !== "b")

    expect(bounds[2][0]).toEqual([0, 7])
    expect(bounds[1]).toBeNull()
    expect(bounds[0][0]).toEqual([7, 12])
  })
})

describe("getSeriesStackBounds", () => {
  // same accumulation over uPlot's column-major layout
  it("matches the row-major bounds for the same values", () => {
    const seriesData = [
      [0, 1],
      [5, 5],
      [-3, -3],
      [4, 4],
    ]
    const bounds = getSeriesStackBounds(seriesData, () => true)

    expect(bounds[2][0]).toEqual([0, 4])
    expect(bounds[1][0]).toEqual([0, -3])
    expect(bounds[0][0]).toEqual([4, 9])
  })

  it("leaves a gap instead of stacking a null as zero", () => {
    const seriesData = [[0], [5], [null]]
    const bounds = getSeriesStackBounds(seriesData, () => true)

    expect(bounds[1][0]).toBeNull()
    expect(bounds[0][0]).toEqual([0, 5])
  })
})

describe("getStackValueRange", () => {
  it("spans the stack ends of both directions", () => {
    const data = [[0, 5, -3, -2, 4]]
    const bounds = getStackBounds(data, ["a", "b", "c", "d"])

    expect(getStackValueRange(bounds)).toEqual([-5, 9])
  })

  // dygraph would range this as [18, 28], leaving the bottom band entirely below the axis
  it("keeps zero in range so the bottom band stays visible", () => {
    const data = [[0, 10, 18]]
    const bounds = getStackBounds(data, ["a", "b"])

    expect(getStackValueRange(bounds)).toEqual([0, 28])
  })

  it("collapses to zero when nothing is stacked", () => {
    expect(getStackValueRange([null, null])).toEqual([0, 0])
  })
})

describe("getStackSegments", () => {
  const bound = [0, 1]

  it("returns a single full-span segment when there are no gaps", () => {
    expect(getStackSegments([bound, bound, bound], 3)).toEqual([[0, 2]])
  })

  it("splits into separate segments around an interior null, leaving the gap empty", () => {
    expect(getStackSegments([bound, null, bound], 3)).toEqual([
      [0, 0],
      [2, 2],
    ])
  })

  it("handles multiple gaps and contiguous runs", () => {
    const series = [bound, bound, null, bound, null, bound, bound]
    expect(getStackSegments(series, 7)).toEqual([
      [0, 1],
      [3, 3],
      [5, 6],
    ])
  })

  it("skips leading and trailing nulls", () => {
    expect(getStackSegments([null, bound, bound, null], 4)).toEqual([[1, 2]])
  })

  it("returns no segments when every value is null", () => {
    expect(getStackSegments([null, null, null], 3)).toEqual([])
  })
})
