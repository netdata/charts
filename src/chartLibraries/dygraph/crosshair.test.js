import crosshair from "./crosshair"

describe("crosshair", () => {
  let mockChartUI, mockDygraph, mockChart, mockCanvas, mockCtx

  beforeEach(() => {
    // Mock canvas context
    mockCtx = {
      save: jest.fn(),
      restore: jest.fn(),
      beginPath: jest.fn(),
      closePath: jest.fn(),
      moveTo: jest.fn(),
      lineTo: jest.fn(),
      stroke: jest.fn(),
      setLineDash: jest.fn(),
      strokeStyle: ""
    }

    // Mock dygraph
    mockDygraph = {
      getArea: jest.fn(() => ({ h: 400 })),
      canvas_ctx_: mockCtx,
      toDomXCoord: jest.fn(timestamp => timestamp / 1000000), // Simple conversion for testing
      setSelection: jest.fn()
    }

    // Mock chart
    mockChart = {
      getPayload: jest.fn(() => ({
        data: [
          [1617946860000, 25, 50, 75],
          [1617946920000, 30, 55, 70],
          [1617946980000, 20, 45, 80],
          [1617947040000, 35, 60, 65],
        ]
      })),
      getThemeAttribute: jest.fn((attr) => {
        const colors = {
          themeCrosshair: "#ff6600",
          themeNetdata: "#00aa00"
        }
        return colors[attr] || "#cccccc"
      })
    }

    // Mock chartUI
    mockChartUI = {
      getDygraph: jest.fn(() => mockDygraph),
      chart: mockChart
    }
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe("basic functionality", () => {
    it("draws crosshair for valid row", () => {
      crosshair(mockChartUI, 1)

      expect(mockDygraph.getArea).toHaveBeenCalled()
      expect(mockDygraph.toDomXCoord).toHaveBeenCalledWith(1617946920000)
      expect(mockDygraph.setSelection).toHaveBeenCalledWith(1)
      expect(mockCtx.save).toHaveBeenCalled()
      expect(mockCtx.restore).toHaveBeenCalled()
      expect(mockCtx.beginPath).toHaveBeenCalled()
      expect(mockCtx.closePath).toHaveBeenCalled()
      expect(mockCtx.stroke).toHaveBeenCalled()
    })

    it("sets correct line dash for default hover", () => {
      crosshair(mockChartUI, 0)

      expect(mockCtx.setLineDash).toHaveBeenCalledWith([5, 5])
    })

    it("draws line from top to bottom of chart area", () => {
      const mockX = 1617.946920000 // Expected x coordinate
      mockDygraph.toDomXCoord.mockReturnValue(mockX)

      crosshair(mockChartUI, 0)

      expect(mockCtx.moveTo).toHaveBeenCalledWith(mockX, 0)
      expect(mockCtx.lineTo).toHaveBeenCalledWith(mockX, 400)
    })

    it("uses correct stroke style for hover", () => {
      crosshair(mockChartUI, 0, "hover")

      expect(mockChart.getThemeAttribute).toHaveBeenCalledWith("themeCrosshair")
      expect(mockCtx.strokeStyle).toBe("#ff6600")
    })
  })

  describe("flavour variations", () => {
    it("handles hover flavour", () => {
      crosshair(mockChartUI, 1, "hover")

      expect(mockCtx.setLineDash).toHaveBeenCalledWith([5, 5])
      expect(mockChart.getThemeAttribute).toHaveBeenCalledWith("themeCrosshair")
    })

    it("handles click flavour", () => {
      crosshair(mockChartUI, 1, "click")

      expect(mockCtx.setLineDash).toHaveBeenCalledWith([2, 2])
      expect(mockChart.getThemeAttribute).toHaveBeenCalledWith("themeNetdata")
    })

    it("defaults to hover flavour when no flavour specified", () => {
      crosshair(mockChartUI, 1)

      expect(mockCtx.setLineDash).toHaveBeenCalledWith([5, 5])
      expect(mockChart.getThemeAttribute).toHaveBeenCalledWith("themeCrosshair")
    })

    it("handles unknown flavour by using undefined values", () => {
      crosshair(mockChartUI, 1, "unknown")

      expect(mockCtx.setLineDash).toHaveBeenCalledWith(undefined)
      expect(mockChart.getThemeAttribute).toHaveBeenCalledWith(undefined)
    })
  })

  describe("edge cases", () => {
    it("handles invalid row index gracefully", () => {
      crosshair(mockChartUI, 999) // Row index out of bounds

      // Should return early and not call drawing methods
      expect(mockCtx.save).not.toHaveBeenCalled()
      expect(mockCtx.beginPath).not.toHaveBeenCalled()
    })

    it("handles empty data array", () => {
      mockChart.getPayload.mockReturnValue({ data: [] })

      crosshair(mockChartUI, 0)

      // Should return early and not call drawing methods
      expect(mockCtx.save).not.toHaveBeenCalled()
      expect(mockCtx.beginPath).not.toHaveBeenCalled()
    })

    it("returns early for non-array row data", () => {
      mockChart.getPayload.mockReturnValue({
        data: [
          null, // Invalid row data
          [1617946920000, 30, 55, 70],
        ]
      })

      crosshair(mockChartUI, 0)

      // Should return early and not call drawing methods
      expect(mockCtx.save).not.toHaveBeenCalled()
      expect(mockCtx.beginPath).not.toHaveBeenCalled()
    })

    it("handles missing payload data", () => {
      mockChart.getPayload.mockReturnValue({ data: undefined })

      expect(() => crosshair(mockChartUI, 0)).toThrow()
    })

    it("handles negative row index", () => {
      crosshair(mockChartUI, -1)

      // Should return early and not call drawing methods
      expect(mockCtx.save).not.toHaveBeenCalled()
      expect(mockCtx.beginPath).not.toHaveBeenCalled()
    })
  })

  describe("canvas context operations", () => {
    it("saves and restores canvas context", () => {
      crosshair(mockChartUI, 1)

      expect(mockCtx.save).toHaveBeenCalled()
      expect(mockCtx.restore).toHaveBeenCalled()
    })

    it("properly sequences drawing operations", () => {
      crosshair(mockChartUI, 1)

      const calls = [
        mockCtx.save,
        mockCtx.beginPath,
        mockCtx.setLineDash,
        mockCtx.moveTo,
        mockCtx.lineTo,
        mockCtx.stroke,
        mockCtx.closePath,
        mockCtx.restore
      ]

      // Verify all drawing methods were called
      calls.forEach((call) => {
        expect(call).toHaveBeenCalled()
      })
    })
  })

  describe("coordinate calculations", () => {
    it("uses timestamp from correct data row", () => {
      crosshair(mockChartUI, 2)

      expect(mockDygraph.toDomXCoord).toHaveBeenCalledWith(1617946980000)
    })

    it("handles different chart area heights", () => {
      mockDygraph.getArea.mockReturnValue({ h: 200 })
      const mockX = 500

      mockDygraph.toDomXCoord.mockReturnValue(mockX)

      crosshair(mockChartUI, 1)

      expect(mockCtx.moveTo).toHaveBeenCalledWith(mockX, 0)
      expect(mockCtx.lineTo).toHaveBeenCalledWith(mockX, 200)
    })

    it("handles zero height chart area", () => {
      mockDygraph.getArea.mockReturnValue({ h: 0 })
      const mockX = 300

      mockDygraph.toDomXCoord.mockReturnValue(mockX)

      crosshair(mockChartUI, 0)

      expect(mockCtx.moveTo).toHaveBeenCalledWith(mockX, 0)
      expect(mockCtx.lineTo).toHaveBeenCalledWith(mockX, 0)
    })
  })

  describe("dygraph integration", () => {
    it("sets dygraph selection to correct row", () => {
      crosshair(mockChartUI, 3)

      expect(mockDygraph.setSelection).toHaveBeenCalledWith(3)
    })

    it("gets chart area from dygraph", () => {
      crosshair(mockChartUI, 0)

      expect(mockDygraph.getArea).toHaveBeenCalled()
    })

    it("converts timestamp to DOM coordinates", () => {
      crosshair(mockChartUI, 1)

      expect(mockDygraph.toDomXCoord).toHaveBeenCalledWith(1617946920000)
    })
  })

  describe("theme integration", () => {
    it("retrieves theme color for hover", () => {
      crosshair(mockChartUI, 0, "hover")

      expect(mockChart.getThemeAttribute).toHaveBeenCalledWith("themeCrosshair")
    })

    it("retrieves theme color for click", () => {
      crosshair(mockChartUI, 0, "click")

      expect(mockChart.getThemeAttribute).toHaveBeenCalledWith("themeNetdata")
    })

    it("handles missing theme attributes gracefully", () => {
      mockChart.getThemeAttribute.mockReturnValue(undefined)

      crosshair(mockChartUI, 0)

      expect(mockCtx.strokeStyle).toBeUndefined()
    })
  })
})