const transformDataRow = (row, point) =>
  row.reduce(
    (h, dim, i) => {
      h.values.push(i === 0 ? dim : dim[point.value])
      h.all.push(
        i === 0
          ? { value: dim }
          : Object.keys(point).reduce((p, k) => {
              p[k] = dim[point[k]]
              return p
            }, {})
      )

      if (i === row.length - 1) {
        h.values = [...h.values, 0, 0]
        h.all = [...h.all, {}, {}]
      }

      return h
    },
    { values: [], all: [] }
  )

const transformResult = result => {
  if (Array.isArray(result)) return { data: result }

  const enhancedData = result.data.reduce(
    (h, row) => {
      const enhancedRow = transformDataRow(row, result.point)

      h.data.push(enhancedRow.values)
      h.all.push(enhancedRow.all)

      return h
    },
    { data: [], all: [] }
  ) // Initialize with zero for ar and pa - allow stacked and area graphs to not display it

  return {
    labels: [...result.labels, "ANOMALY_RATE", "ANNOTATIONS"],
    ...enhancedData,
  }
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
    db: { update_every: updateEvery, first_entry: firstEntry, last_entry: lastEntry, tiers },
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
    result: transformResult(result),
    updateEvery,
    viewUpdateEvery,
    firstEntry,
    lastEntry,
    units,
    chartType,
    title,
    tiers,
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
