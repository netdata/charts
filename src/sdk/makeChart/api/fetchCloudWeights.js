import { getChartURLOptions, getChartPayload } from "./helpers"

const wildcard = "*"

const getPayload = chart => {
  const {
    selectedContexts,
    context,
    nodesScope,
    contextScope,
    selectedInstances,
    selectedDimensions,
    selectedLabels,
    aggregationMethod,
  } = chart.getAttributes()
  const selectedNodes = chart.getFilteredNodeIds()

  const options = getChartURLOptions(chart)
  const groupByLabel = chart.getAttribute("groupByLabel").join("|")

  return {
    format: "json",
    options: options.join("|"),
    contexts: selectedContexts.join("|") || context || wildcard,
    scope_contexts: contextScope.join("|") || wildcard,
    scope_nodes: nodesScope.join("|") || wildcard,
    nodes: selectedNodes.join("|") || wildcard,
    instances: selectedInstances.join("|") || wildcard,
    dimensions: selectedDimensions.join("|") || wildcard,
    labels: selectedLabels.join("|") || wildcard,
    group_by: chart.getAttribute("groupBy").join("|"),
    ...(!!groupByLabel && { group_by_label: groupByLabel }),
    aggregation: aggregationMethod,
    ...getChartPayload(chart),
  }
}

export default (chart, options) => {
  const { host } = chart.getAttributes()

  const payload = getPayload(chart)

  const query = new URLSearchParams(payload).toString()
  const url = `${host}/weights?${query}`

  return fetch(url, options).then(response => response.json())
}
