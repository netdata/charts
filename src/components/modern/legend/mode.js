import { useEffect } from "react"
import { useAttributeValue, useChart } from "@/components/provider"
import { pickLegend } from "@/components/modern/tokens"

export const legendModes = ["below", "direct", "live", "table", "hidden"]

// line-end labels stop being readable past this many series, and each one is a DOM row
export const maxLabelledSeries = 8

const directChartTypes = { line: true, area: true }
const labelledModes = { direct: true, live: true }

// direct labels sit at each line's last point, which only exists for unstacked lines that the
// renderer can map to a y pixel; everything else falls back to the one-line legend. "auto" and
// unknown layouts follow pickLegend
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

// Written by the modern line body; unset means no modern body measured the card, so the hover
// tooltip stays on as the only readout
export const useLegendMode = () => useAttributeValue("legendMode") || "hidden"

export const focusDimension = (chart, id) => {
  if ((chart.getAttribute("focusedDimensionId") || null) === (id || null)) return

  chart.updateAttribute("focusedDimensionId", id)
}

// an entry can unmount under the pointer (toggle, re-sort, resize) without a mouseleave
export const useClearFocusOnUnmount = () => {
  const chart = useChart()

  useEffect(() => () => focusDimension(chart, null), [chart])
}
