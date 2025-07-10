import stackedBarPlotter from "./stackedBar"

describe("stackedBar plotter", () => {
  let mockPlotter
  let mockCtx

  beforeEach(() => {
    mockCtx = {
      fillStyle: "blue",
      strokeStyle: "darkblue",
      fillRect: jest.fn(),
      strokeRect: jest.fn(),
    }

    mockPlotter = {
      drawingContext: mockCtx,
      color: "#ff0000",
      points: [
        { canvasx: 10, canvasy: 20 },
        { canvasx: 30, canvasy: 40 },
      ],
      dygraph: {
        toDomYCoord: jest.fn(() => 100),
      },
    }
  })

  it("renders stacked bars", () => {
    const plotter = stackedBarPlotter()
    plotter(mockPlotter)

    expect(mockCtx.fillRect).toHaveBeenCalledTimes(2)
    expect(mockCtx.strokeRect).toHaveBeenCalledTimes(2)
  })

  it("uses plotter color for fill style", () => {
    const plotter = stackedBarPlotter()
    plotter(mockPlotter)

    expect(mockCtx.fillStyle).toBe("#ff0000")
  })

  it("calculates bar width from point separation", () => {
    const plotter = stackedBarPlotter()
    plotter(mockPlotter)

    // Bar width should be 2/3 of separation (30-10 = 20, so 2/3 * 20 = 13.33, floored = 13)
    expect(mockCtx.fillRect).toHaveBeenCalledWith(
      3.5, // center_x - bar_width/2 (10 - 13/2 = 3.5)
      20, // canvasy
      13, // bar_width
      80 // y_bottom - canvasy (100 - 20)
    )
  })

  it("positions bars correctly based on canvas coordinates", () => {
    const plotter = stackedBarPlotter()
    plotter(mockPlotter)

    expect(mockCtx.fillRect).toHaveBeenNthCalledWith(
      1,
      3.5, // first bar x position
      20, // first bar y position
      13, // width
      80 // height
    )

    expect(mockCtx.fillRect).toHaveBeenNthCalledWith(
      2,
      23.5, // second bar x position (30 - 13/2)
      40, // second bar y position
      13, // width
      60 // height (100 - 40)
    )
  })

  it("draws stroke rectangles with same dimensions", () => {
    const plotter = stackedBarPlotter()
    plotter(mockPlotter)

    expect(mockCtx.strokeRect).toHaveBeenCalledWith(3.5, 20, 13, 80)
    expect(mockCtx.strokeRect).toHaveBeenCalledWith(23.5, 40, 13, 60)
  })

  it("uses y_bottom from dygraph", () => {
    mockPlotter.dygraph.toDomYCoord = jest.fn(() => 150)

    const plotter = stackedBarPlotter()
    plotter(mockPlotter)

    expect(mockCtx.fillRect).toHaveBeenCalledWith(
      expect.any(Number),
      20,
      expect.any(Number),
      130 // 150 - 20
    )
  })
})
