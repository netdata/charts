import { pickLegend } from "./tokens"

describe("pickLegend", () => {
  it("hides the legend on tiles", () => {
    expect(pickLegend({ width: 300, count: 3 })).toBe("hidden")
  })

  it("labels a few series directly", () => {
    expect(pickLegend({ width: 640, count: 3 })).toBe("direct")
  })

  it("uses a single line for a handful of series", () => {
    expect(pickLegend({ width: 640, count: 5 })).toBe("below")
  })

  it("uses the side table for wide or crowded charts", () => {
    expect(pickLegend({ width: 1200, count: 3 })).toBe("table")
    expect(pickLegend({ width: 640, count: 12 })).toBe("table")
  })
})
