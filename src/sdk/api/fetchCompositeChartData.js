import { getChartURLOptions, getChartPayload } from "./helpers"

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
    },
  ].filter(Boolean)
}

const getCompositeChartPayload = chart => {
  const { context } = chart.getMetadata()
  const { nodeIds, dimensions } = chart.getAttributes()

  const filter = { nodeIDs: nodeIds, context, ...(dimensions.length && { dimensions }) }
  const aggregations = getAggregations(chart)

  return {
    filter,
    aggregations,
    agent_options: getChartURLOptions(chart),
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
  }).then(response => response.json())
}
