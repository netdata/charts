import annotationsPlotter from "./annotations"

describe("annotations plotter", () => {
  let mockChartUI
  let mockPlotter
  let mockCtx

  beforeEach(() => {
    mockCtx = {
      strokeStyle: "black",
      fillStyle: "black",  
      fillRect: jest.fn(),
      strokeRect: jest.fn()
    }

    mockPlotter = {
      setName: "ANNOTATIONS",
      drawingContext: mockCtx,
      points: [
        { canvasx: 10, xval: 1000 },
        { canvasx: 20, xval: 2000 }
      ],
      dygraph: {
        getArea: () => ({ h: 100 })
      }
    }

    mockChartUI = {
      chart: {
        getPayloadDimensionIds: () => ["dim1", "dim2"],
        getAttribute: () => [],
        isDimensionVisible: () => true,
        getPayload: () => ({
          all: [
            [1000, { pa: 1 }, { pa: 2 }],
            [2000, { pa: 4 }, { pa: 8 }]
          ]
        }),
        getClosestRow: (xval) => xval === 1000 ? 0 : 1
      }
    }
  })

  it("returns early if no chartUI", () => {
    const plotter = annotationsPlotter(null)
    expect(() => plotter(mockPlotter)).not.toThrow()
  })

  it("returns early if setName is not ANNOTATIONS", () => {
    mockPlotter.setName = "OTHER"
    const plotter = annotationsPlotter(mockChartUI)
    plotter(mockPlotter)
    expect(mockCtx.fillRect).not.toHaveBeenCalled()
  })

  it("returns early if no points", () => {
    mockPlotter.points = []
    const plotter = annotationsPlotter(mockChartUI)
    plotter(mockPlotter)
    expect(mockCtx.fillRect).not.toHaveBeenCalled()
  })

  it("returns early if less than 2 points", () => {
    mockPlotter.points = [{ canvasx: 10, xval: 1000 }]
    const plotter = annotationsPlotter(mockChartUI)
    plotter(mockPlotter)
    expect(mockCtx.fillRect).not.toHaveBeenCalled()
  })

  it("renders annotations with transparent background", () => {
    const plotter = annotationsPlotter(mockChartUI)
    plotter(mockPlotter)
    
    expect(mockCtx.fillRect).toHaveBeenCalled()
    expect(mockCtx.strokeRect).toHaveBeenCalled()
  })

  it("processes points with selected legend dimensions", () => {
    mockChartUI.chart.getAttribute = () => ["dim1"]
    const plotter = annotationsPlotter(mockChartUI)
    plotter(mockPlotter)
    
    expect(mockCtx.fillRect).toHaveBeenCalled()
    expect(mockCtx.strokeRect).toHaveBeenCalled()
  })
})