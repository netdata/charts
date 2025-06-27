import { getChartURLOptions, getChartPayload } from "./helpers"

const wildcardArray = ["*"]

const getPayload = (chart, attrs = {}) => {
  const chartAttributes = chart.getAttributes()
  const extraAttributes = getChartPayload(chart, attrs)

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
    after = extraAttributes.after,
    before = extraAttributes.before,
    points = extraAttributes.points,
    time_group = extraAttributes.time_group,
    time_resampling = extraAttributes.time_resampling,
    method,
    highlightAfter,
    highlightBefore,
    baselineAfter,
    baselineBefore,
  } = { ...chartAttributes, ...attrs }

  return {
    selectors: {
      nodes: Array.isArray(selectedNodes) && selectedNodes.length ? selectedNodes : wildcardArray,
      contexts:
        Array.isArray(selectedContexts) && selectedContexts.length
          ? selectedContexts
          : context
            ? [context]
            : wildcardArray,
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
      time: {
        time_group: time_group || "average",
        time_group_options: "",
        time_resampling: time_resampling || 0,
      },
      metrics: [
        {
          group_by: groupBy,
          group_by_label: groupByLabel,
          aggregation: aggregationMethod,
        },
      ],
    },
    window: {
      after: Math.floor((highlightAfter || after) / 1000),
      before: Math.floor((highlightBefore || before) / 1000),
      points,
      baseline: {
        after: Math.floor(after / 1000),
        before: Math.floor(before / 1000),
      },
    },
    scope: {
      nodes: Array.isArray(contextScope) && contextScope.length ? contextScope : wildcardArray,
      contexts: Array.isArray(nodesScope) && nodesScope.length ? nodesScope : [],
    },
    method: method || "ks2",
    options: [
      ...(options ? (Array.isArray(options) ? options : [options]) : []),
      "minify",
      "nonzero",
      "unaligned",
    ],
    timeout: 180_000,
  }
}

export default (chart, { attrs, ...options } = {}) => {
  const { host } = chart.getAttributes()

  const payload = getPayload(chart, attrs)

  return fetch(`${host}/weights`, {
    method: "POST",
    body: JSON.stringify(payload),
    ...options,
  }).then(response => response.json())
}
