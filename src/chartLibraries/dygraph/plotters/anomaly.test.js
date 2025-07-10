import anomalyPlotter from "./anomaly"

describe("anomaly plotter", () => {
  let mockChartUI
  let mockPlotter
  let mockCtx

  beforeEach(() => {
    mockCtx = {
      strokeStyle: "black",
      fillStyle: "black",
      fillRect: jest.fn(),
      strokeRect: jest.fn(),
    }

    mockPlotter = {
      setName: "ANOMALY_RATE",
      drawingContext: mockCtx,
      points: [
        { canvasx: 10, xval: 1000 },
        { canvasx: 20, xval: 2000 },
      ],
    }

    mockChartUI = {
      chart: {
        getPayloadDimensionIds: () => ["dim1", "dim2"],
        getAttribute: () => [],
        isDimensionVisible: () => true,
        getThemeAttribute: () => "#ff0000",
        getPayload: () => ({
          all: [
            [1000, { arp: 25 }, { arp: 50 }],
            [2000, { arp: 75 }, { arp: 100 }],
          ],
        }),
        getClosestRow: xval => (xval === 1000 ? 0 : 1),
      },
    }
  })

  it("returns early if no chartUI", () => {
    const plotter = anomalyPlotter(null)
    expect(() => plotter(mockPlotter)).not.toThrow()
  })

  it("returns early if setName is not ANOMALY_RATE", () => {
    mockPlotter.setName = "OTHER"
    const plotter = anomalyPlotter(mockChartUI)
    plotter(mockPlotter)
    expect(mockCtx.fillRect).not.toHaveBeenCalled()
  })

  it("returns early if no points", () => {
    mockPlotter.points = []
    const plotter = anomalyPlotter(mockChartUI)
    plotter(mockPlotter)
    expect(mockCtx.fillRect).not.toHaveBeenCalled()
  })

  it("returns early if less than 2 points", () => {
    mockPlotter.points = [{ canvasx: 10, xval: 1000 }]
    const plotter = anomalyPlotter(mockChartUI)
    plotter(mockPlotter)
    expect(mockCtx.fillRect).not.toHaveBeenCalled()
  })

  it("renders anomaly rate bars", () => {
    const plotter = anomalyPlotter(mockChartUI)
    plotter(mockPlotter)

    expect(mockCtx.fillRect).toHaveBeenCalled()
    expect(mockCtx.strokeRect).toHaveBeenCalled()
    expect(mockCtx.fillRect).toHaveBeenCalledTimes(2)
  })

  it("handles selected legend dimensions", () => {
    mockChartUI.chart.getAttribute = () => ["dim1"]
    const plotter = anomalyPlotter(mockChartUI)
    plotter(mockPlotter)

    expect(mockCtx.fillRect).toHaveBeenCalled()
    expect(mockCtx.strokeRect).toHaveBeenCalled()
  })

  it("calculates max anomaly rate value correctly", () => {
    const plotter = anomalyPlotter(mockChartUI)
    plotter(mockPlotter)

    // Should use max arp value from selected dimensions
    expect(mockCtx.fillRect).toHaveBeenCalledTimes(2)
    expect(mockCtx.strokeRect).toHaveBeenCalledTimes(2)
  })

  it("handles zero anomaly values", () => {
    mockChartUI.chart.getPayload = () => ({
      all: [
        [1000, { arp: 0 }, { arp: 0 }],
        [2000, { arp: 0 }, { arp: 0 }],
      ],
    })

    const plotter = anomalyPlotter(mockChartUI)
    plotter(mockPlotter)

    expect(mockCtx.fillRect).toHaveBeenCalled()
  })
})
