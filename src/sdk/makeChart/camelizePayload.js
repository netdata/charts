import { heatmapOrChartType } from "@/helpers/heatmap"
import { getAlias } from "@/helpers/units"

const transformDataRow = (row, point, labels, byDimension) =>
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

      const label = labels[i]
      if (!byDimension[label]) byDimension[label] = { min: Infinity, max: -Infinity }
      if (dim[point.value] <= byDimension[label].min) byDimension[label].min = dim[point.value]
      if (dim[point.value] >= byDimension[label].max) byDimension[label].max = dim[point.value]

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
      const enhancedRow = transformDataRow(row, result.point, result.labels, h.byDimension)

      h.data.push(enhancedRow.values)
      h.all.push(enhancedRow.all)

      return h
    },
    { data: [], all: [], byDimension: {} }
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

const getStsByContext = (groups, units, dimensions, contextsArray) => {
  if (!Array.isArray(groups)) return [[], {}]
  if (!Array.isArray(contextsArray) || !contextsArray.length) return [[], {}]

  const unitsByKey = {}

  const regex = new RegExp(
    groups.reduce((s, g) => {
      s = s + (s ? "," : "")
      s = s + ("context" === g ? "(.*)" : ".*")

      return s
    }, "")
  )

  if (!dimensions?.ids) {
    return [[], {}]
  }

  let stsByCtx = {}

  const dimensionContexts = dimensions.ids.map((id, index) => {
    const match = id.match(regex)
    if (!match) return contextsArray[0].id

    const [, ctx] = match

    if (ctx && dimensions.sts) {
      stsByCtx[ctx] = stsByCtx[ctx] || { min: Infinity, max: -Infinity }
      stsByCtx[ctx].min =
        stsByCtx[ctx].min > dimensions.sts.min[index]
          ? dimensions.sts.min[index]
          : stsByCtx[ctx].min
      stsByCtx[ctx].max =
        stsByCtx[ctx].max < dimensions.sts.max[index]
          ? dimensions.sts.max[index]
          : stsByCtx[ctx].max
    }

    return ctx || contextsArray[0].id
  })

  if (groups.includes("context")) {
    contextsArray.forEach(ctx => {
      const regex = new RegExp(
        groups.reduce((s, g) => {
          s = s + (s ? "," : "")
          s = s + ("context" === g ? ctx.id : ".*")

          return s
        }, "")
      )

      const dimIndex = dimensions.ids.findIndex(id => regex.test(id))

      if (dimIndex === -1) return

      unitsByKey[ctx.id] = dimensions.units[dimIndex]
    })
  }

  return [
    dimensionContexts,
    contextsArray.reduce((h, ctx) => {
      h[ctx.id] = {
        ...(stsByCtx[ctx.id] || ctx.sts),
        units: getAlias(unitsByKey[ctx.id] || (Array.isArray(units) ? units[0] : units)),
      }

      return h
    }, {}),
  ]
}

export default (payload, chart) => {
  const {
    summary: {
      nodes: nodesArray = [],
      instances: instancesArray = [],
      dimensions: dimensionsArray = [],
      labels = [],
      alerts = [],
      contexts: contextsArray = [],
    } = {},
    functions = [],
    totals: {
      contexts: contextsTotals = {},
      dimensions: dimensionsTotals = {},
      instances: instancesTotals = {},
      label_key_values: labelsTotals = {},
      nodes: nodesTotals = {},
    } = {},
    db: {
      update_every: updateEvery,
      first_entry: firstEntry,
      last_entry: lastEntry,
      tiers,
      per_tier: perTier,
      dimensions: dbDimensions,
      units: dbUnits,
    } = {},
    view: {
      title,
      update_every: viewUpdateEvery,
      units,
      dimensions: viewDimensions = {},
      chart_type: chartType,
      min,
      max,
    } = {},
    result,
    ...rest
  } = payload
  let contexts = {}
  contextsArray.forEach(c => (contexts[c.id] = c))

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

  const grouped = viewDimensions?.grouped_by

  const [dimContexts, unitsStsByContext] = getStsByContext(
    grouped,
    units,
    viewDimensions,
    contextsArray
  )

  const [dbDimContexts, dbUnitsStsByContext] = getStsByContext(
    grouped,
    dbUnits,
    dbDimensions,
    contextsArray
  )

  const details = {
    viewDimensions: {
      ...viewDimensions,
      contexts: dimContexts,
      grouped,
    },
    units: Array.isArray(units) ? units.map(getAlias) : [getAlias(units)],
    unitsStsByContext,
    chartType: heatmapOrChartType(viewDimensions.ids, chartType),
    title,
    tiers,
    perTier,
    contexts,
    nodes,
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
    dbDimensions: {
      ...dbDimensions,
      contexts: dbDimContexts,
    },
    dbUnits: Array.isArray(dbUnits) ? dbUnits.map(getAlias) : [getAlias(dbUnits)],
    dbUnitsStsByContext,
  }

  nodesIndexes = null

  return {
    ...rest,
    ...details,
    result: transformResult(result),
    updateEvery,
    viewUpdateEvery,
    firstEntry,
    lastEntry,
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
