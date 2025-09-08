import { getChartURLOptions, getChartPayload } from "./helpers"

const wildcard = "*"

const getPayload = (chart, attrs = {}) => {
  const chartAttributes = chart.getAttributes()
  const { after, before, points, time_group, time_resampling } = getChartPayload(chart, attrs)

  const {
    selectedContexts,
    context,
    nodesScope,
    contextScope,
    selectedNodes = chart.getFilteredNodeIds(),
    selectedInstances,
    selectedDimensions,
    selectedLabels,
    aggregationMethod,
    groupBy,
    groupByLabel,
    options = getChartURLOptions(chart),
    method,
    highlightAfter,
    highlightBefore,
    baselineAfter,
    baselineBefore,
  } = { ...chartAttributes, ...attrs }

  return {
    format: "json",
    options: Array.isArray(options) ? options.join("|") : "",
    contexts:
      (Array.isArray(selectedContexts) ? selectedContexts.join("|") : "") || context || wildcard,
    scope_contexts: (Array.isArray(contextScope) ? contextScope.join("|") : "") || wildcard,
    scope_nodes: (Array.isArray(nodesScope) ? nodesScope.join("|") : "") || wildcard,
    nodes: (Array.isArray(selectedNodes) ? selectedNodes.join("|") : "") || wildcard,
    instances: (Array.isArray(selectedInstances) ? selectedInstances.join("|") : "") || wildcard,
    dimensions: (Array.isArray(selectedDimensions) ? selectedDimensions.join("|") : "") || wildcard,
    labels: (Array.isArray(selectedLabels) ? selectedLabels.join("|") : "") || wildcard,
    group_by: Array.isArray(groupBy) ? groupBy.join("|") : "",
    ...(Array.isArray(groupByLabel) &&
      groupByLabel.length && { group_by_label: groupByLabel.join("|") }),
    aggregation: aggregationMethod,
    ...getChartPayload(chart, attrs),
    after: Math.floor(highlightAfter || after),
    before: Math.floor(highlightBefore || before),
    baseline_after: Math.floor(baselineAfter || after),
    baseline_before: Math.floor(baselineBefore || before),
    method: method || "volume",
    points,
    time_group: time_group || "average",
    time_resampling,
  }
}

export default (chart, { attrs, ...options } = {}) => {
  const { host } = chart.getAttributes()

  const payload = getPayload(chart, attrs)

  const query = new URLSearchParams(payload).toString()
  const url = `${host}/weights?${query}`

  return fetch(url, options).then(response => response.json())
}
