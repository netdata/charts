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
  Array.isArray(ids) && ids.every(id => id.match(regex)) ? "heatmap" : chartType

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
  const max = chart.getAttribute("max")
  const colors = getColors(opacity)
  const step = max / (colors.length - 1)
  const getLinearColor = scaleLinear()
    .domain(Array.from({ length: colors.length - 1 }, (_, i) => i * step))
    .range(colors)

  return value => (!value ? "transparent" : getLinearColor(value))
}

export const useGetColor = (opacity = 1) => {
  const chart = useChart()

  return useMemo(() => makeGetColor(chart, opacity), [opacity])
}

export const withoutPrefix = label =>
  label ? label.replace(/.+_(\d+?\.?(\d+)?|\+[Ii]nf)$/, "$1") : label
