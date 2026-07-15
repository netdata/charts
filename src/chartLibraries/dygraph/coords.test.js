import { makeTestChart } from "@jest/testUtilities"

describe("dygraph coordinate primitives", () => {
  it("exposes getPlotArea and getXCoord on the chartUI instance", () => {
    const { chart } = makeTestChart({ attributes: { chartLibrary: "dygraph" } })
    const ui = chart.getUI()

    expect(typeof ui.getPlotArea).toBe("function")
    expect(typeof ui.getXCoord).toBe("function")

    const area = ui.getPlotArea()
    expect(area).toEqual({ left: 0, top: 0, width: 0, height: 0 })
    expect(ui.getXCoord(1000)).toBe(0)
  })
})
