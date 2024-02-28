import deepEqual from "@/helpers/deepEqual"
import pristine, { pristineKey } from "@/sdk/pristine"
import getInitialFilterAttributes, { stackedAggregations } from "./getInitialAttributes"
import { isHeatmap } from "@/helpers/heatmap"
import makeLog from "@/sdk/makeLog"

export default chart => {
  const chartType = chart.getAttribute("chartType")
  let prevChartType = chartType

  const log = ({ value, ...rest }) =>
    makeLog(chart)({
      ...rest,
      value: value && typeof value !== "string" ? JSON.stringify(value) : value,
    })

  const onGroupChange = groupBy => {
    chart.updateAttribute("selectedLegendDimensions", [])
    if (chart.getAttribute("selectedChartType")) return

    if (groupBy.length > 1 || groupBy[0] !== "dimension") {
      prevChartType = prevChartType || chart.getAttribute("chartType")
      const aggregationMethod = chart.getAttribute("aggregationMethod")
      return chart.updateAttribute(
        "chartType",
        stackedAggregations[aggregationMethod] ? "stacked" : chartType
      )
    } else {
      chart.updateAttributes({ chartType: prevChartType, processing: true })
    }
    prevChartType = chartType
  }

  const allowedGroupByValues = {
    node: true,
    instance: true,
    dimension: true,
    "percentage-of-instance": true,
    selected: true,
  }

  const updateGroupByAttribute = selected => {
    const selectedLabels = selected.filter(sel => sel.isLabel)
    const groupByLabel = selectedLabels.map(sel => sel.value)

    let groupBy = selected.reduce((h, sel) => {
      if (!allowedGroupByValues[sel.value]) return h
      h.push(sel.value)
      return h
    }, [])

    if (selectedLabels.length) groupBy.push("label")

    if (!groupBy.length) groupBy = ["dimension"]

    if (
      deepEqual(groupBy, chart.getAttribute("groupBy")) &&
      deepEqual(groupByLabel, chart.getAttribute("groupByLabel"))
    )
      return

    chart.updateAttributes({
      groupByLabel: groupByLabel,
      groupBy: groupBy,
      processing: true,
    })

    chart.updateAttributes(getInitialFilterAttributes(chart))
    chart.fetch({ processing: true }).then(() => onGroupChange(chart.getAttribute("groupBy")))

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

  const chartLibraries = {
    dygraph: true,
    easypiechart: true,
    gauge: true,
    number: true,
    d3pie: true,
    bars: true,
    groupBoxes: true,
  }

  const updateChartTypeAttribute = selected => {
    const prevChartLibrary = chart.getAttribute("chartLibrary")
    const prevGroupBy = chart.getAttribute("groupBy")

    if (!chartLibraries[selected]) {
      chart.updateAttributes({
        chartLibrary: "dygraph",
        selectedChartType: selected,
        chartType: selected,
        processing: true,
      })
      if (prevChartLibrary !== "dygraph") {
        chart.getUI().unmount()
        chart.setUI({ ...chart.sdk.makeChartUI(chart), ...(chart.ui || {}) }, "default")
      }
    } else {
      chart.updateAttributes({
        chartLibrary: selected,
        processing: true,
      })
      chart.getUI().unmount()
      chart.setUI({ ...chart.sdk.makeChartUI(chart), ...(chart.ui || {}) }, "default")
    }
    chartLibraries[selected]

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
    chart.attributeListeners.trigger(pristineKey, attributes[pristineKey], prev)
    chart.sdk.trigger("pristineChanged", chart, pristineKey, attributes[pristineKey], prev)
    Object.keys(prev).forEach(key =>
      chart.attributeListeners.trigger(key, attributes[key], prev[key])
    )

    if (hasChangedLibrary) {
      chart.getUI().unmount()
      chart.setUI({ ...chart.sdk.makeChartUI(chart), ...(chart.ui || {}) }, "default")
    }
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
    resetPristine,
    removePristine,
    toggleFullscreen,
  }
}
