import { getSparklinePoints } from "./sparklineCanvas"

describe("getSparklinePoints", () => {
  it("scales a single-series range into the canvas bounds", () => {
    expect(getSparklinePoints([0, 5, 10], 100, 24)).toEqual([
      { x: 4, y: 20 },
      { x: 50, y: 12 },
      { x: 96, y: 4 },
    ])
  })

  it("centers constant values", () => {
    expect(getSparklinePoints([5, 5], 100, 24)).toEqual([
      { x: 4, y: 12 },
      { x: 96, y: 12 },
    ])
  })

  it("preserves gaps and rejects an empty numeric series", () => {
    expect(getSparklinePoints([1, null, 3], 100, 20)).toEqual([
      { x: 4, y: 16 },
      null,
      { x: 96, y: 4 },
    ])
    expect(getSparklinePoints([null, NaN], 100, 20)).toEqual([])
  })
})
