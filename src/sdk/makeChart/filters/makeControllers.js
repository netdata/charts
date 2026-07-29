import deepEqual from "@/helpers/deepEqual"
import pristine, { pristineKey } from "@/sdk/pristine"
import getInitialFilterAttributes from "./getInitialAttributes"
import { isHeatmap } from "@/helpers/heatmap"
import makeLog from "@/sdk/makeLog"

export default (chart, getChartInstance = () => chart) => {
  const log = ({ value, ...rest }) =>
    makeLog(chart)({
      ...rest,
      value: value && typeof value !== "string" ? JSON.stringify(value) : value,
    })

  const allowedGroupByValues = {
    node: true,
    instance: true,
    dimension: true,
    "percentage-of-instance": true,
    selected: true,
  }

  const baseUpdateGroupBy = (
    selected,
    {
      groupByKey = "groupBy",
      groupByLabelKey = "groupByLabel",
      fallbackGroupBy = ["dimension"],
      dataKey = null,
      loadingKey = null,
    }
  ) => {
    const selectedLabels = selected.filter(sel => sel.isLabel)
    const groupByLabel = selectedLabels.map(sel => sel.value)

    let groupBy = selected.reduce((h, sel) => {
      if (!allowedGroupByValues[sel.value]) return h
      h.push(sel.value)
      return h
    }, [])

    if (selectedLabels.length) groupBy.push("label")

    if (!groupBy.length) groupBy = fallbackGroupBy

    if (
      deepEqual(groupBy, chart.getAttribute(groupByKey)) &&
      deepEqual(groupByLabel, chart.getAttribute(groupByLabelKey))
    )
      return false

    const updates = {
      [groupByLabelKey]: groupByLabel,
      [groupByKey]: groupBy,
      processing: true,
    }

    if (dataKey) updates[dataKey] = null
    if (loadingKey) updates[loadingKey] = true

    chart.updateAttributes(updates)
    return true
  }

  const updateGroupByAttribute = selected => {
    const changed = baseUpdateGroupBy(selected, {})
    if (!changed) return

    chart.updateAttribute("selectedLegendDimensions", [])
    chart.updateAttributes(getInitialFilterAttributes(chart))
    chart.fetch({ processing: true })

    log({
      chartAction: "chart-groupby-change",
      value: selected,
    })
  }

  const updatePostGroupByAttribute = selected => {
    const selectedLabels = selected.filter(sel => sel.isLabel)
    const groupByLabel = selectedLabels.map(sel => sel.value)

    let groupBy = selected.reduce((h, sel) => {
      if (!allowedGroupByValues[sel.value]) return h
      h.push(sel.value)
      return h
    }, [])

    if (selectedLabels.length) groupBy.push("label")

    if (
      deepEqual(groupBy, chart.getAttribute("postGroupBy")) &&
      deepEqual(groupByLabel, chart.getAttribute("postGroupByLabel"))
    )
      return

    chart.updateAttributes({
      postGroupByLabel: groupByLabel,
      postGroupBy: groupBy,
      processing: true,
    })

    chart.updateAttributes(getInitialFilterAttributes(chart))
    chart.fetch({ processing: true })

    log({
      chartAction: "chart-postgroupby-change",
      value: selected,
    })
  }

  const legacyRendererByVisualization = {
    line: "dygraph",
    stacked: "dygraph",
    area: "dygraph",
    stackedBar: "dygraph",
    multiBar: "dygraph",
    heatmap: "dygraph",
    easypiechart: "easypiechart",
    gauge: "gauge",
    number: "number",
    d3pie: "d3pie",
    bars: "bars",
    groupBoxes: "groupBoxes",
    table: "table",
  }
  const timeSeriesVisualizations = {
    line: true,
    stacked: true,
    area: true,
    stackedBar: true,
    multiBar: true,
    heatmap: true,
  }

  const getChartLibrariesByType = () => chart.getAttribute("chartLibrariesByType") || {}
  const getChartRenderersByVisualization = () =>
    chart.getAttribute("chartRenderersByVisualization") || {}

  const getConfiguredRenderer = visualization =>
    getChartRenderersByVisualization()[visualization] ||
    (timeSeriesVisualizations[visualization]
      ? getChartLibrariesByType()[visualization]
      : null) ||
    legacyRendererByVisualization[visualization]

  const inferVisualization = () => {
    const chartLibrary = chart.getAttribute("chartLibrary")
    const chartType = chart.getAttribute("chartType")

    if (
      chartLibrary &&
      legacyRendererByVisualization[chartLibrary] === chartLibrary &&
      !timeSeriesVisualizations[chartLibrary]
    )
      return chartLibrary

    if (
      chartType &&
      (chartLibrary === legacyRendererByVisualization[chartType] ||
        chartLibrary === getConfiguredRenderer(chartType))
    )
      return chartType

    return null
  }

  let activeVisualization = inferVisualization()

  const getVisualizationType = () => activeVisualization || inferVisualization()

  const resolveRenderer = (renderer, visualization, legacyRenderer, visited = new Set()) => {
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

  const getRendererForVisualization = visualization => {
    const legacyRenderer = legacyRendererByVisualization[visualization] || "dygraph"
    return resolveRenderer(
      getConfiguredRenderer(visualization) || legacyRenderer,
      visualization,
      legacyRenderer
    )
  }

  const getRendererForChartType = getRendererForVisualization

  const isVisualizationRenderer = (
    chartLibrary = chart.getAttribute("chartLibrary")
  ) => {
    const visualization = getVisualizationType()
    if (!visualization) return false
    return (
      chartLibrary === chart.getAttribute("chartLibrary") ||
      chartLibrary === getConfiguredRenderer(visualization) ||
      chartLibrary === legacyRendererByVisualization[visualization]
    )
  }

  const isTimeSeriesRenderer = (
    chartLibrary = chart.getAttribute("chartLibrary")
  ) => {
    const visualization = getVisualizationType()
    if (visualization)
      return !!timeSeriesVisualizations[visualization] && isVisualizationRenderer(chartLibrary)

    return (
      chartLibrary === "dygraph" || Object.values(getChartLibrariesByType()).includes(chartLibrary)
    )
  }

  const replaceChartUI = () => {
    const chartInstance = getChartInstance()
    return chart.replaceUI(
      { ...chart.sdk.makeChartUI(chartInstance), ...(chart.ui || {}) },
      "default"
    )
  }

  const reconcileChartLibrary = (chartType = chart.getAttribute("chartType")) => {
    const prevChartLibrary = chart.getAttribute("chartLibrary")
    let visualization = getVisualizationType()

    if (!visualization && chartType) visualization = chartType
    else if (timeSeriesVisualizations[visualization] && chartType) visualization = chartType
    if (!visualization) return false

    const nextChartLibrary = getRendererForVisualization(visualization)
    activeVisualization = visualization
    if (prevChartLibrary === nextChartLibrary) return false

    chart.updateAttribute("chartLibrary", nextChartLibrary)
    replaceChartUI()
    return true
  }

  const fallbackChartLibrary = (failedRenderer, fallbackRenderer) => {
    if (chart.getAttribute("chartLibrary") !== failedRenderer) return false

    const visualization = getVisualizationType()
    const legacyRenderer = legacyRendererByVisualization[visualization] || "dygraph"
    const requestedFallback = fallbackRenderer || legacyRenderer
    const nextRenderer = resolveRenderer(
      requestedFallback,
      visualization,
      legacyRenderer
    )
    if (nextRenderer === failedRenderer || !(nextRenderer in chart.sdk.ui)) return false

    chart.updateAttribute("chartLibrary", nextRenderer)
    replaceChartUI()
    return true
  }

  const updateChartTypeAttribute = selected => {
    const prevChartLibrary = chart.getAttribute("chartLibrary")
    const prevGroupBy = chart.getAttribute("groupBy")
    const isTimeSeries = !!timeSeriesVisualizations[selected]
    const nextChartLibrary = getRendererForVisualization(selected)
    activeVisualization = selected

    chart.updateAttributes({
      chartLibrary: nextChartLibrary,
      processing: true,
      ...(isTimeSeries && { chartType: selected }),
      ...(isHeatmap(selected) && { dimensionsSort: "default" }),
    })
    if (prevChartLibrary !== nextChartLibrary) replaceChartUI()

    if (isHeatmap(selected)) {
      updateGroupByAttribute(["dimension"])
      if (!deepEqual(prevGroupBy, chart.getAttribute("groupBy"))) return
    }

    chart.trigger("fetch", { processing: true })

    log({
      chartAction: "chart-type-change",
      value: selected,
    })
  }

  const updateNodesAttribute = selected => {
    const { selectedNodes, selectedInstances } = selected.reduce(
      (h, sel) => {
        if (sel.isInstance) {
          h.selectedInstances.push(sel.value)
        } else {
          h.selectedNodes.push(sel.value)
        }
        return h
      },
      { selectedNodes: [], selectedInstances: [] }
    )

    const nodesHaveChanges = !deepEqual(selectedNodes, chart.getAttribute("selectedNodes"))
    if (nodesHaveChanges) chart.updateAttributes({ selectedNodes: selectedNodes, processing: true })

    const instancesHaveChanges = !deepEqual(
      selectedInstances,
      chart.getAttribute("selectedInstances")
    )
    if (instancesHaveChanges)
      chart.updateAttributes({ selectedInstances: selectedInstances, processing: true })

    if (instancesHaveChanges || nodesHaveChanges) chart.trigger("fetch", { processing: true })

    log({
      chartAction: "chart-node-change",
      value: selected,
    })
  }

  const updateNodeLabelsFilter = selectedLabels => {
    if (typeof selectedLabels === "function") {
      const selected = chart.getAttribute("selectedNodeLabelsFilter")
      selectedLabels = selectedLabels(selected)
    }

    if (deepEqual(selectedLabels, chart.getAttribute("selectedNodeLabelsFilter"))) return

    chart.updateAttributes({
      selectedNodeLabelsFilter: selectedLabels,
      processing: true,
    })

    chart.trigger("fetch", { processing: true })

    log({
      chartAction: "chart-host-labels-filter-change",
      value: selectedLabels,
    })
  }

  const updateInstancesAttribute = selected => {
    const selectedInstances = selected.map(sel => sel.value)

    if (deepEqual(selectedInstances, chart.getAttribute("selectedInstances"))) return

    chart.updateAttributes({ selectedInstances: selectedInstances, processing: true })

    chart.trigger("fetch", { processing: true })

    log({
      chartAction: "chart-instance-change",
      value: selected,
    })
  }

  const updateDimensionsAttribute = selected => {
    const selectedDimensions = selected.map(sel => sel.value)

    if (deepEqual(selectedDimensions, chart.getAttribute("selectedDimensions"))) return

    chart.updateAttributes({ selectedDimensions: selectedDimensions, processing: true })

    chart.trigger("fetch", { processing: true })

    log({
      chartAction: "chart-dimensions-change",
      value: selected,
    })
  }

  const updateLabelsAttribute = selected => {
    const selectedLabels = selected.map(sel => sel.value)

    if (deepEqual(selectedLabels, chart.getAttribute("selectedLabels"))) return

    chart.updateAttributes({ selectedLabels: selectedLabels, processing: true })

    chart.trigger("fetch", { processing: true })

    log({
      chartAction: "chart-labels-change",
      value: selected,
    })
  }

  const updateAggregationMethodAttribute = value => {
    if (chart.getAttribute("aggregationMethod") === value) return

    chart.updateAttributes({ aggregationMethod: value, processing: true })

    chart.trigger("fetch", { processing: true })

    log({
      chartAction: "chart-aggregation-method-change",
      value,
    })
  }

  const updatePostAggregationMethodAttribute = value => {
    if (chart.getAttribute("postAggregationMethod") === value) return

    chart.updateAttributes({ postAggregationMethod: value, processing: true })

    chart.trigger("fetch", { processing: true })

    log({
      chartAction: "chart-aggregation-method-change",
      value,
    })
  }

  const updateContextScopeAttribute = value => {
    if (chart.getAttribute("contextScope")[0] === value) return

    chart.updateAttributes({ contextScope: [value], processing: true })
    chart.updateAttributes(getInitialFilterAttributes(chart))

    chart.trigger("fetch", { processing: true })

    log({
      chartAction: "chart-context-scope-change",
      value,
    })
  }

  const updateTimeAggregationMethodAttribute = ({ alias, method }) => {
    const value = alias ? `${method}${alias}` : method

    if (chart.getAttribute("groupingMethod") === value) return

    chart.updateAttributes({ groupingMethod: value, processing: true })
    chart.trigger("fetch", { processing: true })

    log({
      chartAction: "chart-time-aggregation-method-change",
      value,
    })
  }

  const resetPristine = () => {
    const attributes = chart.getAttributes()
    const prev = { ...attributes[pristineKey] }

    const hasChangedLibrary =
      "chartLibrary" in prev && attributes.chartLibrary !== prev.chartLibrary

    pristine.reset(attributes)
    activeVisualization = inferVisualization()
    chart.attributeListeners.trigger(pristineKey, attributes[pristineKey], prev)
    chart.sdk.trigger("pristineChanged", chart, pristineKey, attributes[pristineKey], prev)
    Object.keys(prev).forEach(key =>
      chart.attributeListeners.trigger(key, attributes[key], prev[key])
    )

    if (hasChangedLibrary) replaceChartUI()
    chart.trigger("fetch", { processing: true })
  }

  const removePristine = () => {
    const prev = chart.getAttribute(pristineKey)
    const next = {}
    chart.updateAttribute(pristineKey, next)
    chart.sdk.trigger("pristineChanged", chart, pristineKey, next, prev)
  }

  const toggleFullscreen = () => {
    const fullscreen = chart.getAttribute("fullscreen")

    chart.updateAttribute("fullscreen", !fullscreen)
  }

  return {
    updateGroupByAttribute,
    updatePostGroupByAttribute,
    updateChartTypeAttribute,
    updateNodesAttribute,
    updateInstancesAttribute,
    updateDimensionsAttribute,
    updateLabelsAttribute,
    updateAggregationMethodAttribute,
    updatePostAggregationMethodAttribute,
    updateTimeAggregationMethodAttribute,
    updateContextScopeAttribute,
    updateNodeLabelsFilter,
    resetPristine,
    removePristine,
    toggleFullscreen,
    baseUpdateGroupBy,
    getRendererForChartType,
    getRendererForVisualization,
    getVisualizationType,
    isVisualizationRenderer,
    isTimeSeriesRenderer,
    reconcileChartLibrary,
    fallbackChartLibrary,
  }
}
