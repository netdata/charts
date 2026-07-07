import makeDimensions from "./makeDimensions"
import { loadHeatmapPayload, makeTestChart } from "@jest/testUtilities"

describe("makeDimensions", () => {
  let mockChart
  let mockSdk

  beforeEach(() => {
    mockChart = {
      getAttribute: jest.fn(),
      setAttribute: jest.fn(),
      updateAttribute: jest.fn(),
      trigger: jest.fn(),
      onAttributeChange: jest.fn(),
      getAttributes: jest.fn(() => ({
        colors: [],
        contextScope: ["test"],
        id: "test-chart",
        groupBy: [],
        context: "system.cpu",
        dimensionsSort: "default",
        selectedLegendDimensions: [],
        dimensionIds: ["cpu", "memory"],
        selectedDimensions: ["cpu"],
        viewDimensions: {
          ids: ["cpu", "memory"],
          names: ["CPU Usage", "Memory Usage"],
          priorities: [1, 2],
          units: ["percentage", "bytes"],
          contexts: ["cpu", "memory"],
          grouped: [],
        },
        sparkline: false,
        heatmapType: null,
        units: ["percentage", "bytes"],
        unitsConversionBase: [1000, 1000],
        unitsConversionPrefix: ["", ""],
        unitsConversionMethod: ["fixed", "fixed"],
        unitsConversionFractionDigits: [2, 2],
        unitsConversionDivider: [1, 1],
        unitsByContext: {},
      })),
      getThemeIndex: jest.fn(() => 0),
      getPayload: jest.fn(() => ({
        data: [
          [1000, 10, 20],
          [2000, 15, 25],
        ],
        all: [
          [1000, 10, 20],
          [2000, 15, 25],
        ],
      })),
      getDimensionValue: jest.fn(() => 50),
      getVisibleDimensionIds: jest.fn(() => ["cpu", "memory"]),
      getDimensionIds: jest.fn(() => ["cpu", "memory"]),
      isDimensionVisible: jest.fn(() => true),
    }

    mockSdk = {
      getRoot: jest.fn(() => ({
        getNextColor: jest.fn(() => "#ff0000"),
      })),
    }

    makeDimensions(mockChart, mockSdk)
  })

  it("adds isSparkline method to chart", () => {
    expect(typeof mockChart.isSparkline).toBe("function")
  })

  it("adds getHeatmapType method to chart", () => {
    expect(typeof mockChart.getHeatmapType).toBe("function")
  })

  it("adds getPayloadDimensionIds method to chart", () => {
    expect(typeof mockChart.getPayloadDimensionIds).toBe("function")
  })

  it("returns sparkline dimensions when sparkline is true", () => {
    mockChart.getAttribute.mockImplementation(key => {
      if (key === "sparkline") return true
      return null
    })

    const result = mockChart.getPayloadDimensionIds()
    expect(result).toEqual(["sum"])
  })

  it("returns viewDimensions ids when not sparkline", () => {
    mockChart.getAttribute.mockImplementation(key => {
      if (key === "sparkline") return false
      if (key === "viewDimensions") return { ids: ["cpu", "memory"] }
      return null
    })

    const result = mockChart.getPayloadDimensionIds()
    expect(result).toEqual(["cpu", "memory"])
  })

  it("adds getDimensionIndex method", () => {
    expect(typeof mockChart.getDimensionIndex).toBe("function")
  })

  it("adds getDimensionIds method", () => {
    expect(typeof mockChart.getDimensionIds).toBe("function")
  })

  it("adds getVisibleDimensionIds method", () => {
    expect(typeof mockChart.getVisibleDimensionIds).toBe("function")
  })

  it("adds isDimensionVisible method", () => {
    expect(typeof mockChart.isDimensionVisible).toBe("function")
  })

  it("adds getDimensionName method", () => {
    mockChart.getAttribute.mockImplementation(key => {
      if (key === "viewDimensions") return { names: ["CPU Usage", "Memory Usage"] }
      return null
    })

    expect(typeof mockChart.getDimensionName).toBe("function")

    const result = mockChart.getDimensionName("cpu")
    expect(result).toBe("cpu")
  })

  it("adds getDimensionPriority method", () => {
    expect(typeof mockChart.getDimensionPriority).toBe("function")

    const result = mockChart.getDimensionPriority("cpu")
    expect(result).toBe(0)
  })

  it("adds getDimensionUnit method", () => {
    mockChart.getAttribute.mockImplementation(key => {
      if (key === "viewDimensions") return { units: ["percentage", "bytes"] }
      return null
    })

    expect(typeof mockChart.getDimensionUnit).toBe("function")

    const result = mockChart.getDimensionUnit()
    expect(result).toBe("percentage")
  })

  it("adds selectDimensionColor method", () => {
    mockChart.getAttribute.mockImplementation(key => {
      if (key === "colors") return []
      if (key === "selectedDimensions") return ["cpu"]
      return null
    })

    expect(typeof mockChart.selectDimensionColor).toBe("function")

    const result = mockChart.selectDimensionColor("cpu")
    expect(result).toBe("#ff0000")
  })

  it("adds updateDimensions method", () => {
    expect(typeof mockChart.updateDimensions).toBe("function")
  })

  it("adds sortDimensions method", () => {
    mockChart.getAttribute.mockImplementation(key => {
      if (key === "dimensionsSort") return "nameAsc"
      if (key === "selectedLegendDimensions") return []
      return null
    })

    expect(typeof mockChart.sortDimensions).toBe("function")
    expect(() => mockChart.sortDimensions()).not.toThrow()
  })

  it("adds getDimensionValue method", () => {
    expect(typeof mockChart.getDimensionValue).toBe("function")
  })

  it("adds toggleDimensionId method", () => {
    mockChart.getAttribute.mockImplementation(key => {
      if (key === "selectedLegendDimensions") return []
      return null
    })

    expect(typeof mockChart.toggleDimensionId).toBe("function")
    expect(() => mockChart.toggleDimensionId("cpu")).not.toThrow()
  })

  describe("sorting methods", () => {
    beforeEach(() => {
      mockChart.getDimensionName = jest.fn(id => (id === "cpu" ? "CPU Usage" : "Memory Usage"))
      mockChart.getDimensionPriority = jest.fn(id => (id === "cpu" ? 1 : 2))
    })

    it("sorts by default method using priority", () => {
      mockChart.getAttribute.mockImplementation(key => {
        if (key === "dimensionsSort") return "default"
        if (key === "selectedLegendDimensions") return []
        return null
      })

      expect(() => mockChart.sortDimensions()).not.toThrow()
      expect(mockChart.trigger).toHaveBeenCalledWith("dimensionChanged")
    })

    it("sorts by name ascending", () => {
      mockChart.getAttribute.mockImplementation(key => {
        if (key === "dimensionsSort") return "nameAsc"
        if (key === "selectedLegendDimensions") return []
        return null
      })

      expect(() => mockChart.sortDimensions()).not.toThrow()
    })

    it("sorts by name descending", () => {
      mockChart.getAttribute.mockImplementation(key => {
        if (key === "dimensionsSort") return "nameDesc"
        if (key === "selectedLegendDimensions") return []
        return null
      })

      expect(() => mockChart.sortDimensions()).not.toThrow()
    })

    it("sorts by value descending", () => {
      mockChart.getAttribute.mockImplementation(key => {
        if (key === "dimensionsSort") return "valueDesc"
        if (key === "selectedLegendDimensions") return []
        return null
      })

      expect(() => mockChart.sortDimensions()).not.toThrow()
    })

    it("sorts by value ascending", () => {
      mockChart.getAttribute.mockImplementation(key => {
        if (key === "dimensionsSort") return "valueAsc"
        if (key === "selectedLegendDimensions") return []
        return null
      })

      expect(() => mockChart.sortDimensions()).not.toThrow()
    })

    it("sorts by anomaly descending", () => {
      mockChart.getAttribute.mockImplementation(key => {
        if (key === "dimensionsSort") return "anomalyDesc"
        if (key === "selectedLegendDimensions") return []
        return null
      })

      expect(() => mockChart.sortDimensions()).not.toThrow()
    })

    it("sorts by anomaly ascending", () => {
      mockChart.getAttribute.mockImplementation(key => {
        if (key === "dimensionsSort") return "anomalyAsc"
        if (key === "selectedLegendDimensions") return []
        return null
      })

      expect(() => mockChart.sortDimensions()).not.toThrow()
    })

    it("sorts by annotations descending", () => {
      mockChart.getAttribute.mockImplementation(key => {
        if (key === "dimensionsSort") return "annotationsDesc"
        if (key === "selectedLegendDimensions") return []
        return null
      })

      expect(() => mockChart.sortDimensions()).not.toThrow()
    })

    it("sorts by annotations ascending", () => {
      mockChart.getAttribute.mockImplementation(key => {
        if (key === "dimensionsSort") return "annotationsAsc"
        if (key === "selectedLegendDimensions") return []
        return null
      })

      expect(() => mockChart.sortDimensions()).not.toThrow()
    })

    it("uses default sort for unknown method", () => {
      mockChart.getAttribute.mockImplementation(key => {
        if (key === "dimensionsSort") return "unknownSort"
        if (key === "selectedLegendDimensions") return []
        return null
      })

      expect(() => mockChart.sortDimensions()).not.toThrow()
    })
  })

  describe("dimension visibility", () => {
    it("filters visible dimensions when selectedLegendDimensions has values", () => {
      mockChart.getAttribute.mockImplementation(key => {
        if (key === "selectedLegendDimensions") return ["cpu"]
        if (key === "dimensionsSort") return "default"
        return null
      })
      mockChart.getDimensionName = jest.fn(id => (id === "cpu" ? "CPU Usage" : "Memory Usage"))

      mockChart.sortDimensions()
      expect(mockChart.trigger).toHaveBeenCalledWith("dimensionChanged")
    })

    it("shows all dimensions when selectedLegendDimensions is empty", () => {
      mockChart.getAttribute.mockImplementation(key => {
        if (key === "selectedLegendDimensions") return []
        if (key === "dimensionsSort") return "default"
        return null
      })

      mockChart.sortDimensions()
      expect(mockChart.trigger).toHaveBeenCalledWith("dimensionChanged")
    })

    it("includes dimensions by name in selectedLegendDimensions", () => {
      mockChart.getAttribute.mockImplementation(key => {
        if (key === "selectedLegendDimensions") return ["CPU Usage"]
        if (key === "dimensionsSort") return "default"
        return null
      })
      mockChart.getDimensionName = jest.fn(id => (id === "cpu" ? "CPU Usage" : "Memory Usage"))

      mockChart.sortDimensions()
      expect(mockChart.trigger).toHaveBeenCalledWith("dimensionChanged")
    })
  })

  describe("color selection", () => {
    it("returns color from colors attribute for sparkline", () => {
      mockChart.getAttribute.mockImplementation(key => {
        if (key === "sparkline") return true
        if (key === "colors") return ["#blue"]
        return null
      })

      const color = mockChart.selectDimensionColor("cpu")
      expect(color).toBe("#blue")
    })

    it("returns color for selected dimension", () => {
      mockChart.getAttribute.mockImplementation(key => {
        if (key === "sparkline") return false
        if (key === "colors") return ["#green"]
        if (key === "selectedDimensions") return ["cpu"]
        return null
      })

      const color = mockChart.selectDimensionColor("selected")
      expect(color).toBe("#green")
    })

    it("uses SDK color when no colors attribute", () => {
      mockChart.getAttribute.mockImplementation(key => {
        if (key === "sparkline") return false
        if (key === "colors") return []
        if (key === "selectedDimensions") return ["cpu"]
        return null
      })

      const color = mockChart.selectDimensionColor("cpu")
      expect(color).toBe("#ff0000")
    })

    it("handles partIndex for split dimension names", () => {
      mockChart.getAttribute.mockImplementation(key => {
        if (key === "sparkline") return false
        if (key === "colors") return []
        if (key === "selectedDimensions") return ["cpu,gpu"]
        return null
      })

      const color = mockChart.selectDimensionColor("cpu,gpu", 1)
      expect(color).toBe("#ff0000")
    })
  })

  describe("dimension names and properties", () => {
    it("returns dimension name with partIndex", () => {
      mockChart.getAttribute.mockImplementation(key => {
        if (key === "viewDimensions") return { names: ["CPU,GPU Usage"] }
        return null
      })

      const name = mockChart.getDimensionName("cpu", 0)
      expect(name).toBe("cpu")
    })

    it("returns empty string when no viewDimensions names", () => {
      mockChart.getAttribute.mockImplementation(key => {
        if (key === "viewDimensions") return {}
        return null
      })

      const name = mockChart.getDimensionName("cpu")
      expect(name).toBe("")
    })

    it("returns 0 priority when no viewDimensions priorities", () => {
      mockChart.getAttribute.mockImplementation(key => {
        if (key === "viewDimensions") return {}
        return null
      })

      const priority = mockChart.getDimensionPriority("cpu")
      expect(priority).toBe(0)
    })

    it("returns first unit when no id provided", () => {
      mockChart.getAttribute.mockImplementation(key => {
        if (key === "viewDimensions") return { units: ["percentage", "bytes"] }
        return null
      })

      const unit = mockChart.getDimensionUnit()
      expect(unit).toBe("percentage")
    })

    it("returns empty string when no viewDimensions units", () => {
      mockChart.getAttribute.mockImplementation(key => {
        if (key === "viewDimensions") return {}
        return null
      })

      const unit = mockChart.getDimensionUnit("cpu")
      expect(unit).toBe("")
    })
  })

  describe("heatmap type detection", () => {
    it("sets heatmap type for grouped by dimension with matching prefix", () => {
      mockChart.getAttribute.mockImplementation(key => {
        if (key === "groupBy") return ["dimension"]
        if (key === "context") return "system.cpu"
        if (key === "dimensionsSort") return "default"
        if (key === "selectedLegendDimensions") return []
        if (key === "dimensionIds") return ["cpu_0", "cpu_1", "cpu_2"]
        return null
      })

      const dimensionIds = ["cpu_0", "cpu_1", "cpu_2"]
      mockChart.getPayloadDimensionIds = jest.fn(() => dimensionIds)

      mockChart.updateDimensions()

      expect(mockChart.setAttribute).toHaveBeenCalled()
    })

    it("disables heatmap for mixed prefixes", () => {
      mockChart.getAttribute.mockImplementation(key => {
        if (key === "groupBy") return ["dimension"]
        if (key === "context") return "system.cpu"
        if (key === "dimensionsSort") return "default"
        if (key === "selectedLegendDimensions") return []
        if (key === "dimensionIds") return ["cpu_0", "memory_1"]
        return null
      })

      const dimensionIds = ["cpu_0", "memory_1"]
      mockChart.getPayloadDimensionIds = jest.fn(() => dimensionIds)

      mockChart.updateDimensions()

      expect(mockChart.setAttribute).toHaveBeenCalled()
    })

    it("sets default heatmap type for latency context", () => {
      mockChart.getAttribute.mockImplementation(key => {
        if (key === "groupBy") return ["dimension"]
        if (key === "context") return "system.latency"
        if (key === "dimensionsSort") return "default"
        if (key === "selectedLegendDimensions") return []
        if (key === "dimensionIds") return ["latency_0", "latency_1"]
        return null
      })

      const dimensionIds = ["latency_0", "latency_1"]
      mockChart.getPayloadDimensionIds = jest.fn(() => dimensionIds)

      mockChart.updateDimensions()

      expect(mockChart.setAttribute).toHaveBeenCalled()
    })

    it("sets null heatmap type when not grouped by dimension", () => {
      mockChart.getAttribute.mockImplementation(key => {
        if (key === "groupBy") return ["instance"]
        if (key === "dimensionsSort") return "default"
        if (key === "selectedLegendDimensions") return []
        if (key === "dimensionIds") return ["cpu", "memory"]
        return null
      })

      const dimensionIds = ["cpu", "memory"]
      mockChart.getPayloadDimensionIds = jest.fn(() => dimensionIds)

      mockChart.updateDimensions()

      expect(mockChart.setAttribute).toHaveBeenCalledWith("heatmapType", null)
    })
  })

  describe("toggleDimensionId advanced scenarios", () => {
    it("toggles dimension when selectedLegendDimensions is empty", () => {
      mockChart.getAttribute.mockImplementation(key => {
        if (key === "selectedLegendDimensions") return []
        return null
      })
      mockChart.getDimensionIds = jest.fn(() => ["cpu", "memory", "disk"])

      mockChart.toggleDimensionId("cpu")

      expect(mockChart.updateAttribute).toHaveBeenCalledWith("selectedLegendDimensions", ["cpu"])
    })

    it("toggles dimension with merge option when empty", () => {
      mockChart.getAttribute.mockImplementation(key => {
        if (key === "selectedLegendDimensions") return []
        return null
      })
      mockChart.getDimensionIds = jest.fn(() => ["cpu", "memory", "disk"])

      mockChart.toggleDimensionId("cpu", { merge: true })

      expect(mockChart.updateAttribute).toHaveBeenCalledWith("selectedLegendDimensions", [
        "memory",
        "disk",
      ])
    })

    it("removes visible dimension", () => {
      mockChart.getAttribute.mockImplementation(key => {
        if (key === "selectedLegendDimensions") return ["cpu", "memory"]
        return null
      })
      mockChart.isDimensionVisible = jest.fn(id => id === "cpu")

      mockChart.toggleDimensionId("cpu")

      expect(mockChart.updateAttribute).toHaveBeenCalledWith("selectedLegendDimensions", ["cpu"])
    })

    it("removes visible dimension with merge option", () => {
      mockChart.getAttribute.mockImplementation(key => {
        if (key === "selectedLegendDimensions") return ["cpu", "memory"]
        return null
      })
      mockChart.isDimensionVisible = jest.fn(id => id === "cpu")

      mockChart.toggleDimensionId("cpu", { merge: true })

      expect(mockChart.updateAttribute).toHaveBeenCalledWith("selectedLegendDimensions", ["memory"])
    })

    it("clears selection when removing last dimension", () => {
      mockChart.getAttribute.mockImplementation(key => {
        if (key === "selectedLegendDimensions") return ["cpu"]
        return null
      })
      mockChart.isDimensionVisible = jest.fn(() => true)

      mockChart.toggleDimensionId("cpu")

      expect(mockChart.updateAttribute).toHaveBeenCalledWith("selectedLegendDimensions", [])
    })

    it("adds non-visible dimension", () => {
      mockChart.getAttribute.mockImplementation(key => {
        if (key === "selectedLegendDimensions") return ["cpu"]
        return null
      })
      mockChart.isDimensionVisible = jest.fn(() => false)

      mockChart.toggleDimensionId("memory")

      expect(mockChart.updateAttribute).toHaveBeenCalledWith("selectedLegendDimensions", ["memory"])
    })

    it("adds non-visible dimension with merge", () => {
      mockChart.getAttribute.mockImplementation(key => {
        if (key === "selectedLegendDimensions") return ["cpu"]
        return null
      })
      mockChart.isDimensionVisible = jest.fn(() => false)

      mockChart.toggleDimensionId("memory", { merge: true })

      expect(mockChart.updateAttribute).toHaveBeenCalledWith("selectedLegendDimensions", [
        "cpu",
        "memory",
      ])
    })
  })

  describe("edge cases and additional methods", () => {
    it("handles getUnitAttributes with context", () => {
      mockChart.getAttribute.mockImplementation(key => {
        if (key === "unitsByContext") return { cpu: { unit: "percentage" } }
        if (key === "viewDimensions") return { contexts: ["cpu", "memory"] }
        return null
      })
      mockChart.getDimensionContext = jest.fn(() => "cpu")

      const attrs = mockChart.getUnitAttributes("cpu")
      expect(attrs).toEqual({ unit: "percentage" })
    })

    it("handles getUnitAttributes without context", () => {
      mockChart.getAttribute.mockImplementation(key => {
        if (key === "unitsByContext") return {}
        if (key === "viewDimensions") return { units: ["percentage"], contexts: ["cpu"] }
        if (key === "units") return ["percentage", "bytes"]
        if (key === "unitsConversionBase") return [1000, 1000]
        if (key === "unitsConversionPrefix") return ["", ""]
        if (key === "unitsConversionMethod") return ["fixed", "fixed"]
        if (key === "unitsConversionFractionDigits") return [2, 2]
        if (key === "unitsConversionDivider") return [1, 1]
        return null
      })
      mockChart.getDimensionContext = jest.fn(() => "cpu")
      mockChart.getDimensionUnit = jest.fn(() => "percentage")

      const attrs = mockChart.getUnitAttributes("cpu")
      expect(attrs).toHaveProperty("method", "fixed")
    })

    it("handles getDimensionGroups", () => {
      mockChart.getAttribute.mockImplementation(key => {
        if (key === "viewDimensions") return { grouped: ["group1", "group2"] }
        return null
      })

      const groups = mockChart.getDimensionGroups()
      expect(groups).toEqual(["group1", "group2"])
    })

    it("returns empty array for getDimensionGroups when no groups", () => {
      mockChart.getAttribute.mockImplementation(key => {
        if (key === "viewDimensions") return {}
        return null
      })

      const groups = mockChart.getDimensionGroups()
      expect(groups).toEqual([])
    })

    it("handles getRowDimensionValue with incremental logic", () => {
      mockChart.getAttribute.mockImplementation(key => {
        if (key === "heatmapType") return "incremental"
        return null
      })
      mockChart.getDimensionIds = jest.fn(() => ["cpu", "memory", "disk"])
      mockChart.isDimensionVisible = jest.fn(() => true)
      mockChart.getRowDimensionValue = jest.fn().mockReturnValueOnce(30).mockReturnValueOnce(10)

      const pointData = [1000, 10, 20, 30]
      mockChart.getRowDimensionValue("disk", pointData, { incrementable: true })

      expect(mockChart.getRowDimensionValue).toHaveBeenCalled()
    })

    it("handles onHoverSortDimensions for heatmap", () => {
      mockChart.getAttribute.mockImplementation(key => {
        if (key === "heatmapType") return "default"
        if (key === "dimensionsSort") return "valueDesc"
        return null
      })

      const sorted = mockChart.onHoverSortDimensions(1)
      expect(sorted).toBeDefined()
    })

    it("handles onHoverSortDimensions for non-heatmap", () => {
      mockChart.getAttribute.mockImplementation(key => {
        if (key === "heatmapType") return null
        if (key === "dimensionsSort") return "valueDesc"
        return null
      })

      const sorted = mockChart.onHoverSortDimensions(1)
      expect(sorted).toBeDefined()
    })

    it("handles color selection with number color index", () => {
      mockChart.getAttribute.mockImplementation(key => {
        if (key === "sparkline") return false
        if (key === "colors") return [2, "#blue"]
        if (key === "selectedDimensions") return ["cpu"]
        return null
      })

      const color = mockChart.selectDimensionColor("cpu")
      expect(color).toBe("#ff0000")
    })

    it("handles empty updateColors when no dimensionIds", () => {
      mockChart.getAttribute.mockImplementation(key => {
        if (key === "dimensionIds") return []
        return null
      })

      expect(() => mockChart.updateColors()).not.toThrow()
    })

    it("handles always sort conditions", () => {
      const sortDimensionsSpy = jest.spyOn(mockChart, "sortDimensions")

      mockChart.getAttribute.mockImplementation(key => {
        if (key === "dimensionsSort") return "valueDesc"
        if (key === "selectedLegendDimensions") return []
        if (key === "groupBy") return []
        if (key === "dimensionIds") return ["cpu", "memory"]
        return null
      })

      const originalIds = ["cpu", "memory"]
      mockChart.getPayloadDimensionIds = jest.fn(() => originalIds)

      mockChart.updateDimensions()
      expect(sortDimensionsSpy).toHaveBeenCalled()
    })
  })
})

