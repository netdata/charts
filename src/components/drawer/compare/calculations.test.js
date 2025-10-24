import { calculateStats, calculatePercentageChange, calculateComparisons } from "./calculations"

describe("calculations", () => {
  describe("calculateStats", () => {
    it("calculates correct statistics from data", () => {
      const payload = {
        data: [
          [1, 10, 20],
          [2, 30, 40],
          [3, 50, 60],
        ],
        dimensions: ["cpu", "memory"],
        viewUpdateEvery: 2,
      }

      const result = calculateStats(payload)

      expect(result).toEqual({
        min: 10,
        avg: 35,
        max: 60,
        points: 3,
        dimensions: 2,
        value: 60,
        arp: 0,
        cv: 48.79500364742666,
        median: 35,
        stddev: 17.07825127659933,
        p25: 22.5,
        p75: 47.5,
        p95: 57.5,
        range: 50,
        count: 6,
        volume: 210,
      })
    })

    it("filters data by highlight range", () => {
      const payload = {
        data: [
          [1000000, 10, 20], // 1000 seconds in ms
          [2000000, 30, 40], // 2000 seconds in ms
          [3000000, 50, 60], // 3000 seconds in ms
          [4000000, 70, 80], // 4000 seconds in ms
        ],
        dimensions: ["cpu", "memory"],
        viewUpdateEvery: 2,
      }

      // Highlight range in seconds (1500-3500), will be converted to ms internally
      const result = calculateStats(payload, [1500, 3500])

      expect(result).toEqual({
        min: 30,
        avg: 45,
        max: 60,
        points: 2,
        dimensions: 2,
        value: 60,
        arp: 0,
        cv: 24.845199749997665,
        median: 45,
        stddev: 11.180339887498949,
        p25: 37.5,
        p75: 52.5,
        p95: 58.5,
        range: 30,
        count: 4,
        volume: 180,
      })
    })

    it("returns null when highlight range excludes all data", () => {
      const payload = {
        data: [
          [1000, 10, 20],
          [2000, 30, 40],
        ],
        dimensions: ["cpu", "memory"],
      }

      const result = calculateStats(payload, [5000, 6000])

      expect(result).toBeNull()
    })

    it("handles null and invalid values", () => {
      const payload = {
        data: [
          [1, null, 20],
          [2, NaN, 40],
          [3, Infinity, 60],
        ],
        dimensions: ["cpu"],
        viewUpdateEvery: 1,
      }

      const result = calculateStats(payload)

      expect(result).toEqual({
        min: 20,
        avg: 40,
        max: 60,
        points: 3,
        dimensions: 2,
        value: 60,
        arp: 0,
        cv: 40.8248290463863,
        median: 40,
        stddev: 16.32993161855452,
        p25: 30,
        p75: 50,
        p95: 58,
        range: 40,
        count: 3,
        volume: 120,
      })
    })

    it("returns null for empty or invalid payload", () => {
      expect(calculateStats(null)).toBeNull()
      expect(calculateStats({})).toBeNull()
      expect(calculateStats({ data: [] })).toBeNull()
      expect(calculateStats({ data: [[1]] })).toBeNull()
    })
  })

  describe("calculatePercentageChange", () => {
    it("calculates positive percentage change", () => {
      const result = calculatePercentageChange(120, 100)

      expect(result).toEqual({
        value: 20,
        direction: "up",
        formatted: "20.0%",
      })
    })

    it("calculates negative percentage change", () => {
      const result = calculatePercentageChange(80, 100)

      expect(result).toEqual({
        value: 20,
        direction: "down",
        formatted: "20.0%",
      })
    })

    it("handles edge cases", () => {
      expect(calculatePercentageChange(0, 100)).toEqual({
        value: 100,
        direction: "down",
        formatted: "100.0%",
      })

      expect(calculatePercentageChange(100, 0)).toEqual({
        value: 0,
        direction: "neutral",
        formatted: "0.0%",
      })

      expect(calculatePercentageChange(0, 0)).toEqual({
        value: 0,
        direction: "neutral",
        formatted: "0.0%",
      })

      expect(calculatePercentageChange(null, 100)).toBeNull()
      expect(calculatePercentageChange(100, null)).toBeNull()
    })
  })

  describe("calculateComparisons", () => {
    const mockPeriods = [
      {
        id: "selected",
        isBase: true,
        stats: { min: 10, avg: 30, max: 50, points: 100, dimensions: 2 },
      },
      {
        id: "24h",
        stats: { min: 8, avg: 36, max: 60, points: 90, dimensions: 2 },
      },
      {
        id: "7d",
        stats: { min: 12, avg: 24, max: 40, points: 110, dimensions: 2 },
      },
    ]

    it("calculates comparisons correctly", () => {
      const result = calculateComparisons(mockPeriods)

      expect(result[0]).toEqual(mockPeriods[0])

      expect(result[1].changes.min).toEqual({
        value: 20,
        direction: "down",
        formatted: "20.0%",
      })

      expect(result[1].changes.avg).toEqual({
        value: 20,
        direction: "up",
        formatted: "20.0%",
      })
    })

    it("handles missing base period", () => {
      const periodsWithoutBase = [{ id: "24h", stats: { min: 10, avg: 20, max: 30 } }]

      const result = calculateComparisons(periodsWithoutBase)
      expect(result).toEqual(periodsWithoutBase)
    })
  })
})
