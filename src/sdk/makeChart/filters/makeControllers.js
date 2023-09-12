import deepEqual from "@/helpers/deepEqual"
import pristine, { pristineKey } from "@/sdk/pristine"
import getInitialFilterAttributes, { stackedAggregations } from "./getInitialAttributes"
import { isHeatmap } from "@/helpers/heatmap"
import makeLog from "@/sdk/makeLog"

export default chart => {
  const chartType = chart.getAttribute("chartType")
  let prevChartType = chartType

  const log = makeLog(chart)

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
      action: "chart-groupby-change",
      data: { value: selected },
    })
  }

  const updateChartTypeAttribute = selected => {
    const prevGroupBy = chart.getAttribute("groupBy")

    chart.updateAttributes({
      selectedChartType: selected,
      chartType: selected,
      processing: true,
    })

    if (isHeatmap(selected)) {
      updateGroupByAttribute(["dimension"])
      if (!deepEqual(prevGroupBy, chart.getAttribute("groupBy"))) return
    }

    chart.trigger("fetch", { processing: true })

    log({
      action: "chart-type-change",
      data: { value: selected },
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
      action: "chart-node-change",
      data: { value: selected },
    })
  }

  const updateInstancesAttribute = selected => {
    const selectedInstances = selected.map(sel => sel.value)

    if (deepEqual(selectedInstances, chart.getAttribute("selectedInstances"))) return

    chart.updateAttributes({ selectedInstances: selectedInstances, processing: true })

    chart.trigger("fetch", { processing: true })

    log({
      action: "chart-instance-change",
      data: { value: selected },
    })
  }

  const updateDimensionsAttribute = selected => {
    const selectedDimensions = selected.map(sel => sel.value)

    if (deepEqual(selectedDimensions, chart.getAttribute("selectedDimensions"))) return

    chart.updateAttributes({ selectedDimensions: selectedDimensions, processing: true })

    chart.trigger("fetch", { processing: true })

    log({
      action: "chart-dimensions-change",
      data: { value: selected },
    })
  }

  const updateLabelsAttribute = selected => {
    const selectedLabels = selected.map(sel => sel.value)

    if (deepEqual(selectedLabels, chart.getAttribute("selectedLabels"))) return

    chart.updateAttributes({ selectedLabels: selectedLabels, processing: true })

    chart.trigger("fetch", { processing: true })

    log({
      action: "chart-labels-change",
      data: { value: selected },
    })
  }

  const updateAggregationMethodAttribute = value => {
    if (chart.getAttribute("aggregationMethod") === value) return

    chart.updateAttributes({ aggregationMethod: value, processing: true })

    chart.trigger("fetch", { processing: true })

    log({
      action: "chart-aggregation-method-change",
      data: { value },
    })
  }

  const updateContextScopeAttribute = value => {
    if (chart.getAttribute("contextScope")[0] === value) return

    chart.updateAttributes({ contextScope: [value], processing: true })
    chart.updateAttributes(getInitialFilterAttributes(chart))

    chart.trigger("fetch", { processing: true })

    log({
      action: "chart-context-scope-change",
      data: { value },
    })
  }

  const updateTimeAggregationMethodAttribute = ({ alias, method }) => {
    const value = alias ? `${method}${alias}` : method

    if (chart.getAttribute("groupingMethod") === value) return

    chart.updateAttributes({ groupingMethod: value, processing: true })
    chart.trigger("fetch", { processing: true })

    log({
      action: "chart-time-aggregation-method-change",
      data: { value },
    })
  }

  const resetPristine = () => {
    const attributes = chart.getAttributes()
    const prev = { ...attributes[pristineKey] }
    pristine.reset(attributes)
    chart.attributeListeners.trigger(pristineKey, attributes[pristineKey], prev)
    chart.sdk.trigger("pristineChanged", chart, pristineKey, attributes[pristineKey], prev)
    Object.keys(prev).forEach(key =>
      chart.attributeListeners.trigger(key, attributes[key], prev[key])
    )
    chart.trigger("fetch", { processing: true })
  }

  const removePristine = () => {
    const prev = chart.getAttribute(pristineKey)
    const next = {}
    chart.updateAttribute(pristineKey, next)
    chart.sdk.trigger("pristineChanged", chart, pristineKey, next, prev)
  }

  return {
    updateGroupByAttribute,
    updateChartTypeAttribute,
    updateNodesAttribute,
    updateInstancesAttribute,
    updateDimensionsAttribute,
    updateLabelsAttribute,
    updateAggregationMethodAttribute,
    updateTimeAggregationMethodAttribute,
    updateContextScopeAttribute,
    resetPristine,
    removePristine,
  }
}
