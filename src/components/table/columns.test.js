import { findDimensionId } from "./columns"

describe("table value columns", () => {
  it("finds a dimension in grouped arrays", () => {
    expect(findDimensionId(["ctx,read", "ctx,write"], "write")).toBe("ctx,write")
  })

  it("accepts a grouped leaf containing one dimension", () => {
    expect(findDimensionId("ctx,read", "read")).toBe("ctx,read")
  })

  it("returns undefined for missing grouped dimensions", () => {
    expect(findDimensionId(null, "read")).toBeUndefined()
  })
})
