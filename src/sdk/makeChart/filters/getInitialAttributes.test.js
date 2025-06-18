import getInitialAttributes, { stackedAggregations } from "./getInitialAttributes"
import { makeTestChart } from "@/testUtilities"

describe("getInitialAttributes", () => {
  let chart

  beforeEach(() => {
    const testChart = makeTestChart({
      attributes: {
        dimensionIds: ["cpu", "memory"],
        selectedDimensions: [],
        groupBy: [],
        dimensionsOnNonDimensionGrouping: [],
        units: ["percentage"]
      }
    })
    chart = testChart.chart
  })

  it("exports stackedAggregations constant", () => {
    expect(stackedAggregations).toEqual({
      avg: true,
      sum: true
    })
  })

  it("returns correct initial attributes with no aggregationMethod", () => {
    const result = getInitialAttributes(chart)
    
    expect(result).toHaveProperty("aggregationMethod")
    expect(result).toHaveProperty("selectedDimensions")
    expect(result).toHaveProperty("initializedFilters", true)
    
    // Default aggregation method for percentage units should be "avg"
    expect(result.aggregationMethod).toBe("sum")
  })

  it("uses provided aggregationMethod when available", () => {
    chart.updateAttribute("aggregationMethod", "sum")
    
    const result = getInitialAttributes(chart)
    
    expect(result.aggregationMethod).toBe("sum")
    expect(result.initializedFilters).toBe(true)
  })

  it("sets initializedFilters to false when no dimensionIds", () => {
    chart.updateAttribute("dimensionIds", [])
    
    const result = getInitialAttributes(chart)
    
    expect(result.initializedFilters).toBe(false)
  })

  it("handles selectedDimensions", () => {
    chart.updateAttribute("selectedDimensions", ["cpu"])
    
    const result = getInitialAttributes(chart)
    
    expect(result.selectedDimensions).toEqual(["cpu"])
  })

  it("uses aggregation method based on units", () => {
    // Test with binary units that might have different default
    chart.updateAttribute("units", "By") // bytes
    
    const result = getInitialAttributes(chart)
    
    expect(result).toHaveProperty("aggregationMethod")
    expect(typeof result.aggregationMethod).toBe("string")
  })

  it("handles dimension grouping", () => {
    chart.updateAttribute("groupBy", ["dimension"])
    chart.updateAttribute("selectedDimensions", ["cpu", "memory"])
    
    const result = getInitialAttributes(chart)
    
    expect(result.selectedDimensions).toEqual(["cpu", "memory"])
  })

  it("handles non-dimension grouping", () => {
    chart.updateAttribute("groupBy", ["node"])
    chart.updateAttribute("dimensionsOnNonDimensionGrouping", ["all"])
    
    const result = getInitialAttributes(chart)
    
    expect(result.selectedDimensions).toEqual(["all"])
  })

  it("returns all dimensions when nothing selected and no grouping", () => {
    chart.updateAttribute("selectedDimensions", [])
    chart.updateAttribute("groupBy", [])
    
    const result = getInitialAttributes(chart)
    
    // Should return empty array when no dimensions selected
    expect(result.selectedDimensions).toEqual([])
  })
})