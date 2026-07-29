import { makeTestChart } from "@jest/testUtilities"
import { makeCrosshairRects, makeVerticalDashRects } from "./interaction"

describe("WebGPU Cartesian interaction layer", () => {
  it("builds a bounded dashed crosshair from synchronized hover state", () => {
    const { chart } = makeTestChart()
    chart.updateAttributes({ clickX: [null, null], hoverX: [1500, "dimension"] })
    const frame = {
      afterMs: 1000,
      beforeMs: 2000,
      plot: { left: 10, top: 5, width: 100, height: 20 },
    }

    const rects = makeCrosshairRects(chart, frame)
    expect(rects).toEqual([
      { x: 60, y: 5, width: 1, height: 5, color: "#536775" },
      { x: 60, y: 15, width: 1, height: 5, color: "#536775" },
    ])
  })

  it("gives a finite click selection priority over hover", () => {
    const { chart } = makeTestChart()
    chart.updateAttributes({ clickX: [1250, "dimension"], hoverX: [1750, "dimension"] })
    const frame = {
      afterMs: 1000,
      beforeMs: 2000,
      plot: { left: 10, top: 5, width: 100, height: 4 },
    }

    expect(makeCrosshairRects(chart, frame)).toEqual([
      { x: 35, y: 5, width: 1, height: 2, color: "#00AB44" },
    ])
  })

  it("clips the last dash to the plot boundary", () => {
    expect(
      makeVerticalDashRects({
        x: 3,
        plot: { left: 0, top: 0, width: 10, height: 12 },
        color: "#ffffff",
        dash: [5, 2],
      })
    ).toEqual([
      { x: 3, y: 0, width: 1, height: 5, color: "#ffffff" },
      { x: 3, y: 7, width: 1, height: 5, color: "#ffffff" },
    ])
  })
})
