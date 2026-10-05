export const resolveTimeSeriesRenderer = chart => {
  const wanted =
    chart.getAttribute("timeSeriesRenderer") ??
    chart.sdk?.getRoot?.()?.getAttribute("timeSeriesRenderer")
  const chartLibrary = chart.getAttribute("chartLibrary")

  if (wanted === "uplot" && chartLibrary === "dygraph") return "uplot"
  if (wanted !== "uplot" && chartLibrary === "uplot" && chart.getAttribute("rendererOverridden"))
    return "dygraph"

  return null
}

export const applyTimeSeriesRenderer = chart => {
  const next = resolveTimeSeriesRenderer(chart)
  if (!next) return false

  chart.updateAttributes({ chartLibrary: next, rendererOverridden: next === "uplot" })
  return true
}

export default chart => {
  const offChart = chart.onAttributeChange("timeSeriesRenderer", () => {
    const ui = chart.getUI()
    if (!applyTimeSeriesRenderer(chart) || !ui) return

    ui.unmount()
    chart.setUI({ ...chart.sdk.makeChartUI(chart), ...(chart.ui || {}) }, "default")
  })

  const root = chart.sdk?.getRoot?.()
  const offRoot =
    root && root !== chart
      ? root.onAttributeChange("timeSeriesRenderer", (next, prev) => {
          if ((chart.getAttribute("timeSeriesRenderer") ?? null) === (prev ?? null))
            chart.updateAttribute("timeSeriesRenderer", next)
        })
      : null

  return () => {
    offChart()
    if (offRoot) offRoot()
  }
}
