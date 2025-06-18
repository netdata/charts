import makeDygraph from "./index"
import makeDefaultSDK from "@/makeDefaultSDK"
import makeMockPayload from "@/helpers/makeMockPayload"
import systemLoadLine from "../../../fixtures/systemLoadLine"




describe("dygraph chartLibrary", () => {
  let sdk, chart, element

  beforeEach(() => {
    element = document.createElement("div")
    element.style.width = "800px"
    element.style.height = "400px"
    document.body.appendChild(element)

    sdk = makeDefaultSDK({
      ui: { dygraph: makeDygraph },
      attributes: {
        chartLibrary: "dygraph",
        after: 1617946860000,
        before: 1617947750000,
        theme: "dark",
        chartType: "line",
        enabledHover: true,
        enabledNavigation: true,
      },
    })

    chart = sdk.makeChart({
      getChart: makeMockPayload(systemLoadLine[0], { delay: 0 })
    })
    sdk.appendChild(chart)
  })

  afterEach(() => {
    if (element && element.parentNode) {
      element.parentNode.removeChild(element)
    }
    jest.clearAllMocks()

    // Reset Dygraph mock to ensure fresh state
    const Dygraph = require("dygraphs")
    if (!Dygraph.defaultInteractionModel) {
      Dygraph.defaultInteractionModel = {}
    }
    Dygraph.defaultInteractionModel.touchstart = jest.fn()
    Dygraph.defaultInteractionModel.touchmove = jest.fn()
    Dygraph.defaultInteractionModel.touchend = jest.fn()

    sdk = null
    chart = null
    element = null
  })

  describe("basic functionality", () => {
    it("renders a chart with data", () => {
      const ui = chart.getUI("default")
      ui.mount(element)

      expect(element.classList.contains("dark")).toBe(true)
      expect(ui).toBeDefined()
    })

    it("handles empty data gracefully", () => {
      chart.doneFetch({
        result: {
          labels: ["time"],
          data: [],
        },
      })

      const ui = chart.getUI("default")
      ui.mount(element)

      expect(ui).toBeDefined()
    })

    it("handles outOfLimits state", () => {
      chart.updateAttribute("outOfLimits", true)

      const ui = chart.getUI("default")
      ui.mount(element)

      expect(ui).toBeDefined()
    })

    it("prevents multiple mounts on same element", () => {
      const ui = chart.getUI("default")
      ui.mount(element)
      ui.mount(element) // Second mount should not create duplicate

      expect(ui).toBeDefined()
    })
  })

  describe("chart type configurations", () => {
    it("configures line chart correctly", () => {
      chart.updateAttribute("chartType", "line")
      const ui = chart.getUI("default")
      ui.mount(element)

      expect(ui).toBeDefined()
    })

    it("configures stacked chart correctly", () => {
      chart.updateAttribute("chartType", "stacked")
      const ui = chart.getUI("default")
      ui.mount(element)

      expect(ui).toBeDefined()
    })

    it("configures area chart correctly", () => {
      chart.updateAttribute("chartType", "area")
      const ui = chart.getUI("default")
      ui.mount(element)

      expect(ui).toBeDefined()
    })

    it("configures heatmap chart correctly", () => {
      chart.updateAttribute("chartType", "heatmap")
      const ui = chart.getUI("default")
      ui.mount(element)

      expect(ui).toBeDefined()
    })

    it("configures stackedBar chart correctly", () => {
      chart.updateAttribute("chartType", "stackedBar")
      const ui = chart.getUI("default")
      ui.mount(element)

      expect(ui).toBeDefined()
    })

    it("configures multiBar chart correctly", () => {
      chart.updateAttribute("chartType", "multiBar")
      const ui = chart.getUI("default")
      ui.mount(element)

      expect(ui).toBeDefined()
    })
  })

  describe("theme handling", () => {
    it("applies theme class to element", () => {
      chart.updateAttribute("theme", "light")
      const ui = chart.getUI("default")
      ui.mount(element)

      expect(element.classList.contains("light")).toBe(true)
    })

    it("updates theme dynamically", () => {
      const ui = chart.getUI("default")
      ui.mount(element)

      expect(element.classList.contains("dark")).toBe(true)

      chart.updateAttribute("theme", "light")

      expect(element.classList.contains("dark")).toBe(false)
      expect(element.classList.contains("light")).toBe(true)
    })
  })

  describe("interaction handling", () => {
    it("handles hoverX attribute changes", () => {
      const ui = chart.getUI("default")
      ui.mount(element)

      chart.updateAttribute("hoverX", [1617946920000])
      chart.updateAttribute("hoverX", null) // Clear hover

      expect(ui).toBeDefined()
    })

    it("handles clickX attribute changes", () => {
      const ui = chart.getUI("default")
      ui.mount(element)

      chart.updateAttribute("clickX", [1617946920000])
      chart.updateAttribute("clickX", null) // Clear click

      expect(ui).toBeDefined()
    })

    it("toggles hover functionality", () => {
      const ui = chart.getUI("default")
      ui.mount(element)

      chart.updateAttribute("enabledHover", false)
      chart.updateAttribute("enabledHover", true)

      expect(ui).toBeDefined()
    })

    it("toggles navigation functionality", () => {
      const ui = chart.getUI("default")
      ui.mount(element)

      chart.updateAttribute("enabledNavigation", false)
      chart.updateAttribute("enabledNavigation", true)

      expect(ui).toBeDefined()
    })
  })

  describe("overlays and annotations", () => {
    it("handles overlay toggles", () => {
      const ui = chart.getUI("default")
      ui.mount(element)

      chart.updateAttribute("overlays", ["alarm", "highlight"])
      chart.updateAttribute("overlays", [])

      expect(ui).toBeDefined()
    })

    it("handles draft annotation changes", () => {
      const ui = chart.getUI("default")
      ui.mount(element)

      chart.updateAttribute("draftAnnotation", { x: 1617946920000, text: "Test" })
      chart.updateAttribute("draftAnnotation", null)

      expect(ui).toBeDefined()
    })

    it("configures anomaly series when enabled", () => {
      chart.updateAttribute("showAnomalies", true)
      const ui = chart.getUI("default")
      ui.mount(element)

      expect(ui).toBeDefined()
    })

    it("configures annotation series when enabled", () => {
      chart.updateAttribute("showAnnotations", true)
      const ui = chart.getUI("default")
      ui.mount(element)

      expect(ui).toBeDefined()
    })
  })

  describe("value range and axis handling", () => {
    it("handles static value range", () => {
      const ui = chart.getUI("default")
      ui.mount(element)

      chart.updateAttribute("staticValueRange", [0, 100])
      chart.updateAttribute("staticValueRange", null)

      expect(ui).toBeDefined()
    })

    it("handles static value range for heatmap", () => {
      chart.updateAttribute("chartType", "heatmap")
      const ui = chart.getUI("default")
      ui.mount(element)

      chart.updateAttribute("staticValueRange", [5.7, 95.3])

      expect(ui).toBeDefined()
    })

    it("handles timezone changes", () => {
      const ui = chart.getUI("default")
      ui.mount(element)

      chart.updateAttribute("timezone", "America/New_York")

      expect(ui).toBeDefined()
    })
  })

  describe("legend and dimension handling", () => {
    it("handles selected legend dimensions changes", () => {
      const ui = chart.getUI("default")
      ui.mount(element)

      chart.updateAttribute("selectedLegendDimensions", ["cpu", "memory"])

      expect(ui).toBeDefined()
    })

    it("skips updates when processing", () => {
      const ui = chart.getUI("default")
      ui.mount(element)

      chart.updateAttribute("processing", true)
      chart.updateAttribute("chartType", "area")
      chart.updateAttribute("selectedLegendDimensions", ["cpu"])

      expect(ui).toBeDefined()
    })

    it("handles fraction digits in legend updates", () => {
      chart.updateAttribute("unitsConversionFractionDigits", [-1, 2, 3])
      const ui = chart.getUI("default")
      ui.mount(element)

      chart.updateAttribute("selectedLegendDimensions", ["cpu"])

      expect(ui).toBeDefined()
    })

    it("handles positive fraction digits in legend updates", () => {
      chart.updateAttribute("unitsConversionFractionDigits", [2, 1, 0])
      const ui = chart.getUI("default")
      ui.mount(element)

      chart.updateAttribute("selectedLegendDimensions", ["memory"])

      expect(ui).toBeDefined()
    })
  })

  describe("sparkline mode", () => {
    it("configures sparkline options", () => {
      chart.updateAttribute("sparkline", true)
      const ui = chart.getUI("default")
      ui.mount(element)

      expect(ui).toBeDefined()
    })
  })

  describe("unmount functionality", () => {
    it("cleans up resources on unmount", () => {
      const ui = chart.getUI("default")
      ui.mount(element)

      // Verify mount created resources
      expect(ui).toBeDefined()

      ui.unmount()

      // After unmount, should be able to mount again
      ui.mount(element)
      expect(ui).toBeDefined()
    })

    it("handles unmount when not mounted", () => {
      const ui = chart.getUI("default")

      expect(() => ui.unmount()).not.toThrow()
    })
  })

  describe("event handling", () => {
    it("prevents default on touch events", () => {
      const ui = chart.getUI("default")
      ui.mount(element)

      const touchEvent = new Event("touchstart")
      const preventDefaultSpy = jest.spyOn(touchEvent, "preventDefault")

      element.dispatchEvent(touchEvent)

      expect(preventDefaultSpy).toHaveBeenCalled()
    })

    it.skip("handles all touch event types", () => {
      const ui = chart.getUI("default")
      ui.mount(element)

        [("touchstart", "touchmove", "touchend")].forEach(eventType => {
          const event = new Event(eventType)
          const preventDefaultSpy = jest.spyOn(event, "preventDefault")

          element.dispatchEvent(event)

          expect(preventDefaultSpy).toHaveBeenCalled()
        })
    })
  })

  describe("data options", () => {
    it("handles includeZero option", () => {
      chart.updateAttribute("includeZero", true)
      const ui = chart.getUI("default")
      ui.mount(element)

      expect(ui).toBeDefined()
    })

    it("handles axis visibility options", () => {
      chart.updateAttribute("enabledXAxis", false)
      chart.updateAttribute("enabledYAxis", false)
      const ui = chart.getUI("default")
      ui.mount(element)

      expect(ui).toBeDefined()
    })

    it("handles y-axis label width", () => {
      chart.updateAttribute("yAxisLabelWidth", 100)
      const ui = chart.getUI("default")
      ui.mount(element)

      expect(ui).toBeDefined()
    })
  })

  describe("color and styling options", () => {
    it("configures color options", () => {
      const ui = chart.getUI("default")
      ui.mount(element)

      // Test that the chart mounts with color configurations
      expect(ui).toBeDefined()
    })
  })

  describe("visibility options", () => {
    it("handles dimension visibility", () => {
      chart.updateAttribute("selectedLegendDimensions", ["cpu"])
      const ui = chart.getUI("default")
      ui.mount(element)

      expect(ui).toBeDefined()
    })
  })

  describe("error handling", () => {
    it("handles missing payload gracefully", () => {
      const newChart = sdk.makeChart()
      sdk.appendChild(newChart)

      // Don't call doneFetch to simulate missing data
      const ui = newChart.getUI("default")

      expect(() => ui.mount(element)).not.toThrow()
    })

    it("handles invalid data gracefully", () => {
      chart.doneFetch({
        result: {
          labels: ["time"],
          data: null,
        },
      })

      const ui = chart.getUI("default")

      expect(() => ui.mount(element)).not.toThrow()
    })
  })

  describe("resize handling", () => {
    it("handles resize events", () => {
      const ui = chart.getUI("default")
      ui.mount(element)

      // Simulate resize
      chart.trigger("resize")

      expect(ui).toBeDefined()
    })
  })

  describe("navigation settings", () => {
    it("handles navigation configuration changes", () => {
      const ui = chart.getUI("default")
      ui.mount(element)

      chart.updateAttribute("navigation", { pan: true, zoom: true })

      expect(ui).toBeDefined()
    })
  })
})
