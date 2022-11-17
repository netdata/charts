import { getChartURLOptions, getChartPayload } from "./helpers"
import initialPayload from "../initialPayload"

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

const valuesByMethod = {
  "sum-of-abs": "sum",
}
const normalizeAggregationMethod = method => valuesByMethod[method] || method

const mapChartInstances = instances =>
  instances.reduce(
    (acc, { chartId, nodeId }) => ({
      ...acc,
      [nodeId]: [...(acc[nodeId] || []), chartId],
    }),
    {}
  )

const getCompositeChartPayload = chart => {
  const metadata = chart.getMetadata()
  const {
    nodeIds = [],
    dimensions,
    postAggregationMethod,
    filteredLabels,
    context,
    chartId,
    filters,
    selectedNodeIds,
    selectedChartId,
    nodeChartInstances,
  } = chart.getAttributes()

  const filter = {
    nodeIDs: selectedNodeIds.length ? selectedNodeIds : nodeIds,
    context: metadata.context || context || chartId,
    ...(dimensions.length && { dimensions }),
    ...(Object.keys(filteredLabels).length && { labels: filteredLabels }),
    ...(selectedChartId && { chartID: selectedChartId }),
    ...(nodeChartInstances.length && { nodeChartInstances: mapChartInstances(nodeChartInstances) }),
    ...filters,
  }
  const aggregations = getAggregations(chart)

  return {
    filter,
    aggregations,
    agent_options: getChartURLOptions(chart),
    ...(postAggregationMethod && {
      post_aggregation_methods: [normalizeAggregationMethod(postAggregationMethod)],
    }),
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
  })
    .then(response => {
      return response.json().then(data => {
        if (response.ok) return data
        throw data
      })
    })
    .catch(error => {
      if (
        error.errorMsgKey &&
        error.errorMsgKey === "ErrAllNodesFailed" &&
        !error.nodes.some(node => node.error.errorMsgKey !== "ErrNoData")
      )
        return initialPayload

      throw error
    })
}
