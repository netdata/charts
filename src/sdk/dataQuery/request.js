const wildcard = "*"
const wildcardArray = [wildcard]

const hasValue = value => value !== undefined && value !== null

const withUnaligned = (options = [], unaligned) => {
  const values = Array.isArray(options) ? options : [options]
  if (!unaligned || values.includes("unaligned")) return values

  return [...values, "unaligned"]
}

const selectedContexts = ({ selectedContexts, context }) =>
  Array.isArray(selectedContexts) && selectedContexts.length
    ? selectedContexts
    : context
      ? [context]
      : wildcardArray

const selectedValues = values => (Array.isArray(values) && values.length ? values : wildcardArray)

const scopedContexts = values => (Array.isArray(values) && values.length ? values : wildcardArray)

const scopedDimensions = values =>
  Array.isArray(values) && values.length ? { dimensions: values } : {}

const getTimeGroupOptions = attributes =>
  attributes.timeGroupOptions ?? attributes.time_group_options

const getTimeGroup = attributes => attributes.time_group ?? attributes.groupingMethod

const getTimeResampling = attributes => attributes.time_resampling ?? attributes.groupingTime

export const buildCloudDataPayload = attributes => {
  const {
    selectedNodes,
    selectedInstances,
    selectedDimensions,
    selectedLabels,
    nodesScope,
    contextScope,
    dimensionsScope,
    aggregationMethod,
    groupBy,
    groupByLabel,
    postGroupBy,
    postGroupByLabel,
    postAggregationMethod,
    showPostAggregations,
    after,
    before,
    points,
    format = "json2",
    tier,
    limit,
    timeout,
    unaligned,
  } = attributes
  const timeGroupOptions = getTimeGroupOptions(attributes)
  const timeGroup = getTimeGroup(attributes)
  const timeResampling = getTimeResampling(attributes)
  const options = withUnaligned(attributes.options, unaligned)

  return {
    format,
    options,
    scope: {
      contexts: scopedContexts(contextScope),
      nodes: Array.isArray(nodesScope) && nodesScope.length ? nodesScope : [],
      ...scopedDimensions(dimensionsScope),
    },
    selectors: {
      contexts: selectedContexts(attributes),
      nodes: selectedValues(selectedNodes),
      instances: selectedValues(selectedInstances),
      dimensions: selectedValues(selectedDimensions),
      labels: selectedValues(selectedLabels),
    },
    aggregations: {
      metrics: [
        {
          group_by: groupBy,
          group_by_label: groupByLabel,
          aggregation: aggregationMethod,
        },
        showPostAggregations &&
          Array.isArray(postGroupBy) &&
          postGroupBy.length && {
            group_by: postGroupBy,
            group_by_label: postGroupByLabel,
            aggregation: postAggregationMethod,
          },
      ].filter(Boolean),
      time: {
        time_group: timeGroup,
        ...(hasValue(timeGroupOptions) && { time_group_options: timeGroupOptions }),
        time_resampling: timeResampling,
      },
    },
    window: {
      after,
      ...(after > 0 && { before }),
      points,
      ...(hasValue(tier) && { tier }),
    },
    ...(hasValue(limit) && { limit }),
    ...(hasValue(timeout) && { timeout }),
  }
}

export const buildAgentDataPayload = attributes => {
  const {
    selectedNodes,
    selectedInstances,
    selectedDimensions,
    selectedLabels,
    nodesScope,
    contextScope,
    dimensionsScope,
    aggregationMethod,
    groupBy = [],
    groupByLabel = [],
    postGroupBy = [],
    postGroupByLabel = [],
    postAggregationMethod,
    showPostAggregations,
    selectedContexts: contexts,
    context,
    after,
    before,
    points,
    format = "json2",
    tier,
    limit,
    timeout,
    unaligned,
  } = attributes
  const timeGroupOptions = getTimeGroupOptions(attributes)
  const timeGroup = getTimeGroup(attributes)
  const timeResampling = getTimeResampling(attributes)
  const options = withUnaligned(attributes.options, unaligned)

  return {
    points,
    format,
    time_group: timeGroup,
    ...(hasValue(timeGroupOptions) && { time_group_options: timeGroupOptions }),
    time_resampling: timeResampling,
    after,
    before,
    ...(hasValue(tier) && { tier }),
    ...(hasValue(limit) && { limit }),
    ...(hasValue(timeout) && { timeout }),
    options: options.join("|"),
    contexts: (Array.isArray(contexts) ? contexts.join("|") : "") || context || wildcard,
    scope_contexts: (Array.isArray(contextScope) ? contextScope.join("|") : "") || wildcard,
    scope_nodes: (Array.isArray(nodesScope) ? nodesScope.join("|") : "") || wildcard,
    ...(Array.isArray(dimensionsScope) && dimensionsScope.length
      ? { scope_dimensions: dimensionsScope.join("|") }
      : {}),
    nodes: (Array.isArray(selectedNodes) ? selectedNodes.join("|") : "") || wildcard,
    instances: (Array.isArray(selectedInstances) ? selectedInstances.join("|") : "") || wildcard,
    dimensions: (Array.isArray(selectedDimensions) ? selectedDimensions.join("|") : "") || wildcard,
    labels: (Array.isArray(selectedLabels) ? selectedLabels.join("|") : "") || wildcard,
    "group_by[0]": groupBy.join("|"),
    "group_by_label[0]": groupByLabel.join("|"),
    "aggregation[0]": aggregationMethod,
    ...(showPostAggregations &&
      postGroupBy.length && {
        "group_by[1]": postGroupBy.join("|"),
        "group_by_label[1]": postGroupByLabel.join("|"),
        "aggregation[1]": postAggregationMethod,
      }),
  }
}

export const buildDataRequest = attributes => {
  const { agent, host } = attributes

  if (agent) {
    const query = new URLSearchParams(buildAgentDataPayload(attributes)).toString()
    return { url: `${host}/data?${query}`, options: {} }
  }

  return {
    url: `${host}/data`,
    options: {
      method: "POST",
      body: JSON.stringify(buildCloudDataPayload(attributes)),
    },
  }
}

export const withDataRequestAuth = (attributes, options = {}) => {
  const { bearer, xNetdataBearer } = attributes
  if (!bearer && !xNetdataBearer) return options

  return {
    ...options,
    headers: bearer
      ? { Authorization: `Bearer ${bearer}` }
      : { "X-Netdata-Auth": `Bearer ${xNetdataBearer}` },
  }
}
