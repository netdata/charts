import { useChart, useForceUpdate, useImmediateListener } from "@/components/provider"

const RESET_DEFAULTS = {
  chartType: "line",
  chartLibrary: "dygraph",
  groupingMethod: "average",
  enabledYAxis: true,
  enabledXAxis: true,
  legend: true,
  chartLegendLayout: null,
  staticValueRange: null,
  desiredUnits: ["auto"],
  staticFractionDigits: null,
  points: null,
  nulls2zero: false,
  gaugeThresholds: null,
}

const FETCH_KEYS = new Set(["points", "nulls2zero", "groupingMethod"])

const timeSeriesRenderers = new Set(["dygraph", "uplot"])

const getTarget = (pristine, key) => (key in pristine ? pristine[key] : RESET_DEFAULTS[key])

const comparable = (key, value) => {
  if (key === "chartType") return value || RESET_DEFAULTS.chartType
  if (key === "chartLibrary" && timeSeriesRenderers.has(value)) return "timeseries"
  return value
}

export const useIsPristine = resetKeys => {
  const chart = useChart()
  const forceUpdate = useForceUpdate()

  useImmediateListener(
    () => chart.onAttributesChange(["pristine", ...resetKeys], forceUpdate),
    [chart, resetKeys.join(",")]
  )

  const pristine = chart.getAttribute("pristine") || {}

  return resetKeys.every(
    key =>
      JSON.stringify(comparable(key, chart.getAttribute(key))) ===
      JSON.stringify(comparable(key, getTarget(pristine, key)))
  )
}

export const resetSettings = (chart, resetKeys) => {
  const pristine = chart.getAttribute("pristine") || {}
  const targets = {}
  resetKeys.forEach(key => {
    targets[key] = getTarget(pristine, key)
  })

  const hasChartTypeReset = "chartType" in targets || "chartLibrary" in targets
  let triggerFetch = false
  let triggerYAxis = false
  const plainUpdates = {}

  resetKeys.forEach(key => {
    if (key === "chartType" || key === "chartLibrary") return
    plainUpdates[key] = targets[key]
    if (FETCH_KEYS.has(key)) triggerFetch = true
    else triggerYAxis = true
  })

  if (Object.keys(plainUpdates).length) chart.updateAttributes(plainUpdates)
  if (triggerYAxis) chart.trigger("yAxisChange")
  if (triggerFetch) chart.trigger("fetch", { processing: true })

  if (hasChartTypeReset) {
    const library =
      "chartLibrary" in targets ? targets.chartLibrary : chart.getAttribute("chartLibrary")
    const type = "chartType" in targets ? targets.chartType : chart.getAttribute("chartType")
    const selected = timeSeriesRenderers.has(library) ? type || RESET_DEFAULTS.chartType : library
    chart.updateChartTypeAttribute(selected)
  }
}
