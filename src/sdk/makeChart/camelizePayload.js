const transformDataRow = (row, point, stats) =>
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
        h.values = [...h.values, null, null]
        h.all = [...h.all, {}, {}]
      }

      stats.maxAr = i !== 0 && stats.maxAr < dim[point.ar] ? dim[point.ar] : stats.maxAr

      return h
    },
    { values: [], all: [] }
  )

const buildTree = (h, keys, id) => {
  const [key, ...subKeys] = keys

  if (!h[key] && !subKeys.length) {
    h[key] = id
    return h
  }

  if (!h[key]) h[key] = {}

  h[key] = buildTree(h[key], subKeys, id)
  return h
}

const transformResult = (result, stats) => {
  const enhancedData = result.data.reduce(
    (h, row) => {
      const enhancedRow = transformDataRow(row, result.point, stats)

      h.data.push(enhancedRow.values)
      h.all.push(enhancedRow.all)

      return h
    },
    { data: [], all: [] }
  )

  const tree = result.labels.reduce((h, id, i) => {
    if (i === 0) return h

    const keys = id.split(",")

    return buildTree(h, keys, id)
  }, {})

  return {
    labels: [...result.labels, "ANOMALY_RATE", "ANNOTATIONS"],
    ...enhancedData,
    tree,
  }
}

export default payload => {
  const {
    summary = {}, // set default value
    summary: { nodes: nodesArray = [], instances = [], dimensions = [], labels = [], alerts = [] },
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
    db: {
      update_every: updateEvery,
      first_entry: firstEntry,
      last_entry: lastEntry,
      tiers,
      per_tier: perTier,
    },
    view: {
      title,
      update_every: viewUpdateEvery,
      units,
      dimensions: viewDimensions,
      chart_type: chartType,
      min,
      max,
    },
    result,
    ...rest
  } = payload

  let stats = { maxAr: 0 }

  let nodes = {}
  let nodesIndexes = {}
  nodesArray.forEach(n => {
    nodes[n.mg] = n
    nodesIndexes[n.ni] = n.mg
  })

  return {
    ...rest,
    result: transformResult(result, stats),
    updateEvery,
    viewUpdateEvery,
    firstEntry,
    lastEntry,
    units,
    chartType,
    title,
    tiers,
    perTier,
    metadata: {
      fullyLoaded: nodesArray.length > 0,
      nodes,
      nodesIndexes,
      instances: instances.reduce(
        (h, i) => ({ ...h, [`${i.id}@${nodes[nodesIndexes[i.ni]].mg}`]: i }),
        {}
      ),
      dimensions: dimensions.reduce((h, d) => ({ ...h, [d.id]: d }), {}),
      labels: labels.reduce((h, l) => ({ ...h, [l.id]: l }), {}),
      alerts: alerts.reduce((h, a) => ({ ...h, [a.name]: a }), {}),
      viewDimensions,
      detailed,
      functions,
      contextsTotals,
      dimensionsTotals,
      instancesTotals,
      labelsTotals,
      nodesTotals,
    },
    min,
    max,
    ...stats,
  }
}
