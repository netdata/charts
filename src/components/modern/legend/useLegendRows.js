import { useRef } from "react"
import { convert, useChart, useForceUpdate, useImmediateListener } from "@/components/provider"
import { unregister } from "@/helpers/makeListeners"
import { isIncremental } from "@/helpers/heatmap"
import { formatReadout, formatReadoutUnit } from "@/components/modern/format"

const isNumber = value => typeof value === "number" && isFinite(value)

export const getReadoutIndex = chart => {
  const { all } = chart.getPayload()
  if (!all?.length) return { index: -1, hovering: false }

  const hover = chart.getAttribute("hoverX")
  const closest = hover ? chart.getClosestRow(hover[0]) : -1

  return closest === -1
    ? { index: all.length - 1, hovering: false }
    : { index: closest, hovering: true }
}

const scanWindow = (chart, id, data) => {
  let sum = 0
  let count = 0
  let max = -Infinity

  for (let i = 0; i < data.length; i++) {
    const value = chart.getRowDimensionValue(id, data[i], { abs: false, allowNull: true })
    if (!isNumber(value)) continue

    sum += value
    count += 1
    if (value > max) max = value
  }

  return count ? { mean: sum / count, max } : { mean: null, max: null }
}

export const getWindowStats = chart => {
  const { data } = chart.getPayload()
  const sts = isIncremental(chart) ? null : chart.getAttribute("viewDimensions")?.sts

  return chart.getDimensionIds().reduce((acc, id) => {
    const index = chart.getDimensionIndex(id)
    const mean = sts?.avg?.[index]
    const max = sts?.max?.[index]

    acc[id] = isNumber(mean) && isNumber(max) ? { mean, max } : scanWindow(chart, id, data || [])
    return acc
  }, {})
}

const hasFlags = flags => !!flags && typeof flags === "object" && Object.keys(flags).length > 0

const formatStats = (chart, id, windowStats) =>
  windowStats
    ? {
        mean: formatReadout(chart, windowStats.mean, { dimensionId: id }),
        meanUnit: formatReadoutUnit(chart, windowStats.mean, { dimensionId: id }),
        max: formatReadout(chart, windowStats.max, { dimensionId: id }),
        maxUnit: formatReadoutUnit(chart, windowStats.max, { dimensionId: id }),
      }
    : { mean: "-", meanUnit: "", max: "-", maxUnit: "" }

export const makeRow = (chart, id, index, stats, formatted) => {
  const value =
    index === -1 ? null : chart.getDimensionValue(id, index, { abs: false, allowNull: true })
  const arp = index === -1 ? null : chart.getDimensionValue(id, index, { valueKey: "arp" })
  const pa = index === -1 ? null : chart.getDimensionValue(id, index, { valueKey: "pa" })
  const flags = pa ? convert(chart, pa, { valueKey: "pa" }) : null

  let summary = formatted?.get(id)
  if (!summary) {
    summary = formatStats(chart, id, stats?.[id])
    if (formatted) formatted.set(id, summary)
  }

  return {
    id,
    name: chart.getDimensionName(id) || id,
    color: chart.selectDimensionColor(id),
    visible: chart.isDimensionVisible(id),
    value,
    display: formatReadout(chart, value, { dimensionId: id }),
    unit: formatReadoutUnit(chart, value, { dimensionId: id }),
    arp: isNumber(arp) ? arp : 0,
    anomaly: isNumber(arp) && arp > 0 ? `${convert(chart, arp, { valueKey: "arp" })}%` : "",
    flags: hasFlags(flags) ? flags : null,
    mean: summary.mean,
    meanUnit: summary.meanUnit,
    max: summary.max,
    maxUnit: summary.maxUnit,
  }
}

const events = ["dimensionChanged", "visibleDimensionsChanged", "payloadChanged", "successFetch"]
const attributes = [
  "hoverX",
  "selectedLegendDimensions",
  "unitsConversionPrefix",
  "unitsConversionBase",
  "unitsByDimension",
  "viewDimensions",
  "theme",
]

const cacheAttributes = [
  "unitsConversionPrefix",
  "unitsConversionBase",
  "unitsByDimension",
  "staticFractionDigits",
  "viewDimensions",
]

const sameKey = (a, b) => !!a && a.length === b.length && a.every((value, i) => value === b[i])

export const useLegendRows = ({ withStats = false, withRows = true } = {}) => {
  const chart = useChart()
  const forceUpdate = useForceUpdate()
  const cache = useRef({ key: null, stats: null, formatted: null })

  useImmediateListener(
    () =>
      unregister(
        ...events.map(name => chart.on(name, forceUpdate)),
        ...attributes.map(name => chart.onAttributeChange(name, forceUpdate))
      ),
    [chart]
  )

  const ids = chart.getDimensionIds() || []
  const { index, hovering } = getReadoutIndex(chart)
  const payload = chart.getPayload()

  const key = [payload, ids, withStats, ...cacheAttributes.map(name => chart.getAttribute(name))]
  if (!sameKey(cache.current.key, key)) {
    cache.current = { key, stats: withStats ? getWindowStats(chart) : null, formatted: new Map() }
  }
  const { stats, formatted } = cache.current

  const timestamp = index === -1 ? null : payload.all[index]?.[0]
  const getRow = id => makeRow(chart, id, index, stats, formatted)

  return {
    ids,
    rows: withRows ? ids.map(getRow) : [],
    getRow,
    stats,
    index,
    hovering,
    timestamp,
  }
}
