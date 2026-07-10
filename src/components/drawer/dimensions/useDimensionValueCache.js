import { useMemo, useReducer } from "react"
import { calculateMedian, calculatePercentile, calculateStdDev } from "@/helpers/statistics"
import { isIncremental } from "@/helpers/heatmap"
import {
  useAttributeValue,
  useChart,
  useImmediateListener,
  usePayload,
} from "@/components/provider"
import { getPointValue } from "@/sdk/makeChart/getPointValue"

const nextVersion = version => version + 1

const advancedStatKeys = new Set(["median", "stddev", "p95", "range", "volume"])
const responseStatKeys = new Set(["min", "avg", "max", "arp"])

const isValidNumber = value => value !== null && !isNaN(value) && isFinite(value)

const getVisibleDimensionId = (chart, id) =>
  chart.isDimensionVisible(id) ? id : chart.getVisibleDimensionIds()[0]

const getViewStatValue = (chart, id, key, { abs, period }) => {
  if (period !== "window" || isIncremental(chart)) return undefined

  const visibleId = getVisibleDimensionId(chart, id)
  if (!visibleId) return undefined

  const dimensionIndex = chart.getDimensionIndex(visibleId)
  if (typeof dimensionIndex !== "number") return undefined

  const stats = chart.getAttribute("viewDimensions")?.sts
  if (!stats) return undefined

  if (key === "range") {
    const min = stats.min?.[dimensionIndex]
    const max = stats.max?.[dimensionIndex]

    if (!isValidNumber(min) || !isValidNumber(max)) return undefined
    if (abs && (min < 0 || max < 0)) return undefined

    return max - min
  }

  if (!responseStatKeys.has(key)) return undefined

  const value = stats[key]?.[dimensionIndex]
  if (!isValidNumber(value)) return undefined

  if (key !== "arp" && abs) {
    const min = stats.min?.[dimensionIndex]
    const max = stats.max?.[dimensionIndex]

    if ((isValidNumber(min) && min < 0) || (isValidNumber(max) && max < 0)) return undefined
  }

  return value
}

const getDirectRowDimensionValue = (
  chart,
  id,
  row,
  { dimensionIndex, valueKey = "value", abs = true, allowNull = false }
) => {
  if (dimensionIndex === undefined || isIncremental(chart)) {
    return chart.getRowDimensionValue(id, row, { valueKey, abs, allowNull })
  }

  let value = getPointValue(row?.[dimensionIndex + 1], chart.getPayload().point, valueKey)
  if (typeof value === "undefined") return null

  value = allowNull && value === null ? value : abs ? Math.abs(value) : value

  return value
}

const getPeriodRows = (chart, payload, period) => {
  const data = payload?.data || []
  if (!data.length) return null

  if (period !== "highlight") return data

  const { highlight } = chart.getAttribute("overlays")
  if (!highlight?.range) return null

  const [start, end] = highlight.range

  return data.filter(row => {
    const timestamp = row[0] / 1000
    return timestamp >= start && timestamp <= end
  })
}

const calculateDimensionStats = (chart, id, rows, { abs, includeAdvancedStats, requestedKey }) => {
  if (!rows?.length) return null

  id = getVisibleDimensionId(chart, id)
  if (!id) return null

  const dimensionIndex = chart.getDimensionIndex(id)
  const includeAdvanced = includeAdvancedStats || advancedStatKeys.has(requestedKey)
  const values = includeAdvanced ? [] : null
  let count = 0
  let sum = 0
  let min = Infinity
  let max = -Infinity
  let volume = 0

  for (let i = 0; i < rows.length; i++) {
    const value = getDirectRowDimensionValue(chart, id, rows[i], {
      dimensionIndex,
      abs,
      allowNull: true,
    })

    if (!isValidNumber(value)) continue

    count++
    sum += value
    volume += Math.abs(value)
    if (value < min) min = value
    if (value > max) max = value
    if (values) values.push(value)
  }

  if (!count) return null

  const avg = sum / count
  const stats = {
    min,
    avg,
    max,
    arp: 0,
  }

  if (!includeAdvanced) return stats

  return {
    ...stats,
    median: calculateMedian(values),
    stddev: calculateStdDev(values, avg),
    p95: calculatePercentile(values, 95),
    range: max - min,
    volume,
  }
}

const getLatestIndex = (chart, payload) => {
  const all = payload?.all || []
  if (!all.length) return -1

  const hover = chart.getAttribute("hoverX")
  const index = hover ? chart.getClosestRow(hover[0]) : -1

  return index === -1 ? all.length - 1 : index
}

export const createDimensionValueCache = (
  chart,
  { payload = chart.getPayload(), period = "window", includeAdvancedStats = false } = {}
) => {
  const latestValues = new Map()
  const statsById = new Map()
  const rows = getPeriodRows(chart, payload, period)
  const abs = chart.getAttribute("abs")
  const latestIndex = getLatestIndex(chart, payload)

  const getLatestValue = (id, valueKey) => {
    const key = `${id}\u0000${valueKey}`
    if (latestValues.has(key)) return latestValues.get(key)

    const visibleId = getVisibleDimensionId(chart, id)
    const dimensionIndex = visibleId ? chart.getDimensionIndex(visibleId) : undefined
    const value =
      latestIndex === -1 || !visibleId
        ? null
        : getDirectRowDimensionValue(chart, visibleId, payload?.all?.[latestIndex], {
            dimensionIndex,
            valueKey,
            abs,
            allowNull: true,
          })

    latestValues.set(key, value)

    return value
  }

  const getStats = (id, requestedKey) => {
    const cached = statsById.get(id)
    const needsAdvanced = includeAdvancedStats || advancedStatKeys.has(requestedKey)

    if (cached?.stats && Object.prototype.hasOwnProperty.call(cached.stats, requestedKey)) {
      return cached.stats
    }

    const responseStat = getViewStatValue(chart, id, requestedKey, { abs, period })

    if (typeof responseStat !== "undefined") {
      const stats = {
        ...(cached?.stats || {}),
        [requestedKey]: responseStat,
      }

      statsById.set(id, {
        includeAdvanced: cached?.includeAdvanced || false,
        stats,
      })

      return stats
    }

    if (cached && (!needsAdvanced || cached.includeAdvanced)) return cached.stats

    const stats = calculateDimensionStats(chart, id, rows, {
      abs,
      includeAdvancedStats,
      requestedKey,
    })

    statsById.set(id, {
      includeAdvanced: needsAdvanced,
      stats,
    })

    return stats
  }

  return {
    get: (id, valueKey = "value", { period: valuePeriod = period } = {}) => {
      if (valuePeriod === "latest") return getLatestValue(id, valueKey)

      return getStats(id, valueKey)?.[valueKey] ?? null
    },
  }
}

const useVisibleDimensionsVersion = chart => {
  const [version, bumpVersion] = useReducer(nextVersion, 0)

  useImmediateListener(() => chart.on("visibleDimensionsChanged", bumpVersion), [chart])

  return version
}

const useDimensionValueCache = (period, { includeAdvancedStats = false } = {}) => {
  const chart = useChart()
  const payload = usePayload()
  const hover = useAttributeValue("hoverX")
  const overlays = useAttributeValue("overlays")
  const abs = useAttributeValue("abs")
  const visibleDimensionsVersion = useVisibleDimensionsVersion(chart)

  return useMemo(
    () => createDimensionValueCache(chart, { payload, period, includeAdvancedStats }),
    [chart, payload, period, includeAdvancedStats, hover, overlays, abs, visibleDimensionsVersion]
  )
}

export default useDimensionValueCache
