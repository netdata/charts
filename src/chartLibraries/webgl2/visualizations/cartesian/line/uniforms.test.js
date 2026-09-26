import makeUniformValues from "./uniforms"

const frame = {
  domain: { after: 1, before: 2, minimum: 3, maximum: 4 },
  plot: { left: 5, top: 6, width: 7, height: 8 },
  canvas: { width: 9, height: 10, lineWidth: 11, mode: 12 },
  fill: { baseline: 13, opacity: 14, mode: 15, heatmapMaximum: 16 },
  counts: { points: 17, series: 18, segmentsPerPair: 19, segmentsPerSeries: 20 },
}

const textureStates = {
  x: { width: 21, height: 22 },
  y: { width: 23, height: 24 },
  color: { width: 25, height: 26 },
  base: { width: 27, height: 28 },
}

describe("WebGL2 line uniform packing", () => {
  it("packs the shared shader with exact declared arity", () => {
    const values = makeUniformValues({
      frame,
      textureStates,
      usesStackedData: true,
      isMultiBar: false,
      isHeatmap: false,
    })

    expect(values.uDomain).toEqual([1, 2, 3, 4])
    expect(values.uPlot).toEqual([5, 6, 7, 8])
    expect(values.uCanvas).toEqual([9, 10, 11, 12])
    expect(values.uFill).toEqual([13, 14, 15])
    expect(values.uCounts).toEqual([17, 18, 19, 20])
    expect(values.uBaseTextureSize).toEqual([27, 28])
  })

  it("adds the fourth fill value only for the Heatmap shader", () => {
    const values = makeUniformValues({
      frame,
      textureStates,
      usesStackedData: false,
      isMultiBar: false,
      isHeatmap: true,
    })

    expect(values.uFill).toEqual([13, 14, 15, 16])
    expect(values).not.toHaveProperty("uBaseValues")
    expect(values).not.toHaveProperty("uBaseTextureSize")
  })
})
