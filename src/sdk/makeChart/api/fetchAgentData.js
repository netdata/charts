import { getChartURLOptions, getChartPayload } from "./helpers"

const wildcard = "*"

const getPayload = chart => {
  const {
    selectedContexts,
    context,
    nodesScope,
    contextScope,
    selectedNodes,
    selectedInstances,
    selectedDimensions,
    selectedLabels,
    aggregationMethod,
    groupBy,
    groupByLabel,
    postGroupBy,
    postGroupByLabel,
    postAggregationMethod,
    showPostAggregations,
  } = chart.getAttributes()

  const options = getChartURLOptions(chart)
  const extraPayload = getChartPayload(chart)

  return {
    ...extraPayload,
    options: options.join("|"),
    contexts:
      (Array.isArray(selectedContexts) ? selectedContexts.join("|") : "") || context || wildcard,
    scope_contexts: (Array.isArray(contextScope) ? contextScope.join("|") : "") || wildcard,
    scope_nodes: (Array.isArray(nodesScope) ? nodesScope.join("|") : "") || wildcard,
    nodes: (Array.isArray(selectedNodes) ? selectedNodes.join("|") : "") || wildcard,
    instances: (Array.isArray(selectedInstances) ? selectedInstances.join("|") : "") || wildcard,
    dimensions: (Array.isArray(selectedDimensions) ? selectedDimensions.join("|") : "") || wildcard,
    labels: (Array.isArray(selectedLabels) ? selectedLabels.join("|") : "") || wildcard,
    "group_by[0]": groupBy.join("|"),
    "group_by_label[0]": groupByLabel.join("|"),
    "aggregation[0]": aggregationMethod,
    ...(showPostAggregations &&
      !!postGroupBy.length && {
        "group_by[1]": postGroupBy.join("|"),
        "group_by_label[1]": postGroupByLabel.join("|"),
        "aggregation[1]": postAggregationMethod,
      }),
  }
}

export default (chart, options) => {
  const { host } = chart.getAttributes()

  const payload = getPayload(chart)

  const query = new URLSearchParams(payload).toString()
  const url = `${host}/data?${query}`

  return fetch(url, options).then(response => response.json())
}
