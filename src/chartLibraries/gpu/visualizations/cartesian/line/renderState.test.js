import makeRenderState from "./renderState"

const packed = {
  pointCount: 3,
  seriesCount: 2,
  xOriginMs: 1000,
  yOrigin: 10,
  yScale: 2,
}

const makeState = options =>
  makeRenderState({
    packed,
    fillMode: null,
    afterMs: 2000,
    beforeMs: 4000,
    minimum: 6,
    maximum: 14,
    width: 100,
    height: 50,
    dpr: 2,
    lineWidth: 1,
    stepped: false,
    smooth: false,
    ...options,
  })

describe("GPU Cartesian render state", () => {
  it("normalizes semantic values into backend-neutral physical state", () => {
    const state = makeState()

    expect(state.canvas).toEqual({
      width: 200,
      height: 100,
      lineWidth: 2,
      mode: 0,
    })
    expect(state.domain).toEqual({
      after: 1,
      before: 3,
      minimum: -2,
      maximum: 2,
    })
    expect(state.drawStats.sourcePairs).toBe(4)
    expect(state.flags.isBar).toBe(false)
  })

  it("builds exact bar counts and fill metadata", () => {
    const state = makeState({
      fillMode: "multiBar",
      barWidth: 4,
      heatmapMaximum: 9,
    })

    expect(state.drawLayout).toEqual({
      instanceCount: 6,
      fillInstanceCount: 6,
      strokeInstanceCount: 0,
      segmentsPerPair: 0,
      segmentsPerSeries: 0,
    })
    expect(state.fill).toEqual({
      baseline: 8,
      opacity: -5,
      mode: 2,
      heatmapMaximum: 0,
    })
    expect(state.fillPass).toBe(4)
  })
})
