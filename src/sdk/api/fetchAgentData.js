import { getChartURLOptions, getChartPayload } from "./helpers"

const getGroupBy = groupBy => {
  if (groupBy === "chart") return "instance"
  if (groupBy === "node" || groupBy === "dimension") return groupBy
  return "label"
}

const wildcard = "*"

const getPayload = chart => {
  const {
    selectedContexts,
    context,
    hostScope,
    contextScope,
    selectedHosts,
    selectedInstances,
    selectedDimensions,
    selectedLabels,
    dimensionsAggregationMethod,
  } = chart.getAttributes()

  const groupByKey = chart.getAttribute("groupBy")
  const groupBy = getGroupBy(groupByKey)

  const options = getChartURLOptions(chart)

  return {
    format: "json",
    options: options.join("|"),
    contexts: selectedContexts.join("|") || context || wildcard,
    scope_contexts: contextScope.join("|") || wildcard,
    scope_hosts: hostScope.join("|") || wildcard,
    hosts: selectedHosts.join("|") || wildcard,
    instances: selectedInstances.join("|") || wildcard,
    dimensions: selectedDimensions.join("|") || wildcard,
    ...(selectedLabels && {
      labels: Object.entries(selectedLabels)
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

  return fetch(url, options).then(response => response.json())
}
