import { getChartURLOptions, getChartPayload } from "./helpers"

const wildcard = "*"

const getPayload = (chart, attrs = {}) => {
  const {
    selectedContexts,
    context,
    nodesScope,
    contextScope,
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
  } = { ...chart.getAttributes(), ...attrs }
  const selectedNodes = chart.getFilteredNodeIds()

  const options = getChartURLOptions(chart)
  const extraPayload = getChartPayload(chart, attrs)

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

export default (chart, { attrs, ...options } = {}) => {
  const { host } = chart.getAttributes()

  const payload = getPayload(chart, attrs)

  const query = new URLSearchParams(payload).toString()
  const url = `${host}/data?${query}`
  options = {
    ...options,
    ...((chart.getAttribute("bearer") || chart.getAttribute("xNetdataBearer")) && {
      headers: {
        ...(chart.getAttribute("bearer")
          ? {
              Authorization: `Bearer ${chart.getAttribute("bearer")}`,
            }
          : {
              "X-Netdata-Auth": `Bearer ${chart.getAttribute("xNetdataBearer")}`,
            }),
      },
    }),
  }

  return fetch(url, options).then(response => response.json())
}
