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

  const { after, before, points, time_group, time_resampling, format, ...restPayload } =
    getChartPayload(chart)

  const groupByLabel = restPayload["group_by_label[0]"] || chart.getAttribute("groupByLabel")

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
      metrics: [
        {
          aggregation: restPayload["aggregation[0]"] || aggregationMethod,
          group_by: restPayload["group_by[0]"] || chart.getAttribute("groupBy"),
          ...(!!groupByLabel && { group_by_label: groupByLabel }),
        },
        !!restPayload["group_by[1]"] && {
          aggregation: restPayload["aggregation[1]"] || "avg",
          group_by: restPayload["group_by[1]"] || "",
          ...(!!restPayload["group_by_label[1]"] && {
            group_by_label: restPayload["group_by_label[1]"],
          }),
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
