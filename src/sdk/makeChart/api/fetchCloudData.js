import { getChartURLOptions, getChartPayload } from "./helpers"

const wildcardArray = ["*"]

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

  const { after, before, points, time_group, time_resampling, format } = getChartPayload(chart)

  return {
    format,
    options,
    scope: {
      contexts: Array.isArray(contextScope) && contextScope.length ? contextScope : wildcardArray,
      nodes: Array.isArray(nodesScope) && nodesScope.length ? nodesScope : [],
    },
    selectors: {
      contexts:
        Array.isArray(selectedContexts) && selectedContexts.length
          ? selectedContexts
          : context
          ? [context]
          : wildcardArray,
      nodes: Array.isArray(selectedNodes) && selectedNodes.length ? selectedNodes : wildcardArray,
      instances:
        Array.isArray(selectedInstances) && selectedInstances.length
          ? selectedInstances
          : wildcardArray,
      dimensions:
        Array.isArray(selectedDimensions) && selectedDimensions.length
          ? selectedDimensions
          : wildcardArray,
      labels:
        Array.isArray(selectedLabels) && selectedLabels.length ? selectedLabels : wildcardArray,
    },
    aggregations: {
      metrics: [
        {
          group_by: groupBy,
          group_by_label: groupByLabel,
          aggregation: aggregationMethod,
        },
        showPostAggregations &&
          !!postGroupBy.length && {
            group_by: postGroupBy,
            group_by_label: postGroupByLabel,
            aggregation: postAggregationMethod,
          },
      ].filter(Boolean),
      time: {
        time_group,
        // time_group_options: "",
        time_resampling,
      },
    },
    window: {
      after,
      ...(after > 0 && { before }),
      points,
      // tier: 0
    },
  }
}

export default (chart, options) => {
  const { host } = chart.getAttributes()

  const payload = getPayload(chart)

  return fetch(`${host}/data`, {
    method: "POST",
    body: JSON.stringify(payload),
    ...options,
  }).then(response => response.json())
}
