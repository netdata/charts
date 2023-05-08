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

      stats.maxArp = i !== 0 && stats.maxArp < dim[point.arp] ? dim[point.arp] : stats.maxArp

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
    summary: {
      nodes: nodesArray = [],
      instances: instancesArray = [],
      dimensions: dimensionsArray = [],
      labels = [],
      alerts = [],
    },
    functions = [],
    details = {},
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
      dimensions: dbDimensions,
      units: dbUnits,
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

  let stats = { maxArp: 0 }

  let nodes = {}
  let nodesIndexes = {}
  nodesArray.forEach(n => {
    nodes[n.nd || n.mg] = n
    nodesIndexes[n.ni] = n.nd || n.mg
  })

  let dimensionIds = []
  let dimensions = {}
  dimensionsArray.forEach(d => {
    dimensions[d.id] = d
    dimensionIds.push(d.id)
  })

  let instanceId = null
  const instances = instancesArray.reduce((h, i) => {
    instanceId = `${i.id}@${nodes[nodesIndexes[i.ni]].nd || nodes[nodesIndexes[i.ni]].mg}`
    h[instanceId] = i
    h[instanceId].nm = `${i.nm || i.id}@${nodes[nodesIndexes[i.ni]].nm}`
    return h
  }, {})

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
    nodes,
    nodesIndexes,
    instances,
    dimensions,
    dimensionIds,
    labels: labels.reduce((h, l) => ({ ...h, [l.id]: l }), {}),
    alerts: alerts.reduce((h, a) => ({ ...h, [a.name]: a }), {}),
    viewDimensions,
    dbDimensions,
    dbUnits,
    details,
    functions,
    contextsTotals,
    dimensionsTotals,
    instancesTotals,
    labelsTotals,
    nodesTotals,
    min,
    max,
    ...stats,
  }
}
