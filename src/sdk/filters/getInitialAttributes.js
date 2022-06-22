import getAggregateMethod from "./getAggregateMethod"
import getDimensions from "./getDimensions"

export const stackedAggregations = {
  avg: true,
  sum: true,
}

export default chart => {
  const { id, chartLabels } = chart.getMetadata()
  const units = chart.getUnits()

  const clusterId = chartLabels?.k8s_cluster_id?.[0]

  const {
    aggregationMethod: aggregationMethodAttr,
    dimensions,
    dimensionsAggregationMethod,
  } = chart.getAttributes()
  const groupBy = chart.getAttribute("groupBy") || "dimension"
  const chartType = chart.getAttribute("chartType")
  const aggregationMethod = aggregationMethodAttr || getAggregateMethod(units)

  // @todo re-visit the logic of the initial attributes
  // It should keep pristine
  return {
    aggregationMethod,
    dimensions: dimensions?.length ? dimensions : getDimensions(chart, groupBy),
    dimensionsAggregationMethod: dimensionsAggregationMethod || "sum",
    groupBy,
    selectedChart: id,
    ...(clusterId && { labels: { k8s_cluster_id: [clusterId] } }),
    chartType:
      groupBy !== "dimension" && stackedAggregations[aggregationMethod] ? "stacked" : chartType,
    initializedFilters: true,
  }
}
