import crosshair from "./crosshair"
import { makeTestChart } from "@jest/testUtilities"

describe("crosshair", () => {
  let chart, mockChartUI, mockDygraph, mockCtx

  beforeEach(() => {
    const { chart: testChart } = makeTestChart({
      libraryName: "dygraph"
    })
    
    chart = testChart
    
    jest.spyOn(chart, 'getPayload').mockReturnValue({
      data: [
        [1617946860000, 25, 50, 75],
        [1617946920000, 30, 55, 70],
        [1617946980000, 20, 45, 80],
        [1617947040000, 35, 60, 65],
      ]
    })
    
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

    mockDygraph = {
      getArea: jest.fn(() => ({ h: 400 })),
      canvas_ctx_: mockCtx,
      toDomXCoord: jest.fn(timestamp => timestamp / 1000000),
      setSelection: jest.fn()
    }

    mockChartUI = {
      getDygraph: jest.fn(() => mockDygraph),
      chart: chart
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
      const getThemeAttributeSpy = jest.spyOn(chart, 'getThemeAttribute').mockReturnValue("#ff6600")
      
      crosshair(mockChartUI, 0, "hover")

      expect(getThemeAttributeSpy).toHaveBeenCalledWith("themeCrosshair")
      expect(mockCtx.strokeStyle).toBe("#ff6600")
      
      getThemeAttributeSpy.mockRestore()
    })
  })

  describe("flavour variations", () => {
    it("handles hover flavour", () => {
      const getThemeAttributeSpy = jest.spyOn(chart, 'getThemeAttribute')
      
      crosshair(mockChartUI, 1, "hover")

      expect(mockCtx.setLineDash).toHaveBeenCalledWith([5, 5])
      expect(getThemeAttributeSpy).toHaveBeenCalledWith("themeCrosshair")
      
      getThemeAttributeSpy.mockRestore()
    })

    it("handles click flavour", () => {
      const getThemeAttributeSpy = jest.spyOn(chart, 'getThemeAttribute')
      
      crosshair(mockChartUI, 1, "click")

      expect(mockCtx.setLineDash).toHaveBeenCalledWith([2, 2])
      expect(getThemeAttributeSpy).toHaveBeenCalledWith("themeNetdata")
      
      getThemeAttributeSpy.mockRestore()
    })

    it("defaults to hover flavour when no flavour specified", () => {
      const getThemeAttributeSpy = jest.spyOn(chart, 'getThemeAttribute')
      
      crosshair(mockChartUI, 1)

      expect(mockCtx.setLineDash).toHaveBeenCalledWith([5, 5])
      expect(getThemeAttributeSpy).toHaveBeenCalledWith("themeCrosshair")
      
      getThemeAttributeSpy.mockRestore()
    })

    it("handles unknown flavour by using undefined values", () => {
      const getThemeAttributeSpy = jest.spyOn(chart, 'getThemeAttribute')
      
      crosshair(mockChartUI, 1, "unknown")

      expect(mockCtx.setLineDash).toHaveBeenCalledWith(undefined)
      expect(getThemeAttributeSpy).toHaveBeenCalledWith(undefined)
      
      getThemeAttributeSpy.mockRestore()
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
      chart.getPayload.mockReturnValue({ data: [] })

      crosshair(mockChartUI, 0)

      expect(mockCtx.save).not.toHaveBeenCalled()
      expect(mockCtx.beginPath).not.toHaveBeenCalled()
    })

    it("returns early for non-array row data", () => {
      chart.getPayload.mockReturnValue({
        data: [
          null,
          [1617946920000, 30, 55, 70],
        ]
      })

      crosshair(mockChartUI, 0)

      expect(mockCtx.save).not.toHaveBeenCalled()
      expect(mockCtx.beginPath).not.toHaveBeenCalled()
    })

    it("handles missing payload data", () => {
      chart.getPayload.mockReturnValue({ data: undefined })

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
      const getThemeAttributeSpy = jest.spyOn(chart, 'getThemeAttribute')
      
      crosshair(mockChartUI, 0, "hover")

      expect(getThemeAttributeSpy).toHaveBeenCalledWith("themeCrosshair")
      
      getThemeAttributeSpy.mockRestore()
    })

    it("retrieves theme color for click", () => {
      const getThemeAttributeSpy = jest.spyOn(chart, 'getThemeAttribute')
      
      crosshair(mockChartUI, 0, "click")

      expect(getThemeAttributeSpy).toHaveBeenCalledWith("themeNetdata")
      
      getThemeAttributeSpy.mockRestore()
    })

    it("handles missing theme attributes gracefully", () => {
      const getThemeAttributeSpy = jest.spyOn(chart, 'getThemeAttribute').mockReturnValue(undefined)

      crosshair(mockChartUI, 0)

      expect(mockCtx.strokeStyle).toBeUndefined()
      
      getThemeAttributeSpy.mockRestore()
    })
  })
})