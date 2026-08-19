import {
  getLegacyRenderer,
  inferVisualization,
  isTimeSeriesVisualization,
} from "./metadata"

const errorMessage = error => {
  if (!error) return null
  return error instanceof Error ? error.message : String(error)
}

export default (chart, getChartInstance = () => chart) => {
  let activeVisualization = inferVisualization(chart.getAttributes())
  let requestedRenderer = null
  let activeRenderer = null
  let fallbackReason = null

  const resolveRenderer = (
    renderer,
    visualization,
    legacyRenderer,
    visited = new Set()
  ) => {
    if (!renderer || visited.has(renderer)) return legacyRenderer
    visited.add(renderer)

    const makeRenderer = chart.sdk.ui[renderer]
    if (
      makeRenderer &&
      makeRenderer.isSupported?.(chart.sdk, visualization, chart) !== false
    )
      return renderer

    return resolveRenderer(
      makeRenderer?.fallbackRenderer || legacyRenderer,
      visualization,
      legacyRenderer,
      visited
    )
  }

  const selectRenderer = visualization => {
    const legacyRenderer = getLegacyRenderer(visualization)
    const preferredRenderer =
      chart.sdk.getPreferredRenderer?.(chart, visualization) || legacyRenderer

    return {
      requested: preferredRenderer,
      active: resolveRenderer(
        preferredRenderer,
        visualization,
        legacyRenderer
      ),
    }
  }

  const getVisualizationType = () =>
    activeVisualization || inferVisualization(chart.getAttributes())

  const initializeRenderer = () => {
    const visualization = getVisualizationType()
    if (!visualization) {
      requestedRenderer = chart.getAttribute("chartLibrary")
      activeRenderer = requestedRenderer
      return activeRenderer
    }

    activeVisualization = visualization
    const selected = selectRenderer(visualization)
    requestedRenderer = selected.requested
    activeRenderer = selected.active
    return activeRenderer
  }

  const getActiveRenderer = () => activeRenderer || initializeRenderer()

  const getRendererForVisualization = visualization =>
    selectRenderer(visualization).active

  const getRendererState = () => {
    const active = getActiveRenderer()
    return {
      visualization: getVisualizationType(),
      requested: requestedRenderer,
      active,
      fallbackReason,
    }
  }

  const replaceChartUI = () => {
    if (!chart.getUI()) return false
    const chartInstance = getChartInstance()
    chart.replaceUI(
      { ...chart.sdk.makeChartUI(chartInstance), ...(chart.ui || {}) },
      "default"
    )
    return true
  }

  const reconcileRenderer = visualization => {
    const previousVisualization = getVisualizationType()
    const previousRenderer = getActiveRenderer()
    const inferred =
      visualization ||
      inferVisualization(chart.getAttributes()) ||
      previousVisualization

    if (!inferred) return false

    const selected = selectRenderer(inferred)
    activeVisualization = inferred
    requestedRenderer = selected.requested
    activeRenderer = selected.active
    fallbackReason = null

    if (
      previousVisualization === activeVisualization &&
      previousRenderer === activeRenderer
    )
      return false

    replaceChartUI()
    return true
  }

  const fallbackRenderer = (failedRenderer, requestedFallback, error) => {
    if (getActiveRenderer() !== failedRenderer) return false

    const visualization = getVisualizationType()
    const legacyRenderer = getLegacyRenderer(visualization)
    const nextRenderer = resolveRenderer(
      requestedFallback || legacyRenderer,
      visualization,
      legacyRenderer
    )
    if (nextRenderer === failedRenderer || !(nextRenderer in chart.sdk.ui))
      return false

    activeRenderer = nextRenderer
    fallbackReason = errorMessage(error) || `${failedRenderer} failed`
    replaceChartUI()
    return true
  }

  return {
    fallbackRenderer,
    getActiveRenderer,
    getRendererForChartType: getRendererForVisualization,
    getRendererForVisualization,
    getRendererState,
    getVisualizationType,
    isTimeSeriesVisualization: () =>
      isTimeSeriesVisualization(getVisualizationType()),
    reconcileRenderer,
  }
}
