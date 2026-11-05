import { getSideRight } from "./container"

describe("getSideRight", () => {
  it("places the element to the right of the line when it fits", () => {
    expect(getSideRight({ from: 100, chartWidth: 600, elementWidth: 200, gap: 8 })).toBe(308)
  })

  it("flips the element to the left of the line near the right edge", () => {
    expect(getSideRight({ from: 500, chartWidth: 600, elementWidth: 200, gap: 8 })).toBe(492)
  })

  it("keeps the element inside the chart when neither side fits", () => {
    expect(getSideRight({ from: 120, chartWidth: 334, elementWidth: 216, gap: 8 })).toBe(334)
  })
})
