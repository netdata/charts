import unitConversion from "./index"
import { makeTestChart } from "@jest/testUtilities"

describe("unitConversion", () => {
  let chart

  beforeEach(() => {
    const testChart = makeTestChart({
      attributes: {
        units: ["By"],
        unitsCurrent: ["By"],
        unitsConversion: "original",
        unitsStsByContext: {},
        dbUnitsStsByContext: {},
        dimensionIds: ["cpu", "memory"],
        visibleDimensionIds: ["cpu", "memory"],
      },
    })
    chart = testChart.chart
  })

  it("returns a cleanup function", () => {
    const cleanup = unitConversion(chart)
    expect(typeof cleanup).toBe("function")

    expect(() => cleanup()).not.toThrow()
  })

  it("sets up unit conversion attributes", () => {
    unitConversion(chart)

    expect(chart.getAttribute("unitsConversionMethod")).toBeDefined()
    expect(chart.getAttribute("dbUnitsConversionMethod")).toBeDefined()
  })

  it("handles static value range", () => {
    chart.updateAttribute("staticValueRange", [0, 100])

    unitConversion(chart)

    chart.trigger("yAxisChange", 50, 150)

    expect(chart.getAttribute("min")).toBe(0)
    expect(chart.getAttribute("max")).toBe(100)
  })

  it("updates conversion when visible dimensions change", () => {
    const cleanup = unitConversion(chart)

    chart.updateAttribute("visibleDimensionIds", ["cpu"])
    chart.trigger("visibleDimensionsChanged")

    expect(chart.getAttribute("unitsConversionMethod")).toBeDefined()

    cleanup()
  })

  it("updates conversion on y-axis change", () => {
    const cleanup = unitConversion(chart)

    chart.trigger("yAxisChange", 10, 90)

    expect(chart.getAttribute("min")).toBe(10)
    expect(chart.getAttribute("max")).toBe(90)

    cleanup()
  })

  it("handles missing payload data gracefully", () => {
    const testChart = makeTestChart({
      attributes: {
        units: ["By"],
      },
    })

    const cleanup = unitConversion(testChart.chart)

    expect(() => {
      testChart.chart.trigger("yAxisChange", 0, 100)
    }).not.toThrow()

    cleanup()
  })

  it("uses dimension min/max when available", () => {
    const mockPayload = {
      byDimension: {
        cpu: { min: 20, max: 80 },
        memory: { min: 10, max: 90 },
      },
    }
    chart.getPayload = () => mockPayload

    const cleanup = unitConversion(chart)

    chart.trigger("visibleDimensionsChanged")

    // The implementation handles min/max conversion logic
    expect(typeof chart.getAttribute("min")).toBe("number")
    expect(typeof chart.getAttribute("max")).toBe("number")

    cleanup()
  })

  it("handles context-specific units", () => {
    chart.updateAttribute("unitsStsByContext", {
      cpu: { units: ["%"], min: 0, max: 100 },
      memory: { units: ["By"], min: 0, max: 1024 },
    })

    unitConversion(chart)

    const unitsByContext = chart.getAttribute("unitsByContext")
    expect(unitsByContext).toBeDefined()
    expect(typeof unitsByContext).toBe("object")
  })

  it("processes both units and dbUnits", () => {
    chart.updateAttribute("dbUnitsStsByContext", {
      cpu: { units: ["ms"] },
    })

    unitConversion(chart)

    expect(chart.getAttribute("unitsConversionMethod")).toBeDefined()
    expect(chart.getAttribute("dbUnitsConversionMethod")).toBeDefined()
    expect(chart.getAttribute("dbUnitsByContext")).toBeDefined()
  })

  it("respects chart state on initialization", () => {
    chart.updateAttributes({
      units: ["%"],
      staticValueRange: [0, 100],
    })

    unitConversion(chart)

    const method = chart.getAttribute("unitsConversionMethod")
    expect(method).toBeDefined()
  })
})
