import { getChartURLOptions, getChartPayload, getWeightsWindow } from "./helpers"
import { getWeightsBaseline } from "@/sdk/correlationBaseline"

const wildcardArray = ["*"]

const getPayload = (chart, attrs = {}) => {
  const chartAttributes = chart.getAttributes()
  const { after, before, points, time_group, time_resampling } = getChartPayload(chart, attrs)
  const weightsWindow = getWeightsWindow(chart, attrs)

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
      ...weightsWindow,
      points,
      baseline: getWeightsBaseline({
        method,
        ...weightsWindow,
        baselineAfter: baselineAfter || after,
        baselineBefore: baselineBefore || before,
      }),
    },
    scope: {
      nodes: Array.isArray(nodesScope) && nodesScope.length ? nodesScope : [],
      contexts: Array.isArray(contextScope) && contextScope.length ? contextScope : wildcardArray,
    },
    method: method || "volume",
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
