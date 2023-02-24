const camelizeResult = result => {
  if (Array.isArray(result)) return result

  const { labels, data, post_aggregated_data } = result

  return { labels, data, postAggregatedData: post_aggregated_data }
}

export default payload => {
  const {
    summary = {}, // set default value
    summary: { nodes = [], instances = [], dimensions = [], labels = [], alerts = [] },
    functions = [],
    detailed = {},
    db: { update_every: updateEvery, first_entry: firstEntry, last_entry: lastEntry },
    view: {
      title,
      update_every: viewUpdateEvery,
      units,
      dimensions: viewDimensions,
      chart_type: chartType,
    },
    result,
    ...rest
  } = payload

  return {
    result: camelizeResult(result),
    updateEvery,
    viewUpdateEvery,
    firstEntry,
    lastEntry,
    units,
    chartType,
    metadata: {
      title,
      fullyLoaded: nodes.length > 0,
      nodes,
      instances,
      dimensions,
      labels,
      alerts,
      viewDimensions,
      detailed,
      functions,
    },
    ...rest,
  }
}
