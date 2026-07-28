import { getClosestRow } from "./interactions"

describe("WebGPU line hit testing", () => {
  const data = [
    [1000, 1],
    [2000, 2],
    [3000, 3],
  ]

  it("finds the nearest aligned row without scanning every point", () => {
    expect(getClosestRow(data, 100)).toBe(0)
    expect(getClosestRow(data, 1700)).toBe(1)
    expect(getClosestRow(data, 2600)).toBe(2)
    expect(getClosestRow(data, 4000)).toBe(2)
  })

  it("reports no row for empty data", () => {
    expect(getClosestRow([], 1000)).toBe(-1)
  })
})
