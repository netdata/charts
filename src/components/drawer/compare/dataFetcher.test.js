import {
  getCurrentTimeRange,
  getComparisonPeriods,
  getMainPeriodPayload,
  normalizeComparisonPayload,
  fetchComparisonData,
} from "./dataFetcher"
import { calculateStats, extractDimensionValues } from "./calculations"
import { makeTestChart } from "@jest/testUtilities"

const customPeriods = [
  { id: "24h", label: "24 hours before", offsetSeconds: 86400 },
  { id: "7d", label: "7 days before", offsetSeconds: 604800 },
]

const makeRawPayload = ({ value = 51, pointValue = 1 } = {}) => ({
  result: {
    labels: ["time", "cpu"],
    point: { value: pointValue, arp: pointValue ? 0 : 1 },
    data: [
      [1000, pointValue ? [50, value] : [value, 50]],
      [2000, pointValue ? [60, value + 10] : [value + 10, 60]],
    ],
  },
  view: { update_every: 5 },
})

const loadChart = chart =>
  new Promise(resolve => {
    const unsubscribe = chart.on("successFetch", () => {
      unsubscribe()
      resolve()
    })

    chart.fetch()
  })

describe("dataFetcher", () => {
  let chart

  beforeEach(() => {
    chart = makeTestChart({
      attributes: {
        after: 1000,
        before: 2000,
        contextScope: ["system.cpu"],
        customPeriods,
      },
    }).chart
  })

  describe("getCurrentTimeRange", () => {
    it("uses the chart's canonical absolute window", () => {
      expect(getCurrentTimeRange(chart)).toEqual({ after: 1000, before: 2000 })

      chart.updateAttributes({ after: -900, before: 0, renderedAt: 2_000_000 })

      expect(getCurrentTimeRange(chart)).toEqual({ after: 1100, before: 2000 })
    })
  })

  describe("getComparisonPeriods", () => {
    it("generates the selected and custom periods in order", () => {
      expect(getComparisonPeriods({ after: 1000, before: 2000 }, customPeriods)).toEqual([
        {
          id: "selected",
          label: "Selected timeframe",
          after: 1000,
          before: 2000,
          isBase: true,
        },
        {
          ...customPeriods[0],
          after: 1000 - 86400,
          before: 2000 - 86400,
        },
        {
          ...customPeriods[1],
          after: 1000 - 604800,
          before: 2000 - 604800,
        },
      ])
    })
  })

  describe("normalizeComparisonPayload", () => {
    it("extracts the configured scalar value without chart-only object copies", () => {
      const result = normalizeComparisonPayload({
        result: {
          labels: ["time", "cpu", "memory"],
          point: { value: 1, arp: 2 },
          data: [
            [1000, [50, 51, 0], [30, 31, 0]],
            [2000, [60, 61, 0], [40, 41, 0]],
          ],
        },
        view: { update_every: 5 },
      })

      expect(result).toEqual({
        labels: ["time", "cpu", "memory", "ANOMALY_RATE", "ANNOTATIONS"],
        data: [
          [1000, 51, 31, null, null],
          [2000, 61, 41, null, null],
        ],
        viewUpdateEvery: 5,
      })
      expect(result).not.toHaveProperty("all")
      expect(result).not.toHaveProperty("tree")
      expect(result).not.toHaveProperty("byDimension")
      expect(extractDimensionValues(result)).toEqual({ cpu: 61, memory: 41 })
      expect(calculateStats(result)).toMatchObject({ points: 2, dimensions: 4 })
    })

    it("supports point.value zero and preserves nulls", () => {
      const rawPayload = makeRawPayload({ value: 0, pointValue: 0 })
      rawPayload.result.data[0][1][0] = null

      expect(normalizeComparisonPayload(rawPayload).data).toEqual([
        [1000, null, null, null],
        [2000, 10, null, null],
      ])
    })

    it("rejects malformed responses instead of treating them as empty data", () => {
      expect(() => normalizeComparisonPayload({ result: {} })).toThrow(
        "Invalid comparison response"
      )
      expect(() =>
        normalizeComparisonPayload({
          result: { labels: ["time", "cpu"], data: [[1000]], point: { value: 0 } },
        })
      ).toThrow("Invalid comparison data row")
    })

    it("handles thousands of dimensions with the compact contract", () => {
      const dimensionCount = 5256
      const labels = ["time", ...Array.from({ length: dimensionCount }, (_, index) => `d${index}`)]
      const data = Array.from({ length: 3 }, (_, pointIndex) => [
        pointIndex * 1000,
        ...Array.from({ length: dimensionCount }, (_, dimensionIndex) => [
          dimensionIndex + pointIndex,
          0,
          0,
        ]),
      ])

      const result = normalizeComparisonPayload({
        result: { labels, data, point: { value: 0, arp: 1, pa: 2 } },
        view: { update_every: 5 },
      })

      expect(result.data).toHaveLength(3)
      expect(result.data[0]).toHaveLength(dimensionCount + 3)
      expect(result.labels).toHaveLength(dimensionCount + 3)
      expect(result.data[2][dimensionCount]).toBe(dimensionCount + 1)
    })
  })

  describe("fetchComparisonData", () => {
    it("does not request comparison data before the main chart loads", async () => {
      const getChart = chart.getChart
      let calls = 0
      chart.getChart = (...args) => {
        calls++
        return getChart(...args)
      }

      expect(await fetchComparisonData(chart)).toEqual([])
      expect(calls).toBe(0)
    })

    it("always reuses the loaded main payload and fetches only historical periods", async () => {
      await loadChart(chart)
      const getChart = chart.getChart
      let calls = 0
      chart.getChart = (...args) => {
        calls++
        return getChart(...args)
      }

      const result = await fetchComparisonData(chart)

      expect(calls).toBe(customPeriods.length)
      expect(result[0].payload.data).toBe(chart.getPayload().data)
      expect(getMainPeriodPayload(chart).data).toBe(chart.getPayload().data)
      expect(chart.getAttribute("comparePeriods")).toBe(result)
    })

    it("uses a successful empty main payload without refetching it", async () => {
      chart.updateAttribute("loaded", true)
      chart.updateAttribute("customPeriods", [])
      let calls = 0
      chart.getChart = async () => {
        calls++
        return makeRawPayload()
      }

      const result = await fetchComparisonData(chart)

      expect(calls).toBe(0)
      expect(result).toHaveLength(1)
      expect(result[0].payload.data).toBe(chart.getPayload().data)
      expect(result[0].payload.data).toEqual([])
    })

    it("deduplicates identical concurrent batches but not completed batches", async () => {
      await loadChart(chart)
      let calls = 0
      chart.getChart = async () => {
        calls++
        await new Promise(resolve => setTimeout(resolve, 5))
        return makeRawPayload()
      }

      const [first, second] = await Promise.all([
        fetchComparisonData(chart),
        fetchComparisonData(chart),
      ])
      expect(first).toBe(second)
      expect(calls).toBe(customPeriods.length)

      await fetchComparisonData(chart)
      expect(calls).toBe(customPeriods.length * 2)
    })

    it("includes complete period definitions in batch identity and keeps latest results", async () => {
      await loadChart(chart)
      let calls = 0
      chart.getChart = async () => {
        calls++
        await new Promise(resolve => setTimeout(resolve, 5))
        return makeRawPayload({ value: calls })
      }

      const first = fetchComparisonData(chart)
      chart.updateAttribute(
        "customPeriods",
        customPeriods.map(period =>
          period.id === "24h" ? { ...period, label: "Previous day" } : period
        )
      )
      const second = fetchComparisonData(chart)
      await Promise.all([first, second])

      expect(calls).toBe(customPeriods.length * 2)
      expect(chart.getAttribute("comparePeriods")[1].label).toBe("Previous day")
      expect(chart.getAttribute("compareLoading")).toBe(false)
    })

    it("keeps transport and malformed-response failures local to each period", async () => {
      await loadChart(chart)
      let calls = 0
      chart.getChart = async () => {
        calls++
        if (calls === 1) throw new Error("Network error")
        return { result: {} }
      }

      const result = await fetchComparisonData(chart)

      expect(result[0].error).toBeNull()
      expect(result[1]).toMatchObject({ payload: null, error: "Network error" })
      expect(result[2]).toMatchObject({ payload: null, error: "Invalid comparison response" })
      expect(chart.getAttribute("compareError")).toBeNull()
      expect(chart.getAttribute("compareLoading")).toBe(false)
    })
  })
})
