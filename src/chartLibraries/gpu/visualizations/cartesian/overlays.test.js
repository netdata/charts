import { makeTestChart } from "@jest/testUtilities"
import { makeOverlayRects } from "./overlays"

const frame = {
  afterMs: 1000,
  beforeMs: 11000,
  domain: [0, 1],
  plot: { left: 10, top: 0, width: 100, height: 50 },
}

describe("WebGPU Cartesian overlays", () => {
  it("builds highlight fill and dashed boundaries on the plot canvas", () => {
    const { chart } = makeTestChart()
    chart.updateAttribute("overlays", {
      highlight: { type: "highlight", range: [3, 7] },
    })

    const rects = makeOverlayRects({ chart, chartUI: chart.getUI(), frame })
    expect(rects[0]).toEqual({
      x: 30,
      y: 0,
      width: 40,
      height: 50,
      color: "rgba(207, 213, 218, 0.12)",
    })
    expect(rects.some(rect => rect.x === 30 && rect.color === "#CFD5DA")).toBe(true)
    expect(rects.some(rect => rect.x === 70 && rect.color === "#CFD5DA")).toBe(true)
  })

  it("respects cleared-transition visibility", () => {
    const { chart } = makeTestChart()
    chart.updateAttribute("overlays", {
      transitions: {
        type: "alertTransitions",
        showCleared: false,
        transitions: [
          { timestamp: 2, to: "warning" },
          { timestamp: 6, to: "clear" },
        ],
      },
    })

    const rects = makeOverlayRects({ chart, chartUI: chart.getUI(), frame })
    expect(rects).toEqual([
      {
        x: 20,
        y: 0,
        width: 40,
        height: 50,
        color: "rgba(255, 195, 0, 0.3)",
      },
    ])
  })
})
