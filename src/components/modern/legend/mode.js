import { useEffect } from "react"
import { useAttributeValue, useChart } from "@/components/provider"
import { pickLegend } from "@/components/modern/tokens"

export const legendModes = ["below", "direct", "live", "table", "hidden"]

export const maxLabelledSeries = 8

export const getLegendLayout = (legendLayout, chartLegendLayout) =>
  legendModes.includes(legendLayout) ? legendLayout : chartLegendLayout

const directChartTypes = { line: true, area: true }
const labelledModes = { direct: true, live: true }

export const placeableLibraries = { dygraph: true, uplot: true }

export const tooManyToLabel = visibleCount => visibleCount > maxLabelledSeries

export const canPlaceLabels = ({ chartType = "line", canPlaceDirect = true }) =>
  !!directChartTypes[chartType] && canPlaceDirect

export const canShowLabels = ({ chartType, visibleCount, canPlaceDirect }) =>
  !tooManyToLabel(visibleCount) && canPlaceLabels({ chartType, canPlaceDirect })

export const resolveLegendMode = ({
  width,
  count,
  visibleCount = count,
  legendLayout,
  legend = true,
  sparkline = false,
  hasFooter = true,
  heatmap = false,
  chartType = "line",
  canPlaceDirect = true,
}) => {
  if (!legend || sparkline) return "hidden"

  let mode = legendModes.includes(legendLayout) ? legendLayout : pickLegend({ width, count })

  if (heatmap && mode !== "hidden") mode = "below"
  if (labelledModes[mode] && tooManyToLabel(visibleCount)) mode = "table"
  if (labelledModes[mode] && !canPlaceLabels({ chartType, canPlaceDirect })) mode = "below"
  if (mode === "below" && !hasFooter) mode = "hidden"

  return mode
}

export const useLegendMode = () => useAttributeValue("legendMode") || "hidden"

export const focusDimension = (chart, id) => {
  if ((chart.getAttribute("focusedDimensionId") || null) === (id || null)) return

  chart.updateAttribute("focusedDimensionId", id)
}

export const useClearFocusOnUnmount = () => {
  const chart = useChart()

  useEffect(() => () => focusDimension(chart, null), [chart])
}
