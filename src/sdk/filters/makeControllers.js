import getInitialFilterAttributes, { stackedAggregations } from "./getInitialAttributes"
import pristineComposite, { pristineCompositeKey } from "@/sdk/pristineComposite"

export default chart => {
  const metadata = chart.getMetadata()
  let prevChartType = metadata.chartType
  const onGroupChange = groupBy => {
    chart.setMetadataAttribute("initializedFilters", false)

    if (groupBy !== "dimension") {
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

  const onGroupFetch = groupBy => {
    onGroupChange(groupBy)

    chart.updateAttribute("selectedDimensions", null)
  }

  const updateGroupByAttribute = value => {
    chart.updateAttribute("groupBy", value)
    if (value === "dimension") {
      chart.updateAttribute("dimensions", [])
    }
    const attributes = getInitialFilterAttributes(chart)
    chart.updateAttributes(attributes)
    chart.fetchAndRender().then(() => onGroupFetch(value))
  }

  const updateDimensionsAttribute = value => {
    chart.updateAttribute("dimensions", value)
    chart.fetchAndRender()
  }

  const updateFilteredLabelsAttribute = value => {
    chart.updateAttribute("filteredLabels", value)
    chart.fetchAndRender()
  }

  const updateAggregationMethodAttribute = value => {
    chart.updateAttribute("aggregationMethod", value)
    const groupBy = chart.getAttribute("groupBy")

    if (groupBy !== "dimension") {
      prevChartType = prevChartType || chart.getAttribute("chartType")
      chart.updateAttribute(
        "chartType",
        stackedAggregations[value] ? "stacked" : metadata.chartType
      )
    } else {
      if (chart.getAttribute("chartType") === "line") {
        chart.updateAttribute("chartType", prevChartType)
      }
      prevChartType = metadata.chartType
    }

    chart.fetchAndRender()
  }

  const updateTimeAggregationMethodAttribute = ({ alias, method }) => {
    const value = alias ? `${method}${alias}` : method
    chart.updateAttribute("groupingMethod", value)
    chart.fetchAndRender()
  }

  const resetPristineComposite = () => {
    const attributes = chart.getAttributes()
    const prev = { ...attributes[pristineCompositeKey] }
    pristineComposite.reset(attributes)
    chart.attributeListeners.trigger(pristineCompositeKey, attributes[pristineCompositeKey], prev)
    chart.sdk.trigger(
      "pristineChanged",
      chart,
      pristineCompositeKey,
      attributes[pristineCompositeKey],
      prev
    )
    Object.keys(prev).forEach(key =>
      chart.attributeListeners.trigger(key, attributes[key], prev[key])
    )
    chart.fetchAndRender()
  }

  const removePristineComposite = () => {
    const prev = chart.getAttribute(pristineCompositeKey)
    const next = {}
    chart.updateAttribute(pristineCompositeKey, next)
    chart.sdk.trigger("pristineChanged", chart, pristineCompositeKey, next, prev)
  }

  return {
    updateGroupByAttribute,
    updateDimensionsAttribute,
    updateFilteredLabelsAttribute,
    updateAggregationMethodAttribute,
    updateTimeAggregationMethodAttribute,
    resetPristineComposite,
    removePristineComposite,
  }
}
