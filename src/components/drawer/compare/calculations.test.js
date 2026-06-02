import {
  calculateStats,
  calculatePercentageChange,
  calculateComparisons,
  extractDimensionValues,
} from "./calculations"

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
        min: 30,
        avg: 70,
        max: 110,
        points: 3,
        dimensions: 2,
        cv: 46.656947481584346,
        median: 70,
        stddev: 32.65986323710904,
        p25: 50,
        p75: 90,
        p95: 106,
        range: 80,
        count: 3,
        volume: 420,
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
        min: 70,
        avg: 90,
        max: 110,
        points: 2,
        dimensions: 2,
        cv: 22.22222222222222,
        median: 90,
        stddev: 20,
        p25: 80,
        p75: 100,
        p95: 108,
        range: 40,
        count: 2,
        volume: 360,
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

    it("uses absolute values for dimension aggregation", () => {
      const payload = {
        data: [
          [1, -500, 100],
          [2, -300, 200],
          [3, -100, 50],
        ],
        dimensions: ["received", "sent"],
        viewUpdateEvery: 1,
      }

      const result = calculateStats(payload)

      expect(result.min).toBe(150)
      expect(result.avg).toBeCloseTo(416.67, 1)
      expect(result.max).toBe(600)
      expect(result.median).toBe(500)
      expect(result.volume).toBeCloseTo(1250, 0)
      expect(result.range).toBe(450)
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

  describe("extractDimensionValues", () => {
    it("returns null when payload is null or undefined", () => {
      expect(extractDimensionValues(null)).toBeNull()
      expect(extractDimensionValues(undefined)).toBeNull()
    })

    it("returns null when payload.data is empty", () => {
      expect(
        extractDimensionValues({ data: [], labels: ["time", "in", "ANOMALY_RATE", "ANNOTATIONS"] })
      ).toBeNull()
    })

    it("returns null when payload.labels is missing or not an array", () => {
      expect(extractDimensionValues({ data: [[1, 10]] })).toBeNull()
      expect(extractDimensionValues({ data: [[1, 10]], labels: "nope" })).toBeNull()
    })

    it("returns a label -> value bag for a bare camelized payload", () => {
      const payload = {
        labels: ["time", "in", "out", "ANOMALY_RATE", "ANNOTATIONS"],
        data: [[1000, 100, 200, null, null]],
      }

      expect(extractDimensionValues(payload)).toEqual({ in: 100, out: 200 })
    })

    it("skips synthetic ANOMALY_RATE and ANNOTATIONS labels", () => {
      const payload = {
        labels: ["time", "in", "ANOMALY_RATE", "out", "ANNOTATIONS"],
        data: [[1000, 100, 0.5, 200, "x"]],
      }

      expect(extractDimensionValues(payload)).toEqual({ in: 100, out: 200 })
    })

    it("picks the requested row when rowIndex is provided", () => {
      const payload = {
        labels: ["time", "in", "out", "ANOMALY_RATE", "ANNOTATIONS"],
        data: [
          [1000, 10, 20, null, null],
          [2000, 30, 40, null, null],
          [3000, 50, 60, null, null],
        ],
      }

      expect(extractDimensionValues(payload, 0)).toEqual({ in: 10, out: 20 })
      expect(extractDimensionValues(payload, 1)).toEqual({ in: 30, out: 40 })
    })

    it("counts from end for negative rowIndex", () => {
      const payload = {
        labels: ["time", "in", "out", "ANOMALY_RATE", "ANNOTATIONS"],
        data: [
          [1000, 10, 20, null, null],
          [2000, 30, 40, null, null],
          [3000, 50, 60, null, null],
        ],
      }

      expect(extractDimensionValues(payload)).toEqual({ in: 50, out: 60 })
      expect(extractDimensionValues(payload, -1)).toEqual({ in: 50, out: 60 })
      expect(extractDimensionValues(payload, -2)).toEqual({ in: 30, out: 40 })
    })
  })
})
