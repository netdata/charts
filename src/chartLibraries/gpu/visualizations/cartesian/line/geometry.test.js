import { makeCurveSegments, makeDrawLayout } from "./geometry"

describe("WebGPU aligned line draw layout", () => {
  it("draws one segment per adjacent pair for every linear series", () => {
    expect(makeDrawLayout({ pointCount: 3, seriesCount: 2, stepped: false })).toEqual({
      pairsPerSeries: 2,
      segmentsPerPair: 1,
      segmentsPerSeries: 2,
      fillInstanceCount: 0,
      strokeInstanceCount: 4,
      instanceCount: 4,
    })
  })

  it("draws horizontal and vertical segments for each stepped pair", () => {
    expect(makeDrawLayout({ pointCount: 3, seriesCount: 2, stepped: true })).toEqual({
      pairsPerSeries: 2,
      segmentsPerPair: 2,
      segmentsPerSeries: 4,
      fillInstanceCount: 0,
      strokeInstanceCount: 8,
      instanceCount: 8,
    })
  })

  it("tessellates smooth pairs according to physical point spacing", () => {
    const curveSegments = makeCurveSegments({ pointCount: 100, plotWidth: 1532 })
    expect(curveSegments).toBe(8)
    expect(
      makeDrawLayout({
        pointCount: 100,
        seriesCount: 3,
        smooth: true,
        curveSegments,
      })
    ).toEqual({
      pairsPerSeries: 99,
      segmentsPerPair: 8,
      segmentsPerSeries: 792,
      fillInstanceCount: 0,
      strokeInstanceCount: 2376,
      instanceCount: 2376,
    })
  })

  it("draws one exact fill trapezoid per pair before optional strokes", () => {
    expect(
      makeDrawLayout({
        pointCount: 3,
        seriesCount: 2,
        stepped: false,
        filled: true,
      })
    ).toEqual({
      pairsPerSeries: 2,
      segmentsPerPair: 1,
      segmentsPerSeries: 2,
      fillInstanceCount: 4,
      strokeInstanceCount: 4,
      instanceCount: 8,
    })
    expect(
      makeDrawLayout({
        pointCount: 3,
        seriesCount: 2,
        stepped: true,
        filled: true,
        stroke: false,
      })
    ).toEqual({
      pairsPerSeries: 2,
      segmentsPerPair: 2,
      segmentsPerSeries: 4,
      fillInstanceCount: 4,
      strokeInstanceCount: 0,
      instanceCount: 4,
    })
  })

  it("keeps dense and sparse smooth-pair subdivisions within screen error", () => {
    expect(makeCurveSegments({ pointCount: 1000, plotWidth: 1532 })).toBe(1)
    const sparseSegments = makeCurveSegments({ pointCount: 2, plotWidth: 1532 })
    expect(sparseSegments).toBe(766)
    expect(1532 / sparseSegments).toBeLessThanOrEqual(2)
  })

  it("does not submit geometry without adjacent points or visible series", () => {
    expect(makeDrawLayout({ pointCount: 1, seriesCount: 3, stepped: false }).instanceCount).toBe(0)
    expect(makeDrawLayout({ pointCount: 3, seriesCount: 0, stepped: false }).instanceCount).toBe(0)
  })
})
