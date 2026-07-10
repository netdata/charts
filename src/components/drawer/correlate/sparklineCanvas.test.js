import { getSparklinePoints } from "./sparklineCanvas"

describe("getSparklinePoints", () => {
  it("scales a single-series range into the canvas bounds", () => {
    expect(getSparklinePoints([0, 5, 10], 100, 25)).toEqual([
      { x: 2, y: 23 },
      { x: 50, y: 12.5 },
      { x: 98, y: 2 },
    ])
  })

  it("centers constant values", () => {
    expect(getSparklinePoints([5, 5], 100, 24)).toEqual([
      { x: 2, y: 12 },
      { x: 98, y: 12 },
    ])
  })

  it("preserves gaps and rejects an empty numeric series", () => {
    expect(getSparklinePoints([1, null, 3], 100, 20)).toEqual([
      { x: 2, y: 18 },
      null,
      { x: 98, y: 2 },
    ])
    expect(getSparklinePoints([null, NaN], 100, 20)).toEqual([])
  })
})
