import { useMemo } from "react"
import { scaleLinear } from "d3-scale"
import { color as parseColor } from "d3"
import { useChart, useAttributeValue, usePayload } from "@/components/provider"
import isInXRange from "@/helpers/isInXRange"

export const heatmapTypes = {
  default: "default",
  disabled: "disabled",
  incremental: "incremental",
}

export const isHeatmap = chart =>
  (!chart || typeof chart === "string" ? chart : chart.getAttribute("chartType")) === "heatmap"

export const useIsHeatmap = () => useAttributeValue("chartType") === "heatmap"

export const isIncremental = chart =>
  isHeatmap(chart) && chart.getAttribute("heatmapType") === heatmapTypes.incremental

export const getHeatmapRowsRange = count => [-0.5, Math.max(count, 1) - 0.5]

export const snapHeatmapRange = ([min, max], count) => {
  const top = Math.max(count, 1) - 0.5
  const low = Math.min(Math.max(Math.floor(min + 0.5) - 0.5, -0.5), top - 1)
  const high = Math.max(Math.min(Math.ceil(max - 0.5) + 0.5, top), low + 1)

  return [low, high]
}

export const getHeatmapLabelOffset = chart => (chart.getHeatmapSortedIds?.() ? 0.5 : 0)

export const fitHeatmapGap = (size, gap) => (size >= 2 * gap + 1 ? gap : 0)

export const findHeatmapCell = (chart, x, id, getXRange) => {
  if (x == null) return null

  const step = chart.getAttribute("viewUpdateEvery")
  if (!isInXRange(x, getXRange(), step)) return null

  const yIndex = chart.getHeatmapYIndex(id)
  if (yIndex === -1) return null

  const row = chart.getClosestRow(x)
  const rowX = row === -1 ? null : chart.getPayload().data[row]?.[0]
  if (rowX == null || Math.abs(rowX - x) > ((step || 1) * 1000) / 2) return null

  return { row, yIndex }
}

export const getMarkedHeatmapCell = (chart, getXRange) => {
  const marked = chart.getAttribute("heatmapMarkedCell")
  return marked ? findHeatmapCell(chart, marked.x, marked.id, getXRange) : null
}

const regex = /(.+)_(-?\d+?\.?(\d+)?|\+[Ii]nf)$/

export const heatmapOrChartType = (ids, chartType) =>
  Array.isArray(ids) && ids.length && ids.every(id => id.match(regex)) ? "heatmap" : chartType

export const heatmapDefaultPalette = [
  "rgb(62, 73, 137)",
  "rgb(49, 104, 142)",
  "rgb(38, 130, 142)",
  "rgb(31, 158, 137)",
  "rgb(53, 183, 121)",
  "rgb(110, 206, 88)",
  "rgb(181, 222, 43)",
  "rgb(253, 231, 37)",
]

export const getHeatmapPalette = chart => {
  const palette = chart.getAttribute("heatmapPalette")
  const colors = Array.isArray(palette)
    ? palette
    : palette?.[chart.getAttribute("theme")] || palette?.default
  const valid = Array.isArray(colors)
    ? colors.filter(value => typeof value === "string" && !!parseColor(value))
    : []

  return valid.length > 1 ? valid : heatmapDefaultPalette
}

export const isLogColorScale = chart => chart.getAttribute("heatmapColorScale") === "log"

const withOpacity = (value, opacity) => {
  const parsed = parseColor(value)
  if (!parsed) return value

  parsed.opacity = opacity
  return parsed.formatRgb()
}

export const getHeatmapMax = chart => {
  const max = Number(chart.getAttribute("max"))
  if (Number.isFinite(max) && max > 0) return max

  const { byDimension = {} } = chart.getPayload() || {}
  return Object.values(byDimension).reduce(
    (largest, stats) => (Number.isFinite(stats?.max) && stats.max > largest ? stats.max : largest),
    0
  )
}

export const makeGetColor = (chart, opacity = 1) => {
  const max = getHeatmapMax(chart)
  const colors = getHeatmapPalette(chart).map(value => withOpacity(value, opacity))

  if (!Number.isFinite(max) || max <= 0) {
    return value => (value == null || value === 0 ? "transparent" : colors[0])
  }

  const position = isLogColorScale(chart)
    ? value => Math.log10(Math.max(value, 0) + 1) / Math.log10(max + 1)
    : value => value / max
  const getScaleColor = scaleLinear()
    .domain(colors.map((_, index) => index / (colors.length - 1)))
    .range(colors)
    .clamp(true)

  return value => (value == null || value === 0 ? "transparent" : getScaleColor(position(value)))
}

export const useGetColor = (opacity = 1) => {
  const chart = useChart()
  const payload = usePayload()
  const max = useAttributeValue("max")
  const palette = useAttributeValue("heatmapPalette")
  const colorScale = useAttributeValue("heatmapColorScale")
  const theme = useAttributeValue("theme")

  return useMemo(
    () => makeGetColor(chart, opacity),
    [chart, opacity, payload, max, palette, colorScale, theme]
  )
}

export const withoutPrefix = label =>
  label ? label.replace(/.+_(-?\d+?\.?(\d+)?|\+[Ii]nf)$/, "$1") : label

export const cropHeatmapZeroEdges = (ids, isZeroOnly, minVisible = 5) => {
  if (!Array.isArray(ids) || typeof isZeroOnly !== "function" || ids.length <= minVisible)
    return ids

  const zeroOnly = ids.map(isZeroOnly)
  const firstNonZero = zeroOnly.findIndex(isZero => !isZero)

  if (firstNonZero === -1) return ids

  let lastNonZero = zeroOnly.length - 1
  while (lastNonZero >= 0 && zeroOnly[lastNonZero]) lastNonZero--

  let first = firstNonZero > 0 ? firstNonZero - 1 : firstNonZero
  let last = lastNonZero < ids.length - 1 ? lastNonZero + 1 : lastNonZero
  const targetLength = Math.min(minVisible, ids.length)

  while (last - first + 1 < targetLength) {
    const bottomDistance = firstNonZero - first
    const topDistance = last - lastNonZero

    if (first > 0 && (last === ids.length - 1 || bottomDistance <= topDistance)) {
      first--
    } else if (last < ids.length - 1) {
      last++
    } else {
      break
    }
  }

  return ids.slice(first, last + 1)
}
