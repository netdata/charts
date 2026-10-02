import { useEffect } from "react"
import { useAttributeValue, useChart } from "@/components/provider"
import { pickLegend } from "@/components/modern/tokens"

export const legendModes = ["below", "direct", "live", "table", "hidden"]

export const maxLabelledSeries = 8

const directChartTypes = { line: true, area: true }
const labelledModes = { direct: true, live: true }

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
  if (labelledModes[mode] && visibleCount > maxLabelledSeries) mode = "table"
  if (labelledModes[mode] && (!directChartTypes[chartType] || !canPlaceDirect)) mode = "below"
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
