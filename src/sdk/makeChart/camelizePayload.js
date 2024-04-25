import { heatmapOrChartType } from "@/helpers/heatmap"
import { getAlias } from "@/helpers/units"

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
        h.values = [...h.values, null, null]
        h.all = [...h.all, {}, {}]
      }

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

const transformResult = result => {
  const enhancedData = result.data.reduce(
    (h, row) => {
      const enhancedRow = transformDataRow(row, result.point)

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
  const instances = instancesArray.reduce((h, i = {}) => {
    instanceId = `${i.id}@${nodes[nodesIndexes[i.ni]].nd || nodes[nodesIndexes[i.ni]].mg}`
    h[instanceId] = { ...i }
    h[instanceId].nm = `${i.nm || i.id}@${nodes[nodesIndexes[i.ni]].nm}`
    return h
  }, {})

  return {
    ...rest,
    result: transformResult(result),
    updateEvery,
    viewUpdateEvery,
    firstEntry,
    lastEntry,
    units: Array.isArray(units) ? units.map(getAlias) : [getAlias(units)],
    unitsByKey: Array.isArray(units)
      ? units.reduce((h, u, i) => ({ ...h, [u]: i }), {})
      : { [units]: 0 },
    chartType: heatmapOrChartType(viewDimensions.ids, chartType),
    title,
    tiers,
    perTier,
    nodes,
    nodesIndexes,
    instances,
    dimensions,
    dimensionIds,
    labels: labels.reduce((h, l) => {
      h[l.id] = l
      return h
    }, {}),
    alerts: alerts.reduce((h, a) => {
      h[a.nm] = a
      return h
    }, {}),
    viewDimensions,
    dbDimensions,
    dbUnits: Array.isArray(dbUnits) ? dbUnits.map(getAlias) : [getAlias(dbUnits)],
    dbUnitsByKey: Array.isArray(dbUnits)
      ? dbUnits.reduce((h, u, i) => ({ ...h, [u]: i }), {})
      : { [dbUnits]: 0 },
    details,
    functions,
    contextsTotals,
    dimensionsTotals,
    instancesTotals,
    labelsTotals,
    nodesTotals,
    min,
    max,
  }
}
