import { getStackBounds, getStackValueRange } from "./stacking"

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
