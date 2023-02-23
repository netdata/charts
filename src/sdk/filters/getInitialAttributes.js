import getChartType from "./getChartType"
import getAggregateMethod from "./getAggregateMethod"
import getDimensions from "./getDimensions"
import getDefaultGroupBy from "./getGroupBy"

const getFilteredDimensions = dimensions => {
  if (dimensions?.includes("all_dimensions")) return []
  return dimensions
}

export const stackedAggregations = {
  avg: true,
  sum: true,
}

export default chart => {
  const { id, chartLabels, dimensions: allDimensions } = chart.getMetadata()
  const units = chart.getUnits()

  const clusterId = chartLabels?.k8s_cluster_id?.[0]

  const { aggregationMethod: aggregationMethodAttr, dimensions } = chart.getAttributes()
  const [groupBy, groupByLabel] = getDefaultGroupBy(chart)
  const chartType = chart.getAttribute("chartType")
  const filteredLabels = chart.getAttribute("filteredLabels") || {}
  const aggregationMethod = aggregationMethodAttr || getAggregateMethod(units)

  return {
    aggregationMethod,
    dimensions: dimensions?.length
      ? getFilteredDimensions(dimensions)
      : getDimensions(chart, { groupBy, groupByLabel }),
    groupBy,
    groupByLabel,
    selectedChart: id,
    ...(clusterId && { labels: { k8s_cluster_id: [clusterId] } }), // TODO fix for K8s
    chartType: chartType || getChartType(chart, { groupBy, groupByLabel }),
    initializedFilters: !!allDimensions && Object.keys(allDimensions).length > 0,
    filteredLabels,
  }
}
