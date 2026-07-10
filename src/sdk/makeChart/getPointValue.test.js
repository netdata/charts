import { getPointValue, getRowPointValue } from "./getPointValue"

const point = { value: 0, arp: 1, pa: 2 }

describe("getPointValue", () => {
  it("reads JSON2 array cells using the point schema", () => {
    const cell = [10, 20, 30]

    expect(getPointValue(cell, point)).toBe(10)
    expect(getPointValue(cell, point, "arp")).toBe(20)
    expect(getPointValue(cell, point, "pa")).toBe(30)
  })

  it("keeps compatibility with object and scalar cells", () => {
    expect(getPointValue({ value: 10, arp: 20 }, point)).toBe(10)
    expect(getPointValue({ value: 10, arp: 20 }, point, "arp")).toBe(20)
    expect(getPointValue(10, point)).toBe(10)
    expect(getPointValue(10, point, "arp")).toBeUndefined()
    expect(getPointValue(null, point)).toBeNull()
    expect(getPointValue(null, point, "arp")).toBeUndefined()
  })

  it("returns undefined when an array cell has no requested field", () => {
    expect(getPointValue([10], point, "unknown")).toBeUndefined()
    expect(getPointValue([10], {}, "value")).toBeUndefined()
  })
})

describe("getRowPointValue", () => {
  it("reads a cell at the requested row index", () => {
    expect(getRowPointValue([1000, [10, 20, 30]], 1, point, "pa")).toBe(30)
    expect(getRowPointValue(null, 1, point)).toBeUndefined()
  })
})
