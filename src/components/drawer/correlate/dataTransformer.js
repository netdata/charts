const requiredGroupFields = ["dimension", "context", "node"]

const getGroupBy = response => response?.request?.aggregations?.metrics?.[0]?.group_by || []

const splitGroupedValue = value => (typeof value === "string" ? value.split(",") : [])

const getCorrelationStrength = weight => {
  const absWeight = Math.abs(weight)
  if (absWeight <= 0.05) return "Strong"
  if (absWeight <= 0.2) return "Moderate"
  if (absWeight <= 0.5) return "Weak"
  return "Very Weak"
}

const transformItem = (item, indexes) => {
  const ids = splitGroupedValue(item?.id)
  const names = splitGroupedValue(item?.nm)
  const [weight, timeframe, baseline] = item?.v || []
  const correlationWeight = weight?.[0]

  if (
    ids.length < indexes.groupCount ||
    names.length < indexes.groupCount ||
    typeof correlationWeight !== "number" ||
    !Array.isArray(timeframe) ||
    !Array.isArray(baseline)
  )
    return null

  const dimension = ids[indexes.dimension]
  const context = ids[indexes.context]
  const nodeId = ids[indexes.node]
  const timeframeAvg = timeframe[1]
  const baselineAvg = baseline[1]

  return {
    rowId: JSON.stringify(["dimension", context, nodeId, dimension]),
    kind: "dimension",
    dimension,
    dimensionName: names[indexes.dimension],
    context,
    contextName: names[indexes.context],
    nodeId,
    nodeName: names[indexes.node],
    correlationWeight,
    weightMin: weight[0],
    weightMax: weight[2],
    timeframeAvg,
    timeframeCount: timeframe[4],
    baselineAvg,
    baselineCount: baseline[4],
    percentChange: baselineAvg !== 0 ? ((timeframeAvg - baselineAvg) / baselineAvg) * 100 : 0,
    correlationStrength: getCorrelationStrength(correlationWeight),
  }
}

export const transformCorrelationData = (response, threshold = 0.01, scopeContexts = []) => {
  if (!Array.isArray(response?.result) || !response?.v_schema) return []

  const groupBy = getGroupBy(response)
  const indexes = requiredGroupFields.reduce(
    (result, field) => ({ ...result, [field]: groupBy.indexOf(field) }),
    { groupCount: groupBy.length }
  )

  if (requiredGroupFields.some(field => indexes[field] < 0)) return []

  const excludedContexts = new Set(scopeContexts)

  return response.result
    .map(item => transformItem(item, indexes))
    .filter(
      item =>
        item && Math.abs(item.correlationWeight) < threshold && !excludedContexts.has(item.context)
    )
    .sort((a, b) => Math.abs(a.correlationWeight) - Math.abs(b.correlationWeight))
}

export const groupByContext = data => {
  const groups = new Map()

  data.forEach(item => {
    let group = groups.get(item.context)

    if (!group) {
      group = {
        rowId: JSON.stringify(["context", item.context]),
        kind: "context",
        context: item.context,
        contextName: item.contextName,
        children: [],
        minWeight: 1,
        count: 0,
      }
      groups.set(item.context, group)
    }

    group.children.push(item)
    group.minWeight = Math.min(group.minWeight, Math.abs(item.correlationWeight))
    group.count++
  })

  return [...groups.values()].sort((a, b) => a.minWeight - b.minWeight)
}
