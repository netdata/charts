import { useMemo } from "react"
import { scaleLinear } from "d3-scale"
import { useChart, useAttributeValue } from "@/components/provider"

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

const regex = /(.+)_(\d+?\.?(\d+)?|\+[Ii]nf)$/

export const heatmapOrChartType = (ids, chartType) =>
  Array.isArray(ids) && ids.length && ids.every(id => id.match(regex)) ? "heatmap" : chartType

const getColors = opacity => [
  `rgba(62, 73, 137, ${opacity})`,
  `rgba(49, 104, 142, ${opacity})`,
  `rgba(38, 130, 142, ${opacity})`,
  `rgba(31, 158, 137, ${opacity})`,
  `rgba(53, 183, 121, ${opacity})`,
  `rgba(110, 206, 88, ${opacity})`,
  `rgba(181, 222, 43, ${opacity})`,
  `rgba(253, 231, 37, ${opacity})`,
]

export const makeGetColor = (chart, opacity = 1) => {
  const max = Number(chart.getAttribute("max"))
  const colors = getColors(opacity)

  if (!Number.isFinite(max) || max <= 0) {
    return value => (value == null || value === 0 ? "transparent" : colors[0])
  }

  const step = max / (colors.length - 1)
  const getLinearColor = scaleLinear()
    .domain(Array.from({ length: colors.length - 1 }, (_, i) => i * step))
    .range(colors)

  return value => (value == null || value === 0 ? "transparent" : getLinearColor(value))
}

export const useGetColor = (opacity = 1) => {
  const chart = useChart()

  return useMemo(() => makeGetColor(chart, opacity), [opacity])
}

export const withoutPrefix = label =>
  label ? label.replace(/.+_(\d+?\.?(\d+)?|\+[Ii]nf)$/, "$1") : label

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
