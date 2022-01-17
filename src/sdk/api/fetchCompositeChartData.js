import { getChartURLOptions, getChartPayload } from "./helpers"

// const getCompositeChartURLOptions = chart => {
//   const { dimensionsAggregationMethod, groupBy } = chart.getAttributes()
//   const options = getChartURLOptions(chart)

//   return [
//     ...options,
//     // (dimensionsAggregationMethod === "sum" || (groupBy && groupBy !== "dimension")) && "absolute",
//     "flip",
//   ].filter(Boolean)
// }

const getGroupByValues = groupBy => {
  if (groupBy === "chart") return "node"
  if (groupBy === "node" || groupBy === "dimension") return groupBy
  return `label=${groupBy}`
}

const getAggregations = chart => {
  const {
    aggregationMethod,
    dimensionsAggregationMethod,
    groupBy,
    postGroupBy,
    aggregationGroups,
  } = chart.getAttributes()

  const groupValues = [getGroupByValues(groupBy), postGroupBy && `label=${postGroupBy}`].filter(
    Boolean
  )

  return [
    groupBy !== "dimension" && {
      method: dimensionsAggregationMethod,
      groupBy: ["chart", ...groupValues],
    },
    groupBy !== "chart" && {
      method: aggregationMethod,
      groupBy: groupValues,
      ...(aggregationGroups.length && { labels: aggregationGroups }),
    },
  ].filter(Boolean)
}

const getCompositeChartPayload = chart => {
  const { context, nodeIDs: nodeIdsThatContainChart } = chart.getMetadata()
  const {
    nodeIds: reachableNodeIds,
    dimensions,
    postAggregationMethod,
    filteredLabels,
  } = chart.getAttributes()

  const filter = {
    nodeIDs: nodeIdsThatContainChart
      ? nodeIdsThatContainChart.filter(nodeId => reachableNodeIds.includes(nodeId))
      : reachableNodeIds,
    context,
    ...(dimensions.length && { dimensions }),
    labels: filteredLabels,
  }
  const aggregations = getAggregations(chart)

  return {
    filter,
    aggregations,
    agent_options: getChartURLOptions(chart),
    ...(postAggregationMethod && { post_aggregation_methods: [postAggregationMethod] }),
    ...getChartPayload(chart),
  }
}

export default (chart, options) => {
  const { host } = chart.getAttributes()

  const payload = getCompositeChartPayload(chart)

  return fetch(host, {
    method: "POST",
    body: JSON.stringify(payload),
    ...options,
  }).then(response => {
    return response.json().then(data => {
      if (response.ok) return data
      throw data
    })
  })
}
