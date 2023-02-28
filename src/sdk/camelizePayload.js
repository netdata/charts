const camelizeResult = (result, { anomalyResult }) => {
  if (Array.isArray(result)) return result

  const { labels, data, post_aggregated_data } = result

  if (anomalyResult && typeof anomalyResult === "object" && Array.isArray(anomalyResult.data)) {
    const enhancedData = data.map((row, i) => {
      const [, ...anomalyRow] = anomalyResult.data[i]
      return [...row, anomalyRow.reduce((a, b) => (a > b ? a : b), 0)]
    })

    return {
      labels: [...labels, "ANOMALY_RATE"],
      data: enhancedData,
      postAggregatedData: post_aggregated_data,
    }
  }

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
    anomaly_rates: anomalyResult,
    ...rest
  } = payload

  return {
    result: camelizeResult(result, { anomalyResult }),
    anomalyResult,
    updateEvery,
    viewUpdateEvery,
    firstEntry,
    lastEntry,
    units,
    chartType,
    title,
    metadata: {
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
