import getInitialAttributes, { stackedAggregations } from "./getInitialAttributes"

jest.mock("./getAggregateMethod", () => jest.fn(() => "avg"))
jest.mock("./getDimensions", () => jest.fn(() => ["cpu", "memory"]))

describe("getInitialAttributes", () => {
  let mockChart

  beforeEach(() => {
    mockChart = {
      getAttribute: jest.fn()
    }
  })

  it("exports stackedAggregations constant", () => {
    expect(stackedAggregations).toEqual({
      avg: true,
      sum: true
    })
  })

  it("returns correct initial attributes with no aggregationMethod", () => {
    mockChart.getAttribute.mockImplementation(key => {
      if (key === "dimensionIds") return ["cpu", "memory"]
      if (key === "aggregationMethod") return null
      return null
    })

    const result = getInitialAttributes(mockChart)
    
    expect(result).toEqual({
      aggregationMethod: "avg",
      selectedDimensions: ["cpu", "memory"],
      initializedFilters: true
    })
  })

  it("uses provided aggregationMethod when available", () => {
    mockChart.getAttribute.mockImplementation(key => {
      if (key === "dimensionIds") return ["cpu"]
      if (key === "aggregationMethod") return "sum"
      return null
    })

    const result = getInitialAttributes(mockChart)
    
    expect(result).toEqual({
      aggregationMethod: "sum",
      selectedDimensions: ["cpu", "memory"],
      initializedFilters: true
    })
  })

  it("sets initializedFilters to false when no dimensionIds", () => {
    mockChart.getAttribute.mockImplementation(key => {
      if (key === "dimensionIds") return []
      if (key === "aggregationMethod") return null
      return null
    })

    const result = getInitialAttributes(mockChart)
    
    expect(result).toEqual({
      aggregationMethod: "avg",
      selectedDimensions: ["cpu", "memory"],
      initializedFilters: false
    })
  })
})