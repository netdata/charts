import { isStateUnits } from "./stepped"

describe("isStateUnits", () => {
  it("returns true for state units", () => {
    expect(isStateUnits(["{state}"])).toBe(true)
    expect(isStateUnits(["state"])).toBe(true)
  })

  it("returns true for status units", () => {
    expect(isStateUnits(["{status}"])).toBe(true)
    expect(isStateUnits(["status"])).toBe(true)
  })

  it("accepts a plain string", () => {
    expect(isStateUnits("state")).toBe(true)
  })

  it("returns false for non-state units", () => {
    expect(isStateUnits(["bytes/s"])).toBe(false)
    expect(isStateUnits(["%"])).toBe(false)
  })

  it("returns false when mixed with non-state units", () => {
    expect(isStateUnits(["state", "bytes/s"])).toBe(false)
  })

  it("returns false for empty or missing units", () => {
    expect(isStateUnits([])).toBe(false)
    expect(isStateUnits([""])).toBe(false)
    expect(isStateUnits(undefined)).toBe(false)
  })
})
