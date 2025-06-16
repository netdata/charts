import makeHoverX from "./hoverX"

// Mock external dependencies
jest.mock("@/helpers/eventOffset", () => jest.fn((event) => ({
  offsetX: event.offsetX || 100,
  offsetY: event.offsetY || 50
})))

describe("hoverX", () => {
  let mockChartUI, mockDygraph, mockChart, mockSDK, hoverX

  beforeEach(() => {
    // Mock SDK
    mockSDK = {
      trigger: jest.fn()
    }

    // Mock chart
    mockChart = {
      getAttribute: jest.fn(),
      updateAttribute: jest.fn(),
      trigger: jest.fn(),
      getPayloadDimensionIds: jest.fn(() => ["cpu", "memory", "disk"])
    }

    // Mock dygraph
    mockDygraph = {
      getArea: jest.fn(() => ({ h: 400 })),
      findStackedPoint: jest.fn(() => ({
        point: { canvasy: 60 },
        row: 1,
        seriesName: "cpu"
      })),
      findClosestPoint: jest.fn(() => ({
        point: { canvasy: 50 },
        row: 2,
        seriesName: "memory"
      })),
      getPropertiesForSeries: jest.fn((seriesName) => {
        if (seriesName === "ANNOTATIONS" || seriesName === "ANOMALY_RATE") return null
        return {
          column: seriesName === "cpu" ? 1 : seriesName === "memory" ? 2 : 3,
          name: seriesName
        }
      }),
      toDomXCoord: jest.fn((timestamp) => timestamp / 1000000)
    }

    // Mock chartUI
    mockChartUI = {
      getDygraph: jest.fn(() => mockDygraph),
      chart: mockChart,
      sdk: mockSDK,
      on: jest.fn(() => mockChartUI),
      off: jest.fn()
    }

    // Set default chart attributes
    mockChart.getAttribute.mockImplementation((attr) => {
      const attrs = {
        chartType: "line",
        overlays: {},
        draftAnnotation: null
      }
      return attrs[attr]
    })

    hoverX = makeHoverX(mockChartUI)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe("findClosest functionality", () => {
    it("returns empty object for non-array points", () => {
      const event = { offsetX: 100, offsetY: 50 }
      const result = hoverX.toggle(true)

      // Simulate highlight callback with invalid points
      mockChartUI.on.mock.calls[0][1](event, 123456789, null)

      expect(mockSDK.trigger).not.toHaveBeenCalled()
    })

    it("detects annotation area when near bottom", () => {
      const event = { offsetX: 100, offsetY: 395 } // Near bottom
      const points = [{ name: "cpu", yval: 25 }]

      hoverX.toggle(true)
      const highlightCallback = mockChartUI.on.mock.calls[0][1]
      highlightCallback(event, 123456789, points)

      // Should not trigger highlight for annotation area
      expect(mockSDK.trigger).not.toHaveBeenCalledWith("highlightHover", mockChart, expect.any(Number), expect.any(String))
    })

    it("detects anomaly area when near top", () => {
      const event = { offsetX: 100, offsetY: 10 } // Near top
      const points = [{ name: "cpu", yval: 25 }]

      hoverX.toggle(true)
      const highlightCallback = mockChartUI.on.mock.calls[0][1]
      highlightCallback(event, 123456789, points)

      // Should not trigger highlight for anomaly area
      expect(mockSDK.trigger).not.toHaveBeenCalledWith("highlightHover", mockChart, expect.any(Number), expect.any(String))
    })

    it("uses stacked point finding for stacked charts", () => {
      mockChart.getAttribute.mockImplementation((attr) => {
        if (attr === "chartType") return "stacked"
        return null
      })

      const event = { offsetX: 100, offsetY: 70 } // Below stacked point
      const points = [
        { name: "cpu", yval: 25, idx: 1 },
        { name: "memory", yval: 50, idx: 1 }
      ]

      hoverX.toggle(true)
      const highlightCallback = mockChartUI.on.mock.calls[0][1]
      highlightCallback(event, 123456789, points)

      expect(mockDygraph.findStackedPoint).toHaveBeenCalledWith(100, 70)
    })

    it("finds max value point when stacked point is above cursor", () => {
      mockChart.getAttribute.mockImplementation((attr) => {
        if (attr === "chartType") return "stackedBar"
        return null
      })

      mockDygraph.findStackedPoint.mockReturnValue({
        point: { canvasy: 80 }, // Below cursor at y=70, so condition will be true
        row: 1,
        seriesName: "cpu"
      })

      const event = { offsetX: 100, offsetY: 70 }
      const points = [
        { name: "cpu", yval: 25, idx: 1 },
        { name: "memory", yval: 75, idx: 1 }, // Max value
        { name: "disk", yval: 50, idx: 1 }
      ]

      hoverX.toggle(true)
      const highlightCallback = mockChartUI.on.mock.calls[0][1]
      highlightCallback(event, 123456789, points)

      expect(mockSDK.trigger).toHaveBeenCalledWith("highlightHover", mockChart, 123456789, "memory")
    })

    it("uses regular closest point finding for non-stacked charts", () => {
      const event = { offsetX: 100, offsetY: 50 }
      const points = [{ name: "cpu", yval: 25 }]

      hoverX.toggle(true)
      const highlightCallback = mockChartUI.on.mock.calls[0][1]
      highlightCallback(event, 123456789, points)

      expect(mockDygraph.findClosestPoint).toHaveBeenCalledWith(100, 50)
    })
  })

  describe("dimension detection", () => {
    it("gets dimension ID from series properties", () => {
      const event = { offsetX: 100, offsetY: 50 }
      const points = [{ name: "cpu", yval: 25 }]

      mockDygraph.findClosestPoint.mockReturnValue({
        seriesName: "memory"
      })

      hoverX.toggle(true)
      const highlightCallback = mockChartUI.on.mock.calls[0][1]
      highlightCallback(event, 123456789, points)

      expect(mockDygraph.getPropertiesForSeries).toHaveBeenCalledWith("memory")
      expect(mockSDK.trigger).toHaveBeenCalledWith("highlightHover", mockChart, 123456789, "memory")
    })

    it("handles missing series properties", () => {
      const event = { offsetX: 100, offsetY: 50 }
      const points = [{ name: "cpu", yval: 25 }]

      mockDygraph.findClosestPoint.mockReturnValue({
        seriesName: "unknown"
      })
      mockDygraph.getPropertiesForSeries.mockReturnValue(null)

      hoverX.toggle(true)
      const highlightCallback = mockChartUI.on.mock.calls[0][1]
      highlightCallback(event, 123456789, points)

      expect(mockSDK.trigger).not.toHaveBeenCalled()
    })

    it("handles missing dimension IDs", () => {
      const event = { offsetX: 100, offsetY: 50 }
      const points = [{ name: "cpu", yval: 25 }]

      mockChart.getPayloadDimensionIds.mockReturnValue(null)

      hoverX.toggle(true)
      const highlightCallback = mockChartUI.on.mock.calls[0][1]
      highlightCallback(event, 123456789, points)

      expect(mockSDK.trigger).not.toHaveBeenCalled()
    })

    it("returns series name when dimension ID not found", () => {
      const event = { offsetX: 100, offsetY: 50 }
      const points = [{ name: "cpu", yval: 25 }]

      mockDygraph.findClosestPoint.mockReturnValue({
        seriesName: "unknown_series"
      })
      mockDygraph.getPropertiesForSeries.mockReturnValue({
        column: 10, // Out of bounds
        name: "unknown_series"
      })

      hoverX.toggle(true)
      const highlightCallback = mockChartUI.on.mock.calls[0][1]
      highlightCallback(event, 123456789, points)

      expect(mockSDK.trigger).toHaveBeenCalledWith("highlightHover", mockChart, 123456789, "unknown_series")
    })
  })

  describe("highlight functionality", () => {
    it("triggers highlight events", () => {
      const event = { offsetX: 100, offsetY: 50 }
      const points = [{ name: "cpu", yval: 25 }]

      mockDygraph.findClosestPoint.mockReturnValue({
        seriesName: "cpu"
      })

      hoverX.toggle(true)
      const highlightCallback = mockChartUI.on.mock.calls[0][1]
      highlightCallback(event, 123456789, points)

      expect(mockSDK.trigger).toHaveBeenCalledWith("highlightHover", mockChart, 123456789, "cpu")
      expect(mockChart.trigger).toHaveBeenCalledWith("highlightHover", 123456789, "cpu")
    })

    it("ignores duplicate timestamps", () => {
      const event = { offsetX: 100, offsetY: 50 }
      const points = [{ name: "cpu", yval: 25 }]

      mockDygraph.findClosestPoint.mockReturnValue({
        seriesName: "cpu"
      })

      hoverX.toggle(true)
      const highlightCallback = mockChartUI.on.mock.calls[0][1]
      
      // First call
      highlightCallback(event, 123456789, points)
      expect(mockSDK.trigger).toHaveBeenCalledTimes(1)

      // Second call with same timestamp
      highlightCallback(event, 123456789, points)
      expect(mockSDK.trigger).toHaveBeenCalledTimes(1) // Should not increase
    })

    it("stores last position and points", () => {
      const event = { offsetX: 150, offsetY: 75 }
      const points = [{ name: "memory", yval: 50 }]

      mockDygraph.findClosestPoint.mockReturnValue({
        seriesName: "memory"
      })

      hoverX.toggle(true)
      const highlightCallback = mockChartUI.on.mock.calls[0][1]
      highlightCallback(event, 123456789, points)

      // Verify internal state by triggering mousemove with small delta
      const mousemoveCallback = mockChartUI.on.mock.calls[1][1]
      const moveEvent = { offsetX: 152, offsetY: 77 } // Small movement, should be ignored
      mousemoveCallback(moveEvent)

      // Should not trigger additional events due to small movement
      expect(mockSDK.trigger).toHaveBeenCalledTimes(1)
    })
  })

  describe("click functionality", () => {
    it("triggers click events", () => {
      const event = { offsetX: 100, offsetY: 50 }
      const points = [{ name: "cpu", yval: 25 }]

      mockDygraph.findClosestPoint.mockReturnValue({
        seriesName: "cpu"
      })

      hoverX.toggle(true)
      const clickCallback = mockChartUI.on.mock.calls[3][1] // click is the 4th event
      clickCallback(event, 123456789, points)

      expect(mockSDK.trigger).toHaveBeenCalledWith("highlightClick", mockChart, 123456789, "cpu")
      expect(mockChart.trigger).toHaveBeenCalledWith("highlightClick", 123456789, "cpu")
    })

    it("creates draft annotation", () => {
      const event = { offsetX: 100, offsetY: 50 }
      const points = [{ name: "cpu", yval: 25 }]

      mockDygraph.findClosestPoint.mockReturnValue({
        seriesName: "cpu"
      })

      hoverX.toggle(true)
      const clickCallback = mockChartUI.on.mock.calls[3][1]
      clickCallback(event, 123456789, points)

      expect(mockChart.updateAttribute).toHaveBeenCalledWith("draftAnnotation", {
        timestamp: 123456.789,
        createdAt: expect.any(Date),
        status: "draft"
      })
      expect(mockSDK.trigger).toHaveBeenCalledWith("annotationCreate", mockChart, 123456.789)
      expect(mockChart.trigger).toHaveBeenCalledWith("annotationCreate", 123456.789)
    })

    it("ignores click near existing annotation", () => {
      mockChart.getAttribute.mockImplementation((attr) => {
        if (attr === "overlays") {
          return {
            "annotation1": {
              type: "annotation",
              timestamp: 123456.8 // Close to click timestamp
            }
          }
        }
        return null
      })

      mockDygraph.toDomXCoord.mockReturnValue(99) // Close to offsetX=100

      const event = { offsetX: 100, offsetY: 50 }
      const points = [{ name: "cpu", yval: 25 }]

      hoverX.toggle(true)
      const clickCallback = mockChartUI.on.mock.calls[3][1]
      clickCallback(event, 123456789, points)

      expect(mockChart.updateAttribute).not.toHaveBeenCalledWith("draftAnnotation", expect.any(Object))
    })

    it("ignores click when annotation is being edited", () => {
      mockChart.getAttribute.mockImplementation((attr) => {
        if (attr === "draftAnnotation") {
          return { status: "editing" }
        }
        if (attr === "overlays") return {}
        return null
      })

      const event = { offsetX: 100, offsetY: 50 }
      const points = [{ name: "cpu", yval: 25 }]

      hoverX.toggle(true)
      const clickCallback = mockChartUI.on.mock.calls[3][1]
      clickCallback(event, 123456789, points)

      expect(mockChart.updateAttribute).not.toHaveBeenCalledWith("draftAnnotation", expect.any(Object))
    })
  })

  describe("mousemove functionality", () => {
    it("triggers events on significant movement", () => {
      const event = { offsetX: 100, offsetY: 50 }
      const points = [{ name: "cpu", yval: 25 }]

      mockDygraph.findClosestPoint.mockReturnValue({
        seriesName: "cpu"
      })

      hoverX.toggle(true)
      
      // First, trigger highlight to set lastPoints and lastTimestamp
      const highlightCallback = mockChartUI.on.mock.calls[0][1]
      highlightCallback(event, 123456789, points)

      // Now trigger mousemove with significant movement
      const mousemoveCallback = mockChartUI.on.mock.calls[1][1]
      const moveEvent = { offsetX: 110, offsetY: 60 } // Significant movement
      mousemoveCallback(moveEvent)

      expect(mockSDK.trigger).toHaveBeenCalledTimes(2) // Once for highlight, once for mousemove
    })

    it("ignores small movements", () => {
      const event = { offsetX: 100, offsetY: 50 }
      const points = [{ name: "cpu", yval: 25 }]

      hoverX.toggle(true)
      
      // First, trigger highlight to set lastPoints and lastTimestamp
      const highlightCallback = mockChartUI.on.mock.calls[0][1]
      highlightCallback(event, 123456789, points)

      // Now trigger mousemove with small movement
      const mousemoveCallback = mockChartUI.on.mock.calls[1][1]
      const moveEvent = { offsetX: 102, offsetY: 52 } // Small movement
      mousemoveCallback(moveEvent)

      expect(mockSDK.trigger).toHaveBeenCalledTimes(1) // Only the initial highlight
    })

    it("handles missing lastPoints gracefully", () => {
      hoverX.toggle(true)
      
      const mousemoveCallback = mockChartUI.on.mock.calls[1][1]
      const moveEvent = { offsetX: 110, offsetY: 60 }
      
      expect(() => mousemoveCallback(moveEvent)).not.toThrow()
      // Should not trigger events without lastPoints
      expect(mockSDK.trigger).not.toHaveBeenCalled()
    })
  })

  describe("mouseout functionality", () => {
    it("triggers blur events", () => {
      hoverX.toggle(true)
      
      const mouseoutCallback = mockChartUI.on.mock.calls[2][1]
      mouseoutCallback()

      expect(mockSDK.trigger).toHaveBeenCalledWith("highlightBlur", mockChart)
      expect(mockChart.trigger).toHaveBeenCalledWith("highlightBlur")
    })
  })

  describe("toggle functionality", () => {
    it("enables hover by registering event listeners", () => {
      hoverX.toggle(true)

      expect(mockChartUI.on).toHaveBeenCalledWith("highlightCallback", expect.any(Function))
      expect(mockChartUI.on).toHaveBeenCalledWith("mousemove", expect.any(Function))
      expect(mockChartUI.on).toHaveBeenCalledWith("mouseout", expect.any(Function))
      expect(mockChartUI.on).toHaveBeenCalledWith("click", expect.any(Function))
    })

    it("disables hover by calling destroy", () => {
      hoverX.toggle(false)

      expect(mockChartUI.off).toHaveBeenCalledWith("highlightCallback", expect.any(Function))
      expect(mockChartUI.off).toHaveBeenCalledWith("mousemove", expect.any(Function))
      expect(mockChartUI.off).toHaveBeenCalledWith("mouseout", expect.any(Function))
      expect(mockChartUI.off).toHaveBeenCalledWith("click", expect.any(Function))
    })
  })

  describe("destroy functionality", () => {
    it("cleans up event listeners and state", () => {
      hoverX.destroy()

      expect(mockChartUI.off).toHaveBeenCalledWith("highlightCallback", expect.any(Function))
      expect(mockChartUI.off).toHaveBeenCalledWith("mousemove", expect.any(Function))
      expect(mockChartUI.off).toHaveBeenCalledWith("mouseout", expect.any(Function))
      expect(mockChartUI.off).toHaveBeenCalledWith("click", expect.any(Function))
    })
  })

  describe("annotation detection", () => {
    it("detects near annotation", () => {
      mockChart.getAttribute.mockImplementation((attr) => {
        if (attr === "overlays") {
          return {
            "annotation1": {
              type: "annotation",
              timestamp: 123456.8
            },
            "annotation2": {
              type: "alarm",
              timestamp: 123457.0
            }
          }
        }
        return null
      })

      mockDygraph.toDomXCoord.mockReturnValue(95) // Within 10px threshold

      const event = { offsetX: 100, offsetY: 50 }
      const points = [{ name: "cpu", yval: 25 }]

      hoverX.toggle(true)
      const clickCallback = mockChartUI.on.mock.calls[3][1]
      clickCallback(event, 123456789, points)

      // Should not create annotation due to proximity
      expect(mockChart.updateAttribute).not.toHaveBeenCalledWith("draftAnnotation", expect.any(Object))
    })

    it("allows annotation when far from existing ones", () => {
      mockChart.getAttribute.mockImplementation((attr) => {
        if (attr === "overlays") {
          return {
            "annotation1": {
              type: "annotation",
              timestamp: 123456.8
            }
          }
        }
        return null
      })

      mockDygraph.toDomXCoord.mockReturnValue(85) // >10px away

      const event = { offsetX: 100, offsetY: 50 }
      const points = [{ name: "cpu", yval: 25 }]

      mockDygraph.findClosestPoint.mockReturnValue({
        seriesName: "cpu"
      })

      hoverX.toggle(true)
      const clickCallback = mockChartUI.on.mock.calls[3][1]
      clickCallback(event, 123456789, points)

      // Should create annotation since far enough
      expect(mockChart.updateAttribute).toHaveBeenCalledWith("draftAnnotation", expect.any(Object))
    })
  })
})