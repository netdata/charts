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
  } = chart.getAttributes()

  const options = getChartURLOptions(chart)
  const extraPayload = getChartPayload(chart)

  return {
    ...extraPayload,
    options: options.join("|"),
    contexts: selectedContexts.join("|") || context || wildcard,
    scope_contexts: contextScope.join("|") || wildcard,
    scope_nodes: nodesScope.join("|") || wildcard,
    nodes: selectedNodes.join("|") || wildcard,
    instances: selectedInstances.join("|") || wildcard,
    dimensions: selectedDimensions.join("|") || wildcard,
    labels: selectedLabels.join("|") || wildcard,
    "group_by[0]": (extraPayload["group_by[0]"] || chart.getAttribute("groupBy")).join("|"),
    "group_by_label[0]": (
      extraPayload["group_by_label[0]"] || chart.getAttribute("groupByLabel")
    ).join("|"),
    "aggregation[0]": extraPayload["aggregation[0]"] || aggregationMethod,
    ...(!!extraPayload["group_by[1]"] && {
      "group_by[1]": extraPayload["group_by[1]"].join("|"),
      "group_by_label[1]": (extraPayload["group_by_label[1]"] || []).join("|"),
      "aggregation[1]": extraPayload["aggregation[1]"],
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
