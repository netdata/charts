import { makeDrawLayout } from "./geometry"

describe("WebGPU aligned line draw layout", () => {
  it("draws one segment per adjacent pair for every series", () => {
    expect(makeDrawLayout({ pointCount: 3, seriesCount: 2, stepped: false })).toEqual({
      pairsPerSeries: 2,
      segmentsPerPair: 1,
      segmentsPerSeries: 2,
      instanceCount: 4,
    })
  })

  it("draws horizontal and vertical segments for each stepped pair", () => {
    expect(makeDrawLayout({ pointCount: 3, seriesCount: 2, stepped: true })).toEqual({
      pairsPerSeries: 2,
      segmentsPerPair: 2,
      segmentsPerSeries: 4,
      instanceCount: 8,
    })
  })

  it("does not submit geometry without adjacent points or visible series", () => {
    expect(makeDrawLayout({ pointCount: 1, seriesCount: 3, stepped: false }).instanceCount).toBe(0)
    expect(makeDrawLayout({ pointCount: 3, seriesCount: 0, stepped: false }).instanceCount).toBe(0)
  })
})
