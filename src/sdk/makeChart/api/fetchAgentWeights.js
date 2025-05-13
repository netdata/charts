import { getChartURLOptions, getChartPayload } from "./helpers"

const wildcard = "*"

const getPayload = (chart, params = {}) => {
  const chartAttributes = chart.getAttributes()
  const {
    selectedContexts = chartAttributes.selectedContexts,
    context = chartAttributes.context,
    nodesScope = chartAttributes.nodesScope,
    contextScope = chartAttributes.contextScope,
    selectedNodes = chart.getFilteredNodeIds(),
    selectedInstances = chartAttributes.selectedInstances,
    selectedDimensions = chartAttributes.selectedDimensions,
    selectedLabels = chartAttributes.selectedLabels,
    aggregationMethod = chartAttributes.aggregationMethod,
    groupBy = chartAttributes.groupBy,
    groupByLabel = chartAttributes.groupByLabel,
    options = getChartURLOptions(chart),
    ...rest
  } = params

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
    group_by: groupBy.join("|"),
    ...(!!groupByLabel?.length && { group_by_label: groupByLabel.join("|") }),
    aggregation: aggregationMethod,
    ...getChartPayload(chart),
    ...rest,
  }
}

export default (chart, { params, ...options } = {}) => {
  const { host } = chart.getAttributes()

  const payload = getPayload(chart, params)

  const query = new URLSearchParams(payload).toString()
  const url = `${host}/weights?${query}`

  return fetch(url, options).then(response => response.json())
}
