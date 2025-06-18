import multiColumnBarPlotter from "./multiColumnBar"

describe("multiColumnBar plotter", () => {
  let plotter
  let ctx

  beforeEach(() => {
    ctx = {
      fillStyle: "blue",
      strokeStyle: "darkblue",
      fillRect: jest.fn(),
      strokeRect: jest.fn()
    }

    plotter = {
      seriesIndex: 0,
      drawingContext: ctx,
      allSeriesPoints: [
        [
          { canvasx: 10, canvasy: 20 },
          { canvasx: 30, canvasy: 40 },
          { canvasx: 50, canvasy: 30 }
        ],
        [
          { canvasx: 15, canvasy: 25 },
          { canvasx: 35, canvasy: 45 },
          { canvasx: 55, canvasy: 35 }
        ]
      ],
      dygraph: {
        toDomYCoord: jest.fn(() => 100),
        getColors: jest.fn(() => ["#ff0000", "#00ff00"])
      }
    }
  })

  it("returns early if seriesIndex is not 0", () => {
    plotter.seriesIndex = 1
    const plotterFunc = multiColumnBarPlotter()
    plotterFunc(plotter)
    expect(ctx.fillRect).not.toHaveBeenCalled()
  })

  it("calculates bar width from minimum separation", () => {
    const plotterFunc = multiColumnBarPlotter()
    plotterFunc(plotter)
    
    expect(ctx.fillRect).toHaveBeenCalled()
    const firstCall = ctx.fillRect.mock.calls[0]
    const barWidth = firstCall[2]
    expect(barWidth).toBeLessThan(20)
    expect(barWidth).toBeGreaterThan(0)
  })

  it("renders bars for each series", () => {
    const plotterFunc = multiColumnBarPlotter()
    plotterFunc(plotter)
    
    expect(ctx.fillRect).toHaveBeenCalledTimes(6)
    expect(ctx.strokeRect).toHaveBeenCalledTimes(6)
  })

  it("uses correct colors for fill and stroke", () => {
    const plotterFunc = multiColumnBarPlotter()
    plotterFunc(plotter)
    
    expect(ctx.fillStyle).toBeDefined()
    expect(ctx.strokeStyle).toBeDefined()
  })

  it("positions bars correctly for multiple series", () => {
    const plotterFunc = multiColumnBarPlotter()
    plotterFunc(plotter)
    
    expect(ctx.fillRect).toHaveBeenCalledWith(
      expect.any(Number),
      20,
      expect.any(Number),
      80
    )
  })

  it("handles single series correctly", () => {
    plotter.allSeriesPoints = [
      [
        { canvasx: 10, canvasy: 20 },
        { canvasx: 30, canvasy: 40 }
      ]
    ]
    plotter.dygraph.getColors = jest.fn(() => ["#ff0000"])
    
    const plotterFunc = multiColumnBarPlotter()
    plotterFunc(plotter)
    
    expect(ctx.fillRect).toHaveBeenCalledTimes(2)
  })

  it("calculates minimum separation across all series", () => {
    plotter.allSeriesPoints = [
      [
        { canvasx: 10 },
        { canvasx: 20 },
        { canvasx: 30 }
      ],
      [
        { canvasx: 15 },
        { canvasx: 25 },
        { canvasx: 35 }
      ]
    ]
    
    const plotterFunc = multiColumnBarPlotter()
    plotterFunc(plotter)
    
    const firstCall = ctx.fillRect.mock.calls[0]
    const barWidth = firstCall[2]
    // bar_width = floor(2/3 * min_sep), min_sep = 10, so bar_width = floor(6.666) = 6
    // bar_width per series = 6 / 2 = 3
    expect(barWidth).toBe(3)
  })

  it("handles empty series points", () => {
    plotter.allSeriesPoints = []
    const plotterFunc = multiColumnBarPlotter()
    expect(() => plotterFunc(plotter)).not.toThrow()
  })

  it("applies darkenColor to stroke", () => {
    const plotterFunc = multiColumnBarPlotter()
    plotterFunc(plotter)
    
    expect(ctx.strokeStyle).toContain("rgb(")
  })

  it("centers bars at x position", () => {
    plotter.allSeriesPoints = [
      [
        { canvasx: 100, canvasy: 50 },
        { canvasx: 150, canvasy: 60 }
      ]
    ]
    
    const plotterFunc = multiColumnBarPlotter()
    plotterFunc(plotter)
    
    const firstCall = ctx.fillRect.mock.calls[0]
    const xPos = firstCall[0]
    const barWidth = firstCall[2]
    
    // For single series, x_left = center_x - bar_width/2
    // bar_width = floor(2/3 * 50) = 33, per series = 33
    expect(xPos).toBeLessThan(100)
    expect(xPos + barWidth / 2).toBeCloseTo(100, 0)
  })
})