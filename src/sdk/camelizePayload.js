const camelizeResult = result => {
  if (Array.isArray(result)) return result

  const { labels, data, post_aggregated_data } = result

  return { labels, data, postAggregatedData: post_aggregated_data }
}

export default payload => {
  const {
    id,
    title,
    summary = {}, // set default value
    summary: { hosts = [], instances = [], dimensions = [], labels = [], alerts = [] },
    functions = [],
    detailed = {},
    db: { update_every: updateEvery, first_entry: firstEntry, last_entry: lastEntry },
    view: { update_every: viewUpdateEvery, units, dimensions: viewDimensions },
    result,
    ...rest
  } = payload

  return {
    result: camelizeResult(result),
    metadata: {
      id,
      title,
      fullyLoaded: !!id,
      hosts,
      instances,
      dimensions,
      labels,
      alerts,
      updateEvery,
      viewUpdateEvery,
      firstEntry,
      lastEntry,
      viewDimensions,
      units,
      detailed,
      functions,
    },
    ...rest,
  }
}
