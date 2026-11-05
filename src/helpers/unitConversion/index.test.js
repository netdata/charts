import unitConversion from "./index"
import { makeTestChart } from "@jest/testUtilities"

const bytesRawPayload = {
  view: {
    units: ["By"],
    dimensions: {
      ids: ["small", "large"],
      names: ["small", "large"],
      units: ["By", "By"],
    },
  },
  result: {
    labels: ["time", "small", "large"],
    point: { value: 0, arp: 1, pa: 2 },
    data: [
      [1, 1, 1024 ** 3],
      [2, 512, 2 * 1024 ** 3],
    ],
  },
}

const loadPayload = (chart, rawPayload) =>
  new Promise(resolve => {
    chart.on("successFetch", () => resolve())
    chart.doneFetch(rawPayload)
  })

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

    chart.trigger("yAxisChange", 0, 5000)

    expect(chart.getAttribute("unitsConversionMethod")).toEqual(["adjust"])
    expect(chart.getAttribute("unitsConversionPrefix")).toEqual(["Ki"])
    expect(chart.getAttribute("dbUnitsConversionMethod")).toEqual(["adjust"])
  })

  it("handles static value range", () => {
    chart.updateAttribute("staticValueRange", [0, 100])

    unitConversion(chart)

    chart.trigger("yAxisChange", 50, 150)

    expect(chart.getAttribute("min")).toBe(0)
    expect(chart.getAttribute("max")).toBe(100)
  })

  it("updates conversion when visible dimensions change", async () => {
    await loadPayload(chart, bytesRawPayload)

    const cleanup = unitConversion(chart)

    chart.trigger("visibleDimensionsChanged")

    expect(chart.getAttribute("unitsConversionPrefix")).toEqual(["Gi"])
    expect(chart.getAttribute("max")).toBe(2 * 1024 ** 3)

    chart.updateAttribute("selectedLegendDimensions", ["small"])
    chart.sortDimensions()

    expect(chart.getAttribute("unitsConversionPrefix")).toEqual([""])
    expect(chart.getAttribute("max")).toBe(512)

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

  it("uses dimension min/max when available", async () => {
    await loadPayload(chart, bytesRawPayload)

    const cleanup = unitConversion(chart)

    chart.trigger("visibleDimensionsChanged")

    expect(chart.getAttribute("min")).toBe(1)
    expect(chart.getAttribute("max")).toBe(2 * 1024 ** 3)

    const unitsByDimension = chart.getAttribute("unitsByDimension")
    expect(unitsByDimension.small.prefix).toBe("")
    expect(unitsByDimension.large.prefix).toBe("Gi")

    cleanup()
  })

  it("stores conversion attributes per dimension", () => {
    chart.updateAttributes({
      units: ["By"],
      viewDimensions: {
        ids: ["small", "large"],
        names: ["small", "large"],
        units: ["By", "By"],
        contexts: ["small", "large"],
      },
      dimensionIds: ["small", "large"],
      visibleDimensionIds: ["small", "large"],
    })

    chart.getPayload = () => ({
      byDimension: {
        small: { min: 1, max: 512 },
        large: { min: 1024 ** 3, max: 2 * 1024 ** 3 },
      },
    })
    chart.updateDimensions()

    const cleanup = unitConversion(chart)

    chart.trigger("visibleDimensionsChanged")

    const unitsByDimension = chart.getAttribute("unitsByDimension")

    expect(unitsByDimension.small.prefix).toBe("")
    expect(unitsByDimension.large.prefix).toBe("Gi")

    cleanup()
  })

  it("handles context-specific units", () => {
    chart.updateAttribute("unitsStsByContext", {
      ctxPercent: { units: "%", min: 0, max: 100 },
      ctxBytes: { units: "By", min: 0, max: 1024 },
    })

    unitConversion(chart)

    chart.trigger("yAxisChange", 0, 100)

    const unitsByContext = chart.getAttribute("unitsByContext")
    expect(unitsByContext.ctxPercent.method).toBe("original")
    expect(unitsByContext.ctxPercent.prefix).toBe("")
    expect(unitsByContext.ctxBytes.method).toBe("adjust")
    expect(unitsByContext.ctxBytes.prefix).toBe("Ki")
  })

  it("processes both units and dbUnits", () => {
    chart.updateAttribute("dbUnits", ["ms"])
    chart.updateAttribute("dbUnitsStsByContext", {
      ctxMs: { units: "ms", min: 0, max: 100 },
    })

    unitConversion(chart)

    chart.trigger("yAxisChange", 0, 5000)

    expect(chart.getAttribute("unitsConversionMethod")).toEqual(["adjust"])
    expect(chart.getAttribute("dbUnitsConversionMethod")).toEqual(["ms-s"])
    expect(chart.getAttribute("dbUnitsByContext").ctxMs.method).toBe("ms-ms")
    expect(chart.getAttribute("dbUnitsByContext").ctxMs.base).toBe("ms")
  })

  it("respects chart state on initialization", () => {
    chart.updateAttributes({
      units: ["%"],
      staticValueRange: [0, 100],
    })

    unitConversion(chart)

    chart.trigger("yAxisChange", 50, 150)

    expect(chart.getAttribute("unitsConversionMethod")).toEqual(["original"])
    expect(chart.getAttribute("min")).toBe(0)
    expect(chart.getAttribute("max")).toBe(100)
  })
})
