import getAggregateMethod from "./getAggregateMethod"
import getDimensions from "./getDimensions"

export default chart => {
  const { id, units, chartLabels } = chart.getMetadata()

  const clusterId = chartLabels.k8s_cluster_id?.[0]

  const groupBy = chart.getAttribute("groupBy") || (clusterId ? "k8s_namespace" : "dimension")

  return {
    id,
    aggregationMethod: getAggregateMethod(units),
    dimensions: getDimensions(chart, groupBy),
    dimensionsAggregationMethod: "sum",
    groupBy,
    selectedChart: id,
    ...(clusterId && { labels: { k8s_cluster_id: [clusterId] } }),
  }
}
