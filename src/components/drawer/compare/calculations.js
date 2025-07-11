import { calculateAllStats } from "@/helpers/statistics"

export const calculateStats = (payload, highlightRange = null) => {
  if (!payload?.data?.length) return null

  const { data } = payload

  const filteredData = highlightRange
    ? data.filter(row => {
        const timestamp = row[0]
        const highlightStart = highlightRange[0] * 1000
        const highlightEnd = highlightRange[1] * 1000
        return timestamp >= highlightStart && timestamp <= highlightEnd
      })
    : data

  if (!filteredData.length) return null

  const values = filteredData.flatMap(row =>
    row.slice(1).filter(val => val !== null && !isNaN(val) && isFinite(val))
  )

  if (!values.length) return null

  const stats = calculateAllStats(values)

  return {
    ...stats,
    points: filteredData.length,
    dimensions: payload.dimensions?.length || 0,
  }
}

export const calculatePercentageChange = (current, base) => {
  if (current == null || base == null || base === 0) return null

  const change = ((current - base) / Math.abs(base)) * 100
  return {
    value: Math.abs(change),
    direction: change >= 0 ? "up" : "down",
    formatted: `${Math.abs(change).toFixed(1)}%`,
  }
}

export const calculateComparisons = periods => {
  const base = periods.find(p => p.isBase)
  if (!base?.stats) return periods

  return periods.map(period => {
    if (period.isBase || !period.stats) return period

    return {
      ...period,
      changes: {
        min: calculatePercentageChange(period.stats.min, base.stats.min),
        avg: calculatePercentageChange(period.stats.avg, base.stats.avg),
        max: calculatePercentageChange(period.stats.max, base.stats.max),
        points: calculatePercentageChange(period.stats.points, base.stats.points),
        dimensions: calculatePercentageChange(period.stats.dimensions, base.stats.dimensions),
        median: calculatePercentageChange(period.stats.median, base.stats.median),
        stddev: calculatePercentageChange(period.stats.stddev, base.stats.stddev),
        p95: calculatePercentageChange(period.stats.p95, base.stats.p95),
        range: calculatePercentageChange(period.stats.range, base.stats.range),
        volume: calculatePercentageChange(period.stats.volume, base.stats.volume),
        count: calculatePercentageChange(period.stats.count, base.stats.count),
      },
    }
  })
}
