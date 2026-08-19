import {
  makeScissor,
  makeUniformData,
  uniformByteLength,
} from "./uniforms"

describe("WebGPU line uniform packing", () => {
  it("packs named frame state into the exact shader layout", () => {
    const data = makeUniformData({
      packed: { pointCount: 17, seriesCount: 18 },
      drawLayout: { segmentsPerPair: 19, segmentsPerSeries: 20 },
      domain: { after: 1, before: 2, minimum: 3, maximum: 4 },
      plot: { left: 5, top: 6, width: 7, height: 8 },
      canvas: { width: 9, height: 10, lineWidth: 11, mode: 12 },
      fill: {
        baseline: 13,
        opacity: 14,
        mode: 15,
        heatmapMaximum: 16,
      },
    })

    expect(data.byteLength).toBe(uniformByteLength)
    expect([...new Float32Array(data).slice(0, 16)]).toEqual([
      1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16,
    ])
    expect([...new Uint32Array(data).slice(16)]).toEqual([17, 18, 19, 20])
  })

  it("clamps the scissor to the physical canvas", () => {
    expect(
      makeScissor({
        plot: { left: 90, top: 80, width: 30, height: 40 },
        canvas: { width: 100, height: 100 },
      })
    ).toEqual({ left: 90, top: 80, width: 10, height: 20 })
  })
})
