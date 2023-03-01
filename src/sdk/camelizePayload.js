const camelizeResult = (result, { anomalyResult }) => {
  if (Array.isArray(result)) return result

  const { labels, data, post_aggregated_data } = result

  if (anomalyResult && typeof anomalyResult === "object" && Array.isArray(anomalyResult.data)) {
    const enhancedData = data.map((row, i) => {
      const [, ...anomalyRow] = anomalyResult.data[i]
      return [...row, anomalyRow]
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
    totals = {}, // set default value
    totals: {
      contexts: contextsTotals = {},
      dimensions: dimensionsTotals = {},
      instances: instancesTotals = {},
      label_key_values: labelsTotals = {},
      nodes: nodesTotals = {},
    },
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
      contextsTotals,
      dimensionsTotals,
      instancesTotals,
      labelsTotals,
      nodesTotals,
    },
    ...rest,
  }
}
