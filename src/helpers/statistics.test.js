import { 
  calculateStdDev, 
  calculateMedian, 
  calculatePercentile, 
  calculateAdvancedStats, 
  calculateAllStats 
} from "./statistics"

describe("Statistics helpers", () => {
  const testData = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
  
  it("calculates standard deviation correctly", () => {
    const result = calculateStdDev(testData)
    expect(result).toBeCloseTo(2.87, 1)
  })
  
  it("calculates median correctly", () => {
    expect(calculateMedian(testData)).toBe(5.5)
    expect(calculateMedian([1, 2, 3])).toBe(2)
  })
  
  it("calculates percentiles correctly", () => {
    expect(calculatePercentile(testData, 50)).toBe(5.5)
    expect(calculatePercentile(testData, 95)).toBeCloseTo(9.55, 1)
  })
  
  it("calculates advanced stats", () => {
    const basicStats = { avg: 5.5 }
    const result = calculateAdvancedStats(testData, basicStats)
    
    expect(result.median).toBe(5.5)
    expect(result.stddev).toBeCloseTo(2.87, 1)
    expect(result.p95).toBeCloseTo(9.55, 1)
    expect(result.range).toBe(9)
    expect(result.count).toBe(10)
    expect(result.volume).toBe(55)
  })
  
  it("calculates all stats", () => {
    const result = calculateAllStats(testData)
    
    expect(result.min).toBe(1)
    expect(result.max).toBe(10)
    expect(result.avg).toBe(5.5)
    expect(result.median).toBe(5.5)
    expect(result.count).toBe(10)
    expect(result.volume).toBe(55)
  })
  
  it("handles empty arrays", () => {
    expect(calculateStdDev([])).toBeNull()
    expect(calculateMedian([])).toBeNull()
    expect(calculatePercentile([], 50)).toBeNull()
    expect(calculateAdvancedStats([])).toEqual({})
    expect(calculateAllStats([])).toEqual({})
  })
})