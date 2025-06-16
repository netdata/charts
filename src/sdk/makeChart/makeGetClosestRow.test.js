import makeGetClosestRow from "./makeGetClosestRow"

describe("makeGetClosestRow", () => {
  let mockChart

  beforeEach(() => {
    mockChart = {
      getPayload: jest.fn(() => ({
        data: [
          [1000, 10],
          [2000, 20], 
          [3000, 30],
          [4000, 40],
          [5000, 50]
        ]
      }))
    }
    
    makeGetClosestRow(mockChart)
  })

  it("adds getClosestRow method to chart", () => {
    expect(typeof mockChart.getClosestRow).toBe("function")
  })

  it("adds invalidateClosestRowCache method to chart", () => {
    expect(typeof mockChart.invalidateClosestRowCache).toBe("function")
  })

  it("returns -1 for empty data", () => {
    mockChart.getPayload.mockReturnValue({ data: [] })
    
    const result = mockChart.getClosestRow(1500)
    expect(result).toBe(-1)
  })

  it("returns first index for timestamp before data", () => {
    const result = mockChart.getClosestRow(500)
    expect(result).toBe(0)
  })

  it("returns last index for timestamp after data", () => {
    const result = mockChart.getClosestRow(6000)
    expect(result).toBe(4)
  })

  it("returns exact match when timestamp exists", () => {
    const result = mockChart.getClosestRow(3000)
    expect(result).toBe(2)
  })

  it("returns closest row for timestamp between data points", () => {
    const result = mockChart.getClosestRow(2100)
    expect(result).toBe(1)
  })

  it("caches results for same timestamp", () => {
    mockChart.getClosestRow(2500)
    mockChart.getClosestRow(2500)
    
    expect(mockChart.getPayload).toHaveBeenCalledTimes(1)
  })

  it("invalidates cache and recalculates", () => {
    mockChart.getClosestRow(2500)
    mockChart.invalidateClosestRowCache()
    mockChart.getClosestRow(2500)
    
    expect(mockChart.getPayload).toHaveBeenCalledTimes(2)
  })

  it("finds closest when multiple equidistant points", () => {
    const result = mockChart.getClosestRow(2500)
    expect([1, 2]).toContain(result)
  })
})