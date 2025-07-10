import * as plotters from "./index"

describe("plotters", () => {
  it("exports plotter factory functions", () => {
    expect(typeof plotters.makeLinePlotter).toBe("function")
    expect(typeof plotters.makeStackedBarPlotter).toBe("function")
    expect(typeof plotters.makeMultiColumnBarPlotter).toBe("function")
    expect(typeof plotters.makeHeatmapPlotter).toBe("function")
    expect(typeof plotters.makeAnomalyPlotter).toBe("function")
    expect(typeof plotters.makeAnnotationsPlotter).toBe("function")
  })

  it("plotter factories return functions", () => {
    expect(typeof plotters.makeLinePlotter()).toBe("function")
    expect(typeof plotters.makeStackedBarPlotter()).toBe("function")
    expect(typeof plotters.makeMultiColumnBarPlotter()).toBe("function")
    expect(typeof plotters.makeHeatmapPlotter()).toBe("function")
    expect(typeof plotters.makeAnomalyPlotter()).toBe("function")
    expect(typeof plotters.makeAnnotationsPlotter()).toBe("function")
  })

  it("stackedBar plotter handles mock data", () => {
    const mockPlotter = {
      drawingContext: {
        fillStyle: "",
        fillRect: () => {},
        strokeRect: () => {},
      },
      points: [
        { canvasx: 10, canvasy: 20 },
        { canvasx: 30, canvasy: 40 },
      ],
      dygraph: {
        toDomYCoord: () => 100,
      },
      color: "#ff0000",
    }

    const plotter = plotters.makeStackedBarPlotter()
    expect(() => plotter(mockPlotter)).not.toThrow()
  })
})
