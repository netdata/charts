import heatmapPlotter from "./heatmap"
import { makeTestChart } from "@/testUtilities"

describe("heatmap plotter", () => {
  let chartUI
  let plotter
  let ctx

  beforeEach(() => {
    const { chart } = makeTestChart({
      attributes: {
        chartType: "heatmap",
        dimensionIds: ["dim1", "dim2", "dim3"]
      }
    })

    ctx = {
      fillStyle: "black",
      strokeStyle: "black",
      fillRect: jest.fn(),
      strokeRect: jest.fn()
    }

    plotter = {
      seriesIndex: 0,
      drawingContext: ctx,
      allSeriesPoints: [
        [
          { canvasx: 10 },
          { canvasx: 20 },
          { canvasx: 30 }
        ],
        [
          { canvasx: 15 },
          { canvasx: 25 },
          { canvasx: 35 }
        ],
        [
          { canvasx: 18 },
          { canvasx: 28 },
          { canvasx: 38 }
        ]
      ],
      dygraph: {
        layout_: {
          setNames: ["dim1", "dim2", "dim3"]
        },
        toDomYCoord: jest.fn((index) => 50 + index * 20)
      }
    }

    chartUI = {
      chart: chart
    }

    jest.spyOn(chart, "getVisibleDimensionIds").mockReturnValue(["dim1", "dim2", "dim3"])
    jest.spyOn(chart, "getDimensionIndex").mockImplementation((name) => {
      const map = { "dim1": 0, "dim2": 1, "dim3": 2 }
      return map[name] ?? -1
    })
    jest.spyOn(chart, "getDimensionValue").mockReturnValue(42)
    jest.spyOn(chart, "getAttribute").mockImplementation((attr) => {
      if (attr === "max") return 100
      return undefined
    })
  })

  it("returns early if no chartUI", () => {
    const plotterFunc = heatmapPlotter(null)
    expect(() => plotterFunc(plotter)).not.toThrow()
    expect(ctx.fillRect).not.toHaveBeenCalled()
  })

  it("returns early if seriesIndex is not 0", () => {
    plotter.seriesIndex = 1
    const plotterFunc = heatmapPlotter(chartUI)
    plotterFunc(plotter)
    expect(ctx.fillRect).not.toHaveBeenCalled()
  })

  it("renders heatmap rectangles for visible dimensions", () => {
    const plotterFunc = heatmapPlotter(chartUI)
    plotterFunc(plotter)
    
    expect(ctx.fillRect).toHaveBeenCalled()
    expect(ctx.strokeRect).toHaveBeenCalled()
  })

  it("calculates bar width from minimum separation", () => {
    const plotterFunc = heatmapPlotter(chartUI)
    plotterFunc(plotter)
    
    expect(ctx.fillRect).toHaveBeenCalledWith(
      expect.any(Number),
      expect.any(Number),
      10,
      expect.any(Number)
    )
  })

  it("skips series with unknown dimension index", () => {
    chartUI.chart.getDimensionIndex.mockReturnValue(-1)
    const plotterFunc = heatmapPlotter(chartUI)
    plotterFunc(plotter)
    
    expect(ctx.fillRect).not.toHaveBeenCalled()
  })

  it("uses color based on dimension value", () => {
    const plotterFunc = heatmapPlotter(chartUI)
    plotterFunc(plotter)
    
    expect(ctx.fillStyle).toContain("rgb(")
    expect(ctx.strokeStyle).toBe("transparent")
  })

  it("calculates height based on series position", () => {
    plotter.dygraph.toDomYCoord = jest.fn((index) => {
      if (index === 0) return 50
      if (index === 1) return 70
      if (index === 2) return 90
      return 110
    })
    
    const plotterFunc = heatmapPlotter(chartUI)
    plotterFunc(plotter)
    
    expect(ctx.fillRect).toHaveBeenCalledWith(
      expect.any(Number),
      expect.any(Number),
      expect.any(Number),
      20
    )
  })

  it("handles empty allSeriesPoints", () => {
    plotter.allSeriesPoints = []
    plotter.dygraph.layout_.setNames = []
    const plotterFunc = heatmapPlotter(chartUI)
    expect(() => plotterFunc(plotter)).not.toThrow()
    expect(ctx.fillRect).not.toHaveBeenCalled()
  })

  it("handles two data points", () => {
    plotter.allSeriesPoints = [
      [{ canvasx: 10 }, { canvasx: 110 }]
    ]
    plotter.dygraph.layout_.setNames = ["dim1"]
    const plotterFunc = heatmapPlotter(chartUI)
    plotterFunc(plotter)
    
    expect(ctx.fillRect).toHaveBeenCalledWith(
      expect.any(Number),
      expect.any(Number),
      100,
      expect.any(Number)
    )
  })
})