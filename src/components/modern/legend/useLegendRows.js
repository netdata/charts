import { useRef } from "react"
import { convert, useChart, useForceUpdate, useImmediateListener } from "@/components/provider"
import { unregister } from "@/helpers/makeListeners"
import { isIncremental } from "@/helpers/heatmap"

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

// the query already returns per-dimension window stats; scanning the rows is the fallback for
// payloads without them and for incremental (heatmap) charts whose stats are cumulative
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

export const makeRow = (chart, id, index, stats) => {
  const value =
    index === -1 ? null : chart.getDimensionValue(id, index, { abs: false, allowNull: true })
  const arp = index === -1 ? null : chart.getDimensionValue(id, index, { valueKey: "arp" })
  const pa = index === -1 ? null : chart.getDimensionValue(id, index, { valueKey: "pa" })
  const flags = pa ? convert(chart, pa, { valueKey: "pa" }) : null
  const windowStats = stats?.[id]

  return {
    id,
    name: chart.getDimensionName(id) || id,
    color: chart.selectDimensionColor(id),
    visible: chart.isDimensionVisible(id),
    value,
    display: convert(chart, value, { dimensionId: id }),
    unit: chart.getUnitSign({ dimensionId: id }),
    arp: isNumber(arp) ? arp : 0,
    anomaly: isNumber(arp) && arp > 0 ? `${convert(chart, arp, { valueKey: "arp" })}%` : "",
    flags: hasFlags(flags) ? flags : null,
    mean: windowStats ? convert(chart, windowStats.mean, { dimensionId: id }) : "-",
    max: windowStats ? convert(chart, windowStats.max, { dimensionId: id }) : "-",
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

// One subscription for the whole legend: per-dimension hooks would each re-read the payload on
// every hover move, and the window stats only change with the payload
export const useLegendRows = ({ withStats = false, withRows = true } = {}) => {
  const chart = useChart()
  const forceUpdate = useForceUpdate()
  const cache = useRef({ payload: null, ids: null, stats: null })

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

  let stats = null
  if (withStats) {
    const payload = chart.getPayload()
    if (cache.current.payload !== payload || cache.current.ids !== ids) {
      cache.current = { payload, ids, stats: getWindowStats(chart) }
    }
    stats = cache.current.stats
  }

  const timestamp = index === -1 ? null : chart.getPayload().all[index]?.[0]

  return {
    rows: withRows ? ids.map(id => makeRow(chart, id, index, stats)) : [],
    index,
    hovering,
    timestamp,
  }
}
