import * as plotters from "./index"

describe("plotters index", () => {
  it("exports all plotter functions", () => {
    expect(plotters.makeLinePlotter).toBeDefined()
    expect(plotters.makeStackedBarPlotter).toBeDefined()
    expect(plotters.makeMultiColumnBarPlotter).toBeDefined()
    expect(plotters.makeHeatmapPlotter).toBeDefined()
    expect(plotters.makeAnomalyPlotter).toBeDefined()
    expect(plotters.makeAnnotationsPlotter).toBeDefined()
  })

  it("exports functions for all plotters", () => {
    expect(typeof plotters.makeLinePlotter).toBe("function")
    expect(typeof plotters.makeStackedBarPlotter).toBe("function")
    expect(typeof plotters.makeMultiColumnBarPlotter).toBe("function")
    expect(typeof plotters.makeHeatmapPlotter).toBe("function")
    expect(typeof plotters.makeAnomalyPlotter).toBe("function")
    expect(typeof plotters.makeAnnotationsPlotter).toBe("function")
  })
})