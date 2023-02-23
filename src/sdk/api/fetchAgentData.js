import { getChartURLOptions, getChartPayload } from "./helpers"

const wildcard = "*"

const getPayload = chart => {
  const {
    selectedContexts,
    context,
    hostScope,
    contextScope,
    selectedHosts,
    selectedInstances,
    selectedDimensions,
    selectedLabels,
    aggregationMethod,
  } = chart.getAttributes()

  const options = getChartURLOptions(chart)
  const groupByLabel = chart.getAttribute("groupByLabel").join("|")

  return {
    format: "json",
    options: options.join("|"),
    contexts: selectedContexts.join("|") || context || wildcard,
    scope_contexts: contextScope.join("|") || wildcard,
    scope_hosts: hostScope.join("|") || wildcard,
    hosts: selectedHosts.join("|") || wildcard,
    instances: selectedInstances.join("|") || wildcard,
    dimensions: selectedDimensions.join("|") || wildcard,
    ...(selectedLabels && {
      labels: Object.entries(selectedLabels)
        .map(([key, value]) => `${key}:${value}*`)
        .join("|"),
    }),
    ...getChartPayload(chart),
    group_by: chart.getAttribute("groupBy").join("|"),
    ...(!!groupByLabel && { group_by_label: groupByLabel }),
    aggregation: aggregationMethod,
  }
}

export default (chart, options) => {
  const { host } = chart.getAttributes()

  const payload = getPayload(chart)

  const query = new URLSearchParams(payload).toString()
  const url = `${host}?${query}`

  return fetch(url, options).then(response => response.json())
}
