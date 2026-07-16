import { getStackBounds, getStackSegments, getStackValueRange } from "./stacking"

describe("getStackBounds", () => {
  it("accumulates positive values from a zero base in column order", () => {
    const data = [
      [0, 10, 20, 30],
      [1, 1, 2, 3],
    ]
    const bounds = getStackBounds(data, ["a", "b", "c"])

    expect(bounds[0][0]).toEqual([0, 10])
    expect(bounds[1][0]).toEqual([10, 30])
    expect(bounds[2][0]).toEqual([30, 60])
  })

  it("stacks negative values in a separate downward accumulator", () => {
    const data = [[0, 5, -3, -2, 4]]
    const bounds = getStackBounds(data, ["a", "b", "c", "d"])

    expect(bounds[0][0]).toEqual([0, 5])
    expect(bounds[1][0]).toEqual([0, -3])
    expect(bounds[2][0]).toEqual([-3, -5])
    expect(bounds[3][0]).toEqual([5, 9])
  })

  it("skips hidden columns and leaves gaps for null values", () => {
    const data = [[0, 5, null, 7]]
    const bounds = getStackBounds(data, ["a", "b", "c"], column => column !== "b")

    expect(bounds[0][0]).toEqual([0, 5])
    expect(bounds[1]).toBeNull()
    expect(bounds[2][0]).toEqual([5, 12])
  })
})

describe("getStackValueRange", () => {
  it("spans the extremes of both stacks including zero", () => {
    const data = [[0, 5, -3, -2, 4]]
    const bounds = getStackBounds(data, ["a", "b", "c", "d"])

    expect(getStackValueRange(bounds)).toEqual([-5, 9])
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
