import isInXRange from "./isInXRange"

const range = [1617946860000, 1617946870000]

describe("isInXRange", () => {
  it("keeps a time inside the range", () => {
    expect(isInXRange(1617946865000, range, 1)).toBe(true)
  })

  it("drops a time before the range", () => {
    expect(isInXRange(1617946800000, range, 1)).toBe(false)
  })

  it("drops a time after the range", () => {
    expect(isInXRange(1617946900000, range, 1)).toBe(false)
  })

  it("keeps a time one update step past either edge", () => {
    expect(isInXRange(1617946871000, range, 1)).toBe(true)
    expect(isInXRange(1617946859000, range, 1)).toBe(true)
  })

  it("keeps the time when the range is unknown", () => {
    expect(isInXRange(1617946800000, null, 1)).toBe(true)
    expect(isInXRange(1617946800000, [null, null], 1)).toBe(true)
  })
})
