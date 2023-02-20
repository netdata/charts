import { getChartURLOptions, getChartPayload } from "./helpers"

const getGroupBy = groupBy => {
  if (groupBy === "chart") return "instance"
  if (groupBy === "node" || groupBy === "dimension") return groupBy
  return "label"
}

const getPayload = chart => {
  const {
    hosts = "*",
    contexts,
    chartId,
    context,
    id,
    instances,
    dimensions,
    labels,
    dimensionsAggregationMethod,
  } = chart.getAttributes()

  const groupByKey = chart.getAttribute("groupBy")
  const groupBy = getGroupBy(groupByKey)

  const options = getChartURLOptions(chart)

  return {
    hosts,
    format: "json",
    options: options.join("|"),
    contexts: contexts?.join?.("|") || context || id,
    ...(instances?.length && { instances: instances.join("|") }),
    ...(dimensions?.length && { dimensions: dimensions.join("|") }),
    ...(labels && {
      labels: Object.entries(labels)
        .map(([key, value]) => `${key}:${value}*`)
        .join("|"),
    }),
    ...getChartPayload(chart),
    group_by: groupBy,
    group_by_key: groupByKey,
    group_by_aggregate: dimensionsAggregationMethod,
  }
}

export default (chart, options) => {
  const { host } = chart.getAttributes()

  const payload = getPayload(chart)

  const query = new URLSearchParams(payload).toString()
  const url = `${host}?${query}`

  debugger
  return fetch(url, options).then(response => response.json())
}
