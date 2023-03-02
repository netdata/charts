import deepEqual from "@/helpers/deepEqual"
import pristine, { pristineKey } from "@/sdk/pristine"
import getInitialFilterAttributes, { stackedAggregations } from "./getInitialAttributes"

export default chart => {
  const metadata = chart.getMetadata()
  let prevChartType = metadata.chartType
  const onGroupChange = groupBy => {
    chart.setMetadataAttribute("initializedFilters", false)

    chart.updateAttribute("selectedLegendDimensions", [])
    if (chart.getAttribute("selectedChartType")) return

    if (groupBy.length > 1 || groupBy[0] !== "dimension") {
      prevChartType = prevChartType || chart.getAttribute("chartType")
      const aggregationMethod = chart.getAttribute("aggregationMethod")
      return chart.updateAttribute(
        "chartType",
        stackedAggregations[aggregationMethod] ? "stacked" : metadata.chartType
      )
    } else {
      chart.updateAttribute("chartType", prevChartType)
    }
    prevChartType = metadata.chartType
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
    })

    const attributes = getInitialFilterAttributes(chart)
    chart.updateAttributes(attributes)
    chart.fetchAndRender().then(() => onGroupChange(chart.getAttribute("groupBy")))
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

    if (
      deepEqual(selectedNodes, chart.getAttribute("selectedNodes")) &&
      deepEqual(selectedInstances, chart.getAttribute("selectedInstances"))
    )
      return

    chart.updateAttributes({ selectedNodes: selectedNodes, selectedInstances: selectedInstances })

    chart.fetchAndRender()
  }

  const updateInstancesAttribute = selected => {
    const selectedInstances = selected.map(sel => sel.value)

    if (deepEqual(selectedInstances, chart.getAttribute("selectedInstances"))) return

    chart.updateAttribute(
      "selectedInstances",
      selected.map(sel => sel.value)
    )

    chart.fetchAndRender()
  }

  const updateDimensionsAttribute = selected => {
    const selectedDimensions = selected.map(sel => sel.value)

    if (deepEqual(selectedDimensions, chart.getAttribute("selectedDimensions"))) return

    chart.updateAttribute("selectedDimensions", selectedDimensions)

    chart.fetchAndRender()
  }

  const updateLabelsAttribute = selected => {
    const selectedLabels = selected.map(sel => sel.value)

    if (deepEqual(selectedLabels, chart.getAttribute("selectedLabels"))) return

    chart.updateAttribute("selectedLabels", selectedLabels)

    chart.fetchAndRender()
  }

  const updateAggregationMethodAttribute = value => {
    chart.updateAttribute("aggregationMethod", value)
    const groupBy = chart.getAttribute("groupBy")

    if (groupBy.length > 1 || groupBy[0] !== "dimension") {
      prevChartType = prevChartType || chart.getAttribute("chartType")
      chart.updateAttribute(
        "chartType",
        stackedAggregations[value] ? "stacked" : metadata.chartType
      )
    } else {
      if (chart.getAttribute("chartType") === "line")
        chart.updateAttribute("chartType", prevChartType)

      prevChartType = metadata.chartType
    }

    chart.fetchAndRender()
  }

  const updateTimeAggregationMethodAttribute = ({ alias, method }) => {
    const value = alias ? `${method}${alias}` : method
    chart.updateAttribute("groupingMethod", value)
    chart.fetchAndRender()
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
    chart.fetchAndRender()
  }

  const removePristine = () => {
    const prev = chart.getAttribute(pristineKey)
    const next = {}
    chart.updateAttribute(pristineKey, next)
    chart.sdk.trigger("pristineChanged", chart, pristineKey, next, prev)
  }

  return {
    updateGroupByAttribute,
    updateNodesAttribute,
    updateInstancesAttribute,
    updateDimensionsAttribute,
    updateLabelsAttribute,
    updateAggregationMethodAttribute,
    updateTimeAggregationMethodAttribute,
    resetPristine,
    removePristine,
  }
}
