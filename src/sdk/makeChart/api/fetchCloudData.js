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
  } = chart.getAttributes()

  const options = getChartURLOptions(chart)

  const {
    after,
    before,
    group_by,
    group_by_label,
    points,
    time_group,
    time_resampling,
    aggregation,
    format,
  } = getChartPayload(chart)

  const groupByLabel = group_by_label || chart.getAttribute("groupByLabel")

  return {
    format,
    options,
    scope: {
      contexts: contextScope.length ? contextScope : wildcardArray,
      nodes: nodesScope.length ? nodesScope : [],
    },
    selectors: {
      contexts: selectedContexts.length ? selectedContexts : context ? [context] : wildcardArray,
      nodes: selectedNodes.length ? selectedNodes : wildcardArray,
      instances: selectedInstances.length ? selectedInstances : wildcardArray,
      dimensions: selectedDimensions.length ? selectedDimensions : wildcardArray,
      labels: selectedLabels.length ? selectedLabels : wildcardArray,
    },
    aggregations: {
      metrics: {
        aggregation: aggregation || aggregationMethod,
        group_by: group_by || chart.getAttribute("groupBy"),
        ...(!!groupByLabel && { group_by_label: groupByLabel }),
      },
      time: {
        time_group,
        // time_group_options: "",
        // time_resampling, TODO uncomment when backend is ready
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
