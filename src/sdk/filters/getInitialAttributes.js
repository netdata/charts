import getAggregateMethod from "./getAggregateMethod"
import getDimensions from "./getDimensions"

export default chart => {
  const { id, chartLabels } = chart.getMetadata()
  const units = chart.getUnits()

  const clusterId = chartLabels.k8s_cluster_id?.[0]

  const { aggregationMethod, dimensions, dimensionsAggregationMethod } = chart.getAttributes()
  const groupBy = chart.getAttribute("groupBy") || (clusterId ? "k8s_namespace" : "dimension")

  return {
    aggregationMethod: aggregationMethod || getAggregateMethod(units),
    dimensions: dimensions.length ? dimensions : getDimensions(chart, groupBy),
    dimensionsAggregationMethod: dimensionsAggregationMethod || "sum",
    groupBy,
    selectedChart: id,
    ...(clusterId && { labels: { k8s_cluster_id: [clusterId] } }),
  }
}
