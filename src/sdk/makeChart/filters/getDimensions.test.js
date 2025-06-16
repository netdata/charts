import getDimensions from "./getDimensions"

describe("getDimensions", () => {
  let mockChart

  beforeEach(() => {
    mockChart = {
      getAttributes: jest.fn()
    }
  })

  it("returns selectedDimensions when they exist", () => {
    mockChart.getAttributes.mockReturnValue({
      selectedDimensions: ["cpu", "memory"],
      groupBy: [],
      dimensionsOnNonDimensionGrouping: ["disk"]
    })

    const result = getDimensions(mockChart)
    expect(result).toEqual(["cpu", "memory"])
  })

  it("returns selectedDimensions when groupBy includes dimension", () => {
    mockChart.getAttributes.mockReturnValue({
      selectedDimensions: [],
      groupBy: ["dimension", "instance"],
      dimensionsOnNonDimensionGrouping: ["disk"]
    })

    const result = getDimensions(mockChart)
    expect(result).toEqual([])
  })

  it("returns dimensionsOnNonDimensionGrouping when selectedDimensions is empty and groupBy doesn't include dimension", () => {
    mockChart.getAttributes.mockReturnValue({
      selectedDimensions: [],
      groupBy: ["instance"],
      dimensionsOnNonDimensionGrouping: ["disk", "network"]
    })

    const result = getDimensions(mockChart)
    expect(result).toEqual(["disk", "network"])
  })

  it("returns selectedDimensions when dimensionsOnNonDimensionGrouping is null", () => {
    mockChart.getAttributes.mockReturnValue({
      selectedDimensions: [],
      groupBy: ["instance"],
      dimensionsOnNonDimensionGrouping: null
    })

    const result = getDimensions(mockChart)
    expect(result).toEqual([])
  })

  it("handles empty groupBy array", () => {
    mockChart.getAttributes.mockReturnValue({
      selectedDimensions: ["cpu"],
      groupBy: [],
      dimensionsOnNonDimensionGrouping: ["disk"]
    })

    const result = getDimensions(mockChart)
    expect(result).toEqual(["cpu"])
  })
})