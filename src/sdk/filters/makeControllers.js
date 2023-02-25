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

  const canBeGroupedByAttrs = {
    node: true,
    instance: true,
    dimension: true,
  }

  const updateGroupByAttribute = ({ values, selected }) => {
    const prevGroupByLabel = chart.getAttribute("groupByLabel")
    const selectedLabels = selected.filter(sel => sel.isLabel)

    chart.updateAttribute(
      "groupByLabel",
      selectedLabels.map(sel => sel.value)
    )

    let newValues = values.filter(value => canBeGroupedByAttrs[value])

    if (selectedLabels.length) newValues.push("label")

    const prevGroupBy = chart.getAttribute("groupBy")

    if (!newValues.length) newValues = ["dimension"]

    chart.updateAttribute("groupBy", newValues)

    if (
      deepEqual(prevGroupBy, chart.getAttribute("groupBy")) &&
      deepEqual(prevGroupByLabel, chart.getAttribute("groupByLabel"))
    )
      return

    const attributes = getInitialFilterAttributes(chart)
    chart.updateAttributes(attributes)
    chart.fetchAndRender().then(() => onGroupChange(chart.getAttribute("groupBy")))
  }

  const updateNodesAttribute = ({ values }) => {
    const selectedNodes = chart.getAttribute("selectedNodes")
    chart.updateAttribute("selectedNodes", values)

    if (deepEqual(selectedNodes, chart.getAttribute("selectedNodes"))) return

    chart.fetchAndRender()
  }

  const updateInstancesAttribute = ({ values }) => {
    const selectedInstances = chart.getAttribute("selectedInstances")
    chart.updateAttribute("selectedInstances", values)

    if (deepEqual(selectedInstances, chart.getAttribute("selectedInstances"))) return

    chart.fetchAndRender()
  }

  const updateDimensionsAttribute = ({ values }) => {
    const selectedDimensions = chart.getAttribute("selectedDimensions")
    chart.updateAttribute("selectedDimensions", values)

    if (deepEqual(selectedDimensions, chart.getAttribute("selectedDimensions"))) return

    chart.fetchAndRender()
  }

  const updateFilteredLabelsAttribute = ({ values }) => {
    const filteredLabels = chart.getAttribute("filteredLabels")
    chart.updateAttribute("filteredLabels", values)

    if (deepEqual(filteredLabels, chart.getAttribute("filteredLabels"))) return

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
    updateFilteredLabelsAttribute,
    updateAggregationMethodAttribute,
    updateTimeAggregationMethodAttribute,
    resetPristine,
    removePristine,
  }
}
