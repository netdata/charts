import { makeTestChart } from "@jest/testUtilities"

describe("uplot coordinate primitives", () => {
  it("exposes getPlotArea/getXCoord/getXAxisRange with safe zero values when unmounted", () => {
    const { chart } = makeTestChart({ attributes: { chartLibrary: "uplot" } })
    const ui = chart.getUI()

    expect(typeof ui.getPlotArea).toBe("function")
    expect(typeof ui.getXCoord).toBe("function")
    expect(typeof ui.getXAxisRange).toBe("function")

    expect(ui.getPlotArea()).toEqual({ left: 0, top: 0, width: 0, height: 0 })
    expect(ui.getXCoord(1000)).toBe(0)
    expect(ui.getXAxisRange()).toBeNull()
  })
})