describe("makeDimensions heatmap bucket ordering", () => {
  const makeHeatmapChart = (ids, attributes = {}) => {
    const { chart } = makeTestChart({
      attributes: {
        chartType: "heatmap",
        context: "prometheus.test.histogram",
        dimensionsSort: "default",
        groupBy: ["dimension"],
        selectedLegendDimensions: [],
        viewDimensions: {
          ids,
          names: ids,
          priorities: ids.map((_, index) => index),
          units: ids.map(() => ""),
          contexts: ids.map(() => ""),
          grouped: ["dimension"],
        },
        ...attributes,
      },
    })

    chart.updateDimensions()

    return chart
  }

  it("sorts pure numeric Prometheus bucket ids without changing payload index", () => {
    const ids = ["+Inf", "0.3", "10", "120", "15", "2", "2.5"]
    const chart = makeHeatmapChart(ids)

    expect(chart.getHeatmapSortedIds()).toEqual(["0.3", "2", "2.5", "10", "15", "120", "+Inf"])
    expect(chart.getHeatmapScale()).toBe("num")
    expect(chart.getHeatmapYIndex("0.3")).toBe(0)
    expect(chart.getHeatmapYIndex("+Inf")).toBe(6)

    expect(chart.getDimensionIndex("+Inf")).toBe(0)
    expect(chart.getDimensionIndex("2")).toBe(5)
    expect(chart.getRowDimensionValue("2", [1000, 7, 1, 2, 3, 4, 5, 6])).toBe(5)
  })

  it("places a runtime-added numeric bucket before +Inf", () => {
    const chart = makeHeatmapChart(["1", "2", "5", "10", "+Inf"])
    const nextIds = ["1", "2", "5", "10", "+Inf", "3"]

    chart.setAttribute("viewDimensions", {
      ids: nextIds,
      names: nextIds,
      priorities: nextIds.map((_, index) => index),
      units: nextIds.map(() => ""),
      contexts: nextIds.map(() => ""),
      grouped: ["dimension"],
    })
    chart.updateDimensions()

    expect(chart.getHeatmapSortedIds()).toEqual(["1", "2", "3", "5", "10", "+Inf"])
    expect(chart.getHeatmapYIndex("3")).toBe(2)
    expect(chart.getHeatmapYIndex("+Inf")).toBe(5)
  })

  it("sorts prefixed compatibility bucket ids", () => {
    const chart = makeHeatmapChart(["bucket_+Inf", "bucket_1024", "bucket_2048"])

    expect(chart.getHeatmapSortedIds()).toEqual(["bucket_1024", "bucket_2048", "bucket_+Inf"])
    expect(chart.getHeatmapScale()).toBe("binary")
    expect(chart.getHeatmapYIndex("bucket_1024")).toBe(0)
    expect(chart.getDimensionIndex("bucket_1024")).toBe(1)
  })

  it("falls back to payload order for non-numeric heatmaps", () => {
    const chart = makeHeatmapChart(["low", "high", "+Inf"])

    expect(chart.getHeatmapSortedIds()).toBe(null)
    expect(chart.getHeatmapScale()).toBe(null)
    expect(chart.getHeatmapYIndex("high")).toBe(1)
  })

  it("uses sorted visible heatmap ids for y positions", () => {
    const chart = makeHeatmapChart(["+Inf", "1", "5", "2"], {
      selectedLegendDimensions: ["2", "+Inf"],
    })

    expect(chart.getVisibleHeatmapIds()).toEqual(["2", "+Inf"])
    expect(chart.getHeatmapYIndex("2")).toBe(0)
    expect(chart.getHeatmapYIndex("+Inf")).toBe(1)
  })

  it("crops zero-only buckets from heatmap edges without changing dimension visibility", async () => {
    const ids = ["0", "1", "2", "3", "4", "5", "6"]
    const chart = makeHeatmapChart(ids)

    await loadHeatmapPayload(chart, ids, [
      [0, 0, 1, 0, 2, 0, 0],
      [0, 0, 0, 0, 2, 0, 0],
    ])

    expect(chart.getAttribute("chartType")).toBe("heatmap")
    expect(chart.getHeatmapSortedIds()).toEqual(ids)
    expect(chart.getDimensionIds()).toEqual(ids)
    expect(chart.getRowDimensionValue("0", chart.getPayload().all[0])).toBe(0)
    expect(chart.getRowDimensionValue("2", chart.getPayload().all[0])).toBe(1)
    expect(chart.getRowDimensionValue("6", chart.getPayload().all[0])).toBe(0)
    expect(chart.getVisibleHeatmapIds()).toEqual(["1", "2", "3", "4", "5"])
    expect(chart.getVisibleDimensionIds()).toEqual(ids)
    expect(chart.getHeatmapYIndex("0")).toBe(-1)
    expect(chart.getHeatmapYIndex("2")).toBe(1)
    expect(chart.getHeatmapYIndex("6")).toBe(-1)
  })

  it("crops incremental heatmap edges using displayed bucket deltas", async () => {
    const ids = [
      "bucket_0",
      "bucket_1",
      "bucket_2",
      "bucket_3",
      "bucket_4",
      "bucket_5",
      "bucket_6",
    ]
    const chart = makeHeatmapChart(ids)

    await loadHeatmapPayload(chart, ids, [
      [0, 0, 1, 1, 3, 3, 3],
      [0, 0, 0, 0, 3, 3, 3],
    ])

    expect(chart.getAttribute("heatmapType")).toBe("incremental")
    expect(chart.getVisibleHeatmapIds()).toEqual([
      "bucket_1",
      "bucket_2",
      "bucket_3",
      "bucket_4",
      "bucket_5",
    ])
    expect(chart.getHeatmapYIndex("bucket_0")).toBe(-1)
    expect(chart.getHeatmapYIndex("bucket_2")).toBe(1)
    expect(chart.getHeatmapYIndex("bucket_6")).toBe(-1)
  })

  it("keeps the full heatmap scale when all buckets are zero", async () => {
    const ids = ["0", "1", "2", "3", "4", "5", "6"]
    const chart = makeHeatmapChart(ids)

    await loadHeatmapPayload(chart, ids, [
      [0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0],
    ])

    expect(chart.getVisibleHeatmapIds()).toEqual(ids)
    expect(chart.getHeatmapYIndex("0")).toBe(0)
    expect(chart.getHeatmapYIndex("6")).toBe(6)
  })
})
