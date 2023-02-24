import getInitialFilterAttributes, { stackedAggregations } from "./getInitialAttributes"
import pristine, { pristineKey } from "@/sdk/pristine"

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

  const updateGroupByAttribute = ({ value, checked, type = "groupBy" } = {}) => {
    if (type === "groupByLabel") {
      const prevGroupByLabel = chart.getAttribute("groupByLabel")

      chart.updateAttribute(
        "groupByLabel",
        checked
          ? [...new Set([...prevGroupByLabel, value])]
          : prevGroupByLabel.filter(g => g !== value)
      )

      // Override
      // - if empty in order to remove "label" from groupBy
      // - if added in order to add "label" in groupBy
      if (checked || !chart.getAttribute("groupByLabel").length) {
        value = "label"
      }
    }

    const prevGroupBy = chart.getAttribute("groupBy")

    let newValues = checked
      ? [...new Set([...prevGroupBy, value])]
      : prevGroupBy.filter(g => g !== value)

    if (!newValues.length) newValues = ["dimension"]

    chart.updateAttribute("groupBy", newValues)

    const attributes = getInitialFilterAttributes(chart)
    chart.updateAttributes(attributes)
    chart.fetchAndRender().then(() => onGroupChange(value))
  }

  const updateNodesAttribute = value => {
    chart.updateAttribute("selectedHosts", value)
    chart.fetchAndRender()
  }

  const updateInstancesAttribute = value => {
    chart.updateAttribute("selectedInstances", value)
    chart.fetchAndRender()
  }

  const updateDimensionsAttribute = value => {
    chart.updateAttribute("selectedDimensions", value)
    chart.fetchAndRender()
  }

  const updateFilteredLabelsAttribute = value => {
    chart.updateAttribute("filteredLabels", value)
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
