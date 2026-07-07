import { makeTestChart } from "@jest/testUtilities"
import { makeNumberSortingFn } from "./columns"
import { createDimensionValueCache } from "./useDimensionValueCache"

const getCellValue = cell => (cell !== null && typeof cell === "object" ? cell[0] : cell)

const makeStats = (ids, rows) =>
  ids.reduce(
    (stats, id, index) => {
      const values = rows.map(row => getCellValue(row[index + 1]))

      stats.min.push(Math.min(...values))
      stats.avg.push(values.reduce((sum, value) => sum + value, 0) / values.length)
      stats.max.push(Math.max(...values))
      stats.arp.push(0)

      return stats
    },
    { min: [], avg: [], max: [], arp: [] }
  )

const makePayload = (ids, rows, { stats = makeStats(ids, rows) } = {}) => ({
  summary: {
    contexts: [{ id: "test.context", sts: { min: 0, max: 100 } }],
  },
  db: {
    update_every: 1,
    dimensions: {
      ids,
      names: ids,
      units: ids.map(() => "requests"),
    },
    units: "requests",
  },
  view: {
    title: "Test chart",
    units: "requests",
    chart_type: "line",
    dimensions: {
      ids,
      names: ids,
      units: ids.map(() => "requests"),
      sts: stats,
    },
  },
  result: {
    labels: ["time", ...ids],
    point: { value: 0, arp: 1, pa: 2 },
    data: rows,
  },
})

const value = number => [number, 0, 0]

const loadChart = async payload => {
  const { chart } = makeTestChart({ mockData: payload })
  const loaded = new Promise(resolve => chart.on("successFetch", resolve))

  chart.doneFetch(payload)
  await loaded

  return chart
}

describe("dimension value cache", () => {
  it("calculates latest values and window stats from the chart payload", async () => {
    const chart = await loadChart(
      makePayload(["low", "mid", "high"], [
        [1000, value(1), value(2), value(10)],
        [2000, value(1), value(4), value(20)],
        [3000, value(1), value(6), value(30)],
      ])
    )

    const cache = createDimensionValueCache(chart, { period: "window", includeAdvancedStats: true })

    expect(cache.get("mid", "value", { period: "latest" })).toBe(6)
    expect(cache.get("mid", "min", { period: "window" })).toBe(2)
    expect(cache.get("mid", "avg", { period: "window" })).toBe(4)
    expect(cache.get("mid", "max", { period: "window" })).toBe(6)
    expect(cache.get("mid", "median", { period: "window" })).toBe(4)
    expect(cache.get("mid", "range", { period: "window" })).toBe(4)
    expect(cache.get("mid", "volume", { period: "window" })).toBe(12)
  })

  it("sorts by cached stat values without rescanning dimensions on every comparison", async () => {
    const ids = ["a", "b", "c", "d", "e", "f"]
    const rows = [
      [1000, value(5), value(1), value(3), value(4), value(2), value(6)],
      [2000, value(5), value(1), value(3), value(4), value(2), value(6)],
      [3000, value(5), value(1), value(3), value(4), value(2), value(6)],
    ]
    const chart = await loadChart(makePayload(ids, rows))
    const valueCache = createDimensionValueCache(chart, { period: "window" })
    const originalGetRowDimensionValue = chart.getRowDimensionValue
    let getRowDimensionValueCalls = 0

    chart.getRowDimensionValue = (...args) => {
      getRowDimensionValueCalls++
      return originalGetRowDimensionValue(...args)
    }

    try {
      const sortingFn = makeNumberSortingFn(chart, {
        key: "avg",
        period: "window",
        valueCache,
      })
      const tableRows = chart.getDimensionIds().map(id => ({ original: id }))

      tableRows.sort(sortingFn)

      const callsAfterFirstSort = getRowDimensionValueCalls

      expect(tableRows.map(row => row.original)).toEqual(["b", "e", "c", "d", "a", "f"])
      expect(callsAfterFirstSort).toBe(0)

      tableRows.reverse().sort(sortingFn)

      expect(getRowDimensionValueCalls).toBe(callsAfterFirstSort)
    } finally {
      chart.getRowDimensionValue = originalGetRowDimensionValue
    }
  })

  it("uses response window stats instead of recalculating row values", async () => {
    const chart = await loadChart(
      makePayload(
        ["a", "b"],
        [
          [1000, value(100), value(1)],
          [2000, value(100), value(1)],
        ],
        {
          stats: {
            min: [10, 20],
            avg: [30, 40],
            max: [50, 60],
            arp: [1, 2],
          },
        }
      )
    )
    const originalGetRowDimensionValue = chart.getRowDimensionValue
    let getRowDimensionValueCalls = 0

    chart.getRowDimensionValue = (...args) => {
      getRowDimensionValueCalls++
      return originalGetRowDimensionValue(...args)
    }

    try {
      const cache = createDimensionValueCache(chart, { period: "window" })

      expect(cache.get("a", "min", { period: "window" })).toBe(10)
      expect(cache.get("a", "avg", { period: "window" })).toBe(30)
      expect(cache.get("a", "max", { period: "window" })).toBe(50)
      expect(cache.get("a", "arp", { period: "window" })).toBe(1)
      expect(cache.get("a", "range", { period: "window" })).toBe(40)
      expect(getRowDimensionValueCalls).toBe(0)
    } finally {
      chart.getRowDimensionValue = originalGetRowDimensionValue
    }
  })

  it("keeps selected-area stats scoped to highlighted rows", async () => {
    const chart = await loadChart(
      makePayload(
        ["a"],
        [[1000, value(1)], [2000, value(3)], [3000, value(100)]],
        {
          stats: {
            min: [1000],
            avg: [1000],
            max: [1000],
            arp: [0],
          },
        }
      )
    )

    chart.setAttribute("overlays", { highlight: { range: [1, 2] } })

    const cache = createDimensionValueCache(chart, { period: "highlight" })

    expect(cache.get("a", "min", { period: "highlight" })).toBe(1)
    expect(cache.get("a", "avg", { period: "highlight" })).toBe(2)
    expect(cache.get("a", "max", { period: "highlight" })).toBe(3)
  })

  it("keeps incremental heatmap bucket delta semantics", async () => {
    const chart = await loadChart(
      makePayload(["bucket_0", "bucket_1", "bucket_2"], [
        [1000, value(10), value(15), value(25)],
        [2000, value(20), value(30), value(45)],
      ])
    )

    chart.setAttribute("chartType", "heatmap")
    chart.setAttribute("heatmapType", "incremental")

    const cache = createDimensionValueCache(chart, { period: "window" })

    expect(cache.get("bucket_1", "avg", { period: "window" })).toBe(7.5)
    expect(cache.get("bucket_2", "avg", { period: "window" })).toBe(12.5)
    expect(cache.get("bucket_1", "value", { period: "latest" })).toBe(10)
  })
})
